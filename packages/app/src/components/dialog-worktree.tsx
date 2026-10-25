import { For, Show, createSignal, onCleanup, onMount } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useLanguage } from "@/context/language"
import { showToast } from "@/utils/toast"

type WorktreeInfo = { path: string; branch: string; main: boolean }
type WorktreeBridge = {
  list: (directory: string) => Promise<{ ok: boolean; worktrees?: WorktreeInfo[]; error?: string }>
  create: (
    directory: string,
    input: { name: string },
  ) => Promise<{ ok: boolean; path?: string; branch?: string; error?: string }>
  remove: (directory: string, path: string) => Promise<{ ok: boolean; error?: string }>
}

const bridge = () => (window as unknown as { api?: { worktree?: WorktreeBridge } }).api?.worktree

export function DialogWorktree(props: { directory: string }) {
  const language = useLanguage()
  const dialog = useDialog()
  const navigate = useNavigate()
  const directory = props.directory

  const [items, setItems] = createSignal<WorktreeInfo[]>([])
  const [name, setName] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal<string>()
  const [pending, setPending] = createSignal<string>()
  let pendingTimer: ReturnType<typeof setTimeout> | undefined

  const explain = (code?: string) => {
    if (code === "invalid-name") return language.t("dialog.worktree.invalidName")
    if (code === "not-a-worktree") return language.t("dialog.worktree.notAWorktree")
    return code || language.t("dialog.worktree.error")
  }

  const resetPending = () => {
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = undefined
    setPending(undefined)
  }

  const refresh = async () => {
    const api = bridge()
    if (!api) {
      setError(language.t("dialog.worktree.unavailable"))
      return
    }
    const result = await api.list(directory).catch((cause) => ({ ok: false, error: String(cause) }))
    if (!result.ok) {
      setError(explain(result.error))
      return
    }
    setError(undefined)
    setItems((result as { worktrees?: WorktreeInfo[] }).worktrees ?? [])
  }

  onMount(() => void refresh())

  const create = async () => {
    const api = bridge()
    const value = name().trim()
    if (!api || !value || busy()) return
    setBusy(true)
    const result = await api.create(directory, { name: value }).catch((cause) => ({ ok: false, error: String(cause) }))
    setBusy(false)
    if (!result.ok) {
      setError(explain(result.error))
      return
    }
    setName("")
    showToast({ title: language.t("dialog.worktree.created"), description: (result as { path?: string }).path })
    await refresh()
  }

  const open = (worktree: WorktreeInfo) => {
    dialog.close()
    navigate(`/${base64Encode(worktree.path)}/session`)
  }

  const remove = async (worktree: WorktreeInfo) => {
    const api = bridge()
    if (!api || busy()) return
    if (pending() !== worktree.path) {
      resetPending()
      setPending(worktree.path)
      pendingTimer = setTimeout(resetPending, 3000)
      return
    }
    resetPending()
    setBusy(true)
    const result = await api.remove(directory, worktree.path).catch((cause) => ({ ok: false, error: String(cause) }))
    setBusy(false)
    if (!result.ok) {
      setError(explain(result.error))
      return
    }
    setError(undefined)
    await refresh()
  }

  onCleanup(resetPending)

  return (
    <Dialog title={language.t("dialog.worktree.title")} description={language.t("dialog.worktree.description")} fit>
      <div class="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pl-6 pr-6 pb-4">
        <div class="flex gap-2">
          <input
            type="text"
            class="h-8 w-full min-w-0 rounded-md border border-border-weaker-base bg-background-base px-2 text-12-regular text-text-strong outline-none placeholder:text-text-weak focus:border-border-focus"
            placeholder={language.t("dialog.worktree.name")}
            value={name()}
            onInput={(event) => setName(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void create()
              }
            }}
          />
          <Button variant="primary" size="normal" disabled={busy() || !name().trim()} onClick={() => void create()}>
            {language.t("dialog.worktree.create")}
          </Button>
        </div>
        <Show when={error()}>
          <p class="text-12-regular text-text-critical-base">{error()}</p>
        </Show>
        <div class="rounded-md border border-border-weaker-base">
          <For each={items()}>
            {(item) => (
              <div class="flex items-center gap-2 border-b border-border-weaker-base/60 px-2 py-1.5 last:border-b-0">
                <div class="min-w-0 flex-1">
                  <div class="truncate text-12-medium text-text-strong">{item.path}</div>
                  <div class="truncate text-11-regular text-text-weak">
                    {item.branch || "—"}
                    {item.main ? ` · ${language.t("dialog.worktree.main")}` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="normal" onClick={() => void open(item)}>
                  {language.t("dialog.worktree.open")}
                </Button>
                <Show when={!item.main}>
                  <Button variant="ghost" size="normal" disabled={busy()} onClick={() => void remove(item)}>
                    {pending() === item.path
                      ? language.t("dialog.worktree.confirm")
                      : language.t("dialog.worktree.remove")}
                  </Button>
                </Show>
              </div>
            )}
          </For>
          <Show when={items().length === 0}>
            <div class="px-2 py-3 text-12-regular text-text-weak">{language.t("dialog.worktree.empty")}</div>
          </Show>
        </div>
        <p class="text-11-regular text-text-weak">{language.t("dialog.worktree.hint")}</p>
      </div>
    </Dialog>
  )
}
