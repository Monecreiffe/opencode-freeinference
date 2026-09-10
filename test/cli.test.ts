import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  parseConfigJson,
  applyFreeInferenceToConfig,
  runSetup,
} from "../src/cli/setup.js";
import { PROVIDER_ID, DEFAULT_NPM_ADAPTER, DEFAULT_BASE_URL } from "../src/defaults.js";
import type { OpenCodeConfig } from "../src/types/opencode.js";

describe("CLI Setup Logic", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-freeinference-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("parseConfigJson", () => {
    it("parses valid standard JSON", () => {
      const parsed = parseConfigJson('{"foo": "bar"}');
      expect(parsed).toEqual({ foo: "bar" });
    });

    it("strips comments and trailing commas", () => {
      const raw = `
      {
        // This is a comment
        "provider": {
          /* multiline comment */
          "test": {},
        },
      }
      `;
      const parsed = parseConfigJson(raw);
      expect(parsed.provider).toBeDefined();
    });

    it("throws a descriptive error on syntax errors", () => {
      expect(() => parseConfigJson("invalid json content")).toThrow();
    });
  });

  describe("applyFreeInferenceToConfig", () => {
    it("adds plugin to empty plugin array", () => {
      const config: OpenCodeConfig = {};
      const result = applyFreeInferenceToConfig(config);

      expect(result.pluginAdded).toBe(true);
      expect(result.providerConfigured).toBe(true);
      expect(config.plugin).toContain("opencode-freeinference");
      expect(config.$schema).toBe("https://opencode.ai/config.json");
    });

    it("does not duplicate plugin if already registered", () => {
      const config: OpenCodeConfig = {
        plugin: ["opencode-freeinference"],
      };
      const result = applyFreeInferenceToConfig(config);

      expect(result.pluginAdded).toBe(false);
      expect(config.plugin?.length).toBe(1);
    });

    it("configures freeinference provider with @ai-sdk/openai-compatible", () => {
      const config: OpenCodeConfig = {};
      applyFreeInferenceToConfig(config, {
        baseURL: "https://custom.freeinference.org/v1",
      });

      const provider = config.provider?.[PROVIDER_ID];
      expect(provider).toBeDefined();
      expect(provider?.npm).toBe(DEFAULT_NPM_ADAPTER);
      expect(provider?.options?.baseURL).toBe("https://custom.freeinference.org/v1");
      expect(provider?.options?.apiKey).toBe("{env:FREEINFERENCE_API_KEY}");
      expect(provider?.env).toContain("FREEINFERENCE_API_KEY");
    });
  });

  describe("runSetup", () => {
    it("creates a new opencode.json if not present", async () => {
      const testConfigPath = path.join(tempDir, "opencode.json");

      const result = await runSetup({
        configPath: testConfigPath,
      });

      expect(result.isNewFile).toBe(true);
      expect(result.configPath).toBe(testConfigPath);
      expect(fs.existsSync(testConfigPath)).toBe(true);

      const written = JSON.parse(fs.readFileSync(testConfigPath, "utf-8"));
      expect(written.plugin).toContain("opencode-freeinference");
      expect(written.provider?.[PROVIDER_ID]?.npm).toBe(DEFAULT_NPM_ADAPTER);
    });

    it("updates existing opencode.json without destroying other configuration", async () => {
      const testConfigPath = path.join(tempDir, "opencode.json");
      const initial = {
        $schema: "https://opencode.ai/config.json",
        plugin: ["existing-plugin"],
        provider: {
          anthropic: {
            npm: "@ai-sdk/anthropic",
          },
        },
        model: "anthropic/claude-3-5-sonnet",
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(initial, null, 2), "utf-8");

      const result = await runSetup({
        configPath: testConfigPath,
      });

      expect(result.isNewFile).toBe(false);
      const written = JSON.parse(fs.readFileSync(testConfigPath, "utf-8"));

      // Preserves existing plugin and adds new one
      expect(written.plugin).toContain("existing-plugin");
      expect(written.plugin).toContain("opencode-freeinference");

      // Preserves existing provider and adds freeinference
      expect(written.provider?.anthropic).toBeDefined();
      expect(written.provider?.[PROVIDER_ID]).toBeDefined();
      expect(written.model).toBe("anthropic/claude-3-5-sonnet");
    });
  });
});
