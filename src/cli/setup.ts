import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  DEFAULT_BASE_URL,
  DEFAULT_NPM_ADAPTER,
  DEFAULT_API_KEY_ENV,
  PROVIDER_ID,
  PROVIDER_NAME,
} from "../defaults.js";
import type { OpenCodeConfig } from "../types/opencode.js";

export interface SetupOptions {
  configPath?: string;
  global?: boolean;
  apiKey?: string;
  baseURL?: string;
  silent?: boolean;
}

export interface SetupResult {
  configPath: string;
  isNewFile: boolean;
  pluginAdded: boolean;
  providerConfigured: boolean;
  config: OpenCodeConfig;
}

/**
 * Resolves the path to the opencode.json configuration file.
 */
export function resolveConfigPath(options: SetupOptions = {}): string {
  if (options.configPath) {
    return path.resolve(options.configPath);
  }

  const globalDir = path.join(os.homedir(), ".config", "opencode");
  const globalCandidates = [
    path.join(globalDir, "opencode.jsonc"),
    path.join(globalDir, "opencode.json"),
  ];

  if (options.global) {
    for (const p of globalCandidates) {
      if (fs.existsSync(p)) return p;
    }
    return globalCandidates[1]!;
  }

  // Look in current directory (root or .opencode)
  const localCandidates = [
    path.resolve(process.cwd(), "opencode.jsonc"),
    path.resolve(process.cwd(), "opencode.json"),
    path.resolve(process.cwd(), ".opencode", "opencode.jsonc"),
    path.resolve(process.cwd(), ".opencode", "opencode.json"),
  ];

  for (const p of localCandidates) {
    if (fs.existsSync(p)) return p;
  }

  // Check global config if local doesn't exist
  for (const p of globalCandidates) {
    if (fs.existsSync(p)) return p;
  }

  // Default to local opencode.json
  return localCandidates[1]!;
}

/**
 * Safely parses a JSON or JSONC string.
 */
export function parseConfigJson(rawContent: string): OpenCodeConfig {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return {};
  }

  // Fast path: valid standard JSON
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fallback: strip JSONC comments and trailing commas
    try {
      const cleaned = trimmed
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(cleaned);
    } catch (error) {
      throw new Error(
        `Failed to parse configuration file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Adds the plugin and provider to the configuration object.
 */
export function applyFreeInferenceToConfig(
  config: OpenCodeConfig,
  options: SetupOptions = {}
): { pluginAdded: boolean; providerConfigured: boolean } {
  let pluginAdded = false;
  let providerConfigured = false;

  const pluginName = "opencode-freeinference";

  // 1. Ensure schema is set
  if (!config.$schema) {
    config.$schema = "https://opencode.ai/config.json";
  }

  // 2. Configure plugin list
  if (!config.plugin) {
    config.plugin = [];
  }

  const hasPlugin = config.plugin.some((p) => {
    if (typeof p === "string") {
      return p === pluginName || p.startsWith(`${pluginName}@`);
    }
    if (Array.isArray(p) && typeof p[0] === "string") {
      return p[0] === pluginName || p[0].startsWith(`${pluginName}@`);
    }
    return false;
  });

  if (!hasPlugin) {
    config.plugin.push(pluginName);
    pluginAdded = true;
  }

  // 3. Configure provider
  if (!config.provider) {
    config.provider = {};
  }

  const existingProvider = config.provider[PROVIDER_ID] || {};
  const baseURL = options.baseURL || existingProvider.options?.baseURL || DEFAULT_BASE_URL;
  const apiKey =
    options.apiKey ||
    existingProvider.options?.apiKey ||
    `{env:${DEFAULT_API_KEY_ENV}}`;

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
    ...(existingProvider.models ? { models: existingProvider.models } : {}),
  };

  providerConfigured = true;

  return { pluginAdded, providerConfigured };
}

/**
 * Executes the setup process, creating or updating opencode.json.
 */
export async function runSetup(options: SetupOptions = {}): Promise<SetupResult> {
  const targetPath = resolveConfigPath(options);
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let config: OpenCodeConfig = {};
  let isNewFile = true;

  if (fs.existsSync(targetPath)) {
    isNewFile = false;
    const content = fs.readFileSync(targetPath, "utf-8");
    if (content.trim().length > 0) {
      config = parseConfigJson(content);
    }
  }

  const { pluginAdded, providerConfigured } = applyFreeInferenceToConfig(
    config,
    options
  );

  const formattedJson = JSON.stringify(config, null, 2) + "\n";
  fs.writeFileSync(targetPath, formattedJson, "utf-8");

  return {
    configPath: targetPath,
    isNewFile,
    pluginAdded,
    providerConfigured,
    config,
  };
}
