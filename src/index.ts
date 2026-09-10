export {
  FreeInferencePlugin,
  FreeInferencePlugin as default,
  type PluginHooks,
} from "./plugin.js";

export {
  discoverFreeInferenceModels,
  fetchRawModels,
  resolveApiKey,
  type DiscoverModelsOptions,
  type DiscoveryResult,
} from "./discovery.js";

export {
  filterChatModels,
  isChatModel,
  isEmbeddingModel,
  type ModelFilterOptions,
} from "./filter.js";

export { transformFreeInferenceModel } from "./transformer.js";

export {
  DEFAULT_BASE_URL,
  DEFAULT_MODELS_ENDPOINT,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_API_KEY_ENV,
  DEFAULT_NPM_ADAPTER,
  PROVIDER_ID,
  PROVIDER_NAME,
  FALLBACK_CHAT_MODELS,
} from "./defaults.js";

export * from "./types/index.js";
