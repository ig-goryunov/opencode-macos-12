import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Browser } from "@/browser"
import DESCRIPTION from "./browser.txt"

export const Parameters = Schema.Struct({
  action: Schema.Literals(["open", "read", "back", "forward", "reload"]).annotate({
    description: "open: load a URL; read: return the current URL/title/text; back/forward/reload: navigate.",
  }),
  url: Schema.String.pipe(Schema.optional).annotate({ description: "URL to load when action=open" }),
})

export const BrowserTool = Tool.define(
  "browser",
  Effect.gen(function* () {
    const browser = yield* Browser.Service
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const result: Browser.Result = yield* browser
            .request({ action: params.action, url: params.url, sessionID: ctx.sessionID })
            .pipe(
              Effect.catchTag("Browser.UnavailableError", () =>
                Effect.succeed({
                  ok: false,
                  error: 'No embedded browser view is open. Ask the user to open the "Browser" tab in the Review panel first.',
                }),
              ),
            )

          if (!result.ok) {
            return { title: `Browser ${params.action}`, metadata: {}, output: `Error: ${result.error ?? "unknown"}` }
          }

          const lines = [`url: ${result.url ?? ""}`]
          if (result.title) lines.push(`title: ${result.title}`)
          if (result.text) lines.push(`text:\n${result.text}`)
          return { title: `Browser ${params.action}`, metadata: {}, output: lines.join("\n") }
        }).pipe(Effect.orDie),
    }
  }),
)
