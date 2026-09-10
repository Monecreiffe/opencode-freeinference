import { runSetup, type SetupOptions } from "./setup.js";
import { discoverFreeInferenceModels, resolveApiKey } from "../discovery.js";
import { DEFAULT_BASE_URL, DEFAULT_API_KEY_ENV } from "../defaults.js";

export async function handleSetupCommand(args: string[]): Promise<void> {
  const options: SetupOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--global" || arg === "-g") {
      options.global = true;
    } else if (arg === "--config" || arg === "-c") {
      options.configPath = args[++i];
    } else if (arg === "--key" || arg === "-k") {
      options.apiKey = args[++i];
    } else if (arg === "--url" || arg === "-u") {
      options.baseURL = args[++i];
    }
  }

  console.log("\n🚀 Configuring OpenCode for FreeInference...\n");

  try {
    const result = await runSetup(options);

    console.log(`✅ Configuration file: ${result.configPath}`);
    if (result.isNewFile) {
      console.log("   Created new configuration file.");
    } else {
      console.log("   Updated existing configuration file.");
    }

    if (result.pluginAdded) {
      console.log("   Added 'opencode-freeinference' to plugins.");
    } else {
      console.log("   'opencode-freeinference' is already listed in plugins.");
    }

    if (result.providerConfigured) {
      console.log("   Configured provider 'freeinference' with @ai-sdk/openai-compatible.");
    }

    // Check API Key
    const apiKey = resolveApiKey(options.apiKey);
    if (!apiKey) {
      console.log("\n⚠️  FREEINFERENCE_API_KEY not found in environment or arguments.");
      console.log("   To set your API key:");
      console.log(`   export ${DEFAULT_API_KEY_ENV}="your_api_key_here"`);
      console.log("   Or add it to your .env file or OpenCode config.\n");
    } else {
      console.log(`\n🔑 API Key detected: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
    }

    // Verify model discovery
    console.log("📡 Discovering available chat models from FreeInference...");
    try {
      const discovery = await discoverFreeInferenceModels({
        apiKey,
        baseURL: options.baseURL || DEFAULT_BASE_URL,
        timeoutMs: 8000,
        useFallbackOnError: true,
      });

      const modelIds = Object.keys(discovery.models);
      console.log(`✅ Discovered ${modelIds.length} chat models (${discovery.source}):`);
      for (const id of modelIds) {
        const m = discovery.models[id];
        const ctx = m?.limit?.context ? `${Math.round(m.limit.context / 1000)}k` : "unknown";
        const tools = m?.tool_call ? "🛠️ tools" : "";
        const reasoning = m?.reasoning ? "🧠 thinking" : "";
        const tags = [tools, reasoning].filter(Boolean).join(" ");
        console.log(`   • ${id} (${m?.name ?? id}) - ctx: ${ctx} ${tags}`);
      }
    } catch (err) {
      console.log(`⚠️  Could not fetch live models: ${err instanceof Error ? err.message : String(err)}`);
      console.log("   Using built-in fallback models.");
    }

    console.log("\n✨ Setup complete! You are ready to use FreeInference with OpenCode and OpenChamber.");
    console.log("\nUsage tips:");
    console.log("  • In OpenCode CLI:     opencode --model freeinference/<model-id>");
    console.log("  • In OpenChamber:      Select any FreeInference model from the model selector");
    console.log("  • List live models:    npx opencode-freeinference list-models\n");
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

export async function handleListModelsCommand(args: string[]): Promise<void> {
  let apiKey: string | undefined;
  let baseURL: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--key" || arg === "-k") {
      apiKey = args[++i];
    } else if (arg === "--url" || arg === "-u") {
      baseURL = args[++i];
    }
  }

  console.log("\n🔍 Fetching models from FreeInference (https://freeinference.org/v1/models)...\n");

  try {
    const result = await discoverFreeInferenceModels({
      apiKey,
      baseURL,
      useFallbackOnError: false,
    });

    console.log(`Found ${result.rawCount} total models (${result.chatCount} chat models, ${result.rawCount - result.chatCount} embedding models filtered out):\n`);

    for (const [id, model] of Object.entries(result.models)) {
      console.log(`📦 ${model.name || id}`);
      console.log(`   ID:          ${id}`);
      console.log(`   Context:     ${model.limit.context.toLocaleString()} tokens`);
      console.log(`   Max Output:  ${model.limit.output.toLocaleString()} tokens`);
      console.log(`   Modalities:  ${model.modalities?.input?.join(", ") || "text"} -> ${model.modalities?.output?.join(", ") || "text"}`);
      console.log(`   Tools:       ${model.tool_call ? "✅ Supported" : "❌ No"}`);
      console.log(`   Reasoning:   ${model.reasoning ? "✅ Supported" : "❌ No"}`);
      if (model.cost) {
        console.log(`   Pricing:     $${model.cost.input}/M prompt, $${model.cost.output}/M completion`);
      }
      console.log();
    }
  } catch (error) {
    console.error(`❌ Failed to list models: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

export async function handleTestConnectionCommand(args: string[]): Promise<void> {
  let apiKey: string | undefined;
  let baseURL: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--key" || arg === "-k") {
      apiKey = args[++i];
    } else if (arg === "--url" || arg === "-u") {
      baseURL = args[++i];
    }
  }

  const key = resolveApiKey(apiKey);
  console.log("\n📡 Testing connection to FreeInference API...");
  console.log(`   Base URL: ${baseURL || DEFAULT_BASE_URL}`);
  console.log(`   API Key:  ${key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "(not set)"}\n`);

  try {
    const start = Date.now();
    const result = await discoverFreeInferenceModels({
      apiKey: key,
      baseURL,
      useFallbackOnError: false,
    });
    const duration = Date.now() - start;

    console.log(`✅ Successfully connected in ${duration}ms!`);
    console.log(`   Discovered ${result.chatCount} chat models.`);
    console.log(`   Models: ${Object.keys(result.models).join(", ")}\n`);
  } catch (error) {
    console.error(`❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

export function printHelp(): void {
  console.log(`
opencode-freeinference CLI

Usage:
  npx opencode-freeinference <command> [options]

Commands:
  setup            Configure OpenCode / OpenChamber to use FreeInference
  list-models      Fetch and list available chat models from FreeInference
  test-connection  Test connection to the FreeInference API endpoint
  help             Show this help information

Setup Options:
  --global, -g     Update global config (~/.config/opencode/opencode.json)
  --config, -c     Specify path to custom opencode.json
  --key, -k        Provide FREEINFERENCE_API_KEY explicitly
  --url, -u        Override FreeInference baseURL (default: https://freeinference.org/v1)

Examples:
  npx opencode-freeinference setup
  npx opencode-freeinference setup --global
  npx opencode-freeinference setup --key your_freeinference_key
  npx opencode-freeinference list-models
  npx opencode-freeinference test-connection
`);
}
