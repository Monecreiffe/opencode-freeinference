#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isBun = typeof globalThis.Bun !== "undefined" || !!process.versions?.bun;
const srcCli = path.resolve(__dirname, "../src/cli/cli-main.ts");
const distCli = path.resolve(__dirname, "../dist/cli.js");

if (isBun && fs.existsSync(srcCli)) {
  import(pathToFileURL(srcCli).href);
} else if (fs.existsSync(distCli)) {
  import(pathToFileURL(distCli).href);
} else if (fs.existsSync(srcCli)) {
  import(pathToFileURL(srcCli).href);
} else {
  console.error(
    "Error: Could not locate CLI distribution files. Please run `bun run build` or `npm run build` first."
  );
  process.exit(1);
}
