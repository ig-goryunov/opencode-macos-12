import { describe, expect, test } from "bun:test"
import { contextItemKey } from "./prompt-context-key"
import type { ContextItem } from "./prompt-state"

const file = (path: string, extra: Partial<Extract<ContextItem, { type: "file" }>> = {}): ContextItem => ({
  type: "file",
  path,
  ...extra,
})

const element = (
  path: string,
  selector: string,
  extra: Partial<Extract<ContextItem, { type: "element" }>> = {},
): ContextItem => ({
  type: "element",
  path,
  selector,
  ...extra,
})

describe("contextItemKey", () => {
  test("separates elements by page and selector", () => {
    const first = contextItemKey(element("https://example.com", "#hero"))
    const second = contextItemKey(element("https://example.com", "#footer"))
    const other = contextItemKey(element("https://example.com/about", "#hero"))
    expect(first).not.toBe(second)
    expect(first).not.toBe(other)
  })

  test("dedupes the same element", () => {
    expect(contextItemKey(element("https://example.com", "#hero"))).toBe(
      contextItemKey(element("https://example.com", "#hero")),
    )
  })

  test("keeps a comment on an element distinct", () => {
    const plain = contextItemKey(element("https://example.com", "#hero"))
    const commented = contextItemKey(element("https://example.com", "#hero", { comment: "make it blue" }))
    expect(plain).not.toBe(commented)
  })

  test("keeps file selection keys working", () => {
    expect(contextItemKey(file("a.ts"))).toBe(contextItemKey(file("a.ts")))
    const lines = contextItemKey(file("a.ts", { selection: { startLine: 1, startChar: 0, endLine: 2, endChar: 0 } }))
    expect(lines).not.toBe(contextItemKey(file("a.ts")))
  })
})
