import { Component, Show, createMemo, type JSX } from "solid-js"
import { SelectV2 } from "@opencode-ai/ui/v2/select-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useSettings } from "@/context/settings"
import { ExternalLink } from "../external-link"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import { createAppearanceSettingsController, type AppearanceSettingsController } from "./general-controllers"
import "./settings-v2.css"

const schemeOptions: ("system" | "light" | "dark")[] = ["system", "light", "dark"]
const zoomLevels = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2]
const reduceMotionOptions = [
  { value: "system" as const, label: "settings.appearance.row.reduceMotion.system" as const },
  { value: "on" as const, label: "settings.appearance.row.reduceMotion.on" as const },
  { value: "off" as const, label: "settings.appearance.row.reduceMotion.off" as const },
]
const fontSettings = {
  ui: {
    action: "settings-ui-font",
    title: "settings.general.row.uiFont.title",
    description: "settings.general.row.uiFont.description",
    font: "ui",
    input: "setUI",
  },
  code: {
    action: "settings-code-font",
    title: "settings.general.row.font.title",
    description: "settings.general.row.font.description",
    font: "code",
    input: "setCode",
  },
  terminal: {
    action: "settings-terminal-font",
    title: "settings.general.row.terminalFont.title",
    description: "settings.general.row.terminalFont.description",
    font: "terminal",
    input: "setTerminal",
  },
} as const

const FontSetting: Component<{
  kind: "ui" | "code" | "terminal"
  fonts: AppearanceSettingsController["fonts"]
}> = (props) => {
  const language = useLanguage()
  const config = () => fontSettings[props.kind]
  return (
    <SettingsRowV2
      id={`font-${props.kind}`}
      title={language.t(config().title)}
      description={language.t(config().description)}
    >
      <div class="w-full sm:w-[220px]">
        <TextInputV2
          data-action={config().action}
          type="text"
          appearance="base"
          value={props.fonts[config().font]().value}
          onInput={(event) => props.fonts[config().input](event.currentTarget.value)}
          placeholder={props.fonts[config().font]().placeholder}
          spellcheck={false}
          autocorrect="off"
          autocomplete="off"
          autocapitalize="off"
          aria-label={language.t(config().title)}
          style={{ "font-family": props.fonts[config().font]().family }}
        />
      </div>
    </SettingsRowV2>
  )
}

const AppearanceSection: Component<{ controller: AppearanceSettingsController; children?: JSX.Element }> = (props) => {
  const language = useLanguage()
  return (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">{language.t("settings.general.section.appearance")}</h3>
      <SettingsListV2>
        <SettingsRowV2
          id="color-scheme"
          title={language.t("settings.general.row.colorScheme.title")}
          description={language.t("settings.general.row.colorScheme.description")}
        >
          <SelectV2
            appearance="inline"
            data-action="settings-color-scheme"
            options={schemeOptions}
            current={schemeOptions.find((option) => option === props.controller.scheme.current())}
            placement="bottom-end"
            gutter={6}
            label={(option) => {
              if (option === "system") return language.t("theme.scheme.system")
              if (option === "light") return language.t("theme.scheme.light")
              return language.t("theme.scheme.dark")
            }}
            onSelect={(option) => option && props.controller.scheme.select(option)}
          />
        </SettingsRowV2>

        <SettingsRowV2
          id="theme"
          title={language.t("settings.general.row.theme.title")}
          description={
            <>
              {language.t("settings.general.row.theme.description")}{" "}
              <ExternalLink class="settings-v2-link" href="https://opencode.ai/docs/themes/">
                {language.t("common.learnMore")}
              </ExternalLink>
            </>
          }
        >
          <SelectV2
            appearance="inline"
            data-action="settings-theme"
            options={props.controller.theme.options()}
            current={props.controller.theme.current()}
            placement="bottom-end"
            gutter={6}
            value={(option) => option.id}
            label={(option) => option.name}
            onSelect={props.controller.theme.select}
          />
        </SettingsRowV2>

        <FontSetting kind="ui" fonts={props.controller.fonts} />
        <FontSetting kind="code" fonts={props.controller.fonts} />
        <FontSetting kind="terminal" fonts={props.controller.fonts} />
        {props.children}
      </SettingsListV2>
    </div>
  )
}

export const SettingsAppearanceV2: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const appearance = createAppearanceSettingsController()
  const settings = useSettings()
  const zoom = () => platform.webviewZoom?.() ?? 1
  const zoomAvailable = () => !!platform.webviewZoom && !!platform.setWebviewZoom
  const formatZoom = (level: number) =>
    new Intl.NumberFormat(language.intl(), { style: "percent", maximumFractionDigits: 0 }).format(level)

  return (
    <>
      <div class="settings-v2-tab-header">
        <div class="flex flex-col gap-1">
          <h2 class="settings-v2-tab-title">{language.t("settings.general.section.appearance")}</h2>
          <p class="text-11-regular text-v2-text-text-muted">{language.t("settings.appearance.description")}</p>
        </div>
      </div>

      <div class="settings-v2-tab-body">
        <AppearanceSection controller={appearance}>
          <Show when={zoomAvailable()}>
            <SettingsRowV2
              id="zoom"
              title={language.t("settings.appearance.row.zoom.title")}
              description={language.t("settings.appearance.row.zoom.description")}
            >
              <SelectV2
                appearance="inline"
                data-action="settings-zoom"
                options={zoomLevels}
                current={zoomLevels.find((level) => Math.abs(level - zoom()) < 0.001) ?? zoom()}
                placement="bottom-end"
                gutter={6}
                value={(level) => String(level)}
                label={formatZoom}
                onSelect={(level) => level && platform.setWebviewZoom?.(level)}
              />
            </SettingsRowV2>
          </Show>

          <SettingsRowV2
            id="reduce-motion"
            title={language.t("settings.appearance.row.reduceMotion.title")}
            description={language.t("settings.appearance.row.reduceMotion.description")}
          >
            <SelectV2
              appearance="inline"
              data-action="settings-reduce-motion"
              options={reduceMotionOptions}
              current={reduceMotionOptions.find((option) => option.value === settings.appearance.reduceMotion())}
              placement="bottom-end"
              gutter={6}
              value={(option) => option.value}
              label={(option) => language.t(option.label)}
              onSelect={(option) => option && settings.appearance.setReduceMotion(option.value)}
            />
          </SettingsRowV2>
        </AppearanceSection>
      </div>
    </>
  )
}
