import type { FreeInferenceRawModel } from "./types/api.js";
import type { Modality, OpenCodeModelConfig } from "./types/opencode.js";

const VALID_MODALITIES: Set<string> = new Set([
  "text",
  "audio",
  "image",
  "video",
  "pdf",
]);

function normalizeModalities(modalities?: string[]): Modality[] | undefined {
  if (!modalities || !Array.isArray(modalities)) {
    return undefined;
  }
  const filtered = modalities
    .map((m) => m.toLowerCase())
    .filter((m): m is Modality => VALID_MODALITIES.has(m));
  return filtered.length > 0 ? filtered : undefined;
}

function parseCost(val?: string | number): number | undefined {
  if (typeof val === "number" && !Number.isNaN(val)) {
    return val;
  }
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Transforms a raw FreeInference model definition into an OpenCode model configuration.
 */
export function transformFreeInferenceModel(
  raw: FreeInferenceRawModel
): OpenCodeModelConfig {
  const samplingParams = raw.supported_sampling_parameters || [];
  const features = raw.supported_features || [];

  // Determine tool calling support
  const supportsTools =
    features.includes("tools") ||
    samplingParams.includes("tools") ||
    samplingParams.includes("tool_choice");

  // Determine reasoning / thinking support
  const supportsReasoning =
    samplingParams.includes("thinking") ||
    samplingParams.includes("reasoning_effort");

  // Determine temperature support
  const supportsTemperature =
    samplingParams.length === 0 || samplingParams.includes("temperature");

  const inputModalities = normalizeModalities(raw.input_modalities) || ["text"];
  const outputModalities = normalizeModalities(raw.output_modalities) || ["text"];

  // Context and max output limits
  const contextLimit = raw.context_length ?? 128000;
  const outputLimit = raw.max_output_length ?? 4096;

  const config: OpenCodeModelConfig = {
    id: raw.id,
    name: raw.name || raw.id,
    limit: {
      context: contextLimit,
      output: outputLimit,
    },
    modalities: {
      input: inputModalities,
      output: outputModalities,
    },
    tool_call: supportsTools,
    reasoning: supportsReasoning,
    temperature: supportsTemperature,
    status: "active",
  };

  // Pricing / cost parsing
  if (raw.pricing) {
    const inputCost = parseCost(raw.pricing.prompt);
    const outputCost = parseCost(raw.pricing.completion);
    if (inputCost !== undefined && outputCost !== undefined) {
      config.cost = {
        input: inputCost,
        output: outputCost,
      };
      const cacheRead = parseCost(raw.pricing.input_cache_reads);
      const cacheWrite = parseCost(raw.pricing.input_cache_writes);
      if (cacheRead !== undefined) {
        config.cost.cache_read = cacheRead;
      }
      if (cacheWrite !== undefined) {
        config.cost.cache_write = cacheWrite;
      }
    }
  }

  return config;
}
