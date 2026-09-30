import { onCleanup, onMount } from "solid-js"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { useServer } from "@/context/server"
import { useSessionLayout } from "@/pages/session/session-layout"
import { authTokenFromCredentials } from "@/utils/server"
import { normalizeBrowserUrl, rewriteLocalhost, serverHostname } from "@/pages/session/browser-url"

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
 * its own last URL and its own pending agent commands. All of this lives in
 * module scope (keyed by session id) so that switching sessions neither loses
 * the view nor the page.
 */
const webviews = new Map<string, BrowserWebview>()
const waiters = new Map<string, Set<Waiter>>()
const urls = new Map<string, string>()
const held = new Map<string, { command: BrowserCommand; at: number }[]>()
const handled = new Set<string>()

const HOLD_TTL = 20_000
const HANDLED_TTL = 60_000

/** The embedded browser tab registers its <webview> here so the bridge can drive it. */
export function registerBrowserWebview(sessionID: string, view: BrowserWebview) {
  webviews.set(sessionID, view)
  const set = waiters.get(sessionID)
  if (!set) return
  waiters.delete(sessionID)
  set.forEach((resolve) => resolve(view))
}

export function unregisterBrowserWebview(sessionID: string, view: BrowserWebview) {
  if (webviews.get(sessionID) === view) webviews.delete(sessionID)
}

export function rememberBrowserUrl(sessionID: string, url: string) {
  if (!url || url === "about:blank") return
  urls.set(sessionID, url)
}

export function recallBrowserUrl(sessionID: string) {
  return urls.get(sessionID)
}

function markHandled(requestID: string) {
  handled.add(requestID)
  setTimeout(() => handled.delete(requestID), HANDLED_TTL)
}

function nextWebview(sessionID: string, timeoutMs: number): Promise<BrowserWebview | undefined> {
  const existing = webviews.get(sessionID)
  if (existing) return Promise.resolve(existing)
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

function holdBrowserCommand(command: BrowserCommand) {
  const target = command.sessionID
  if (!target) return
  const list = held.get(target) ?? []
  list.push({ command, at: Date.now() })
  held.set(target, list)
}

function takeBrowserCommands(sessionID: string) {
  const list = held.get(sessionID) ?? []
  held.delete(sessionID)
  return list.filter((entry) => Date.now() - entry.at < HOLD_TTL).map((entry) => entry.command)
}

/**
 * Always-mounted bridge that lets the AI agent drive the embedded browser. On a
 * `browser.command` event it opens the Review panel and the Browser tab (so the
 * webview mounts), performs the action, then posts the result back to the
 * server. Lives on the session page because the Browser tab itself unmounts
 * while closed. Commands addressed to another session are held until that
 * session's page is mounted, instead of being lost.
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

    // Open the Review panel and the Browser tab so the webview mounts.
    view().reviewPanel.open()
    tabs().open("browser")

    const webview = await nextWebview(sessionID(), 15_000)
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
        const target = host ? rewriteLocalhost(normalized, host).url : normalized
        await webview.loadURL(target)
        rememberBrowserUrl(sessionID(), target)
        await reply(command.requestID, { ok: true, url: target })
        return
      }
      if (command.action === "reload") webview.reload()
      if (command.action === "back") webview.goBack()
      if (command.action === "forward") webview.goForward()
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
      const command = event.properties
      const target = command.sessionID
      if (target && target !== sessionID()) {
        // The command belongs to another session; keep it until that page mounts.
        holdBrowserCommand(command)
        return
      }
      void run(command)
    })
    onCleanup(stop)

    // This session may have received commands while its page was not mounted.
    for (const command of takeBrowserCommands(sessionID())) void run(command)
  })
}
