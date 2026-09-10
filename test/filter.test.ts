import { describe, expect, it } from "bun:test";
import { isChatModel, isEmbeddingModel, filterChatModels } from "../src/filter.js";
import type { FreeInferenceRawModel } from "../src/types/api.js";

describe("Model Filtering", () => {
  const bgeM3Model: FreeInferenceRawModel = {
    id: "bge-m3",
    name: "BGE-M3",
    object: "model",
    created: 1789047993,
    owned_by: "sglang",
    input_modalities: ["text"],
    output_modalities: ["embedding"],
    quantization: "fp16",
    context_length: 8192,
    max_output_length: 0,
    pricing: { prompt: "0", completion: "0" },
    supported_sampling_parameters: [],
    supported_features: ["embeddings"],
    on_demand: false,
    openrouter: null,
  };

  const deepseekModel: FreeInferenceRawModel = {
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
    pricing: { prompt: "0.44", completion: "1.32" },
    supported_sampling_parameters: ["max_tokens", "reasoning_effort", "stop", "stream", "temperature", "thinking", "top_p"],
    supported_features: ["tools", "json_mode", "structured_outputs"],
  };

  const qwenModel: FreeInferenceRawModel = {
    id: "qwen3.6-35b",
    name: "Qwen3.6 35B (high speed)",
    object: "model",
    input_modalities: ["text", "image", "video"],
    output_modalities: ["text"],
    context_length: 262144,
    max_output_length: 8192,
    supported_features: ["tools", "json_mode"],
    supported_sampling_parameters: ["max_tokens", "temperature"],
  };

  describe("isEmbeddingModel", () => {
    it("identifies bge-m3 as an embedding model", () => {
      expect(isEmbeddingModel(bgeM3Model)).toBe(true);
    });

    it("identifies models with max_output_length = 0 as embedding models", () => {
      const zeroOutputModel: FreeInferenceRawModel = {
        id: "custom-embed-model",
        output_modalities: ["text"],
        max_output_length: 0,
      };
      expect(isEmbeddingModel(zeroOutputModel)).toBe(true);
    });

    it("identifies models with output_modalities = ['embedding'] as embedding models", () => {
      const embedModalityModel: FreeInferenceRawModel = {
        id: "some-model",
        output_modalities: ["embedding"],
        max_output_length: 512,
      };
      expect(isEmbeddingModel(embedModalityModel)).toBe(true);
    });

    it("identifies models matching embedding regex as embedding models", () => {
      const textEmbeddingModel: FreeInferenceRawModel = {
        id: "text-embedding-3-large",
        max_output_length: 100,
      };
      expect(isEmbeddingModel(textEmbeddingModel)).toBe(true);
    });

    it("does not flag chat models as embedding models", () => {
      expect(isEmbeddingModel(deepseekModel)).toBe(false);
      expect(isEmbeddingModel(qwenModel)).toBe(false);
    });
  });

  describe("isChatModel", () => {
    it("allows deepseek and qwen chat models", () => {
      expect(isChatModel(deepseekModel)).toBe(true);
      expect(isChatModel(qwenModel)).toBe(true);
    });

    it("excludes bge-m3 by default", () => {
      expect(isChatModel(bgeM3Model)).toBe(false);
    });

    it("respects includeModels option", () => {
      expect(isChatModel(deepseekModel, { includeModels: ["deepseek-v4-flash"] })).toBe(true);
      expect(isChatModel(qwenModel, { includeModels: ["deepseek-v4-flash"] })).toBe(false);
    });

    it("respects excludeModels option", () => {
      expect(isChatModel(deepseekModel, { excludeModels: ["deepseek-v4-flash"] })).toBe(false);
      expect(isChatModel(qwenModel, { excludeModels: ["deepseek-v4-flash"] })).toBe(true);
    });

    it("allows embedding models if filterNonChat is false", () => {
      expect(isChatModel(bgeM3Model, { filterNonChat: false })).toBe(true);
    });
  });

  describe("filterChatModels", () => {
    it("filters out bge-m3 and leaves chat models", () => {
      const rawList = [bgeM3Model, deepseekModel, qwenModel];
      const filtered = filterChatModels(rawList);
      expect(filtered.length).toBe(2);
      expect(filtered.map((m) => m.id)).toEqual(["deepseek-v4-flash", "qwen3.6-35b"]);
    });

    it("returns empty array for invalid inputs", () => {
      expect(filterChatModels(null as any)).toEqual([]);
      expect(filterChatModels(undefined as any)).toEqual([]);
    });
  });
});
