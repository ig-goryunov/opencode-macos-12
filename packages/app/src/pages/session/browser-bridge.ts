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

let activeWebview: BrowserWebview | undefined
let waiters: Waiter[] = []

/** The embedded browser tab registers its <webview> here so the bridge can drive it. */
export function registerBrowserWebview(view: BrowserWebview | undefined) {
  activeWebview = view
  if (!view) return
  const pending = waiters
  waiters = []
  pending.forEach((resolve) => resolve(view))
}

function nextWebview(timeoutMs: number): Promise<BrowserWebview | undefined> {
  if (activeWebview) return Promise.resolve(activeWebview)
  return new Promise((resolve) => {
    const settle = (view: BrowserWebview) => {
      clearTimeout(timer)
      resolve(view)
    }
    const timer = setTimeout(() => {
      waiters = waiters.filter((waiter) => waiter !== settle)
      resolve(undefined)
    }, timeoutMs)
    waiters.push(settle)
  })
}

type BrowserCommand = { requestID: string; action: string; url?: string }

/**
 * Always-mounted bridge that lets the AI agent drive the embedded browser. On a
 * `browser.command` event it opens the Review panel and the Browser tab (so the
 * webview mounts), performs the action, then posts the result back to the
 * server. Lives on the session page because the Browser tab itself unmounts
 * while closed.
 */
export function useBrowserBridge() {
  const platform = usePlatform()
  const server = useServer()
  const sdk = useSDK()
  const { tabs, view } = useSessionLayout()

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
    if (platform.platform !== "desktop") {
      await reply(command.requestID, { ok: false, error: "the embedded browser is desktop-only" })
      return
    }

    // Open the Review panel and the Browser tab so the webview mounts.
    view().reviewPanel.open()
    tabs().open("browser")

    const webview = await nextWebview(5000)
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
      void run(event.properties)
    })
    onCleanup(stop)
  })
}
