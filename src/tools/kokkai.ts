/**
 * 国会（National Diet）API tools.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchMeetings, getMeeting, searchSpeeches } from "../client.js";
import {
  kokkaiMeetingListSchema,
  kokkaiMeetingSchema,
  kokkaiSpeechSchema,
} from "./schemas.js";
import { handleToolCall } from "./handler.js";

export function registerKokkaiTools(server: McpServer): void {
  server.tool(
    "search_kokkai_meetings",
    "国会の会議録を検索します。本文は含まれません。会議の一覧や概要を調べたいときに使います。",
    kokkaiMeetingListSchema.shape,
    handleToolCall((params) => searchMeetings("kokkai", params)),
  );

  server.tool(
    "get_kokkai_meeting",
    "国会の会議録を取得します。全発言の本文テキストを含みます。特定の会議の詳細を読みたいときに使います。",
    kokkaiMeetingSchema.shape,
    handleToolCall((params) => getMeeting("kokkai", params)),
  );

  server.tool(
    "search_kokkai_speeches",
    "国会の発言を検索します。ヒットした発言の本文テキストと会議録情報を返します。",
    kokkaiSpeechSchema.shape,
    handleToolCall((params) => searchSpeeches("kokkai", params)),
  );
}
