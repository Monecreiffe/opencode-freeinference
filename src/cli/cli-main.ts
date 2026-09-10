import {
  handleSetupCommand,
  handleStatusCommand,
  handleListModelsCommand,
  handleTestConnectionCommand,
  printHelp,
} from "./commands.js";

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const command = argv[0];
  const restArgs = argv.slice(1);

  if (!command || command === "setup") {
    await handleSetupCommand(restArgs);
  } else if (command === "status" || command === "doctor" || command === "check") {
    await handleStatusCommand();
  } else if (command === "list-models" || command === "models") {
    await handleListModelsCommand(restArgs);
  } else if (command === "test-connection" || command === "test") {
    await handleTestConnectionCommand(restArgs);
  } else if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
}

if (import.meta.url.startsWith("file:") && process.argv[1]?.includes("cli")) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
