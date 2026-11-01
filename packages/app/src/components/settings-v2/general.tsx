import { Component, Show, createMemo } from "solid-js"
import { createMediaQuery } from "@solid-primitives/media"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { SelectV2 } from "@opencode-ai/ui/v2/select-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { useParams } from "@solidjs/router"
import { decode64 } from "@/utils/base64"
import { DialogMobileAccess } from "@/components/dialog-mobile-access"
import { useUpdaterAction } from "../updater-action"
import { useSettings } from "@/context/settings"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import {
  createPermissionScopeController,
  createShellOptions,
  createShellSettingsController,
  type PermissionScopeController,
  type ShellSettingsController,
} from "./general-controllers"
import "./settings-v2.css"

const sidePanelOptions = [
  { value: "right" as const, label: "settings.general.row.sidePanel.right" as const },
  { value: "left" as const, label: "settings.general.row.sidePanel.left" as const },
]

const PermissionScopeSetting: Component<{ controller: PermissionScopeController }> = (props) => {
  const language = useLanguage()
  return (
    <SettingsRowV2
      id="permissions-autoaccept"
      title={language.t("command.permissions.autoaccept.enable")}
      description={language.t("toast.permissions.autoaccept.on.description")}
    >
      <div data-action="settings-auto-accept-permissions">
        <Switch
          checked={props.controller.accepting()}
          disabled={!props.controller.enabled()}
          onChange={props.controller.set}
        />
      </div>
    </SettingsRowV2>
  )
}

const ShellSetting: Component<{ controller: ShellSettingsController }> = (props) => {
  const language = useLanguage()
  const options = createMemo(() =>
    createShellOptions({
      shells: props.controller.shells(),
      current: props.controller.current(),
    }),
  )
  return (
    <SettingsRowV2
      id="shell"
      title={language.t("settings.general.row.shell.title")}
      description={language.t("settings.general.row.shell.description")}
    >
      <SelectV2
        appearance="inline"
        data-action="settings-shell"
        options={options()}
        current={options().find((option) => option.value === props.controller.current()) ?? options()[0]}
        placement="bottom-end"
        gutter={6}
        value={(option) => option.id}
        label={(option) => {
          if (option.id === "auto") return language.t("settings.general.row.shell.autoDefault")
          if (!option.terminalOnly) return option.name
          return `${option.name} (${language.t("settings.general.row.shell.terminalOnly")})`
        }}
        onSelect={(option) => option && props.controller.select(option.value)}
      />
    </SettingsRowV2>
  )
}

const LanguageSetting = () => {
  const language = useLanguage()
  const options = createMemo(() =>
    language.locales.map((locale) => ({
      value: locale,
      label: language.label(locale),
    })),
  )
  return (
    <SettingsRowV2
      id="language"
      title={language.t("settings.general.row.language.title")}
      description={language.t("settings.general.row.language.description")}
    >
      <SelectV2
        appearance="inline"
        data-action="settings-language"
        options={options()}
        placement="bottom-end"
        gutter={6}
        current={options().find((option) => option.value === language.locale())}
        value={(option) => option.value}
        label={(option) => option.label}
        onSelect={(option) => option && language.setLocale(option.value)}
      />
    </SettingsRowV2>
  )
}

const FollowupSetting = () => {
  const language = useLanguage()
  const settings = useSettings()
  const options = createMemo((): { value: "queue" | "steer"; label: string }[] => [
    { value: "queue", label: language.t("settings.general.row.followup.option.queue") },
    { value: "steer", label: language.t("settings.general.row.followup.option.steer") },
  ])
  return (
    <SettingsRowV2
      id="followup"
      title={language.t("settings.general.row.followup.title")}
      description={language.t("settings.general.row.followup.description")}
    >
      <SelectV2
        appearance="inline"
        data-action="settings-followup"
        options={options()}
        placement="bottom-end"
        gutter={6}
        current={options().find((option) => option.value === settings.general.followup())}
        value={(option) => option.value}
        label={(option) => option.label}
        onSelect={(option) => option && settings.general.setFollowup(option.value)}
      />
    </SettingsRowV2>
  )
}

const MobileAccessSetting = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const dialog = useDialog()
  const params = useParams()
  const server = useServer()

  const workspaces = () => {
    const seen = new Set<string>()
    const list: { directory: string; name: string }[] = []
    const push = (directory: string | undefined) => {
      if (!directory || seen.has(directory)) return
      seen.add(directory)
      const name = directory.split("/").filter(Boolean).pop() ?? directory
      list.push({ directory, name })
    }
    push(params.dir ? decode64(params.dir) : undefined)
    for (const project of server.projects.list()) push(project.worktree)
    return list
  }

  const open = () => dialog.show(() => <DialogMobileAccess workspaces={workspaces()} />)

  return (
    <Show when={platform.platform === "desktop"}>
      <SettingsRowV2
        id="mobile"
        title={language.t("settings.general.row.mobile.title")}
        description={language.t("settings.general.row.mobile.description")}
      >
        <ButtonV2 variant="outline" size="normal" data-action="settings-mobile-access" onClick={open}>
          {language.t("settings.general.row.mobile.action")}
        </ButtonV2>
      </SettingsRowV2>
    </Show>
  )
}

