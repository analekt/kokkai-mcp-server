/**
 * Shared MCP server factory.
 * Used by the HTTP entry point (api/mcp.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerKokkaiTools } from "./tools/kokkai.js";
import { registerTeikokuTools } from "./tools/teikoku.js";
import { registerAdvancedTools } from "./tools/advanced.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kokkai-mcp-server",
    version: "0.1.0",
  });

  registerKokkaiTools(server);
  registerTeikokuTools(server);
  registerAdvancedTools(server);

  return server;
}
