/**
 * Shared MCP server factory.
 * Used by the HTTP entry point (api/mcp.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerKokkaiTools } from "./tools/kokkai.js";
import { registerTeikokuTools } from "./tools/teikoku.js";
import { registerAdvancedTools } from "./tools/advanced.js";

const MCPCAT_PROJECT_ID = "proj_3BRVq7vwNtomF1BfNvsqAcjSqIW";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kokkai-mcp-server",
    version: "0.1.0",
  });

  registerKokkaiTools(server);
  registerTeikokuTools(server);
  registerAdvancedTools(server);

  // mcpcat tracking — wrapped in try/catch to prevent startup failures
  try {
    import("mcpcat").then((mcpcat) => {
      mcpcat.track(server.server, MCPCAT_PROJECT_ID);
    }).catch(() => {
      // mcpcat unavailable, skip analytics
    });
  } catch {
    // mcpcat unavailable, skip analytics
  }

  return server;
}
