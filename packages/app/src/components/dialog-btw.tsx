import { createSignal, onCleanup, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Markdown } from "@opencode-ai/session-ui/markdown"
import { useLanguage } from "@/context/language"
import { useSDK } from "@/context/sdk"
import { useLocal } from "@/context/local"
import { silenceNotifications } from "@/context/notification"
import { showToast } from "@/utils/toast"

export function DialogBtw() {
  const dialog = useDialog()
  const sdk = useSDK()
  const local = useLocal()
  const language = useLanguage()

  const [question, setQuestion] = createSignal("")
  const [answer, setAnswer] = createSignal("")
  const [error, setError] = createSignal<string>()
  const [busy, setBusy] = createSignal(false)
  const [session, setSession] = createSignal<string>()
  const [cancelled, setCancelled] = createSignal(false)

  const ask = async () => {
    const text = question().trim()
    if (!text || busy()) return
    const plan = local.agent.list().find((item) => item.name === "plan")
    if (!plan) {
      setError(language.t("dialog.btw.planUnavailable"))
      return
    }
    setBusy(true)
    setError(undefined)
    setAnswer("")
    setCancelled(false)
    const directory = sdk().directory
    let sessionID: string | undefined
    try {
      const created = await sdk().api.session.create({ location: { directory } })
      sessionID = created.id
      setSession(sessionID)
      silenceNotifications(sessionID)
      const model = local.model.current()
      const result = await sdk().client.session.prompt({
        sessionID,
        directory,
        agent: "plan",
        model: model ? { providerID: model.provider.id, modelID: model.id } : undefined,
        parts: [{ type: "text", text }],
      })
      const parts = (result.data as { parts?: { type: string; text?: string }[] } | undefined)?.parts ?? []
      const next = parts
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text as string)
        .join("\n\n")
      if (!cancelled()) setAnswer(next || language.t("dialog.btw.empty"))
    } catch (cause) {
      if (!cancelled()) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSession(undefined)
      if (sessionID) {
        void sdk()
          .client.session.delete({ sessionID, directory })
          .catch(() => undefined)
      }
      setBusy(false)
    }
  }

  const stop = async () => {
    const sessionID = session()
    if (!sessionID) return
    setCancelled(true)
    await sdk()
      .api.session.interrupt({ sessionID })
      .catch(() => undefined)
  }

  onCleanup(() => {
    const sessionID = session()
    if (!sessionID) return
    void sdk()
      .api.session.interrupt({ sessionID })
      .catch(() => undefined)
  })

  const copy = async () => {
    if (!answer()) return
    await navigator.clipboard.writeText(answer())
    showToast({ title: language.t("dialog.btw.copied") })
  }

  return (
    <Dialog title={language.t("dialog.btw.title")} description={language.t("dialog.btw.description")} fit>
      <div class="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pl-6 pr-6 pb-4">
        <textarea
          autofocus
          rows={3}
          class="w-full resize-none rounded-md border border-border-weaker-base bg-background-base px-2 py-1.5 text-13-regular text-text-strong outline-none placeholder:text-text-weak focus:border-border-focus"
          placeholder={language.t("dialog.btw.placeholder")}
          value={question()}
          onInput={(event) => setQuestion(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              void ask()
            }
          }}
        />
        <Show when={error()}>
          <p class="text-13-regular text-text-critical-base">{error()}</p>
        </Show>
        <Show when={answer()}>
          <div class="min-h-0 overflow-y-auto rounded-md bg-surface-raised-base px-3 py-2 text-13-regular text-text-strong">
            <Markdown text={answer()} />
          </div>
        </Show>
        <div class="flex items-center justify-between gap-2">
          <span class="text-11-regular text-text-weak">{language.t("dialog.btw.hint")}</span>
          <div class="flex gap-2">
            <Show when={answer()}>
              <Button variant="ghost" size="large" onClick={() => void copy()}>
                {language.t("dialog.btw.copy")}
              </Button>
            </Show>
            <Show when={busy()}>
              <Button variant="ghost" size="large" onClick={() => void stop()}>
                {language.t("dialog.btw.stop")}
              </Button>
            </Show>
            <Button variant="secondary" size="large" onClick={() => dialog.close()}>
              {language.t("dialog.btw.close")}
            </Button>
            <Button variant="primary" size="large" disabled={busy() || !question().trim()} onClick={() => void ask()}>
              {busy() ? language.t("dialog.btw.asking") : language.t("dialog.btw.ask")}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
