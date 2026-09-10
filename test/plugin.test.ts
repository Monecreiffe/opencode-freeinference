import { describe, expect, it } from "bun:test";
import { FreeInferencePlugin } from "../src/plugin.js";
import { PROVIDER_ID, PROVIDER_NAME, DEFAULT_NPM_ADAPTER, DEFAULT_BASE_URL } from "../src/defaults.js";
import type { OpenCodeConfig } from "../src/types/opencode.js";

describe("OpenCode Plugin", () => {
  it("initializes plugin hooks with config and auth", async () => {
    const hooks = await FreeInferencePlugin();
    expect(hooks.config).toBeDefined();
    expect(hooks.auth).toBeDefined();
    expect(hooks.auth?.provider).toBe(PROVIDER_ID);
    expect(hooks.auth?.methods.length).toBeGreaterThan(0);
  });

  it("authorizes with a valid API key via auth hook", async () => {
    const hooks = await FreeInferencePlugin();
    const method = hooks.auth?.methods[0];
    expect(method).toBeDefined();

    const success = await method?.authorize?.({ apiKey: "test-freeinference-key" });
    expect(success?.type).toBe("success");
    if (success?.type === "success") {
      expect(success.key).toBe("test-freeinference-key");
      expect(success.provider).toBe(PROVIDER_ID);
    }

    const failed = await method?.authorize?.({ apiKey: "" });
    expect(failed?.type).toBe("failed");
  });

  it("configures freeinference provider in OpenCode config", async () => {
    const hooks = await FreeInferencePlugin();
    const config: OpenCodeConfig = {};

    await hooks.config(config);

    expect(config.provider).toBeDefined();
    const provider = config.provider?.[PROVIDER_ID];
    expect(provider).toBeDefined();
    expect(provider?.name).toBe(PROVIDER_NAME);
    expect(provider?.npm).toBe(DEFAULT_NPM_ADAPTER);
    expect(provider?.options?.baseURL).toBe(DEFAULT_BASE_URL);
    expect(provider?.options?.apiKey).toBe("{env:FREEINFERENCE_API_KEY}");
    expect(provider?.env).toContain("FREEINFERENCE_API_KEY");
    expect(provider?.models).toBeDefined();

    // Models should include chat models and exclude embedding models
    expect(provider?.models?.["deepseek-v4-flash"]).toBeDefined();
    expect(provider?.models?.["bge-m3"]).toBeUndefined();
  });

  it("preserves user custom model overrides", async () => {
    const hooks = await FreeInferencePlugin();
    const config: OpenCodeConfig = {
      provider: {
        [PROVIDER_ID]: {
          models: {
            "deepseek-v4-flash": {
              id: "deepseek-v4-flash",
              name: "Custom Renamed DeepSeek",
              limit: {
                context: 500000,
                output: 10000,
              },
            },
            "custom-private-model": {
              id: "custom-private-model",
              limit: {
                context: 32000,
                output: 4096,
              },
            },
          },
        },
      },
    };

    await hooks.config(config);

    const provider = config.provider?.[PROVIDER_ID];
    expect(provider?.models?.["deepseek-v4-flash"]?.name).toBe("Custom Renamed DeepSeek");
    expect(provider?.models?.["deepseek-v4-flash"]?.limit.context).toBe(500000);
    expect(provider?.models?.["custom-private-model"]).toBeDefined();
    // And discovered models should also be added
    expect(provider?.models?.["qwen3.6-35b"]).toBeDefined();
  });

  it("honors autoConfigureProvider: false option", async () => {
    const hooks = await FreeInferencePlugin(undefined, {
      autoConfigureProvider: false,
    });
    const config: OpenCodeConfig = {};

    await hooks.config(config);
    expect(config.provider?.[PROVIDER_ID]).toBeUndefined();
  });
});
