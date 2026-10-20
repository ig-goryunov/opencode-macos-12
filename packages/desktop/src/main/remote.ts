import { randomUUID } from "node:crypto"
import * as http from "node:http"
import { networkInterfaces } from "node:os"
import QRCode from "qrcode"

import { getLogger } from "./logging"
import { MOBILE_HTML } from "./remote-mobile"

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
      res.statusCode = 501
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ error: "event streams are not available through the remote proxy" }))
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

async function handle(session: Session, req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", "http://remote.invalid")
  if (url.pathname === "/favicon.ico") {
    res.statusCode = 204
    res.end()
    return
  }
  const token = tokenOf(req, url)
  if (!token || token !== session.token) {
    forbidden(res)
    return
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.setHeader("content-type", "text/html; charset=utf-8")
    res.setHeader("cache-control", "no-store")
    res.setHeader("set-cookie", `${COOKIE}=${encodeURIComponent(session.token)}; Path=/; Max-Age=604800; SameSite=Lax`)
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
