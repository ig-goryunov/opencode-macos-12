import { describe, expect, test } from "bun:test"
import { applyVisibilityAll, type ModelVisibilityEntry } from "./model-visibility"

const key = (providerID: string, modelID: string) => `${providerID}:${modelID}`

describe("applyVisibilityAll", () => {
  const stored: (ModelVisibilityEntry & { favorite?: boolean })[] = [
    { providerID: "openai", modelID: "gpt-5", visibility: "hide", favorite: true },
    { providerID: "openai", modelID: "o4", visibility: "show" },
  ]
  const models = [
    { providerID: "openai", modelID: "gpt-5" },
    { providerID: "openai", modelID: "o4" },
    { providerID: "anthropic", modelID: "claude" },
  ]

  test("hides every known model and keeps stored fields", () => {
    const next = applyVisibilityAll(stored, models, "hide")
    expect(next.map((item) => [key(item.providerID, item.modelID), item.visibility])).toEqual([
      ["openai:gpt-5", "hide"],
      ["openai:o4", "hide"],
      ["anthropic:claude", "hide"],
    ])
    expect(next.find((item) => item.modelID === "gpt-5")?.favorite).toBe(true)
  })

  test("shows every known model", () => {
    const next = applyVisibilityAll(stored, models, "show")
    expect(next.every((item) => item.visibility === "show")).toBe(true)
  })

  test("never drops entries the provider list does not know about", () => {
    const next = applyVisibilityAll(stored, models, "hide")
    expect(next.map((item) => key(item.providerID, item.modelID))).toContain("openai:gpt-5")
    expect(next.length).toBe(3)
  })

  test("is stable when the input is empty", () => {
    const next = applyVisibilityAll<ModelVisibilityEntry>([], models, "hide")
    expect(next.length).toBe(3)
    expect(next.every((item) => item.visibility === "hide")).toBe(true)
  })
})
