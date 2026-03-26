/**
 * 帝国議会（Imperial Diet）API tools.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchMeetings, getMeeting, searchSpeeches } from "../client.js";
import {
  teikokuMeetingListSchema,
  teikokuMeetingSchema,
  teikokuSpeechSchema,
} from "./schemas.js";
import { handleToolCall } from "./handler.js";

export function registerTeikokuTools(server: McpServer): void {
  server.tool(
    "search_teikoku_meetings",
    "帝国議会の会議録を検索します。本文は含まれません。戦前の会議の一覧や概要を調べたいときに使います。",
    teikokuMeetingListSchema.shape,
    handleToolCall("search_teikoku_meetings", (params) => searchMeetings("teikoku", params)),
  );

  server.tool(
    "get_teikoku_meeting",
    "帝国議会の会議録を取得します。全発言の本文テキストを含みます。戦前の特定の会議の詳細を読みたいときに使います。",
    teikokuMeetingSchema.shape,
    handleToolCall("get_teikoku_meeting", (params) => getMeeting("teikoku", params)),
  );

  server.tool(
    "search_teikoku_speeches",
    "帝国議会の発言を検索します。ヒットした発言の本文テキストと会議録情報を返します。戦前の議会発言を調べたいときに使います。",
    teikokuSpeechSchema.shape,
    handleToolCall("search_teikoku_speeches", (params) => searchSpeeches("teikoku", params)),
  );
}
