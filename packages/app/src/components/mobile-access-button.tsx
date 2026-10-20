import { Show, createSignal, onCleanup, onMount } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { useSDK } from "@/context/sdk"

type RemoteState = { active: boolean; url?: string; qrSvg?: string; error?: string }

type RemoteBridge = {
  start: (input: { workspaces: { directory: string; name: string }[] }) => Promise<RemoteState>
  stop: () => Promise<unknown>
  status: () => Promise<RemoteState>
}

const bridge = () => (window as unknown as { api?: { remote?: RemoteBridge } }).api?.remote

/**
 * Mobile access control next to the context indicator: click opens a panel with
 * the on/off switch, the status and the QR code for the phone.
 */
export function MobileAccessButton() {
  const language = useLanguage()
  const platform = usePlatform()
  const sdk = useSDK()
  const server = useServer()

  const [active, setActive] = createSignal(false)
  const [busy, setBusy] = createSignal(false)
  const [open, setOpen] = createSignal(false)
  const [remote, setRemote] = createSignal<RemoteState>()
  const [copied, setCopied] = createSignal(false)
  let root: HTMLDivElement | undefined

  const workspaces = () => {
    const seen = new Set<string>()
    const list: { directory: string; name: string }[] = []
    const push = (directory: string | undefined) => {
      if (!directory || seen.has(directory)) return
      seen.add(directory)
      list.push({ directory, name: directory.split("/").filter(Boolean).pop() ?? directory })
    }
    push(sdk().directory)
    for (const project of server.projects.list()) push(project.worktree)
    return list
  }

  const refresh = async () => {
    try {
      const state = await bridge()?.status?.()
      if (!state) return
      setActive(!!state.active)
      if (state.active) setRemote(state)
    } catch {}
  }

  onMount(() => {
    void refresh()
    const onDown = (event: MouseEvent) => {
      if (root && !root.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    onCleanup(() => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    })
  })

  const start = async () => {
    const api = bridge()
    if (!api) return
    setBusy(true)
    try {
      const next = await api.start({ workspaces: workspaces() })
      setRemote(next)
      setActive(!!next?.active)
    } finally {
      setBusy(false)
    }
  }

  const stop = async () => {
    setBusy(true)
    try {
      await bridge()?.stop()?.catch(() => undefined)
      setActive(false)
      setRemote(undefined)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (checked: boolean) => {
    if (busy()) return
    if (checked) void start()
    else void stop()
  }

  const copy = async () => {
    const url = remote()?.url
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const show = (event: MouseEvent) => {
    event.stopPropagation()
    setOpen((value) => {
      if (!value) void refresh()
      return !value
    })
  }

  return (
    <Show when={platform.platform === "desktop" && !!bridge()}>
      <div ref={root} class="relative flex shrink-0 items-center">
        <Tooltip value={language.t("dialog.mobile.title")} placement="bottom">
          <IconButton
            icon="share"
            variant="ghost"
            class="h-7 w-7"
            onClick={show}
            aria-label={language.t("dialog.mobile.title")}
            aria-expanded={open()}
            data-active={active() ? "true" : undefined}
          />
        </Tooltip>
        <Show when={active()}>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute right-1 top-1 size-1.5 rounded-full"
            style={{ background: "var(--v2-icon-icon-success, #39c07a)" }}
          />
        </Show>

        <Show when={open()}>
          <div
            class="absolute right-0 top-full z-50 mt-1 flex w-[300px] flex-col gap-2.5 rounded-xl border border-border-weaker-base bg-background-base p-3 shadow-[0_12px_32px_rgba(0,0,0,.35)]"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-13-medium text-text-strong">{language.t("dialog.mobile.title")}</div>
              <Switch checked={active()} onChange={toggle} />
            </div>

            <div class="flex items-center gap-1.5 text-11-regular text-text-weak">
              <span
                class="size-1.5 rounded-full"
                style={{
                  background: active() ? "var(--v2-icon-icon-success, #39c07a)" : "var(--border-weak-base, #55555c)",
                }}
              />
              {busy()
                ? language.t("dialog.mobile.loading")
                : active()
                  ? language.t("dialog.mobile.status.on")
                  : language.t("dialog.mobile.status.off")}
            </div>

            <Show when={remote()?.error}>
              <div class="text-11-regular text-text-critical-base">{remote()?.error}</div>
            </Show>

            <Show
              when={active() && remote()?.qrSvg}
              fallback={
                <div class="rounded-lg bg-background-stronger px-3 py-6 text-center text-12-regular text-text-weak">
                  {language.t("dialog.mobile.toggleHint")}
                </div>
              }
            >
              <div class="flex justify-center rounded-lg bg-white p-2">
                <div
                  class="size-[220px] overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  innerHTML={remote()?.qrSvg}
                />
              </div>
              <div class="break-all rounded-md bg-background-stronger px-2 py-1.5 text-11-regular text-text-weak">
                {remote()?.url}
              </div>
              <div class="flex items-center justify-between gap-2">
                <button
                  type="button"
                  class="rounded-md border border-border-weaker-base px-2 py-1 text-12-regular text-text-base hover:bg-background-stronger"
                  onClick={() => void copy()}
                >
                  {copied() ? language.t("dialog.mobile.copied") : language.t("dialog.mobile.copy")}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-border-weaker-base px-2 py-1 text-12-regular text-text-critical-base hover:bg-background-stronger"
                  onClick={() => void stop()}
                >
                  {language.t("dialog.mobile.stop")}
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </Show>
  )
}
