import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
  discoverFreeInferenceModels,
  resolveApiKey,
} from "../src/discovery.js";
import { DEFAULT_API_KEY_ENV, FALLBACK_CHAT_MODELS } from "../src/defaults.js";

describe("Model Discovery", () => {
  const originalEnv = process.env[DEFAULT_API_KEY_ENV];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env[DEFAULT_API_KEY_ENV] = originalEnv;
    } else {
      delete process.env[DEFAULT_API_KEY_ENV];
    }
  });

  describe("resolveApiKey", () => {
    it("prefers explicit argument over environment variable", () => {
      process.env[DEFAULT_API_KEY_ENV] = "env-key";
      expect(resolveApiKey("arg-key")).toBe("arg-key");
    });

    it("falls back to environment variable when argument is undefined", () => {
      process.env[DEFAULT_API_KEY_ENV] = "env-key-123";
      expect(resolveApiKey(undefined)).toBe("env-key-123");
    });

    it("returns undefined when neither is set", () => {
      delete process.env[DEFAULT_API_KEY_ENV];
      expect(resolveApiKey("")).toBeUndefined();
      expect(resolveApiKey(undefined)).toBeUndefined();
    });
  });

  describe("discoverFreeInferenceModels", () => {
    it("returns live models from freeinference.org endpoint", async () => {
      const result = await discoverFreeInferenceModels({
        useFallbackOnError: false,
      });

      expect(result.ok).toBe(true);
      expect(result.chatCount).toBeGreaterThan(0);
      expect(result.models["deepseek-v4-flash"]).toBeDefined();
      expect(result.models["bge-m3"]).toBeUndefined(); // ensure embedding model is filtered out!
      expect(result.source).toBe("api");
    });

    it("falls back to FALLBACK_CHAT_MODELS when endpoint is unreachable", async () => {
      const result = await discoverFreeInferenceModels({
        baseURL: "https://invalid-non-existent-domain-12345.org/v1",
        timeoutMs: 500,
        useFallbackOnError: true,
      });

      expect(result.ok).toBe(false);
      expect(result.source).toBe("fallback");
      expect(result.models["deepseek-v4-flash"]).toBeDefined();
      expect(result.models["qwen3.6-35b"]).toBeDefined();
      expect(result.models["diffusiongemma"]).toBeDefined();
    });

    it("throws error when useFallbackOnError is false and request fails", async () => {
      expect(
        discoverFreeInferenceModels({
          baseURL: "https://invalid-non-existent-domain-12345.org/v1",
          timeoutMs: 500,
          useFallbackOnError: false,
        })
      ).rejects.toThrow();
    });
  });
});
