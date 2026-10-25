import { Component, For, Show, createMemo, createSignal, startTransition } from "solid-js"
import { Dialog } from "@opencode-ai/ui/v2/dialog-v2"
import { TabsV2 } from "@opencode-ai/ui/v2/tabs-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsGeneralV2 } from "./general"
import { SettingsKeybinds } from "../settings-keybinds"
import { SettingsProvidersV2 } from "./providers"
import { SettingsModelsV2 } from "./models"
import "./settings-v2.css"
import { SettingsServersV2 } from "./servers"
import { SettingsAboutV2 } from "./about"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useLayout } from "@/context/layout"
import { useTabs } from "@/context/tabs"
import { useServerSync } from "@/context/server-sync"
import { searchSettings, settingsTabLabelKey, type SettingsSearchEntry } from "./search"

export const DialogSettings: Component<{
  sessionID?: string
  defaultValue?: string
}> = (props) => {
  const language = useLanguage()
  const platform = usePlatform()
  const dialog = useDialog()
  const layout = useLayout()
  const tabs = useTabs()
  const serverSync = useServerSync()
  const [tab, setTab] = createSignal(props.defaultValue ?? "general")
  const [query, setQuery] = createSignal("")
  const [active, setActive] = createSignal(0)
  const translate = (key: string) => language.t(key as Parameters<typeof language.t>[0])
  const results = createMemo(() => searchSettings(query(), translate))
  const directory = createMemo(() => {
    const route = layout.route()
    if (route.type === "dir-new-sesssion") return route.dir
    if (route.type === "draft") {
      const draft = tabs.store.find((item) => item.type === "draft" && item.draftID === route.draftID)
      return draft?.type === "draft" ? draft.directory : undefined
    }
    if (route.type === "session") return serverSync().session.get(route.sessionId)?.directory
    return undefined
  })

  const showProviders = () => {
    void dialog.show(() => <DialogSettings sessionID={props.sessionID} defaultValue="providers" />)
  }

  const go = (entry: SettingsSearchEntry) => {
    setQuery("")
    const id = entry.id
    void startTransition(() => setTab(entry.tab))
    if (!id) return
    let tries = 0
    const tick = () => {
      const node = document.querySelector<HTMLElement>(`[data-settings-row="${id}"]`)
      if (!node) {
        if (tries++ < 20) setTimeout(tick, 30)
        return
      }
      node.scrollIntoView({ block: "center", behavior: "smooth" })
      node.classList.add("settings-v2-row-flash")
      setTimeout(() => node.classList.remove("settings-v2-row-flash"), 1600)
    }
    setTimeout(tick, 40)
  }

  const onSearchKeyDown = (event: KeyboardEvent) => {
    if (!results().length) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((value) => (value + 1) % results().length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((value) => (value - 1 + results().length) % results().length)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const entry = results()[active()]?.entry ?? results()[0]?.entry
      if (entry) go(entry)
    }
  }

  return (
    <Dialog size="x-large" variant="settings" class="settings-v2-dialog">
      <TabsV2
        orientation="vertical"
        variant="settings"
        value={tab()}
        onChange={(value) => void startTransition(() => setTab(value))}
        class="settings-v2"
      >
        <TabsV2.List>
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex flex-col gap-3 w-full min-h-0">
              <div class="settings-v2-nav-search">
                <TextInputV2
                  type="search"
                  appearance="base"
                  value={query()}
                  placeholder={language.t("settings.search.placeholder")}
                  spellcheck={false}
                  autocorrect="off"
                  autocomplete="off"
                  autocapitalize="off"
                  aria-label={language.t("settings.search.placeholder")}
                  onInput={(event) => {
                    setActive(0)
                    setQuery(event.currentTarget.value)
                  }}
                  onKeyDown={onSearchKeyDown}
                />
              </div>
              <Show
                when={!query()}
                fallback={
                  <div class="settings-v2-search" role="listbox" aria-label={language.t("settings.search.placeholder")}>
                    <For each={results()}>
                      {(result, index) => (
                        <button
                          type="button"
                          role="option"
                          class="settings-v2-search-item"
                          data-active={index() === active() ? "true" : undefined}
                          aria-selected={index() === active()}
                          onMouseEnter={() => setActive(index())}
                          onClick={() => go(result.entry)}
                        >
                          <span class="settings-v2-search-title">{result.title}</span>
                          <span class="settings-v2-search-tab">
                            {translate(settingsTabLabelKey(result.entry.tab))}
                          </span>
                          <Show when={result.description}>
                            <span class="settings-v2-search-description">{result.description}</span>
                          </Show>
                        </button>
                      )}
                    </For>
                    <Show when={results().length === 0}>
                      <div class="settings-v2-search-empty">{language.t("settings.search.empty")}</div>
                    </Show>
                  </div>
                }
              >
                <div class="flex flex-col gap-3 w-full">
                  <div class="flex flex-col gap-3">
                    <div class="flex flex-col gap-1.5">
                      <TabsV2.SectionTitle>{language.t("settings.section.desktop")}</TabsV2.SectionTitle>
                      <div class="flex flex-col gap-1.5 w-full">
                        <TabsV2.Trigger value="general">
                          <Icon name="sliders" />
                          {language.t("settings.tab.general")}
                        </TabsV2.Trigger>
                        <TabsV2.Trigger value="shortcuts">
                          <Icon name="keyboard" />
                          {language.t("settings.tab.shortcuts")}
                        </TabsV2.Trigger>
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <TabsV2.SectionTitle>{language.t("settings.section.server")}</TabsV2.SectionTitle>
                      <div class="flex flex-col gap-1.5 w-full">
                        <TabsV2.Trigger value="servers">
                          <Icon name="server" />
                          {language.t("status.popover.tab.servers")}
                        </TabsV2.Trigger>
                        <TabsV2.Trigger value="providers">
                          <Icon name="providers" />
                          {language.t("settings.providers.title")}
                        </TabsV2.Trigger>
                        <TabsV2.Trigger value="models">
                          <Icon name="models" />
                          {language.t("settings.models.title")}
                        </TabsV2.Trigger>
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <TabsV2.SectionTitle>{language.t("settings.section.app")}</TabsV2.SectionTitle>
                      <div class="flex flex-col gap-1.5 w-full">
                        <TabsV2.Trigger value="about">
                          <Icon name="help" />
                          {language.t("settings.tab.about")}
                        </TabsV2.Trigger>
                      </div>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
            <div class="settings-v2-nav-footer">
              <span>{language.t("app.name.desktop")}</span>
              <span>v{platform.version}</span>
            </div>
          </div>
        </TabsV2.List>
        <TabsV2.Content value="general" class="settings-v2-panel">
          <SettingsGeneralV2 sessionID={props.sessionID} />
        </TabsV2.Content>
        <TabsV2.Content value="shortcuts" class="settings-v2-panel">
          <SettingsKeybinds v2 />
        </TabsV2.Content>
        <TabsV2.Content value="servers" class="settings-v2-panel">
          <SettingsServersV2 />
        </TabsV2.Content>
        <TabsV2.Content value="providers" class="settings-v2-panel">
          <SettingsProvidersV2 directory={directory} onBack={showProviders} />
        </TabsV2.Content>
        <TabsV2.Content value="models" class="settings-v2-panel">
          <SettingsModelsV2 />
        </TabsV2.Content>
        <TabsV2.Content value="about" class="settings-v2-panel">
          <SettingsAboutV2 />
        </TabsV2.Content>
      </TabsV2>
    </Dialog>
  )
}
