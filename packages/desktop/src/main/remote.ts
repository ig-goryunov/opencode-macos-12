import { randomUUID } from "node:crypto"
import * as http from "node:http"
import { networkInterfaces } from "node:os"
import QRCode from "qrcode"

import { getLogger } from "./logging"
import { MOBILE_HTML } from "./remote-mobile"
import { allowedApi, scopedApi, withinDirectories } from "./remote-scope"

export type RemoteWorkspace = { directory: string; name: string }
export type RemoteStartInput = { workspaces: RemoteWorkspace[] }
export type RemoteStatus = {
  active: boolean
  url?: string
  qrSvg?: string
  workspaces?: RemoteWorkspace[]
  error?: string
}

type Target = { url: string; username: string; password: string }

type Session = {
  server: http.Server
  token: string
  port: number
  url: string
  qrSvg: string
  target: Target
  workspaces: RemoteWorkspace[]
}

let current: Session | undefined

const COOKIE = "oc_remote"

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
}

const HTML_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ")

const MANIFEST = {
  name: "OpenCode",
  short_name: "OpenCode",
  start_url: "/",
  display: "standalone",
  background_color: "#0b0b0c",
  theme_color: "#0b0b0c",
  icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
}

const ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
  '<rect width="512" height="512" rx="112" fill="#0b0b0c"/>' +
  '<path d="M150 176l80 80-80 80" stroke="#4f8cff" stroke-width="40" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M270 336h96" stroke="#e4e4e7" stroke-width="40" stroke-linecap="round"/>' +
  "</svg>"
const SKIP_HEADERS = new Set([
  "host",
  "cookie",
  "authorization",
  "x-remote-token",
  "connection",
  "content-length",
  "accept-encoding",
])

function lanAddress() {
  const all: string[] = []
  for (const list of Object.values(networkInterfaces())) {
    for (const item of list ?? []) {
      if (item.family !== "IPv4" || item.internal) continue
      all.push(item.address)
    }
  }
  return (
    all.find((address) => address.startsWith("192.168.")) ??
    all.find((address) => address.startsWith("10.")) ??
    all.find((address) => /^172\.(1[6-9]|2\d|3[01])\./.test(address)) ??
    all[0]
  )
}

function tokenOf(req: http.IncomingMessage, url: URL) {
  const explicit = url.searchParams.get("t")
  if (explicit) return explicit
  const header = req.headers["x-remote-token"]
  if (typeof header === "string" && header) return header
  const cookie = req.headers.cookie ?? ""
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (match) return decodeURIComponent(match[1])
  return undefined
}

function basic(target: Target) {
  return "Basic " + Buffer.from(`${target.username}:${target.password}`).toString("base64")
}