export const SettingsGeneralV2: Component<{
  sessionID?: string
}> = (props) => {
  const language = useLanguage()
  const platform = usePlatform()
  const settings = useSettings()
  const mobile = createMediaQuery("(max-width: 767px)")
  const updater = useUpdaterAction()
  const permissionScope = createPermissionScopeController(() => props.sessionID)
  const shell = createShellSettingsController()
  const desktop = createMemo(() => platform.platform === "desktop")

  const GeneralSection = () => (
    <div class="settings-v2-section">
      <SettingsListV2>
        <LanguageSetting />

        <PermissionScopeSetting controller={permissionScope} />

        <ShellSetting controller={shell} />

        <FollowupSetting />

        <MobileAccessSetting />

        <Show when={mobile() && import.meta.env.VITE_OPENCODE_CHANNEL !== "prod"}>
          <SettingsRowV2
            id="mobile-titlebar"
            title={language.t("settings.general.row.mobileTitlebarBottom.title")}
            description={language.t("settings.general.row.mobileTitlebarBottom.description")}
          >
            <div data-action="settings-mobile-titlebar-bottom">
              <Switch
                checked={settings.general.mobileTitlebarPosition() === "bottom"}
                onChange={(checked) => settings.general.setMobileTitlebarPosition(checked ? "bottom" : "top")}
              />
            </div>
          </SettingsRowV2>
        </Show>
      </SettingsListV2>
    </div>
  )

  const WorkspaceSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">{language.t("settings.general.section.workspace")}</h3>
      <SettingsListV2>
        <SettingsRowV2
          id="side-panel"
          title={language.t("settings.general.row.sidePanel.title")}
          description={language.t("settings.general.row.sidePanel.description")}
        >
          <SelectV2
            appearance="inline"
            data-action="settings-side-panel"
            options={sidePanelOptions}
            current={sidePanelOptions.find((option) => option.value === settings.general.sidePanelSide())}
            placement="bottom-end"
            gutter={6}
            value={(option) => option.value}
            label={(option) => language.t(option.label)}
            onSelect={(option) => option && settings.general.setSidePanelSide(option.value)}
          />
        </SettingsRowV2>

        <SettingsRowV2
          id="file-tree"
          title={language.t("settings.general.row.showFileTree.title")}
          description={language.t("settings.general.row.showFileTree.description")}
        >
          <div data-action="settings-show-file-tree">
            <Switch
              checked={settings.general.showFileTree()}
              onChange={(checked) => settings.general.setShowFileTree(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="show-navigation"
          title={language.t("settings.general.row.showNavigation.title")}
          description={language.t("settings.general.row.showNavigation.description")}
        >
          <div data-action="settings-show-navigation">
            <Switch
              checked={settings.general.showNavigation()}
              onChange={(checked) => settings.general.setShowNavigation(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="show-search"
          title={language.t("settings.general.row.showSearch.title")}
          description={language.t("settings.general.row.showSearch.description")}
        >
          <div data-action="settings-show-search">
            <Switch
              checked={settings.general.showSearch()}
              onChange={(checked) => settings.general.setShowSearch(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="show-status"
          title={language.t("settings.general.row.showStatus.title")}
          description={language.t("settings.general.row.showStatus.description")}
        >
          <div data-action="settings-show-status">
            <Switch
              checked={settings.general.showStatus()}
              onChange={(checked) => settings.general.setShowStatus(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="custom-agents"
          title={language.t("settings.general.row.showCustomAgents.title")}
          description={language.t("settings.general.row.showCustomAgents.description")}
        >
          <div data-action="settings-show-custom-agents">
            <Switch
              checked={settings.general.showCustomAgents()}
              onChange={(checked) => settings.general.setShowCustomAgents(checked)}
            />
          </div>
        </SettingsRowV2>
      </SettingsListV2>
    </div>
  )

  const UpdatesSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">{language.t("settings.general.section.updates")}</h3>

      <SettingsListV2>
        <SettingsRowV2
          id="release-notes"
          title={language.t("settings.general.row.releaseNotes.title")}
          description={language.t("settings.general.row.releaseNotes.description")}
        >
          <div data-action="settings-release-notes">
            <Switch
              checked={settings.general.releaseNotes()}
              onChange={(checked) => settings.general.setReleaseNotes(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="update-check"
          title={language.t("settings.updates.row.check.title")}
          description={language.t("settings.updates.row.check.description")}
        >
          <ButtonV2 size="normal" variant="neutral" disabled={!updater.action().run} onClick={() => updater.run()}>
            {language.t(updater.action().label)}
          </ButtonV2>
        </SettingsRowV2>
      </SettingsListV2>
    </div>
  )

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.tab.general")}</h2>
      </div>

      <div class="settings-v2-tab-body">
        <GeneralSection />

        <WorkspaceSection />

        <Show when={desktop()}>
          <UpdatesSection />
        </Show>
      </div>
    </>
  )
}
