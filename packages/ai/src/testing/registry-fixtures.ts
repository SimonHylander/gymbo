import { Context, Effect, Layer, Schema } from "effect"

import { defineTool } from "../tool"

export class PrefixService extends Context.Service<
  PrefixService,
  { readonly prefix: string }
>()("@workspace/ai/testing/PrefixService") {}

export const PrefixServiceLive = Layer.succeed(PrefixService)({
  prefix: "hello",
})

export const makePrefixTool = (onExecute: () => void = () => undefined) =>
  defineTool({
    name: "prefix",
    description: "Prefixes a validated name",
    category: "testing",
    inputSchema: Schema.Struct({ name: Schema.String }),
    execute: ({ name }) =>
      Effect.gen(function* () {
        onExecute()
        const service = yield* PrefixService
        return `${service.prefix} ${name}`
      }),
  })
