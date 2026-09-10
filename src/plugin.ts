import {
  DEFAULT_BASE_URL,
  DEFAULT_NPM_ADAPTER,
  DEFAULT_API_KEY_ENV,
  PROVIDER_ID,
  PROVIDER_NAME,
} from "./defaults.js";
import { discoverFreeInferenceModels } from "./discovery.js";
import type {
  OpenCodeConfig,
  OpenCodeProviderConfig,
  PluginOptions,
} from "./types/opencode.js";

export interface PluginHooks {
  config: (config: OpenCodeConfig) => Promise<void>;
  auth?: {
    provider: string;
    methods: Array<{
      type: "api";
      label: string;
      prompts?: Array<{
        type: "text";
        key: string;
        message: string;
        placeholder?: string;
      }>;
      authorize?(inputs?: Record<string, string>): Promise<
        | { type: "success"; key: string; provider?: string }
        | { type: "failed" }
      >;
    }>;
  };
}

/**
 * OpenCode plugin for FreeInference.
 * Automatically discovers available chat models from FreeInference (excluding embedding models),
 * and configures the FreeInference provider in OpenCode using `@ai-sdk/openai-compatible`.
 */
export async function FreeInferencePlugin(
  _input?: unknown,
  options?: PluginOptions
): Promise<PluginHooks> {
  const pluginOptions = options || {};

  return {
    auth: {
      provider: PROVIDER_ID,
      methods: [
        {
          type: "api",
          label: "FreeInference API Key",
          prompts: [
            {
              type: "text",
              key: "apiKey",
              message:
                "Enter your FreeInference API Key (get one at https://freeinference.org):",
              placeholder: "FreeInference API Key",
            },
          ],
          async authorize(inputs?: Record<string, string>) {
            const key = inputs?.apiKey?.trim();
            if (!key) {
              return { type: "failed" };
            }
            return {
              type: "success",
              key,
              provider: PROVIDER_ID,
            };
          },
        },
      ],
    },

    config: async (config: OpenCodeConfig): Promise<void> => {
      if (!config) {
        return;
      }

      if (!config.provider) {
        config.provider = {};
      }

      // Check if provider is explicitly disabled via options
      if (pluginOptions.autoConfigureProvider === false) {
        return;
      }

      const existingProvider: OpenCodeProviderConfig =
        config.provider[PROVIDER_ID] || {};

      const baseURL =
        pluginOptions.baseURL ||
        existingProvider.options?.baseURL ||
        DEFAULT_BASE_URL;

      const apiKey =
        pluginOptions.apiKey ||
        existingProvider.options?.apiKey ||
        `{env:${DEFAULT_API_KEY_ENV}}`;

      // Discover models from FreeInference API
      const discovery = await discoverFreeInferenceModels({
        apiKey: pluginOptions.apiKey,
        baseURL,
        timeoutMs: pluginOptions.timeoutMs,
        filterNonChat: pluginOptions.filterNonChat,
        includeModels: pluginOptions.includeModels,
        excludeModels: pluginOptions.excludeModels,
        useFallbackOnError: true,
      });

      // Preserve any explicitly user-configured models
      const userModels = existingProvider.models || {};
      const mergedModels = {
        ...discovery.models,
        ...userModels,
      };

      const envList = new Set(existingProvider.env || []);
      envList.add(DEFAULT_API_KEY_ENV);

      config.provider[PROVIDER_ID] = {
        name: existingProvider.name || PROVIDER_NAME,
        npm: existingProvider.npm || DEFAULT_NPM_ADAPTER,
        env: Array.from(envList),
        options: {
          ...existingProvider.options,
          baseURL,
          apiKey,
        },
        models: mergedModels,
      };
    },
  };
}

export default FreeInferencePlugin;
