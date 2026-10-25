import { describe, expect, test } from "bun:test"
import { validWorktreeName } from "./worktree"

describe("validWorktreeName", () => {
  test("accepts simple latin names", () => {
    expect(validWorktreeName("task-1")).toBe(true)
    expect(validWorktreeName("fix_login.v2")).toBe(true)
    expect(validWorktreeName("A")).toBe(true)
    expect(validWorktreeName("a".repeat(64))).toBe(true)
  })

  test("rejects path traversal and dot-only names", () => {
    expect(validWorktreeName(".")).toBe(false)
    expect(validWorktreeName("..")).toBe(false)
    expect(validWorktreeName(".hidden")).toBe(false)
    expect(validWorktreeName("a/b")).toBe(false)
    expect(validWorktreeName("../x")).toBe(false)
    expect(validWorktreeName("")).toBe(false)
  })

  test("rejects spaces, slashes and overly long names", () => {
    expect(validWorktreeName("my task")).toBe(false)
    expect(validWorktreeName("задача")).toBe(false)
    expect(validWorktreeName("a".repeat(65))).toBe(false)
  })
})
