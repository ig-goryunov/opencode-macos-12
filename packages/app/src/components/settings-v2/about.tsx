import { type Component, Show } from "solid-js"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { showToast } from "@/utils/toast"
import { useUpdaterAction } from "../updater-action"
import { ExternalLink } from "../external-link"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

const REPO = "https://github.com/ig-goryunov/opencode-macos-12"

export const SettingsAboutV2: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const updater = useUpdaterAction()

  const channel = import.meta.env.VITE_OPENCODE_CHANNEL
  const beta = channel !== "prod"

  const exportLogs = async () => {
    const run = platform.exportDebugLogs
    if (!run) return
    try {
      const path = await run()
      showToast({
        variant: "success",
        icon: "circle-check",
        title: language.t("settings.about.logs.saved"),
        description: path,
      })
    } catch (cause) {
      showToast({
        title: language.t("settings.about.logs.failed"),
        description: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.tab.about")}</h2>
        <p class="settings-v2-tab-subtitle">{language.t("settings.about.description")}</p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">{language.t("settings.about.section.app")}</h3>
          <SettingsListV2>
            <SettingsRowV2
              title={language.t("settings.about.version.title")}
              description={language.t("settings.about.version.description")}
            >
              <div class="flex items-center gap-2 text-12-regular text-text-strong">
                <span>v{platform.version ?? "—"}</span>
                <Show when={beta}>
                  <span class="settings-v2-about-badge">{language.t("settings.about.channel.beta")}</span>
                </Show>
              </div>
            </SettingsRowV2>

            <Show when={platform.updater}>
              <SettingsRowV2
                id="about-update"
                title={language.t("settings.about.updates.title")}
                description={language.t("settings.about.updates.description")}
              >
                <ButtonV2
                  size="normal"
                  variant="neutral"
                  disabled={!updater.action().run}
                  onClick={() => updater.run()}
                >
                  {language.t(updater.action().label)}
                </ButtonV2>
              </SettingsRowV2>
            </Show>

            <Show when={platform.exportDebugLogs}>
              <SettingsRowV2
              id="about-logs"
              title={language.t("settings.about.logs.title")}
              description={language.t("settings.about.logs.description")}
            >
                <ButtonV2 size="normal" variant="outline" onClick={() => void exportLogs()}>
                  {language.t("settings.about.logs.action")}
                </ButtonV2>
              </SettingsRowV2>
            </Show>
          </SettingsListV2>
        </div>

        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">{language.t("settings.about.section.links")}</h3>
          <SettingsListV2>
            <SettingsRowV2
              id="about-releases"
              title={language.t("settings.about.row.releases.title")}
              description={language.t("settings.about.row.releases.description")}
            >
              <ExternalLink class="settings-v2-link" href={`${REPO}/releases`}>
                {language.t("settings.about.row.releases.action")}
              </ExternalLink>
            </SettingsRowV2>
            <SettingsRowV2
              id="about-repo"
              title={language.t("settings.about.row.repo.title")}
              description={language.t("settings.about.row.repo.description")}
            >
              <ExternalLink class="settings-v2-link" href={REPO}>
                {language.t("settings.about.row.repo.action")}
              </ExternalLink>
            </SettingsRowV2>
            <SettingsRowV2
              id="about-docs"
              title={language.t("settings.about.row.docs.title")}
              description={language.t("settings.about.row.docs.description")}
            >
              <ExternalLink class="settings-v2-link" href="https://opencode.ai/docs">
                {language.t("settings.about.row.docs.action")}
              </ExternalLink>
            </SettingsRowV2>
            <SettingsRowV2
              id="about-license"
              title={language.t("settings.about.row.license.title")}
              description={language.t("settings.about.row.license.description")}
            >
              <ExternalLink class="settings-v2-link" href={`${REPO}/blob/main/LICENSE`}>
                {language.t("settings.about.row.license.action")}
              </ExternalLink>
            </SettingsRowV2>
          </SettingsListV2>
        </div>
      </div>
    </>
  )
}
