import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { BrowserNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"

const root = "/browser"
const ResultPayload = Schema.Struct({
  ok: Schema.Boolean,
  url: Schema.String.pipe(Schema.optional),
  title: Schema.String.pipe(Schema.optional),
  text: Schema.String.pipe(Schema.optional),
  error: Schema.String.pipe(Schema.optional),
})

export const BrowserApi = HttpApi.make("browser")
  .add(
    HttpApiGroup.make("browser")
      .add(
        HttpApiEndpoint.post("reply", `${root}/:requestID/reply`, {
          params: { requestID: Schema.String },
          query: WorkspaceRoutingQuery,
          payload: ResultPayload,
          success: described(Schema.Boolean, "Browser command result accepted"),
          error: [HttpApiError.BadRequest, BrowserNotFoundError],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "browser.reply",
            summary: "Reply to a browser command",
            description: "The renderer reports the result of an embedded-browser command requested by the server.",
          }),
        ),
      )
      .annotateMerge(
        OpenApi.annotations({
          title: "browser",
          description: "Embedded browser routes.",
        }),
      )
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(Authorization),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "opencode HttpApi",
      version: "0.0.1",
      description: "Effect HttpApi surface for instance routes.",
    }),
  )
