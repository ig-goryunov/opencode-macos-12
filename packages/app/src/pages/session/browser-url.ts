import type { ServerConnection } from "@/context/server"

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"])

/**
 * Whether a hostname refers to the machine the embedded browser runs on.
 * Note: this is the renderer machine, which for the desktop app is the user's
 * computer even when OpenCode itself is connected to a remote server.
 */
export function isLocalHostname(hostname: string) {
  const value = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
  return LOCAL_HOSTNAMES.has(value)
}

/**
 * Turn user input into a loadable URL. Bare hosts default to https, but
 * localhost / host:port inputs default to http so local dev servers work
 * without the user typing a scheme.
 */
export function normalizeBrowserUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return ""
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return value
  const authority = value.split(/[/?#]/, 1)[0]
  const hostname = authority.split(":")[0]
  const local = isLocalHostname(hostname) || /:\d+$/.test(authority)
  return `${local ? "http" : "https"}://${value}`
}

/**
 * The hostname of the machine running the OpenCode server, when it is not the
 * local machine. Used to map `localhost` dev servers to wherever OpenCode is
 * actually running (VPS / SSH host), since `localhost` inside the embedded
 * browser always means the user's computer.
 */
export function serverHostname(server?: ServerConnection.Any): string | undefined {
  if (!server) return undefined
  if (server.type === "ssh") return server.host || undefined
  if (server.type === "http") {
    try {
      return new URL(server.http.url).hostname || undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

export function rewriteLocalhost(url: string, hostname: string | undefined): { url: string; rewritten: boolean } {
  if (!hostname) return { url, rewritten: false }
  try {
    const parsed = new URL(url)
    if (!isLocalHostname(parsed.hostname)) return { url, rewritten: false }
    parsed.hostname = hostname
    return { url: parsed.toString(), rewritten: true }
  } catch {
    return { url, rewritten: false }
  }
}

export function displayUrl(url: string) {
  return url.replace(/\/$/, "")
}
