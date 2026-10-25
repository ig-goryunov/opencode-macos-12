import { For, onCleanup } from "solid-js"
import {
  backgroundSessions,
  guardBrowserNavigation,
  registerBrowserWebview,
  unregisterBrowserWebview,
  type BrowserWebview,
} from "@/pages/session/browser-bridge"
import { browserPartition, recordBrowserNavigation, restoreBrowserUrl } from "@/pages/session/browser-state"

/**
 * Hidden <webview>s for sessions that are not on screen. They let the AI agent
 * open and read the browser of any session, even while the user looks at a
 * different one. Rendered off-screen (not display:none) so the guest attaches.
 */
export function BrowserBackgroundHosts() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: "320px",
        height: "240px",
        overflow: "hidden",
        opacity: "0",
        "pointer-events": "none",
      }}
    >
      <For each={backgroundSessions()}>{(id) => <BackgroundHost sessionID={id} />}</For>
    </div>
  )
}

function BackgroundHost(props: { sessionID: string }) {
  const attach = (element: HTMLElement) => {
    const view = element as BrowserWebview
    const id = props.sessionID
    guardBrowserNavigation(view)
    onCleanup(() => unregisterBrowserWebview(id, view))
    view.addEventListener("dom-ready", () => {
      if (!view.isConnected) return
      registerBrowserWebview(id, view, { background: true })
      const restored = restoreBrowserUrl(id)
      if (restored && view.getURL() === "about:blank") void view.loadURL(restored).catch(() => undefined)
    })
    const sync = (event: Event) => {
      const url = (event as unknown as { url?: string }).url
      if (!url || url === "about:blank") return
      recordBrowserNavigation(id, url)
    }
    view.addEventListener("did-navigate", sync)
    view.addEventListener("did-navigate-in-page", sync)
  }
  return (
    <webview
      ref={attach}
      class="h-full w-full"
      src="about:blank"
      partition={browserPartition(props.sessionID)}
    />
  )
}
