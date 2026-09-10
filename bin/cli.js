#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distCli = path.resolve(__dirname, "../dist/cli.js");

if (fs.existsSync(distCli)) {
  import(pathToFileURL(distCli).href);
} else {
  // If dist hasn't been built yet and running with bun or tsx
  const srcCli = path.resolve(__dirname, "../src/cli/cli-main.ts");
  if (fs.existsSync(srcCli)) {
    import(pathToFileURL(srcCli).href);
  } else {
    console.error("Error: Could not locate CLI distribution files. Please run `npm run build` or `bun run build` first.");
    process.exit(1);
  }
}
