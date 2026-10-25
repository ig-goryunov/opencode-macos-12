export type SettingsTab = "general" | "shortcuts" | "servers" | "providers" | "models" | "extensions" | "about"

export type SettingsSearchEntry = {
  /** Matches `data-settings-row` on a settings row; omit for whole-tab entries. */
  id?: string
  tab: SettingsTab
  titleKey: string
  descriptionKey?: string
  /** Extra words that should match this row (e.g. the section name). */
  keywords?: string[]
}

export const settingsSearchEntries: SettingsSearchEntry[] = [
  { tab: "general", titleKey: "settings.tab.general" },
  {
    id: "permissions-autoaccept",
    tab: "general",
    titleKey: "command.permissions.autoaccept.enable",
    descriptionKey: "toast.permissions.autoaccept.on.description",
  },
  { id: "shell", tab: "general", titleKey: "settings.general.row.shell.title", descriptionKey: "settings.general.row.shell.description" },
  {
    id: "color-scheme",
    tab: "general",
    titleKey: "settings.general.row.colorScheme.title",
    descriptionKey: "settings.general.row.colorScheme.description",
  },
  { id: "theme", tab: "general", titleKey: "settings.general.row.theme.title", descriptionKey: "settings.general.row.theme.description" },
  { id: "font-ui", tab: "general", titleKey: "settings.general.row.uiFont.title", descriptionKey: "settings.general.row.uiFont.description" },
  { id: "font-code", tab: "general", titleKey: "settings.general.row.font.title", descriptionKey: "settings.general.row.font.description" },
  {
    id: "font-terminal",
    tab: "general",
    titleKey: "settings.general.row.terminalFont.title",
    descriptionKey: "settings.general.row.terminalFont.description",
  },
  { id: "sound-agent", tab: "general", titleKey: "settings.general.sounds.agent.title", descriptionKey: "settings.general.sounds.agent.description" },
  {
    id: "sound-permissions",
    tab: "general",
    titleKey: "settings.general.sounds.permissions.title",
    descriptionKey: "settings.general.sounds.permissions.description",
  },
  { id: "sound-errors", tab: "general", titleKey: "settings.general.sounds.errors.title", descriptionKey: "settings.general.sounds.errors.description" },
  {
    id: "language",
    tab: "general",
    titleKey: "settings.general.row.language.title",
    descriptionKey: "settings.general.row.language.description",
  },
  {
    id: "followup",
    tab: "general",
    titleKey: "settings.general.row.followup.title",
    descriptionKey: "settings.general.row.followup.description",
  },
  { id: "mobile", tab: "general", titleKey: "settings.general.row.mobile.title", descriptionKey: "settings.general.row.mobile.description" },
  {
    id: "reasoning-summaries",
    tab: "general",
    titleKey: "settings.general.row.reasoningSummaries.title",
    descriptionKey: "settings.general.row.reasoningSummaries.description",
    keywords: ["timeline", "таймлайн"],
  },
  {
    id: "shell-parts",
    tab: "general",
    titleKey: "settings.general.row.shellToolPartsExpanded.title",
    descriptionKey: "settings.general.row.shellToolPartsExpanded.description",
    keywords: ["timeline", "таймлайн"],
  },
  {
    id: "edit-parts",
    tab: "general",
    titleKey: "settings.general.row.editToolPartsExpanded.title",
    descriptionKey: "settings.general.row.editToolPartsExpanded.description",
    keywords: ["timeline", "таймлайн"],
  },
  {
    id: "mobile-titlebar",
    tab: "general",
    titleKey: "settings.general.row.mobileTitlebarBottom.title",
    descriptionKey: "settings.general.row.mobileTitlebarBottom.description",
  },
  { id: "file-tree", tab: "general", titleKey: "settings.general.row.showFileTree.title", descriptionKey: "settings.general.row.showFileTree.description" },
  { id: "show-search", tab: "general", titleKey: "settings.general.row.showSearch.title", descriptionKey: "settings.general.row.showSearch.description" },
  { id: "show-status", tab: "general", titleKey: "settings.general.row.showStatus.title", descriptionKey: "settings.general.row.showStatus.description" },
  {
    id: "custom-agents",
    tab: "general",
    titleKey: "settings.general.row.showCustomAgents.title",
    descriptionKey: "settings.general.row.showCustomAgents.description",
  },
  {
    id: "notif-agent",
    tab: "general",
    titleKey: "settings.general.notifications.agent.title",
    descriptionKey: "settings.general.notifications.agent.description",
  },
  {
    id: "notif-permissions",
    tab: "general",
    titleKey: "settings.general.notifications.permissions.title",
    descriptionKey: "settings.general.notifications.permissions.description",
  },
  {
    id: "notif-errors",
    tab: "general",
    titleKey: "settings.general.notifications.errors.title",
    descriptionKey: "settings.general.notifications.errors.description",
  },
  {
    id: "collapse-tools",
    tab: "general",
    titleKey: "settings.general.row.collapseTools.title",
    descriptionKey: "settings.general.row.collapseTools.description",
    keywords: ["timeline", "таймлайн", "tools", "инструменты"],
  },
  {
    id: "release-notes",
    tab: "general",
    titleKey: "settings.general.row.releaseNotes.title",
    descriptionKey: "settings.general.row.releaseNotes.description",
  },
  { id: "update-check", tab: "general", titleKey: "settings.updates.row.check.title", descriptionKey: "settings.updates.row.check.description" },
  { id: "pinch-zoom", tab: "general", titleKey: "settings.general.row.pinchZoom.title", descriptionKey: "settings.general.row.pinchZoom.description" },

  { tab: "shortcuts", titleKey: "settings.tab.shortcuts" },
  { tab: "servers", titleKey: "status.popover.tab.servers" },
  { tab: "providers", titleKey: "settings.providers.title" },
  { tab: "models", titleKey: "settings.models.title" },
  { tab: "extensions", titleKey: "settings.tab.extensions" },
  { tab: "extensions", titleKey: "settings.extensions.mcp.title" },
  {
    id: "ext-skills",
    tab: "extensions",
    titleKey: "settings.extensions.skills.row.title",
    descriptionKey: "settings.extensions.skills.row.description",
  },
  { tab: "extensions", titleKey: "settings.extensions.plugins.title" },
  { tab: "about", titleKey: "settings.tab.about" },
  { id: "about-update", tab: "about", titleKey: "settings.about.updates.title", descriptionKey: "settings.about.updates.description" },
  { id: "about-logs", tab: "about", titleKey: "settings.about.logs.title", descriptionKey: "settings.about.logs.description" },
  { id: "about-releases", tab: "about", titleKey: "settings.about.row.releases.title", descriptionKey: "settings.about.row.releases.description" },
  { id: "about-repo", tab: "about", titleKey: "settings.about.row.repo.title", descriptionKey: "settings.about.row.repo.description" },
  { id: "about-docs", tab: "about", titleKey: "settings.about.row.docs.title", descriptionKey: "settings.about.row.docs.description" },
  { id: "about-license", tab: "about", titleKey: "settings.about.row.license.title", descriptionKey: "settings.about.row.license.description" },
]

