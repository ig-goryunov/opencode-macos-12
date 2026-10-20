import { Show, createSignal, onCleanup } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { useLanguage } from "@/context/language"

type RemoteState = { active: boolean; url?: string; qrSvg?: string; error?: string }

type RemoteBridge = {
  start: (input: { workspaces: { directory: string; name: string }[] }) => Promise<RemoteState>
  stop: () => Promise<unknown>
  status?: () => Promise<RemoteState>
}

const bridge = () => (window as unknown as { api?: { remote?: RemoteBridge } }).api?.remote

export function DialogMobileAccess(props: { workspaces: { directory: string; name: string }[] }) {
  const language = useLanguage()
  const [state, setState] = createSignal<RemoteState>({ active: false })
  const [error, setError] = createSignal<string>()
  const [copied, setCopied] = createSignal(false)
  let stopped = false

  const stop = async () => {
    stopped = true
    await bridge()?.stop()?.catch(() => undefined)
    setState({ active: false })
  }

  void (async () => {
    const remote = bridge()
    if (!remote) {
      setError(language.t("dialog.mobile.unavailable"))
      return
    }
    try {
      const current = await remote.status?.()
      if (current?.active && current.url) {
        setState(current)
        return
      }
      const next = await remote.start({ workspaces: props.workspaces })
      if (stopped) {
        await remote.stop()
        return
      }
      if (next?.error) setError(next.error)
      setState(next ?? { active: false })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  })()

  onCleanup(() => {
    if (!stopped) void bridge()?.stop()
  })

  const copy = async () => {
    const url = state().url
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      title={language.t("dialog.mobile.title")}
      description={language.t("dialog.mobile.description")}
      fit
    >
      <div class="flex flex-col gap-4 pl-6 pr-6 pb-4">
        <Show when={error()}>
          <p class="text-14-regular text-text-critical-base">{error()}</p>
        </Show>
        <Show
          when={state().active && state().qrSvg}
          fallback={<p class="text-14-regular text-text-weak">{language.t("dialog.mobile.loading")}</p>}
        >
          <div class="flex justify-center rounded-xl bg-white p-3">
            <div class="size-[240px] overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full" innerHTML={state().qrSvg} />
          </div>
          <div class="break-all rounded-lg bg-surface-raised-base px-3 py-2 text-12-regular text-text-weak">
            {state().url}
          </div>
          <p class="text-12-regular text-text-weak">{language.t("dialog.mobile.hint")}</p>
          <div class="flex justify-between gap-2">
            <Button variant="ghost" size="large" onClick={() => void copy()}>
              {copied() ? language.t("dialog.mobile.copied") : language.t("dialog.mobile.copy")}
            </Button>
            <Button variant="secondary" size="large" onClick={() => void stop()}>
              {language.t("dialog.mobile.stop")}
            </Button>
          </div>
        </Show>
      </div>
    </Dialog>
  )
}
