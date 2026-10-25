import { describe, expect, test } from "bun:test"
import { dict as en } from "@/i18n/en"
import { dict as ru } from "@/i18n/ru"
import { searchSettings, settingsSearchEntries, settingsTabLabelKey } from "./search"

const english = en as Record<string, string>
const russian = ru as Record<string, string>
const tEn = (key: string) => english[key] ?? key
const tRu = (key: string) => russian[key] ?? key

describe("settings search catalog", () => {
  test("every entry points at an existing translation", () => {
    for (const entry of settingsSearchEntries) {
      expect(english[entry.titleKey], entry.titleKey).toBeTruthy()
      if (entry.descriptionKey) expect(english[entry.descriptionKey], entry.descriptionKey).toBeTruthy()
      expect(english[settingsTabLabelKey(entry.tab)], settingsTabLabelKey(entry.tab)).toBeTruthy()
    }
  })

  test("row ids are unique", () => {
    const ids = settingsSearchEntries.flatMap((entry) => (entry.id ? [entry.id] : []))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("searchSettings", () => {
  test("finds a row by its title and prefers title matches", () => {
    const results = searchSettings("theme", tEn)
    expect(results[0]?.entry.id).toBe("theme")
    expect(results[0]?.title.toLowerCase()).toBe("theme")
  })

  test("finds a row by its description", () => {
    const results = searchSettings("crash dumps", tEn)
    expect(results.map((result) => result.entry.id)).toContain("about-logs")
  })

  test("finds rows in Russian", () => {
    const results = searchSettings("уведом", tRu)
    const ids = results.map((result) => result.entry.id)
    expect(ids).toContain("notif-agent")
    expect(ids).toContain("notif-permissions")
    expect(ids).toContain("notif-errors")
  })

  test("matches extra keywords such as the section name", () => {
    const results = searchSettings("таймлайн", tRu)
    expect(results.map((result) => result.entry.id)).toContain("collapse-tools")
  })

  test("finds whole tabs", () => {
    const results = searchSettings("models", tEn)
    expect(results.some((result) => result.entry.tab === "models" && !result.entry.id)).toBe(true)
  })

  test("ignores empty and unmatched queries", () => {
    expect(searchSettings("   ", tEn)).toEqual([])
    expect(searchSettings("zzzzzz", tEn)).toEqual([])
  })

  test("caps the result list", () => {
    expect(searchSettings("a", tEn).length).toBeLessThanOrEqual(12)
  })
})
