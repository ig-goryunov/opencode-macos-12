import { Browser } from "@/browser"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { BrowserNotFoundError } from "../errors"

export const browserHandlers = HttpApiBuilder.group(InstanceHttpApi, "browser", (handlers) =>
  Effect.gen(function* () {
    const svc = yield* Browser.Service

    const reply = Effect.fn("BrowserHttpApi.reply")(function* (ctx: {
      params: { requestID: string }
      payload: { ok: boolean; url?: string; title?: string; text?: string; error?: string }
    }) {
      yield* svc.reply({ requestID: ctx.params.requestID, result: ctx.payload }).pipe(
        Effect.catchTag("Browser.NotFoundError", (error) =>
          Effect.fail(
            new BrowserNotFoundError({
              requestID: error.requestID,
              message: `Browser request not found: ${error.requestID}`,
            }),
          ),
        ),
      )
      return true
    })

    return handlers.handle("reply", reply)
  }),
)
