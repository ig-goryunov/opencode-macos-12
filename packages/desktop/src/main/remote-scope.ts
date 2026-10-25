import { resolve, sep } from "node:path"

// Only the endpoints the phone page needs. Anything else (pty, shell, file, upgrade,
// terminal, ...) stays reachable from the desktop app but not over the LAN.
const ALLOWED: { path: RegExp; methods: string[] }[] = [
  { path: /^\/session$/, methods: ["GET", "POST"] },
  { path: /^\/session\/status$/, methods: ["GET"] },
  { path: /^\/session\/[A-Za-z0-9_.-]+$/, methods: ["GET"] },
  { path: /^\/session\/[A-Za-z0-9_.-]+\/message$/, methods: ["GET"] },
  { path: /^\/session\/[A-Za-z0-9_.-]+\/children$/, methods: ["GET"] },
  { path: /^\/session\/[A-Za-z0-9_.-]+\/prompt_async$/, methods: ["POST"] },
  { path: /^\/session\/[A-Za-z0-9_.-]+\/abort$/, methods: ["POST"] },
  { path: /^\/permission$/, methods: ["GET"] },
  { path: /^\/permission\/[A-Za-z0-9_.-]+\/reply$/, methods: ["POST"] },
  { path: /^\/config\/providers$/, methods: ["GET"] },
  { path: /^\/event$/, methods: ["GET"] },
]

export function allowedApi(method: string, path: string) {
  const upper = method.toUpperCase()
  return ALLOWED.some((item) => item.path.test(path) && item.methods.includes(upper))
}

// Endpoints that act on a project must name one of the folders the user shared
// with the phone. Without this the token would unlock every project on the
// machine (and `prompt_async` would run the agent anywhere).
export function scopedApi(path: string) {
  if (path === "/session" || path === "/permission") return true
  if (path === "/session/status") return false
  if (/^\/session\/[A-Za-z0-9_.-]+(\/(message|children|prompt_async|abort))?$/.test(path)) return true
  if (/^\/permission\/[A-Za-z0-9_.-]+\/reply$/.test(path)) return true
  return false
}

export function withinDirectories(roots: string[], directory: string) {
  if (!directory) return false
  const target = resolve(directory)
  return roots.some((root) => {
    const base = resolve(root)
    return target === base || target.startsWith(base + sep)
  })
}
