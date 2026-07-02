export {
  IntegrationErrorCode,
  createIntegrationError,
  type IntegrationError,
} from "./errors"
export {
  defineBidirectionalAdapter,
  type BidirectionalAdapter,
  type BidirectionalAdapterDefinition,
} from "./bidirectional-adapter"
export {
  defineInboundAdapter,
  type InboundAdapter,
  type InboundAdapterDefinition,
} from "./inbound-adapter"
export {
  defineOutboundAdapter,
  type OutboundAdapter,
  type OutboundAdapterDefinition,
} from "./outbound-adapter"
export {
  IntegrationRegistry,
  createIntegrationRegistry,
} from "./registry"
export {
  flatMapIntegrationResult,
  integrationDuplicateRegistration,
  integrationErr,
  integrationNotFound,
  integrationOk,
  mapIntegrationResult,
  unwrapIntegrationResult,
} from "./result"
export {
  createIntegrationId,
  type IntegrationContext,
  type IntegrationDirection,
  type IntegrationId,
  type IntegrationResult,
} from "./types"
