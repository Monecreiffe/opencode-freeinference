import type { FreeInferenceRawModel } from "./types/api.js";

const EMBEDDING_MODEL_PATTERNS = [
  /bge-/i,
  /embedding/i,
  /embed/i,
  /gte-/i,
  /e5-/i,
  /sentence-transformers/i,
  /text2vec/i,
];

export interface ModelFilterOptions {
  includeModels?: string[];
  excludeModels?: string[];
  filterNonChat?: boolean;
}

/**
 * Checks if a FreeInference model is an embedding-only model.
 * Returns true if the model is an embedding model (e.g., bge-m3).
 */
export function isEmbeddingModel(model: FreeInferenceRawModel): boolean {
  // Check output modalities: embedding only
  if (model.output_modalities && Array.isArray(model.output_modalities)) {
    const isOnlyEmbedding =
      model.output_modalities.length === 1 &&
      model.output_modalities[0]?.toLowerCase() === "embedding";
    if (isOnlyEmbedding) {
      return true;
    }

    const hasTextOutput = model.output_modalities.some(
      (m) => m.toLowerCase() === "text"
    );
    if (!hasTextOutput) {
      return true;
    }
  }

  // Check supported features: embeddings only
  if (model.supported_features && Array.isArray(model.supported_features)) {
    const isOnlyEmbeddings =
      model.supported_features.length === 1 &&
      model.supported_features[0]?.toLowerCase() === "embeddings";
    if (isOnlyEmbeddings) {
      return true;
    }
  }

  // Check max output length: 0 means no token generation capability
  if (typeof model.max_output_length === "number" && model.max_output_length === 0) {
    return true;
  }

  // Check known embedding model name/id patterns
  if (model.id && EMBEDDING_MODEL_PATTERNS.some((pattern) => pattern.test(model.id))) {
    return true;
  }

  return false;
}

/**
 * Checks whether a model is a usable chat / completion model for OpenCode.
 */
export function isChatModel(
  model: FreeInferenceRawModel,
  options: ModelFilterOptions = {}
): boolean {
  if (!model || !model.id) {
    return false;
  }

  // If explicit include list is specified, it must be in it
  if (options.includeModels && options.includeModels.length > 0) {
    if (!options.includeModels.includes(model.id)) {
      return false;
    }
  }

  // If explicit exclude list is specified
  if (options.excludeModels && options.excludeModels.length > 0) {
    if (options.excludeModels.includes(model.id)) {
      return false;
    }
  }

  // By default, exclude embedding-only models like bge-m3
  if (options.filterNonChat !== false) {
    if (isEmbeddingModel(model)) {
      return false;
    }
  }

  return true;
}

/**
 * Filters a list of raw FreeInference models, keeping only valid chat models.
 */
export function filterChatModels(
  models: FreeInferenceRawModel[],
  options: ModelFilterOptions = {}
): FreeInferenceRawModel[] {
  if (!Array.isArray(models)) {
    return [];
  }
  return models.filter((model) => isChatModel(model, options));
}
