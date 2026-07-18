import type { UseChatHelpers } from "@ai-sdk/react";
import type { DataUIPart } from "ai";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { UIArtifact } from "./artifact";

export type ArtifactActionContext<TMetadata = any> = {
  content: string;
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: "edit" | "diff";
  metadata: TMetadata;
  setMetadata: Dispatch<SetStateAction<TMetadata>>;
};

type ArtifactAction<TMetadata = any> = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: ArtifactActionContext<TMetadata>) => Promise<void> | void;
  isDisabled?: (context: ArtifactActionContext<TMetadata>) => boolean;
};

export type ArtifactToolbarContext = {
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

export type ArtifactToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: ArtifactToolbarContext) => void;
};

type ArtifactContent<TMetadata = any> = {
  title: string;
  content: string;
  mode: "edit" | "diff";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: "streaming" | "idle";
  suggestions: Array<Suggestion>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: TMetadata;
  setMetadata: Dispatch<SetStateAction<TMetadata>>;
};

type InitializeParameters<TMetadata = any> = {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<TMetadata>>;
};

type ArtifactConfig<T extends string, TMetadata = any> = {
  kind: T;
  description: string;
  content: ComponentType<ArtifactContent<TMetadata>>;
  actions: Array<ArtifactAction<TMetadata>>;
  toolbar: Array<ArtifactToolbarItem>;
  initialize?: (parameters: InitializeParameters<TMetadata>) => void;
  onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<TMetadata>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;
};

export class Artifact<T extends string, TMetadata = any> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<ArtifactContent<TMetadata>>;
  readonly actions: Array<ArtifactAction<TMetadata>>;
  readonly toolbar: Array<ArtifactToolbarItem>;
  readonly initialize?: (parameters: InitializeParameters) => void;
  readonly onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<TMetadata>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;

  constructor(config: ArtifactConfig<T, TMetadata>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
    this.initialize = config.initialize || (async () => ({}));
    this.onStreamPart = config.onStreamPart;
  }
}
