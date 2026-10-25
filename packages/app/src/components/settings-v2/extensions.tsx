import { For, Show, createMemo, type Component } from "solid-js"
import { useParams } from "@solidjs/router"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { decode64 } from "@/utils/base64"
import { useLanguage } from "@/context/language"
import { useMcpToggle } from "@/context/mcp"
import { useSync } from "@/context/sync"
import { DialogSkills } from "@/components/dialog-skills"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

const statusLabels = {
  connected: "mcp.status.connected",
  failed: "mcp.status.failed",
  needs_auth: "mcp.status.needs_auth",
  needs_client_registration: "mcp.status.needs_client_registration",
  disabled: "mcp.status.disabled",
} as const

export const SettingsExtensionsV2: Component = () => {
  const language = useLanguage()
  const sync = useSync()
  const toggle = useMcpToggle()
  const dialog = useDialog()
  const params = useParams()

  const servers = createMemo(() =>
    Object.entries(sync().data.mcp ?? {})
      .map(([name, value]) => ({ name, status: value.status, error: "error" in value ? value.error : undefined }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const connected = createMemo(() => servers().filter((item) => item.status === "connected").length)

  const plugins = createMemo(() => {
    const list = sync().data.config.plugin ?? []
    return list.map((entry) => (Array.isArray(entry) ? entry[0] : entry)).filter((item): item is string => !!item)
  })

  const statusLabel = (status?: string) => {
    if (!status) return
    const key = statusLabels[status as keyof typeof statusLabels]
    return key ? language.t(key) : status
  }

  const openSkills = () =>
    dialog.show(() => <DialogSkills directory={params.dir ? decode64(params.dir) : undefined} />)

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.tab.extensions")}</h2>
        <p class="settings-v2-tab-subtitle">{language.t("settings.extensions.description")}</p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">{language.t("settings.extensions.mcp.title")}</h3>
          <SettingsListV2>
            <For each={servers()}>
              {(item) => (
                <SettingsRowV2
                  title={item.name}
                  description={[statusLabel(item.status), item.error].filter(Boolean).join(" · ")}
                >
                  <Switch
                    checked={item.status === "connected"}
                    disabled={item.status === "pending" || (toggle.isPending && toggle.variables === item.name)}
                    onChange={() => {
                      if (toggle.isPending) return
                      toggle.mutate(item.name)
                    }}
                    hideLabel
                  >
                    {item.name}
                  </Switch>
                </SettingsRowV2>
              )}
            </For>
            <Show when={servers().length === 0}>
              <div class="settings-v2-search-empty">{language.t("settings.extensions.mcp.empty")}</div>
            </Show>
          </SettingsListV2>
          <p class="text-11-regular text-text-weak">
            {language.t("settings.extensions.mcp.hint", { connected: connected(), total: servers().length })}
          </p>
        </div>

        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">{language.t("settings.extensions.skills.title")}</h3>
          <SettingsListV2>
            <SettingsRowV2
              id="ext-skills"
              title={language.t("settings.extensions.skills.row.title")}
              description={language.t("settings.extensions.skills.row.description")}
            >
              <ButtonV2 variant="outline" size="normal" onClick={() => void openSkills()}>
                {language.t("settings.extensions.skills.action")}
              </ButtonV2>
            </SettingsRowV2>
          </SettingsListV2>
        </div>

        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">{language.t("settings.extensions.plugins.title")}</h3>
          <SettingsListV2>
            <For each={plugins()}>
              {(plugin) => (
                <SettingsRowV2 title={plugin} description={language.t("settings.extensions.plugins.row.description")}>
                  <span class="text-11-regular text-text-weak">{language.t("settings.extensions.plugins.row.source")}</span>
                </SettingsRowV2>
              )}
            </For>
            <Show when={plugins().length === 0}>
              <div class="settings-v2-search-empty">{language.t("settings.extensions.plugins.empty")}</div>
            </Show>
          </SettingsListV2>
          <p class="text-11-regular text-text-weak">{language.t("settings.extensions.plugins.hint")}</p>
        </div>
      </div>
    </>
  )
}
