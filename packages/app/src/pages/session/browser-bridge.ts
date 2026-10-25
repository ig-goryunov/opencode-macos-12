import { createSignal, onCleanup, onMount } from "solid-js"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { useServer } from "@/context/server"
import { useSessionLayout } from "@/pages/session/session-layout"
import { authTokenFromCredentials } from "@/utils/server"
import { normalizeBrowserUrl, rewriteLocalhost, serverHostname } from "@/pages/session/browser-url"
import { rememberBrowserUrl, stepBrowserHistory } from "@/pages/session/browser-state"

export type BrowserWebview = HTMLElement & {
  getURL(): string
  loadURL(url: string): Promise<void>
  reload(): void
  goBack(): void
  goForward(): void
  executeJavaScript(code: string, userGesture?: boolean): Promise<unknown>
}

type Waiter = (view: BrowserWebview) => void

/**
 * The embedded browser is per session: every session keeps its own <webview>,
 * its own last URL/history (see browser-state.ts) and its own pending agent
 * commands. The registry lives in module scope so switching sessions neither
 * loses the view nor the page. A session that is not on screen gets a hidden
 * background <webview> (rendered by BrowserBackgroundHosts) so the agent can
 * still drive it.
 */
type Entry = { view: BrowserWebview; background: boolean }

const webviews = new Map<string, Entry>()
const waiters = new Map<string, Set<Waiter>>()
const handled = new Set<string>()

const BACKGROUND_LIMIT = 3
const [background, setBackground] = createSignal<string[]>([])

const HANDLED_TTL = 60_000
const BACKGROUND_IDLE = 90_000
const BACKGROUND_SWEEP = 30_000
const lastUse = new Map<string, number>()
let sweeper: ReturnType<typeof setInterval> | undefined

function touchBackground(sessionID: string) {
  lastUse.set(sessionID, Date.now())
  if (sweeper) return
  sweeper = setInterval(() => {
    const now = Date.now()
    for (const id of background()) {
      if (now - (lastUse.get(id) ?? 0) < BACKGROUND_IDLE) continue
      releaseBackgroundWebview(id)
      lastUse.delete(id)
    }
  }, BACKGROUND_SWEEP)
}

/** Sessions that currently need a hidden webview (for the agent). */
export function backgroundSessions() {
  return background()
}

/** The embedded browser tab registers its <webview> here so the bridge can drive it. */
export function registerBrowserWebview(sessionID: string, view: BrowserWebview, options?: { background?: boolean }) {
  const isBackground = options?.background ?? false
  const existing = webviews.get(sessionID)
  // A visible view always wins; a background view never replaces it.
  if (existing && !existing.background && isBackground) return
  webviews.set(sessionID, { view, background: isBackground })
  if (!isBackground && existing?.background) releaseBackgroundWebview(sessionID)
  const set = waiters.get(sessionID)
  if (!set) return
  waiters.delete(sessionID)
  set.forEach((resolve) => resolve(view))
}

export function unregisterBrowserWebview(sessionID: string, view: BrowserWebview) {
  const existing = webviews.get(sessionID)
  if (existing?.view === view) webviews.delete(sessionID)
}

/** Ask BrowserBackgroundHosts to mount a hidden webview for this session. */
export function ensureBackgroundWebview(sessionID: string) {
  touchBackground(sessionID)
  if (webviews.has(sessionID)) return
  setBackground((list) => {
    if (list.includes(sessionID)) return list
    const next = [...list, sessionID]
    return next.length > BACKGROUND_LIMIT ? next.slice(next.length - BACKGROUND_LIMIT) : next
  })
}

export function releaseBackgroundWebview(sessionID: string) {
  lastUse.delete(sessionID)
  setBackground((list) => (list.includes(sessionID) ? list.filter((id) => id !== sessionID) : list))
}

const SAFE_PROTOCOLS = new Set(["http:", "https:", "about:"])

/** The agent-controlled page must never navigate to file:, data:, javascript: and the like. */
export function guardBrowserNavigation(view: BrowserWebview) {
  view.addEventListener("will-navigate", (event) => {
    const target = (event as unknown as { url?: string }).url ?? ""
    try {
      if (SAFE_PROTOCOLS.has(new URL(target).protocol)) return
    } catch {
      // fall through: unparsable urls are blocked
    }
    event.preventDefault()
  })
}

function markHandled(requestID: string) {
  handled.add(requestID)
  setTimeout(() => handled.delete(requestID), HANDLED_TTL)
}

