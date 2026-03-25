#!/usr/bin/env node

/**
 * MCP server for searching Japanese National Diet (国会) and Imperial Diet (帝国議会) records.
 * Wraps the official APIs at kokkai.ndl.go.jp and teikokugikai-i.ndl.go.jp.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerKokkaiTools } from "./tools/kokkai.js";
import { registerTeikokuTools } from "./tools/teikoku.js";
import { registerAdvancedTools } from "./tools/advanced.js";

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const server = new McpServer({
  name: "kokkai-mcp-server",
  version: "0.1.0",
});

registerKokkaiTools(server);
registerTeikokuTools(server);
registerAdvancedTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
