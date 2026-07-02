import { createVercelAIAdapter } from "@workspace/ai"
import {
  convertToModelMessages,
  gateway,
  streamText,
} from "ai"
import { Effect, ManagedRuntime } from "effect"
import { createError, defineEventHandler, readBody } from "h3"

import {
  gymboRegistry,
  makeConvexRoutineServiceLayer,
} from "../../src/lib/ai/routine"
import { DEFAULT_CHAT_MODEL } from "../../src/lib/ai/models"
import type { UIMessage } from "ai"

type ChatRequestBody = {
  message?: Omit<UIMessage, "id">
  messages?: Array<Omit<UIMessage, "id">>
  selectedChatModel?: string
}

function getConvexUrl() {
  return process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL ?? ""
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as ChatRequestBody
  const messages = body.messages ?? (body.message ? [body.message] : [])
  const selectedModel = body.selectedChatModel ?? DEFAULT_CHAT_MODEL
  const convexUrl = getConvexUrl()

  if (!convexUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Convex URL is not configured",
    })
  }

  const runtime = ManagedRuntime.make(makeConvexRoutineServiceLayer(convexUrl))

  try {
    const boundRegistry = gymboRegistry.bind(runtime)
    const tools = createVercelAIAdapter().adapt(boundRegistry)
    const result = streamText({
      model: gateway(selectedModel),
      messages: await convertToModelMessages(messages),
      tools,
    })

    return result.toUIMessageStreamResponse()
  } finally {
    await runtime.disposeEffect.pipe(Effect.runPromise)
  }
})
