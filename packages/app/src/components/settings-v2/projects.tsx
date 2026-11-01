import { Component, For, Show, createMemo } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { useServer } from "@/context/server"
import { useDirectoryPicker } from "@/components/directory-picker"
import { displayName, homeProjectDirectories } from "@/pages/layout/helpers"
import { pathKey } from "@/utils/path-key"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

export const SettingsProjectsV2: Component<{ directory?: string }> = (props) => {
  const language = useLanguage()
  const dialog = useDialog()
  const layout = useLayout()
  const server = useServer()
  const navigate = useNavigate()
  const pickDirectory = useDirectoryPicker()

  const projects = createMemo(() => layout.projects.list())
  const recentlyClosed = createMemo(() => layout.projects.recentlyClosed())
  const isActive = (directory: string) => !!props.directory && pathKey(props.directory) === pathKey(directory)

  const open = (directory: string) => {
    layout.projects.open(directory)
    navigate(`/${base64Encode(directory)}/session`)
    dialog.close()
  }

  const add = () => {
    const connection = server.current
    if (!connection) return
    pickDirectory({
      server: connection,
      title: language.t("home.project.add"),
      multiple: true,
      onSelect: (result) => {
        const directories = homeProjectDirectories(result)
        if (!directories.length) return
        for (const directory of directories) layout.projects.open(directory)
        open(directories[0])
      },
    })
  }

  const remove = (directory: string) => {
    const active = isActive(directory)
    layout.projects.close(directory)
    if (!active) return
    navigate("/")
    dialog.close()
  }

  const ProjectRow: Component<{ directory: string; title: string; removable?: boolean }> = (row) => (
    <SettingsRowV2 id={`project-${row.directory}`} title={row.title} description={row.directory}>
      <div class="flex items-center gap-1">
        <ButtonV2 variant="outline" size="small" onClick={() => open(row.directory)}>
          {language.t("common.open")}
        </ButtonV2>
        <Show when={row.removable}>
          <IconButtonV2
            variant="ghost-muted"
            size="small"
            icon={<Icon name="trash" />}
            aria-label={language.t("common.close")}
            onClick={() => remove(row.directory)}
          />
        </Show>
      </div>
    </SettingsRowV2>
  )

  return (
    <>
      <div class="settings-v2-tab-header flex items-start justify-between gap-4">
        <h2 class="settings-v2-tab-title">{language.t("settings.tab.projects")}</h2>
        <ButtonV2 variant="outline" size="normal" onClick={add}>
          {language.t("home.project.add")}
        </ButtonV2>
      </div>

      <div class="settings-v2-tab-body">
        <Show
          when={projects().length > 0}
          fallback={
            <div class="flex flex-col items-center gap-2 py-20 text-center">
              <Icon name="folder" class="text-v2-icon-icon-muted" />
              <div class="text-13-medium text-v2-text-text-base">{language.t("settings.projects.empty.title")}</div>
              <div class="text-13-regular text-v2-text-text-muted">
                {language.t("settings.projects.empty.description")}
              </div>
              <ButtonV2 variant="neutral" size="normal" class="mt-4" onClick={add}>
                {language.t("home.project.add")}
              </ButtonV2>
            </div>
          }
        >
          <div class="settings-v2-section">
            <SettingsListV2>
              <For each={projects()}>
                {(project) => <ProjectRow directory={project.worktree} title={displayName(project)} removable />}
              </For>
            </SettingsListV2>
          </div>
        </Show>

        <Show when={recentlyClosed().length > 0}>
          <div class="settings-v2-section">
            <h3 class="settings-v2-section-title">{language.t("home.recentlyClosed")}</h3>
            <SettingsListV2>
              <For each={recentlyClosed()}>
                {(project) => <ProjectRow directory={project.worktree} title={displayName(project)} />}
              </For>
            </SettingsListV2>
          </div>
        </Show>
      </div>
    </>
  )
}
