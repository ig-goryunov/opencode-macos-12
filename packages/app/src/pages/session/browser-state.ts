/**
 * Per-session page state for the embedded browser: the current URL plus a small
 * back/forward history. Kept in module scope and persisted to localStorage, so
 * it survives tab remounts, session switches and app restarts.
 */

export type BrowserSessionState = {
  url?: string
  entries: string[]
  index: number
}

const KEY = "opencode.browser.v2"

const states = new Map<string, BrowserSessionState>()
let loaded = false

function readAll(): Record<string, BrowserSessionState> {
  try {
    if (typeof localStorage === "undefined") return {}
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, BrowserSessionState>) : {}
  } catch {
    return {}
  }
}

function load() {
  if (loaded) return
  loaded = true
  for (const [id, value] of Object.entries(readAll())) {
    if (!value || typeof value !== "object") continue
    const entries = Array.isArray(value.entries) ? value.entries.filter((entry) => typeof entry === "string") : []
    const index = typeof value.index === "number" ? value.index : entries.length - 1
    states.set(id, { url: typeof value.url === "string" ? value.url : undefined, entries, index })
  }
}

function persist() {
  try {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(states)))
  } catch {
    // best effort: the in-memory map still works for this run
  }
}

function state(sessionID: string): BrowserSessionState {
  load()
  let current = states.get(sessionID)
  if (!current) {
    current = { entries: [], index: -1 }
    states.set(sessionID, current)
  }
  return current
}

/** Partition name so every session gets its own cookie jar (isolated logins). */
export function browserPartition(sessionID: string) {
  const safe = sessionID.replace(/[^a-zA-Z0-9_-]/g, "")
  return safe ? `persist:opencode-browser-${safe}` : "persist:opencode-browser"
}

export function restoreBrowserUrl(sessionID: string): string | undefined {
  return state(sessionID).url
}

export function browserHistory(sessionID: string): { url?: string; canBack: boolean; canForward: boolean } {
  const current = state(sessionID)
  return {
    url: current.url,
    canBack: current.index > 0,
    canForward: current.index >= 0 && current.index < current.entries.length - 1,
  }
}

/** Remember the current page without touching the history stack. */
export function rememberBrowserUrl(sessionID: string, url: string) {
  if (!url || url === "about:blank") return
  const current = state(sessionID)
  current.url = url
  persist()
}

/** Record a navigation that the page itself performed (link, redirect, reload). */
export function recordBrowserNavigation(sessionID: string, url: string) {
  if (!url || url === "about:blank") return
  const current = state(sessionID)
  if (current.entries[current.index] === url) {
    current.url = url
    persist()
    return
  }
  current.entries = [...current.entries.slice(0, current.index + 1), url]
  current.index = current.entries.length - 1
  current.url = url
  persist()
}

/**
 * Move through the persisted history. Returns the URL to load (or undefined at
 * the end of the stack). The caller loads it; the resulting did-navigate then
 * just re-syncs via `recordBrowserNavigation`.
 */
export function stepBrowserHistory(sessionID: string, delta: 1 | -1): string | undefined {
  const current = state(sessionID)
  const next = current.index + delta
  if (next < 0 || next >= current.entries.length) return undefined
  current.index = next
  current.url = current.entries[next]
  persist()
  return current.url
}
