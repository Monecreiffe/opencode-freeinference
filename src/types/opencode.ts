export type Modality = "text" | "audio" | "image" | "video" | "pdf";

export interface OpenCodeModelLimit {
  context: number;
  output: number;
  input?: number;
}

export interface OpenCodeModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

export interface OpenCodeModelModalities {
  input?: Modality[];
  output?: Modality[];
}

export interface OpenCodeModelConfig {
  id: string;
  name?: string;
  family?: string;
  release_date?: string;
  attachment?: boolean;
  reasoning?: boolean;
  temperature?: boolean;
  tool_call?: boolean;
  cost?: OpenCodeModelCost;
  limit: OpenCodeModelLimit;
  modalities?: OpenCodeModelModalities;
  status?: "alpha" | "beta" | "deprecated" | "active";
  [key: string]: unknown;
}

export interface OpenCodeProviderOptions {
  baseURL?: string;
  apiKey?: string;
  timeout?: number | false;
  headerTimeout?: number | false;
  chunkTimeout?: number | false;
  [key: string]: unknown;
}

export interface OpenCodeProviderConfig {
  name?: string;
  id?: string;
  npm?: string;
  api?: string;
  env?: string[];
  whitelist?: string[];
  blacklist?: string[];
  options?: OpenCodeProviderOptions;
  models?: Record<string, OpenCodeModelConfig>;
  [key: string]: unknown;
}

export interface OpenCodeConfig {
  $schema?: string;
  plugin?: Array<string | [string, Record<string, unknown>]>;
  provider?: Record<string, OpenCodeProviderConfig>;
  model?: string;
  [key: string]: unknown;
}

export interface PluginOptions {
  apiKey?: string;
  baseURL?: string;
  filterNonChat?: boolean;
  timeoutMs?: number;
  includeModels?: string[];
  excludeModels?: string[];
  autoConfigureProvider?: boolean;
  defaultModel?: string;
  [key: string]: unknown;
}
