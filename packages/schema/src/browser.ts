export * as Browser from "./browser"

import { Schema } from "effect"
import { optional } from "./schema"
import { define, inventory } from "./event"

export const Action = Schema.Literals(["open", "read", "back", "forward", "reload"])
export type Action = typeof Action.Type

/**
 * Server → renderer request to drive the embedded browser. The renderer answers
 * over HTTP at `POST /browser/:requestID/reply`. Mirrors the question round-trip.
 */
export const Command = define({
  type: "browser.command",
  schema: {
    requestID: Schema.String,
    action: Action,
    url: Schema.String.pipe(optional),
    sessionID: Schema.String.pipe(optional),
  },
})

export const Event = { Command, Definitions: inventory(Command) }
