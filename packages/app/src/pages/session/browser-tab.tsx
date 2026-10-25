import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { createMemo, createSignal, onCleanup, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { usePrompt } from "@/context/prompt"
import { useServer } from "@/context/server"
import {
  guardBrowserNavigation,
  registerBrowserWebview,
  unregisterBrowserWebview,
  type BrowserWebview,
} from "@/pages/session/browser-bridge"
import {
  browserHistory,
  browserPartition,
  recordBrowserNavigation,
  rememberBrowserUrl,
  restoreBrowserUrl,
  stepBrowserHistory,
} from "@/pages/session/browser-state"
import { displayUrl, normalizeBrowserUrl, rewriteLocalhost, serverHostname } from "@/pages/session/browser-url"

type WebviewElement = BrowserWebview

const PICK_SCRIPT = String.raw`(() => {
  const old = window.__ocPick
  if (old) old.stop()
  const overlay = document.createElement("div")
  const tag = document.createElement("div")
  const css = { position: "fixed", zIndex: "2147483647", pointerEvents: "none", boxSizing: "border-box", display: "none" }
  Object.assign(overlay.style, css, { border: "2px solid #4f8cff", background: "rgba(79,140,255,0.12)", borderRadius: "3px" })
  Object.assign(tag.style, css, {
    background: "#4f8cff", color: "#fff", font: "11px/1.5 -apple-system,system-ui,sans-serif",
    padding: "1px 6px", borderRadius: "4px", maxWidth: "70vw", overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
  })
  const root = document.documentElement
  root.appendChild(overlay)
  root.appendChild(tag)
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim()
  const clip = (value, max) => clean(value).slice(0, max)
  const labelOf = (el) =>
    clip(el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("alt") || el.getAttribute("title") || el.getAttribute("name") || el.innerText || el.value, 80) ||
    el.tagName.toLowerCase()
  const selectorOf = (el) => {
    if (el.id) return "#" + CSS.escape(el.id)
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && parts.length < 5) {
      let part = node.tagName.toLowerCase()
      const classes = Array.from(node.classList).filter((name) => name && !name.startsWith("__oc")).slice(0, 2)
      if (classes.length) part += "." + classes.map((name) => CSS.escape(name)).join(".")
      const parent = node.parentElement
      if (parent) {
        const same = Array.from(parent.children).filter((child) => child.tagName === node.tagName)
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(node) + 1) + ")"
      }
      parts.unshift(part)
      if (node.id) { parts[0] = "#" + CSS.escape(node.id); break }
      node = parent
    }
    return parts.join(" > ")
  }
  const rectOf = (el) => {
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
  }
  const move = (event) => {
    const el = event.target
    if (!el || el === overlay || el === tag || el.nodeType !== 1) return
    const r = el.getBoundingClientRect()
    overlay.style.display = "block"
    overlay.style.left = r.left + "px"
    overlay.style.top = r.top + "px"
    overlay.style.width = r.width + "px"
    overlay.style.height = r.height + "px"
    tag.style.display = "block"
    tag.textContent = labelOf(el)
    tag.style.left = Math.max(0, r.left) + "px"
    tag.style.top = Math.max(0, r.top - 19) + "px"
  }
  const stop = () => {
    window.__ocPickActive = false
    overlay.remove()
    tag.remove()
    document.removeEventListener("mousemove", move, true)
    document.removeEventListener("click", done, true)
    document.removeEventListener("keydown", escape, true)
    window.__ocPick = undefined
  }
  const done = (event) => {
    const el = event.target
    if (!el || el === overlay || el === tag || el.nodeType !== 1) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    window.__ocPickResult = {
      cancelled: false,
      url: location.href,
      title: document.title,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || "",
      label: labelOf(el),
      text: clip(el.innerText || el.value, 300),
      selector: selectorOf(el),
      rect: rectOf(el),
    }
    stop()
  }
  const escape = (event) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    window.__ocPickResult = { cancelled: true }
    stop()
  }
  document.addEventListener("mousemove", move, true)
  document.addEventListener("click", done, true)
  document.addEventListener("keydown", escape, true)
  window.__ocPickActive = true
  window.__ocPickResult = null
  window.__ocPick = { stop }
  return true
})()`

type PickedElement = {
  cancelled: boolean
  url?: string
  title?: string
  tag?: string
  role?: string
  label?: string
  text?: string
  selector?: string
  rect?: { x: number; y: number; width: number; height: number }
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
  const prompt = usePrompt()
  const server = useServer()
  const params = useParams()

  const isDesktop = () => platform.platform === "desktop"
  const sessionID = () => params.id ?? ""
  // The embedded browser always runs on this machine. When OpenCode is
  // connected to a remote server, a `localhost` dev server most likely lives on
  // that server, so we offer to rewrite the host.
  const remoteHost = createMemo(() => (server.isLocal() ? undefined : serverHostname(server.current)))

  // Each session keeps its own page and history, so reopening the tab restores it.
  const remembered = sessionID() ? restoreBrowserUrl(sessionID()) : undefined
  const [address, setAddress] = createSignal(remembered ? displayUrl(remembered) : "")
  const [current, setCurrent] = createSignal(remembered ?? "")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [rewritten, setRewritten] = createSignal(false)
  const [pickActive, setPickActive] = createSignal(false)
  let pickTimer: ReturnType<typeof setInterval> | undefined
  let pickTimeout: ReturnType<typeof setTimeout> | undefined

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
    if (sessionID()) rememberBrowserUrl(sessionID(), result.url)
    void webview?.loadURL(result.url).catch(() => undefined)
  }

  const step = (delta: 1 | -1) => {
    const id = sessionID()
    if (!id) return
    const url = stepBrowserHistory(id, delta)
    if (!url) return
    setCurrent(url)
    setAddress(displayUrl(url))
    setError(null)
    void webview?.loadURL(url).catch(() => undefined)
  }

  const reload = () => {
    if (!current()) return
    webview?.reload()
  }

  let escapePick: ((event: KeyboardEvent) => void) | undefined

  const stopPick = () => {
    if (pickTimer) clearInterval(pickTimer)
    if (pickTimeout) clearTimeout(pickTimeout)
    if (escapePick) window.removeEventListener("keydown", escapePick, true)
    pickTimer = undefined
    pickTimeout = undefined
    escapePick = undefined
    setPickActive(false)
    void webview?.executeJavaScript("window.__ocPick && window.__ocPick.stop()", true).catch(() => undefined)
  }

  const finishPick = (result: PickedElement) => {
    if (!pickActive()) return
    stopPick()
    if (result.cancelled || !result.selector) return
    const label = (result.label ?? result.tag ?? "").replace(/\s+/g, " ").trim().slice(0, 28)
    prompt.context.add({
      type: "element",
      path: result.url ?? current(),
      label,
      selector: result.selector,
      element: result.tag,
      text: (result.text ?? "").slice(0, 300),
      preview: `${result.tag ?? "element"} ${result.selector}`,
    })
    window.dispatchEvent(new Event("opencode:focus-composer"))
  }

  const startPick = () => {
    if (!isDesktop() || !webview) return
    if (!current()) return
    setPickActive(true)
    escapePick = (event) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      stopPick()
    }
    window.addEventListener("keydown", escapePick, true)
    void webview
      .executeJavaScript(PICK_SCRIPT, true)
      .then(() => {
        if (pickTimer) clearInterval(pickTimer)
        if (pickTimeout) clearTimeout(pickTimeout)
        pickTimeout = setTimeout(stopPick, 90_000)
        pickTimer = setInterval(async () => {
          try {
            const result = (await webview?.executeJavaScript("window.__ocPickResult", true)) as PickedElement | null
            if (!result) return
            await webview?.executeJavaScript("window.__ocPickResult = null", true).catch(() => undefined)
            finishPick(result)
          } catch {
            stopPick()
          }
        }, 150)
      })
      .catch(() => setPickActive(false))
  }

  const openExternal = () => {
    const url = webview?.getURL() || current()
    if (url && url !== "about:blank") platform.openExternal(url)
  }

  onCleanup(() => stopPick())

  const attach = (element: HTMLElement) => {
    const view = element as WebviewElement
    webview = view
    guardBrowserNavigation(view)
    const key = sessionID()
    onCleanup(() => {
      if (key) unregisterBrowserWebview(key, view)
    })
    // Register only once the guest is ready, otherwise loadURL throws
    // "The WebView must be attached to the DOM and the dom-ready event emitted".
    view.addEventListener("dom-ready", () => {
      if (!view.isConnected) return
      if (key) registerBrowserWebview(key, view)
      const restored = key ? restoreBrowserUrl(key) : undefined
      if (restored && view.getURL() === "about:blank") {
        void view.loadURL(restored).catch(() => undefined)
      }
    })
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
      if (key) recordBrowserNavigation(key, url)
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
          <IconButton
            icon="chevron-left"
            variant="ghost"
            class="h-7 w-7"
            disabled={!current() || !browserHistory(sessionID()).canBack}
            onClick={() => step(-1)}
          />
        </Tooltip>
        <Tooltip value={language.t("common.goForward")} placement="bottom">
          <IconButton
            icon="chevron-right"
            variant="ghost"
            class="h-7 w-7"
            disabled={!current() || !browserHistory(sessionID()).canForward}
            onClick={() => step(1)}
          />
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
        <Tooltip
          value={language.t(pickActive() ? "session.browser.pick.cancel" : "session.browser.pick")}
          placement="bottom"
        >
          <IconButton
            icon="window-cursor"
            variant="ghost"
            class="h-7 w-7"
            classList={{ "bg-surface-interactive-hover": pickActive() }}
            disabled={!current()}
            onClick={() => (pickActive() ? stopPick() : startPick())}
          />
        </Tooltip>
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

          <Show when={pickActive()}>
            <div class="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-4">
              <div class="rounded-md bg-text-strong px-3 py-1.5 text-12-regular text-text-invert-base shadow-sm">
                {language.t("session.browser.pick.hint")}
              </div>
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
            partition={browserPartition(sessionID())}
          />
        </Show>
      </div>
    </div>
  )
}
