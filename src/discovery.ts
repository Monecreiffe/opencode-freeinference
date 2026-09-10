import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  FALLBACK_CHAT_MODELS,
  DEFAULT_API_KEY_ENV,
} from "./defaults.js";
import { filterChatModels, type ModelFilterOptions } from "./filter.js";
import { transformFreeInferenceModel } from "./transformer.js";
import type { FreeInferenceModelsResponse, FreeInferenceRawModel } from "./types/api.js";
import type { OpenCodeModelConfig } from "./types/opencode.js";

export interface DiscoverModelsOptions extends ModelFilterOptions {
  apiKey?: string;
  baseURL?: string;
  endpoint?: string;
  timeoutMs?: number;
  useFallbackOnError?: boolean;
}

export interface DiscoveryResult {
  ok: boolean;
  models: Record<string, OpenCodeModelConfig>;
  rawCount: number;
  chatCount: number;
  source: "api" | "fallback";
  error?: string;
}

/**
 * Resolves the FreeInference API key from options or environment variables.
 */
export function resolveApiKey(optionsApiKey?: string): string | undefined {
  if (optionsApiKey && optionsApiKey.trim().length > 0) {
    return optionsApiKey.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env[DEFAULT_API_KEY_ENV];
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }
  }
  return undefined;
}

/**
 * Fetches raw models from the FreeInference endpoint.
 */
export async function fetchRawModels(
  options: DiscoverModelsOptions = {}
): Promise<FreeInferenceRawModel[]> {
  const baseURL = options.baseURL || DEFAULT_BASE_URL;
  const endpoint =
    options.endpoint || `${baseURL.replace(/\/+$/, "")}/models`;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const apiKey = resolveApiKey(options.apiKey);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "opencode-freeinference/0.1.0",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch models from FreeInference (${endpoint}): HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as FreeInferenceModelsResponse;
    if (!data || !Array.isArray(data.data)) {
      throw new Error("Invalid response format from FreeInference: expected 'data' array");
    }

    return data.data;
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`FreeInference discovery failed: ${message}`);
  }
}

/**
 * Dynamically discovers and returns available chat models from FreeInference,
 * filtering out embedding-only models like bge-m3.
 */
export async function discoverFreeInferenceModels(
  options: DiscoverModelsOptions = {}
): Promise<DiscoveryResult> {
  const useFallback = options.useFallbackOnError !== false;

  try {
    const rawModels = await fetchRawModels(options);
    const chatModels = filterChatModels(rawModels, options);

    const modelsMap: Record<string, OpenCodeModelConfig> = {};
    for (const raw of chatModels) {
      modelsMap[raw.id] = transformFreeInferenceModel(raw);
    }

    return {
      ok: true,
      models: modelsMap,
      rawCount: rawModels.length,
      chatCount: chatModels.length,
      source: "api",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (useFallback) {
      return {
        ok: false,
        models: { ...FALLBACK_CHAT_MODELS },
        rawCount: Object.keys(FALLBACK_CHAT_MODELS).length,
        chatCount: Object.keys(FALLBACK_CHAT_MODELS).length,
        source: "fallback",
        error: errorMsg,
      };
    }

    throw error;
  }
}
