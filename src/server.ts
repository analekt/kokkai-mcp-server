/**
 * Shared MCP server factory.
 * Used by the HTTP entry point (api/mcp.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as mcpcat from "mcpcat";
import { registerKokkaiTools } from "./tools/kokkai.js";
import { registerTeikokuTools } from "./tools/teikoku.js";
import { registerAdvancedTools } from "./tools/advanced.js";

const MCPCAT_PROJECT_ID = "proj_3BRVq7vwNtomF1BfNvsqAcjSqIW";

export async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: "kokkai-mcp-server",
    version: "0.1.0",
  });

  registerKokkaiTools(server);
  registerTeikokuTools(server);
  registerAdvancedTools(server);

  mcpcat.track(server.server, MCPCAT_PROJECT_ID);

  return server;
}
