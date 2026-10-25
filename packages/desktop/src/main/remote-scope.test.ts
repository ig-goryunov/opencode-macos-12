import { describe, expect, test } from "bun:test"
import { allowedApi, scopedApi, withinDirectories } from "./remote-scope"

describe("remote api whitelist", () => {
  test("allows the endpoints the phone page needs", () => {
    expect(allowedApi("GET", "/session")).toBe(true)
    expect(allowedApi("POST", "/session")).toBe(true)
    expect(allowedApi("GET", "/session/status")).toBe(true)
    expect(allowedApi("GET", "/session/ses_1/message")).toBe(true)
    expect(allowedApi("POST", "/session/ses_1/prompt_async")).toBe(true)
    expect(allowedApi("POST", "/session/ses_1/abort")).toBe(true)
    expect(allowedApi("GET", "/permission")).toBe(true)
    expect(allowedApi("POST", "/permission/per_1/reply")).toBe(true)
  })

  test("rejects shell, file and upgrade endpoints", () => {
    expect(allowedApi("GET", "/pty")).toBe(false)
    expect(allowedApi("GET", "/session/ses_1/file")).toBe(false)
    expect(allowedApi("POST", "/global/upgrade")).toBe(false)
    expect(allowedApi("DELETE", "/session/ses_1")).toBe(false)
    expect(allowedApi("POST", "/session/ses_1/message")).toBe(false)
  })
})

describe("remote project scope", () => {
  test("project endpoints are scoped, status and providers are not", () => {
    expect(scopedApi("/session")).toBe(true)
    expect(scopedApi("/session/ses_1")).toBe(true)
    expect(scopedApi("/session/ses_1/message")).toBe(true)
    expect(scopedApi("/permission")).toBe(true)
    expect(scopedApi("/permission/per_1/reply")).toBe(true)
    expect(scopedApi("/session/status")).toBe(false)
    expect(scopedApi("/config/providers")).toBe(false)
    expect(scopedApi("/event")).toBe(false)
  })
})

describe("withinDirectories", () => {
  const roots = ["/repo", "/work/other"]

  test("accepts a shared root and its subfolders", () => {
    expect(withinDirectories(roots, "/repo")).toBe(true)
    expect(withinDirectories(roots, "/repo/app/src")).toBe(true)
    expect(withinDirectories(roots, "/work/other")).toBe(true)
  })

  test("rejects siblings, parents and lookalike prefixes", () => {
    expect(withinDirectories(roots, "/")).toBe(false)
    expect(withinDirectories(roots, "/repo-evil")).toBe(false)
    expect(withinDirectories(roots, "/repo/../etc")).toBe(false)
    expect(withinDirectories(roots, "/etc")).toBe(false)
    expect(withinDirectories(roots, "")).toBe(false)
  })
})
