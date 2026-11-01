import { describe, expect, test } from "bun:test"
import {
  browserFavicon,
  browserHistory,
  browserHistoryEntries,
  jumpBrowserHistory,
  recordBrowserNavigation,
  rememberBrowserFavicon,
  stepBrowserHistory,
} from "./browser-state"

const id = (name: string) => `test-${name}-${Math.random().toString(36).slice(2)}`

describe("browser state", () => {
  test("records navigation and steps through history", () => {
    const session = id("step")
    recordBrowserNavigation(session, "https://example.com/a")
    recordBrowserNavigation(session, "https://example.com/b")
    expect(browserHistory(session)).toMatchObject({ url: "https://example.com/b", canBack: true, canForward: false })
    expect(stepBrowserHistory(session, -1)).toBe("https://example.com/a")
    expect(browserHistory(session)).toMatchObject({ canBack: false, canForward: true })
    expect(stepBrowserHistory(session, 1)).toBe("https://example.com/b")
  })

  test("jumps directly to a history entry", () => {
    const session = id("jump")
    recordBrowserNavigation(session, "https://example.com/1")
    recordBrowserNavigation(session, "https://example.com/2")
    recordBrowserNavigation(session, "https://example.com/3")
    const { entries, index } = browserHistoryEntries(session)
    expect(index).toBe(2)
    expect(jumpBrowserHistory(session, 0)).toBe("https://example.com/1")
    expect(browserHistoryEntries(session).index).toBe(0)
    expect(entries).toHaveLength(3)
    expect(jumpBrowserHistory(session, 99)).toBeUndefined()
  })

  test("caps history entries", () => {
    const session = id("cap")
    for (let i = 0; i < 120; i++) recordBrowserNavigation(session, `https://example.com/${i}`)
    const { entries, index } = browserHistoryEntries(session)
    expect(entries).toHaveLength(100)
    expect(entries.at(-1)).toBe("https://example.com/119")
    expect(index).toBe(99)
  })

  test("stores http favicons only", () => {
    const session = id("favicon")
    recordBrowserNavigation(session, "https://example.com/a")
    rememberBrowserFavicon(session, "https://example.com/a", "https://example.com/favicon.png")
    expect(browserFavicon(session, "https://example.com/a")).toBe("https://example.com/favicon.png")
    rememberBrowserFavicon(session, "https://example.com/a", "data:image/png;base64,AAAA")
    expect(browserFavicon(session, "https://example.com/a")).toBe("https://example.com/favicon.png")
    rememberBrowserFavicon(session, "https://example.com/a", `https://example.com/${"x".repeat(3000)}`)
    expect(browserFavicon(session, "https://example.com/a")).toBe("https://example.com/favicon.png")
  })
})
