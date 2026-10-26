import { For, Show, createMemo, createResource, createSignal, type Component } from "solid-js"
import { useParams } from "@solidjs/router"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { decode64 } from "@/utils/base64"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"
import { showToast } from "@/utils/toast"
import { DialogSkills } from "@/components/dialog-skills"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

type McpStatus = { status: string; error?: string }

const statusLabels: Record<string, string> = {
  connected: "mcp.status.connected",
  failed: "mcp.status.failed",
  needs_auth: "mcp.status.needs_auth",
  needs_client_registration: "mcp.status.needs_client_registration",
  disabled: "mcp.status.disabled",
}

// The settings dialog lives in a portal above the directory-scoped SDK/Sync
// providers, so this tab talks to the server over HTTP instead of useSync()
// (which used to crash the whole dialog with "SDK context must be used within a
// context provider").
export const SettingsExtensionsV2: Component<{ directory?: string }> = (props) => {
  const language = useLanguage()
  const server = useServer()
  const dialog = useDialog()
  const params = useParams()
  const [pending, setPending] = createSignal<string>()

  const directory = () => props.directory ?? (params.dir ? decode64(params.dir) : undefined)
  const query = () => (directory() ? `?directory=${encodeURIComponent(directory()!)}` : "")
  const auth = (): Record<string, string> => {
    const conn = server.current
    if (!conn?.http.password) return {}
    return { Authorization: `Basic ${btoa(`${conn.http.username ?? "opencode"}:${conn.http.password}`)}` }
  }
  const call = async (path: string, init?: RequestInit) => {
    const conn = server.current
    if (!conn) throw new Error(language.t("error.serverSDK.noServerAvailable"))
    const response = await fetch(`${conn.http.url}${path}${query()}`, {
      ...init,
      headers: { ...auth(), ...((init?.headers as Record<string, string> | undefined) ?? {}) },
    })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return response
  }

  const [servers, { refetch }] = createResource(directory, async () => {
    const response = await call("/mcp")
    return (await response.json()) as Record<string, McpStatus>
  })

  const [config] = createResource(directory, async () => {
    const response = await call("/config")
    return (await response.json()) as { plugin?: Array<string | [string, unknown]> }
  })

  const list = createMemo(() =>
    Object.entries(servers() ?? {})
      .map(([name, value]) => ({ name, status: value.status, error: value.error }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const connected = createMemo(() => list().filter((item) => item.status === "connected").length)

  const plugins = createMemo(() => {
    const entries = config()?.plugin ?? []
    return entries.map((entry) => (Array.isArray(entry) ? entry[0] : entry)).filter((item): item is string => !!item)
  })

  const statusLabel = (status?: string) => {
    if (!status) return
    const key = statusLabels[status]
    return key ? language.t(key as Parameters<typeof language.t>[0]) : status
  }

  const toggle = async (name: string, connected: boolean) => {
    if (pending()) return
    setPending(name)
    try {
      await call(`/mcp/${encodeURIComponent(name)}/${connected ? "disconnect" : "connect"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
      await refetch()
    } catch (cause) {
      showToast({
        title: language.t("common.requestFailed"),
        description: cause instanceof Error ? cause.message : String(cause),
      })
    } finally {
      setPending(undefined)
    }
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
          <Show when={servers.error}>
            <p class="text-11-regular text-text-critical-base">
              {servers.error instanceof Error ? servers.error.message : String(servers.error)}
            </p>
          </Show>
          <SettingsListV2>
            <For each={list()}>
              {(item) => (
                <SettingsRowV2
                  title={item.name}
                  description={[statusLabel(item.status), item.error].filter(Boolean).join(" · ")}
                >
                  <Switch
                    checked={item.status === "connected"}
                    disabled={item.status === "pending" || pending() === item.name}
                    onChange={() => void toggle(item.name, item.status === "connected")}
                    hideLabel
                  >
                    {item.name}
                  </Switch>
                </SettingsRowV2>
              )}
            </For>
            <Show when={list().length === 0}>
              <div class="settings-v2-search-empty">{language.t("settings.extensions.mcp.empty")}</div>
            </Show>
          </SettingsListV2>
          <p class="text-11-regular text-text-weak">
            {language.t("settings.extensions.mcp.hint", { connected: connected(), total: list().length })}
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
                  <span class="text-11-regular text-text-weak">
                    {language.t("settings.extensions.plugins.row.source")}
                  </span>
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
