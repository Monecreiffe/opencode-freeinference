import { describe, expect, it } from "bun:test";
import { transformFreeInferenceModel } from "../src/transformer.js";
import type { FreeInferenceRawModel } from "../src/types/api.js";

describe("Model Transformer", () => {
  it("correctly maps a full FreeInference model", () => {
    const raw: FreeInferenceRawModel = {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash (high speed)",
      object: "model",
      created: 1789047993,
      owned_by: "sglang",
      input_modalities: ["text"],
      output_modalities: ["text"],
      quantization: "none",
      context_length: 1000000,
      max_output_length: 393216,
      pricing: {
        prompt: "0.44",
        completion: "1.32",
        input_cache_reads: "0.014",
        input_cache_writes: "0",
      },
      supported_sampling_parameters: [
        "max_tokens",
        "reasoning_effort",
        "stop",
        "stream",
        "temperature",
        "thinking",
        "top_p",
      ],
      supported_features: ["tools", "json_mode", "structured_outputs"],
    };

    const transformed = transformFreeInferenceModel(raw);

    expect(transformed.id).toBe("deepseek-v4-flash");
    expect(transformed.name).toBe("DeepSeek V4 Flash (high speed)");
    expect(transformed.limit.context).toBe(1000000);
    expect(transformed.limit.output).toBe(393216);
    expect(transformed.modalities?.input).toEqual(["text"]);
    expect(transformed.modalities?.output).toEqual(["text"]);
    expect(transformed.tool_call).toBe(true);
    expect(transformed.reasoning).toBe(true);
    expect(transformed.temperature).toBe(true);
    expect(transformed.status).toBe("active");
    expect(transformed.cost?.input).toBe(0.44);
    expect(transformed.cost?.output).toBe(1.32);
    expect(transformed.cost?.cache_read).toBe(0.014);
    expect(transformed.cost?.cache_write).toBe(0);
  });

  it("handles multimodal models with image and video inputs", () => {
    const raw: FreeInferenceRawModel = {
      id: "qwen3.6-35b",
      name: "Qwen3.6 35B (high speed)",
      input_modalities: ["text", "image", "video"],
      output_modalities: ["text"],
      context_length: 262144,
      max_output_length: 8192,
      pricing: {
        prompt: 0.08,
        completion: 0.28,
      },
      supported_features: ["tools"],
      supported_sampling_parameters: ["temperature"],
    };

    const transformed = transformFreeInferenceModel(raw);

    expect(transformed.id).toBe("qwen3.6-35b");
    expect(transformed.modalities?.input).toEqual(["text", "image", "video"]);
    expect(transformed.modalities?.output).toEqual(["text"]);
    expect(transformed.tool_call).toBe(true);
    expect(transformed.reasoning).toBe(false);
    expect(transformed.cost?.input).toBe(0.08);
    expect(transformed.cost?.output).toBe(0.28);
  });

  it("applies sensible defaults for missing optional fields", () => {
    const raw: FreeInferenceRawModel = {
      id: "minimal-model",
    };

    const transformed = transformFreeInferenceModel(raw);

    expect(transformed.id).toBe("minimal-model");
    expect(transformed.name).toBe("minimal-model");
    expect(transformed.limit.context).toBe(128000);
    expect(transformed.limit.output).toBe(4096);
    expect(transformed.modalities?.input).toEqual(["text"]);
    expect(transformed.modalities?.output).toEqual(["text"]);
    expect(transformed.tool_call).toBe(false);
    expect(transformed.reasoning).toBe(false);
    expect(transformed.cost).toBeUndefined();
  });
});
