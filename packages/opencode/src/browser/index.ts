import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Deferred, Effect, Layer, Schema, Context } from "effect"
import { InstanceState } from "@/effect/instance-state"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Browser } from "@opencode-ai/schema/browser"

export const Action = Browser.Action
export type Action = Browser.Action

export const Result = Schema.Struct({
  ok: Schema.Boolean,
  url: Schema.String.pipe(Schema.optional),
  title: Schema.String.pipe(Schema.optional),
  text: Schema.String.pipe(Schema.optional),
  error: Schema.String.pipe(Schema.optional),
})
export type Result = typeof Result.Type

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()("Browser.NotFoundError", {
  requestID: Schema.String,
}) {}

export class UnavailableError extends Schema.TaggedErrorClass<UnavailableError>()("Browser.UnavailableError", {}) {
  override get message() {
    return "No embedded browser view is open"
  }
}

const TIMEOUT = "25 seconds"

type PendingEntry = {
  deferred: Deferred.Deferred<Result>
}

interface State {
  pending: Map<string, PendingEntry>
}

export interface Interface {
  readonly request: (input: { action: Action; url?: string; sessionID?: string }) => Effect.Effect<Result, UnavailableError>
  readonly reply: (input: { requestID: string; result: Result }) => Effect.Effect<void, NotFoundError>
  readonly list: () => Effect.Effect<ReadonlyArray<string>>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/Browser") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const events = yield* EventV2Bridge.Service
    const state = yield* InstanceState.make<State>(
      Effect.fn("Browser.state")(function* () {
        return { pending: new Map<string, PendingEntry>() }
      }),
    )

    const request = Effect.fn("Browser.request")(function* (input: {
      action: Action
      url?: string
      sessionID?: string
    }) {
      const pending = (yield* InstanceState.get(state)).pending
      const requestID = `brw_${crypto.randomUUID()}`
      const deferred = yield* Deferred.make<Result>()
      pending.set(requestID, { deferred })

      yield* events.publish(Browser.Command, {
        requestID,
        action: input.action,
        url: input.url,
        sessionID: input.sessionID,
      })

      return yield* Effect.ensuring(
        Deferred.await(deferred).pipe(
          Effect.timeout(TIMEOUT),
          Effect.catch(() => Effect.fail(new UnavailableError())),
        ),
        Effect.sync(() => {
          pending.delete(requestID)
        }),
      )
    })

    const reply = Effect.fn("Browser.reply")(function* (input: { requestID: string; result: Result }) {
      const pending = (yield* InstanceState.get(state)).pending
      const existing = pending.get(input.requestID)
      if (!existing) return yield* new NotFoundError({ requestID: input.requestID })
      pending.delete(input.requestID)
      yield* Deferred.succeed(existing.deferred, input.result)
    })

    const list = Effect.fn("Browser.list")(function* () {
      return Array.from((yield* InstanceState.get(state)).pending.keys())
    })

    return Service.of({ request, reply, list })
  }),
)

export const node = LayerNode.make({ service: Service, layer, deps: [EventV2Bridge.node] })

export * as Browser from "."