function nextWebview(sessionID: string, timeoutMs: number): Promise<BrowserWebview | undefined> {
  const existing = webviews.get(sessionID)
  if (existing) return Promise.resolve(existing.view)
  return new Promise((resolve) => {
    const settle = (view: BrowserWebview) => {
      clearTimeout(timer)
      resolve(view)
    }
    const timer = setTimeout(() => {
      const set = waiters.get(sessionID)
      if (set) {
        set.delete(settle)
        if (!set.size) waiters.delete(sessionID)
      }
      resolve(undefined)
    }, timeoutMs)
    const set = waiters.get(sessionID) ?? new Set<Waiter>()
    set.add(settle)
    waiters.set(sessionID, set)
  })
}

type BrowserCommand = { requestID: string; action: string; url?: string; sessionID?: string }

/**
 * Always-mounted bridge that lets the AI agent drive the embedded browser. On a
 * `browser.command` event it drives the browser of the session the command
 * belongs to: the visible one opens the Review panel and the Browser tab first,
 * while a hidden session gets a background webview. Lives on the session page
 * because the Browser tab itself unmounts while closed.
 */
export function useBrowserBridge() {
  const platform = usePlatform()
  const server = useServer()
  const sdk = useSDK()
  const { params, tabs, view } = useSessionLayout()

  const sessionID = () => params.id ?? ""

  const reply = async (requestID: string, result: Record<string, unknown>) => {
    const conn = server.current
    const http = conn && "http" in conn ? conn.http : undefined
    if (!http) return
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (http.password) {
      headers.Authorization = `Basic ${authTokenFromCredentials({ username: http.username, password: http.password })}`
    }
    const directory = encodeURIComponent(sdk().directory)
    await (platform.fetch ?? globalThis.fetch)(
      `${http.url}/browser/${encodeURIComponent(requestID)}/reply?directory=${directory}`,
      { method: "POST", headers, body: JSON.stringify(result) },
    ).catch(() => undefined)
  }

  const run = async (command: BrowserCommand) => {
    if (handled.has(command.requestID)) return
    markHandled(command.requestID)

    if (platform.platform !== "desktop") {
      await reply(command.requestID, { ok: false, error: "the embedded browser is desktop-only" })
      return
    }

    const visible = sessionID()
    const target = command.sessionID ?? visible
    const isVisible = target === visible && !!visible

    if (isVisible) {
      // Open the Review panel and the Browser tab so the webview mounts.
      view().reviewPanel.open()
      tabs().open("browser")
    } else {
      // Not on screen: mount a hidden webview for that session instead.
      ensureBackgroundWebview(target)
    }

    const webview = await nextWebview(target, 15_000)
    if (!webview) {
      await reply(command.requestID, { ok: false, error: "the browser view did not open" })
      return
    }

    try {
      if (command.action === "open") {
        const normalized = normalizeBrowserUrl(command.url ?? "")
        if (!normalized) {
          await reply(command.requestID, { ok: false, error: "missing url" })
          return
        }
        const host = server.isLocal() ? undefined : serverHostname(server.current)
        const next = host ? rewriteLocalhost(normalized, host).url : normalized
        await webview.loadURL(next)
        rememberBrowserUrl(target, next)
        await reply(command.requestID, { ok: true, url: next })
        return
      }
      if (command.action === "back" || command.action === "forward") {
        const next = stepBrowserHistory(target, command.action === "back" ? -1 : 1)
        if (next) {
          await webview.loadURL(next)
          await reply(command.requestID, { ok: true, url: next })
          return
        }
        await reply(command.requestID, { ok: true, url: webview.getURL() })
        return
      }
      if (command.action === "reload") webview.reload()
      if (command.action === "read") {
        const info = (await webview.executeJavaScript(
          "({ url: location.href, title: document.title, text: (document.body ? document.body.innerText : '').slice(0, 20000) })",
          true,
        )) as { url: string; title: string; text: string }
        await reply(command.requestID, { ok: true, url: info.url, title: info.title, text: info.text })
        return
      }
      await reply(command.requestID, { ok: true, url: webview.getURL() })
    } catch (error) {
      await reply(command.requestID, { ok: false, error: String(error) })
    }
  }

  onMount(() => {
    const emitter = sdk().event as unknown as {
      on: (type: string, callback: (event: { properties: BrowserCommand }) => void) => () => void
    }
    const stop = emitter.on("browser.command", (event) => {
      void run(event.properties)
    })
    onCleanup(stop)
  })
}
