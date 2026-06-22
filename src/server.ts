/**
 * Shared MCP server factory.
 * Used by the HTTP entry point (api/mcp.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerKokkaiTools } from "./tools/kokkai.js";
import { registerTeikokuTools } from "./tools/teikoku.js";
import { registerAdvancedTools } from "./tools/advanced.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "kokkai-mcp-server",
      version: "0.1.0",
    },
    {
      // Recommended workflow lives here (not duplicated across tool descriptions)
      // so clients receive it once via the MCP initialize result.
      instructions: [
        "国会・帝国議会の会議録を検索・取得するためのサーバーです。",
        "発言本文は1件あたりのデータ量が大きく、大量に取得するとコンテキストを圧迫します。次の段階的な手順を推奨します:",
        "1. まず count_kokkai / count_teikoku / count_all で件数を把握する。",
        "2. 件数が多い場合は search_*_meetings（本文なしのメタデータ）で会議を絞り込む。",
        "3. 必要な会議のみ get_*_meeting で全発言本文を取得する。",
        "4. 特定の発言だけ読みたい場合は、search_*_speeches で見つけた speechID を get_*_speech に渡してピンポイントで取得する。",
        "戦前から現在までを横断的に調べたいときは search_all_meetings / search_all_speeches / count_all を使う。",
      ].join("\n"),
    },
  );

  registerKokkaiTools(server);
  registerTeikokuTools(server);
  registerAdvancedTools(server);

  return server;
}
