import type { UIMessage } from "ai"

export type MessageMetadata = {
  createdAt: string
}

export type CustomUIDataTypes = Record<string, unknown>
export type ChatTools = any

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes, ChatTools>

export type Attachment = {
  name: string
  url: string
  contentType: string
}
