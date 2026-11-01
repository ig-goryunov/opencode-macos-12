import { Component, For, Show, createMemo } from "solid-js"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useLanguage } from "@/context/language"
import { useSettings } from "@/context/settings"
import { LayoutRetirementNotice, LayoutTransitionToggle } from "./interface-transition"
import { SettingsListV2 } from "./parts/list"
import { timelineDetailPreset, timelineDetailPresets, type TimelineDetailFlags } from "./timeline-detail"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

export const SettingsExperimentalV2: Component = () => {
  const language = useLanguage()
  const dialog = useDialog()
  const settings = useSettings()

  const InterfaceSection = () => (
    <LayoutTransitionToggle
      title={language.t("settings.general.row.newInterface.title")}
      badge={language.t("settings.general.row.newInterface.badge")}
      description={language.t("settings.general.row.newInterface.description")}
      checked={settings.general.newLayoutDesigns()}
      onChange={(checked) => {
        settings.general.setNewLayoutDesigns(checked)
        if (checked) return
        void import("@/components/dialog-settings").then((module) => {
          void dialog.show(() => <module.DialogSettings />)
        })
      }}
    />
  )

  const InterfaceNoticeSection = () => (
    <LayoutRetirementNotice
      title={language.t("settings.general.row.newInterfaceNotice.title")}
      description={language.t("settings.general.row.newInterfaceNotice.description")}
      dismiss={language.t("settings.general.row.newInterfaceNotice.dismiss")}
      onDismiss={() => settings.general.dismissNewInterfaceNotice()}
    />
  )

  const flags = createMemo<TimelineDetailFlags>(() => ({
    showReasoningSummaries: settings.general.showReasoningSummaries(),
    shellToolPartsExpanded: settings.general.shellToolPartsExpanded(),
    editToolPartsExpanded: settings.general.editToolPartsExpanded(),
    timelineCollapseTools: settings.general.timelineCollapseTools(),
  }))
  const preset = createMemo(() => timelineDetailPreset(flags()))
  const position = createMemo(() => {
    const current = preset()
    return current ? timelineDetailPresets.indexOf(current) : 1
  })
  const presetLabel = () => {
    const current = preset()
    if (!current) return language.t("settings.timeline.custom")
    return language.t(`settings.timeline.preset.${current.id}` as Parameters<typeof language.t>[0])
  }
  const applyPreset = (index: number) => {
    const target = timelineDetailPresets[index]
    if (!target) return
    settings.general.setShowReasoningSummaries(target.value.showReasoningSummaries)
    settings.general.setShellToolPartsExpanded(target.value.shellToolPartsExpanded)
    settings.general.setEditToolPartsExpanded(target.value.editToolPartsExpanded)
    settings.general.setTimelineCollapseTools(target.value.timelineCollapseTools)
  }

  const TimelineDetailControl = () => (
    <div data-component="timeline-detail-control">
      <div data-slot="settings-v2-row-copy">
        <div data-slot="settings-v2-row-title">{language.t("settings.timeline.detail")}</div>
        <div data-slot="settings-v2-row-description">{language.t("settings.timeline.description")}</div>
      </div>
      <div data-slot="timeline-detail-scale">
        <div
          data-slot="timeline-detail-track"
          aria-hidden="true"
          style={{ "--timeline-detail-progress": `${(position() / (timelineDetailPresets.length - 1)) * 100}%` }}
        >
          <For each={timelineDetailPresets}>
            {(_, index) => (
              <span
                data-selected={index() <= position() ? "" : undefined}
                style={{ "inset-inline-start": `${(index() / (timelineDetailPresets.length - 1)) * 100}%` }}
              />
            )}
          </For>
        </div>
        <input
          data-action="settings-timeline-detail"
          type="range"
          min="0"
          max={timelineDetailPresets.length - 1}
          step="1"
          value={position()}
          aria-valuetext={presetLabel()}
          aria-label={language.t("settings.timeline.detail")}
          onInput={(event) => applyPreset(event.currentTarget.valueAsNumber)}
        />
      </div>
      <p>
        <span data-slot="timeline-detail-summary">
          {language.t("settings.timeline.summary", { preset: presetLabel() })}
        </span>{" "}
        {language.t(
          `settings.timeline.description.${preset()?.id ?? "custom"}` as Parameters<typeof language.t>[0],
        )}
      </p>
    </div>
  )

  const TimelineSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">{language.t("settings.general.section.timeline")}</h3>

      <TimelineDetailControl />

      <SettingsListV2>
        <SettingsRowV2
          id="reasoning-summaries"
          title={language.t("settings.general.row.reasoningSummaries.title")}
          description={language.t("settings.general.row.reasoningSummaries.description")}
        >
          <div data-action="settings-feed-reasoning-summaries">
            <Switch
              checked={settings.general.showReasoningSummaries()}
              onChange={(checked) => settings.general.setShowReasoningSummaries(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="shell-parts"
          title={language.t("settings.general.row.shellToolPartsExpanded.title")}
          description={language.t("settings.general.row.shellToolPartsExpanded.description")}
        >
          <div data-action="settings-feed-shell-tool-parts-expanded">
            <Switch
              checked={settings.general.shellToolPartsExpanded()}
              onChange={(checked) => settings.general.setShellToolPartsExpanded(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="edit-parts"
          title={language.t("settings.general.row.editToolPartsExpanded.title")}
          description={language.t("settings.general.row.editToolPartsExpanded.description")}
        >
          <div data-action="settings-feed-edit-tool-parts-expanded">
            <Switch
              checked={settings.general.editToolPartsExpanded()}
              onChange={(checked) => settings.general.setEditToolPartsExpanded(checked)}
            />
          </div>
        </SettingsRowV2>

        <SettingsRowV2
          id="collapse-tools"
          title={language.t("settings.general.row.collapseTools.title")}
          description={language.t("settings.general.row.collapseTools.description")}
        >
          <div data-action="settings-timeline-collapse-tools">
            <Switch
              checked={settings.general.timelineCollapseTools()}
              onChange={(checked) => settings.general.setTimelineCollapseTools(checked)}
            />
          </div>
        </SettingsRowV2>
      </SettingsListV2>
    </div>
  )

  const AdvancedSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">{language.t("settings.general.section.advanced")}</h3>

      <SettingsListV2>
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

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.tab.experimental")}</h2>
      </div>

      <div class="settings-v2-tab-body">
        <Show when={settings.general.layoutTransitionAvailable()}>
          <InterfaceSection />
        </Show>

        <Show when={settings.general.newInterfaceNoticeVisible()}>
          <InterfaceNoticeSection />
        </Show>

        <TimelineSection />

        <AdvancedSection />
      </div>
    </>
  )
}