const tabLabels: Record<SettingsTab, string> = {
  general: "settings.tab.general",
  shortcuts: "settings.tab.shortcuts",
  servers: "status.popover.tab.servers",
  providers: "settings.providers.title",
  models: "settings.models.title",
  extensions: "settings.tab.extensions",
  about: "settings.tab.about",
}

export function settingsTabLabelKey(tab: SettingsTab) {
  return tabLabels[tab]
}

export type SettingsSearchResult = {
  entry: SettingsSearchEntry
  title: string
  description: string
}

export function searchSettings(
  query: string,
  t: (key: string) => string,
  entries: SettingsSearchEntry[] = settingsSearchEntries,
): SettingsSearchResult[] {
  const text = query.trim().toLowerCase()
  if (!text) return []
  const matches = entries.flatMap((entry) => {
    const title = t(entry.titleKey)
    const description = entry.descriptionKey ? t(entry.descriptionKey) : ""
    const haystack = [title, description, ...(entry.keywords ?? [])].join(" ").toLowerCase()
    if (!haystack.includes(text)) return []
    return [{ entry, title, description }]
  })
  return matches
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(text) ? 0 : 1
      const bStarts = b.title.toLowerCase().startsWith(text) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.title.localeCompare(b.title)
    })
    .slice(0, 12)
}
