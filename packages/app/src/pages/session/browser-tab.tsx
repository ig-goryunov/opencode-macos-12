import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { createMemo, createSignal, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { displayUrl, normalizeBrowserUrl, rewriteLocalhost, serverHostname } from "@/pages/session/browser-url"

type WebviewElement = HTMLElement & {
  getURL(): string
  loadURL(url: string): Promise<void>
  reload(): void
  goBack(): void
  goForward(): void
}

type WebviewEvent = {
  url?: string
  errorCode?: number
  isMainFrame?: boolean
  errorDescription?: string
}

/**
 * Embedded browser as a first-class view inside the session side panel
 * ("Review and files"). On desktop it is a real Electron <webview>; on the web
 * build an embedded cross-origin browser is not possible, so it degrades to an
 * explicit notice instead of pretending to work.
 */
export function SessionBrowserTab() {
  const platform = usePlatform()
  const language = useLanguage()
  const server = useServer()

  const isDesktop = () => platform.platform === "desktop"
  // The embedded browser always runs on this machine. When OpenCode is
  // connected to a remote server, a `localhost` dev server most likely lives on
  // that server, so we offer to rewrite the host.
  const remoteHost = createMemo(() => (server.isLocal() ? undefined : serverHostname(server.current)))

  const [address, setAddress] = createSignal("")
  const [current, setCurrent] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [rewritten, setRewritten] = createSignal(false)

  let webview: WebviewElement | undefined

  const navigate = (raw: string) => {
    const normalized = normalizeBrowserUrl(raw)
    if (!normalized) return
    const host = remoteHost()
    const result = host ? rewriteLocalhost(normalized, host) : { url: normalized, rewritten: false }
    setRewritten(result.rewritten)
    setCurrent(result.url)
    setAddress(displayUrl(result.url))
    setError(null)
    void webview?.loadURL(result.url).catch(() => undefined)
  }

  const reload = () => {
    if (!current()) return
    webview?.reload()
  }

  const openExternal = () => {
    const url = webview?.getURL() || current()
    if (url && url !== "about:blank") platform.openExternal(url)
  }

  const attach = (element: HTMLElement) => {
    const view = element as WebviewElement
    webview = view
    view.addEventListener("did-start-loading", () => {
      setLoading(true)
      setError(null)
    })
    view.addEventListener("did-stop-loading", () => setLoading(false))
    view.addEventListener("did-fail-load", (event) => {
      const payload = event as unknown as WebviewEvent
      if (payload.isMainFrame === false) return
      // -3 is ERR_ABORTED, fired for navigations that are replaced on purpose.
      if (payload.errorCode === -3) return
      setLoading(false)
      setError(payload.errorDescription || language.t("session.browser.error"))
    })
    const syncUrl = (event: Event) => {
      const url = (event as unknown as WebviewEvent).url
      if (!url || url === "about:blank") return
      setCurrent(url)
      setAddress(displayUrl(url))
    }
    view.addEventListener("did-navigate", syncUrl)
    view.addEventListener("did-navigate-in-page", syncUrl)
    view.addEventListener("new-window", (event) => {
      event.preventDefault()
      const url = (event as unknown as WebviewEvent).url
      if (url) platform.openExternal(url)
    })
  }

  return (
    <div class="flex h-full min-h-0 flex-col overflow-hidden">
      <div class="flex shrink-0 items-center gap-1 border-b border-border-weaker-base px-2 py-1.5">
        <Tooltip value={language.t("common.goBack")} placement="bottom">
          <IconButton icon="chevron-left" variant="ghost" class="h-7 w-7" onClick={() => webview?.goBack()} />
        </Tooltip>
        <Tooltip value={language.t("common.goForward")} placement="bottom">
          <IconButton icon="chevron-right" variant="ghost" class="h-7 w-7" onClick={() => webview?.goForward()} />
        </Tooltip>
        <Tooltip value={language.t("session.browser.reload")} placement="bottom">
          <IconButton icon="reset" variant="ghost" class="h-7 w-7" onClick={reload} />
        </Tooltip>
        <form
          class="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault()
            navigate(address())
          }}
        >
          <input
            type="text"
            spellcheck={false}
            autocomplete="off"
            class="h-7 w-full min-w-0 rounded-md border border-border-weaker-base bg-background-base px-2 text-12-regular text-text-strong outline-none placeholder:text-text-weak focus:border-border-focus"
            placeholder={language.t("session.browser.placeholder")}
            value={address()}
            onInput={(event) => setAddress(event.currentTarget.value)}
          />
        </form>
        <Show when={rewritten() && remoteHost()}>
          <div
            class="shrink-0 rounded-md bg-background-stronger px-1.5 py-0.5 text-11-regular text-text-weak"
            title={language.t("session.browser.rewroteLocalhost")}
          >
            {remoteHost()}
          </div>
        </Show>
        <Tooltip value={language.t("session.browser.openExternal")} placement="bottom">
          <IconButton icon="square-arrow-top-right" variant="ghost" class="h-7 w-7" onClick={openExternal} />
        </Tooltip>
      </div>

      <div class="relative min-h-0 flex-1 overflow-hidden bg-background-base">
        <Show
          when={isDesktop()}
          fallback={
            <div class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <Icon name="globe" size="large" class="text-text-weak" />
              <div class="max-w-72 text-12-regular text-text-weak">{language.t("session.browser.desktopOnly")}</div>
              <Show when={current()}>
                <button
                  type="button"
                  class="rounded-md border border-border-weaker-base px-3 py-1.5 text-12-regular text-text-base hover:bg-background-stronger"
                  onClick={openExternal}
                >
                  {language.t("session.browser.openExternal")}
                </button>
              </Show>
            </div>
          }
        >
          <Show when={loading()}>
            <div class="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-text-strong/30" />
          </Show>

          <Show when={error()}>
            <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background-base px-6 text-center">
              <Icon name="circle-ban-sign" size="large" class="text-text-weak" />
              <div class="max-w-80 break-words text-12-regular text-text-base">{error()}</div>
              <button
                type="button"
                class="rounded-md border border-border-weaker-base px-3 py-1.5 text-12-regular text-text-base hover:bg-background-stronger"
                onClick={reload}
              >
                {language.t("session.browser.retry")}
              </button>
            </div>
          </Show>

          <Show when={!current() && !error()}>
            <div class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Icon name="globe" size="large" class="text-text-weak" />
              <div class="max-w-72 text-12-regular text-text-weak">{language.t("session.browser.empty")}</div>
            </div>
          </Show>

          <webview
            ref={attach}
            class="h-full w-full"
            style={{ "background-color": "var(--background-base)" }}
            src="about:blank"
            partition="persist:opencode-browser"
          />
        </Show>
      </div>
    </div>
  )
}
