import type { OpenCodeModelConfig } from "./types/opencode.js";

export const DEFAULT_BASE_URL = "https://freeinference.org/v1";
export const DEFAULT_MODELS_ENDPOINT = "https://freeinference.org/v1/models";
export const DEFAULT_TIMEOUT_MS = 10000;
export const PROVIDER_ID = "freeinference";
export const PROVIDER_NAME = "FreeInference";
export const DEFAULT_NPM_ADAPTER = "@ai-sdk/openai-compatible";
export const DEFAULT_API_KEY_ENV = "FREEINFERENCE_API_KEY";

/**
 * Fallback chat models provided by FreeInference in case network request fails or times out.
 */
export const FALLBACK_CHAT_MODELS: Record<string, OpenCodeModelConfig> = {
  "deepseek-v4-flash": {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash (high speed)",
    limit: {
      context: 1000000,
      output: 393216,
    },
    modalities: {
      input: ["text"],
      output: ["text"],
    },
    tool_call: true,
    reasoning: true,
    temperature: true,
    cost: {
      input: 0.44,
      output: 1.32,
    },
  },
  "qwen3.6-35b": {
    id: "qwen3.6-35b",
    name: "Qwen3.6 35B (high speed)",
    limit: {
      context: 262144,
      output: 8192,
    },
    modalities: {
      input: ["text", "image", "video"],
      output: ["text"],
    },
    tool_call: true,
    reasoning: false,
    temperature: true,
    cost: {
      input: 0.08,
      output: 0.28,
    },
  },
  "diffusiongemma": {
    id: "diffusiongemma",
    name: "DiffusionGemma 26B",
    limit: {
      context: 262144,
      output: 8192,
    },
    modalities: {
      input: ["text"],
      output: ["text"],
    },
    tool_call: true,
    reasoning: true,
    temperature: true,
    cost: {
      input: 0.02,
      output: 0.08,
    },
  },
};
