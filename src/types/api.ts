export interface FreeInferencePricing {
  prompt?: string | number;
  completion?: string | number;
  image?: string | number;
  request?: string | number;
  input_cache_reads?: string | number;
  input_cache_writes?: string | number;
  [key: string]: unknown;
}

export interface FreeInferenceRawModel {
  id: string;
  name?: string;
  object?: string;
  created?: number;
  owned_by?: string;
  input_modalities?: string[];
  output_modalities?: string[];
  quantization?: string;
  context_length?: number;
  max_output_length?: number;
  pricing?: FreeInferencePricing;
  supported_sampling_parameters?: string[];
  supported_features?: string[];
  on_demand?: boolean;
  openrouter?: unknown;
  [key: string]: unknown;
}

export interface FreeInferenceModelsResponse {
  object?: string;
  data: FreeInferenceRawModel[];
  [key: string]: unknown;
}
