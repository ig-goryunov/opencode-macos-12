/**
 * Per-session page state for the embedded browser: the current URL plus a small
 * back/forward history. Kept in module scope and persisted to localStorage, so
 * it survives tab remounts, session switches and app restarts.
 */

export type BrowserSessionState = {
  url?: string
  entries: string[]
  index: number
  favicons: Record<string, string>
}

const MAX_ENTRIES = 100
const MAX_FAVICONS = 200

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
    const favicons =
      value.favicons && typeof value.favicons === "object"
        ? Object.fromEntries(
            Object.entries(value.favicons).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length <= 2048,
            ),
          )
        : {}
    states.set(id, { url: typeof value.url === "string" ? value.url : undefined, entries, index, favicons })
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
    current = { entries: [], index: -1, favicons: {} }
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

export function browserHistoryEntries(sessionID: string): { entries: string[]; index: number } {
  const current = state(sessionID)
  return { entries: [...current.entries], index: current.index }
}

export function browserFavicon(sessionID: string, url: string): string | undefined {
  return state(sessionID).favicons[url]
}

export function rememberBrowserFavicon(sessionID: string, url: string, favicon: string) {
  if (!url || url === "about:blank") return
  if (!/^https?:\/\//.test(favicon) || favicon.length > 2048) return
  const current = state(sessionID)
  if (current.favicons[url] === favicon) return
  current.favicons[url] = favicon
  const keys = Object.keys(current.favicons)
  if (keys.length > MAX_FAVICONS) {
    for (const key of keys.slice(0, keys.length - MAX_FAVICONS)) delete current.favicons[key]
  }
  persist()
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
  current.entries = [...current.entries.slice(0, current.index + 1), url].slice(-MAX_ENTRIES)
  current.index = current.entries.length - 1
  current.url = url
  persist()
}

/**
 * Move through the persisted history. Returns the URL to load (or undefined at
 * the end of the stack). The caller loads it; the resulting did-navigate then
 * just re-syncs via `recordBrowserNavigation`.
 */
export function jumpBrowserHistory(sessionID: string, index: number): string | undefined {
  const current = state(sessionID)
  if (index < 0 || index >= current.entries.length) return undefined
  current.index = index
  current.url = current.entries[index]
  persist()
  return current.url
}

export function stepBrowserHistory(sessionID: string, delta: 1 | -1): string | undefined {
  const current = state(sessionID)
  const next = current.index + delta
  if (next < 0 || next >= current.entries.length) return undefined
  current.index = next
  current.url = current.entries[next]
  persist()
  return current.url
}
