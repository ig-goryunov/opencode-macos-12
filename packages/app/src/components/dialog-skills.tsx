import { For, Show, createMemo, createResource, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Markdown } from "@opencode-ai/session-ui/markdown"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"

type SkillInfo = { name: string; description?: string; location: string; content: string }

export function DialogSkills(props: { directory?: string }) {
  const language = useLanguage()
  const server = useServer()
  const [query, setQuery] = createSignal("")
  const [active, setActive] = createSignal<string>()

  const directory = () =>
    props.directory ?? server.projects.list()[0]?.worktree ?? server.current?.http.url ?? ""

  const [skills] = createResource(directory, async (directory) => {
    const conn = server.current
    if (!conn) throw new Error(language.t("dialog.skills.empty"))
    const headers: Record<string, string> = {}
    if (conn.http.password) {
      headers.Authorization = `Basic ${btoa(`${conn.http.username ?? "opencode"}:${conn.http.password}`)}`
    }
    const url = `${conn.http.url}/skill${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`
    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return (await response.json()) as SkillInfo[]
  })

  const list = () => (skills.error ? [] : (skills() ?? []))

  const filtered = createMemo(() => {
    const text = query().trim().toLowerCase()
    const items = list()
    if (!text) return items
    return items.filter(
      (skill) => skill.name.toLowerCase().includes(text) || (skill.description ?? "").toLowerCase().includes(text),
    )
  })

  const selected = createMemo(() => {
    return list().find((skill) => skill.name === active()) ?? filtered()[0]
  })

  const scope = (skill: SkillInfo) => {
    if (skill.location.startsWith("<")) return language.t("dialog.skills.builtin")
    if (directory() && skill.location.startsWith(directory())) return language.t("dialog.skills.project")
    return language.t("dialog.skills.global")
  }

  return (
    <Dialog title={language.t("dialog.skills.title")} description={language.t("dialog.skills.description")} fit>
      <div class="flex h-[560px] max-h-[75vh] gap-3 pl-6 pr-6 pb-4">
        <div class="flex w-[260px] shrink-0 flex-col gap-2">
          <input
            type="text"
            class="h-8 w-full rounded-md border border-border-weaker-base bg-background-base px-2 text-12-regular text-text-strong outline-none placeholder:text-text-weak focus:border-border-focus"
            placeholder={language.t("dialog.skills.search")}
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          <Show when={skills.error}>
            {(error) => (
              <p class="rounded-md border border-border-weaker-base px-2 py-1.5 text-11-regular text-text-critical-base">
                {error() instanceof Error ? error().message : String(error())}
              </p>
            )}
          </Show>
          <div class="min-h-0 flex-1 overflow-y-auto rounded-md border border-border-weaker-base">
            <Show when={!skills.loading} fallback={<div class="p-2 text-12-regular text-text-weak">…</div>}>
              <For each={filtered()}>
                {(skill) => (
                  <button
                    type="button"
                    class="block w-full border-b border-border-weaker-base/60 px-2 py-1.5 text-left last:border-b-0 hover:bg-background-stronger"
                    classList={{ "bg-background-stronger": selected()?.name === skill.name }}
                    onClick={() => setActive(skill.name)}
                  >
                    <div class="flex items-center gap-2">
                      <span class="truncate text-12-medium text-text-strong">{skill.name}</span>
                      <span class="ml-auto shrink-0 rounded bg-background-stronger px-1 text-10-regular text-text-weak">
                        {scope(skill)}
                      </span>
                    </div>
                    <Show when={skill.description}>
                      <div class="line-clamp-2 text-11-regular text-text-weak">{skill.description}</div>
                    </Show>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <Show
            when={selected()}
            fallback={<div class="text-12-regular text-text-weak">{language.t("dialog.skills.empty")}</div>}
          >
            {(skill) => (
              <>
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate text-13-medium text-text-strong">{skill().name}</div>
                    <div class="truncate text-11-regular text-text-weak">{skill().location}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="normal"
                    onClick={() => navigator.clipboard.writeText(skill().location)}
                  >
                    {language.t("dialog.skills.copyPath")}
                  </Button>
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto rounded-md border border-border-weaker-base bg-surface-raised-base px-3 py-2 text-12-regular text-text-strong">
                  <Markdown text={skill().content} />
                </div>
              </>
            )}
          </Show>
        </div>
      </div>
    </Dialog>
  )
}