function forbidden(res: http.ServerResponse) {
  res.statusCode = 403
  res.setHeader("content-type", "text/html; charset=utf-8")
  res.end(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<body style="margin:0;padding:32px;background:#0b0b0c;color:#d4d4d8;font:15px/1.5 -apple-system,system-ui,sans-serif">` +
      `<h2 style="margin:0 0 8px;font-size:18px">Ссылка недействительна</h2>` +
      `<p style="margin:0;color:#a1a1aa">Откройте мобильный доступ заново в приложении на компьютере и отсканируйте новый QR-код.</p>`,
  )
}

async function proxy(session: Session, req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue
    if (SKIP_HEADERS.has(key)) continue
    headers[key] = Array.isArray(value) ? value.join(", ") : value
  }
  headers.authorization = basic(session.target)
  const path = url.pathname.slice("/api".length) + url.search
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : req
  try {
    const upstream = await fetch(session.target.url + path, {
      method: req.method,
      headers,
      body: body as unknown as BodyInit,
      duplex: body ? "half" : undefined,
    } as RequestInit)
    const type = upstream.headers.get("content-type") ?? "application/json"
    if (type.includes("text/event-stream")) {
      res.statusCode = upstream.status
      res.setHeader("content-type", type)
      res.setHeader("cache-control", "no-cache, no-transform")
      res.setHeader("connection", "keep-alive")
      res.setHeader("x-accel-buffering", "no")
      const body = upstream.body
      if (!body) {
        res.end()
        return
      }
      const reader = body.getReader()
      let closed = false
      res.on("close", () => {
        closed = true
        void reader.cancel().catch(() => undefined)
      })
      try {
        while (!closed) {
          const { done, value } = await reader.read()
          if (done) break
          if (res.destroyed) break
          if (!res.write(Buffer.from(value))) {
            await new Promise<void>((resolve) => {
              const wake = () => {
                res.off("drain", wake)
                res.off("close", wake)
                resolve()
              }
              res.once("drain", wake)
              res.once("close", wake)
            })
          }
        }
      } catch {
        // client went away
      }
      if (!res.writableEnded) res.end()
      return
    }
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.statusCode = upstream.status
    res.setHeader("content-type", type)
    res.setHeader("cache-control", "no-store")
    res.end(buffer)
  } catch (error) {
    getLogger().error("remote proxy request failed", String(error))
    res.statusCode = 502
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ error: "upstream unavailable" }))
  }
}

function withinWorkspace(session: Session, directory: string) {
  return withinDirectories(
    session.workspaces.map((item) => item.directory),
    directory,
  )
}

async function handle(session: Session, req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", "http://remote.invalid")
  if (url.pathname === "/favicon.ico") {
    res.statusCode = 204
    res.end()
    return
  }
  if (url.pathname === "/manifest.webmanifest") {
    res.setHeader("content-type", "application/manifest+json; charset=utf-8")
    res.end(JSON.stringify(MANIFEST))
    return
  }
  if (url.pathname === "/icon.svg") {
    res.setHeader("content-type", "image/svg+xml; charset=utf-8")
    res.setHeader("cache-control", "public, max-age=86400")
    res.end(ICON)
    return
  }
  const token = tokenOf(req, url)
  if (!token || token !== session.token) {
    forbidden(res)
    return
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    if (url.searchParams.has("t")) {
      res.statusCode = 302
      res.setHeader(
        "set-cookie",
        `${COOKIE}=${encodeURIComponent(session.token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax`,
      )
      res.setHeader("location", "/")
      res.setHeader("cache-control", "no-store")
      res.end()
      return
    }
    res.setHeader("content-type", "text/html; charset=utf-8")
    res.setHeader("cache-control", "no-store")
    res.setHeader("content-security-policy", HTML_CSP)
    res.end(MOBILE_HTML)
    return
  }
  if (url.pathname === "/api/meta") {
    res.setHeader("content-type", "application/json")
    res.setHeader("cache-control", "no-store")
    res.end(JSON.stringify({ workspaces: session.workspaces }))
    return
  }
  if (url.pathname.startsWith("/api/")) {
    const path = url.pathname.slice("/api".length)
    if (!allowedApi(req.method ?? "GET", path)) {
      res.statusCode = 403
      res.setHeader("content-type", "application/json")
      res.setHeader("cache-control", "no-store")
      res.end(JSON.stringify({ error: "forbidden" }))
      return
    }
    const directory = url.searchParams.get("directory") ?? ""
    const allowedDirectory = directory ? withinWorkspace(session, directory) : !scopedApi(path)
    if (!allowedDirectory) {
      res.statusCode = 403
      res.setHeader("content-type", "application/json")
      res.setHeader("cache-control", "no-store")
      res.end(JSON.stringify({ error: "directory is not shared with this device" }))
      return
    }
    await proxy(session, req, res, url)
    return
  }
  res.statusCode = 404
  res.setHeader("content-type", "text/plain; charset=utf-8")
  res.end("not found")
}

export async function startRemote(input: RemoteStartInput, target: Target): Promise<RemoteStatus> {
  await stopRemote()
  const address = lanAddress()
  if (!address) return { active: false, error: "no LAN address found" }

  const token = randomUUID()
  const server = http.createServer((req, res) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value)
    if (!current) {
      res.statusCode = 503
      res.end()
      return
    }
    void handle(current, req, res).catch((error) => {
      getLogger().error("remote request failed", String(error))
      if (!res.headersSent) res.statusCode = 500
      res.end()
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    // Listen on every interface: the LAN address may change (Wi-Fi, VPN), and the
    // token + cookie gate access anyway. The QR still uses the LAN address.
    server.listen(0, "0.0.0.0", () => resolve())
  })

  const bound = server.address()
  const port = typeof bound === "object" && bound ? bound.port : 0
  const url = `http://${address}:${port}/?t=${encodeURIComponent(token)}`
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  })

  current = { server, token, port, url, qrSvg, target, workspaces: input.workspaces }
  getLogger().log("remote control started", { port, workspaces: input.workspaces.length })
  return statusRemote()
}

export async function stopRemote(): Promise<RemoteStatus> {
  const session = current
  current = undefined
  if (session) {
    session.server.closeAllConnections()
    await new Promise<void>((resolve) => session.server.close(() => resolve()))
    getLogger().log("remote control stopped")
  }
  return { active: false }
}

export function statusRemote(): RemoteStatus {
  if (!current) return { active: false }
  return {
    active: true,
    url: current.url,
    qrSvg: current.qrSvg,
    workspaces: current.workspaces,
  }
}
