# opencode-freeinference

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-%3E%3D1.4.0-blueviolet)](https://opencode.ai)
[![OpenChamber Ready](https://img.shields.io/badge/OpenChamber-Compatible-emerald)](https://openchamber.dev)
[![Tested with Bun](https://img.shields.io/badge/Tested%20with-Bun-f472b6)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org)

Official OpenCode plugin for **[FreeInference](https://freeinference.org)** integration with dynamic model discovery and automatic `@ai-sdk/openai-compatible` provider configuration.

Compatible with both **OpenCode** (CLI AI coding agent) and **OpenChamber** (GUI agentic development environment).

---

## Features

- ⚡ **Zero-Config Dynamic Discovery:** Automatically queries `https://freeinference.org/v1/models` on startup to discover available models.
- 🎯 **Intelligent Chat Filtering:** Excludes non-chat and embedding-only models (such as `bge-m3`) so your agent model list remains clean.
- 🛠️ **Full Feature Mapping:** Automatically registers context window sizes, output token limits, tool-calling capabilities (`tool_call`), thinking/reasoning modes (`reasoning`), modalities (multimodal text, image, video), and pricing.
- 🔌 **Standard Adapter:** Configures OpenCode using the official `@ai-sdk/openai-compatible` provider under the hood.
- 🚀 **1-Command Setup:** Interactive CLI tool (`npx opencode-freeinference setup`) configures your project or global `opencode.json` in seconds.
- 🛡️ **Offline Resilient:** Includes a verified fallback catalog so your environment starts up smoothly even with intermittent internet connectivity.
- 🖥️ **OpenChamber & OpenCode GUI Ready:** Full support for OpenChamber model selectors and OpenCode `/connect` credential workflows.

---

## Quick Start (1-Minute Setup)

Run the setup CLI from your project directory:

```bash
npx opencode-freeinference setup
```

To configure **globally** for all projects (`~/.config/opencode/opencode.json`):

```bash
npx opencode-freeinference setup --global
```

You can also pass your API key directly during setup:

```bash
npx opencode-freeinference setup --key your_freeinference_api_key
```

---

## Authentication

Set your FreeInference API key as an environment variable:

```bash
export FREEINFERENCE_API_KEY="your_freeinference_api_key_here"
```

Or add it to your project's `.env` file:

```env
FREEINFERENCE_API_KEY=your_freeinference_api_key_here
```

Get a key at **[https://freeinference.org](https://freeinference.org)**.

---

## Usage with OpenCode CLI

Once configured, run OpenCode with any discovered FreeInference model:

```bash
# DeepSeek V4 Flash (1M context with reasoning)
opencode --model freeinference/deepseek-v4-flash

# Qwen 3.6 35B (Fast, multimodal text/image/video)
opencode --model freeinference/qwen3.6-35b

# DiffusionGemma 26B
opencode --model freeinference/diffusiongemma
```

You can also set FreeInference as your default model in `opencode.json`:

```json
{
  "model": "freeinference/deepseek-v4-flash"
}
```

---

## Usage with OpenChamber GUI

[OpenChamber](https://openchamber.dev) is an agentic GUI workspace built on top of OpenCode.

1. Run `npx opencode-freeinference setup --global` to configure global settings.
2. Launch OpenChamber.
3. Open the model selector dropdown in the workspace or session settings.
4. Select `FreeInference` from the provider list and choose your desired model (e.g. `deepseek-v4-flash` or `qwen3.6-35b`).
5. All context limits, token parameters, and tool integrations work out of the box!

---

## Discovered Models

FreeInference provides high-speed, community-supported model endpoints:

| Model ID | Context Window | Max Output | Modalities | Tools | Reasoning | Pricing (Input / Output) |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `deepseek-v4-flash` | 1,000,000 tokens | 393,216 tokens | text | ✅ | ✅ | $0.44 / $1.32 per 1M |
| `qwen3.6-35b` | 262,144 tokens | 8,192 tokens | text, image, video | ✅ | ❌ | $0.08 / $0.28 per 1M |
| `diffusiongemma` | 262,144 tokens | 8,192 tokens | text | ✅ | ✅ | $0.02 / $0.08 per 1M |

*Note: Embedding-only models such as `bge-m3` are automatically excluded from the chat assistant.*

---

## Manual Configuration

If you prefer to configure `opencode.json` manually:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-freeinference"
  ],
  "provider": {
    "freeinference": {
      "name": "FreeInference",
      "npm": "@ai-sdk/openai-compatible",
      "env": [
        "FREEINFERENCE_API_KEY"
      ],
      "options": {
        "baseURL": "https://freeinference.org/v1",
        "apiKey": "{env:FREEINFERENCE_API_KEY}"
      }
    }
  }
}
```

### Plugin Options

You can customize plugin behavior in `opencode.json`:

```json
{
  "plugin": [
    [
      "opencode-freeinference",
      {
        "timeoutMs": 15000,
        "filterNonChat": true,
        "includeModels": ["deepseek-v4-flash", "qwen3.6-35b"],
        "excludeModels": []
      }
    ]
  ]
}
```

---

## CLI Reference

The CLI utility provides commands to manage and test your FreeInference setup:

```bash
# Run setup tool
npx opencode-freeinference setup [options]

# List currently discovered chat models
npx opencode-freeinference list-models

# Test API connectivity and response latency
npx opencode-freeinference test-connection

# View help
npx opencode-freeinference help
```

### CLI Options
- `--global`, `-g`: Target global configuration file (`~/.config/opencode/opencode.json`)
- `--config`, `-c <path>`: Specify path to a custom `opencode.json`
- `--key`, `-k <apiKey>`: Provide `FREEINFERENCE_API_KEY` directly
- `--url`, `-u <url>`: Override the FreeInference base URL

---

## Development & Testing

This project is built with TypeScript and tested using [Bun](https://bun.sh).

```bash
# Clone the repository
git clone https://github.com/Monecreiffe/opencode-freeinference.git
cd opencode-freeinference

# Install dependencies
bun install

# Run the comprehensive test suite
bun test

# Type-check with strict TypeScript
bun run typecheck

# Build distribution bundle
bun run build
```

---

## License

[MIT](LICENSE) © Monecreiffe
