/**
 * Advanced tools: 横断検索, 件数カウント, 横断カウント, 全件取得.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  searchMeetings,
  searchSpeeches,
  countResults,
  getAllMeetings,
} from "../client.js";
import type { EndpointType } from "../types.js";
import {
  crossSearchMeetingListSchema,
  crossSearchSpeechSchema,
  countSchema,
  getAllMeetingsSchema,
  getAllTeikokuMeetingsSchema,
} from "./schemas.js";
import { handleToolCall } from "./handler.js";

function targetToEndpoint(target: string): EndpointType {
  return target === "meetings" ? "meeting_list" : "speech";
}

function hasError(result: unknown): boolean {
  return typeof result === "object" && result !== null && "error" in result;
}

export function registerAdvancedTools(server: McpServer): void {
  // ---- 横断検索 ----

  server.tool(
    "search_all_meetings",
    "国会と帝国議会の両方から会議録を横断検索します。戦前から現在までの会議を一度に調べたいときに使います。国会固有のパラメータ（closing, speakerRole）や帝国議会固有のパラメータ（speakerElection）は使用できません。",
    crossSearchMeetingListSchema.shape,
    handleToolCall(async (params) => {
      const [kokkai, teikoku] = await Promise.all([
        searchMeetings("kokkai", params).catch((e: Error) => ({ error: e.message, system: "kokkai" as const })),
        searchMeetings("teikoku", params).catch((e: Error) => ({ error: e.message, system: "teikoku" as const })),
      ]);
      return {
        kokkai,
        teikoku,
        hasErrors: hasError(kokkai) || hasError(teikoku),
      };
    }),
  );

  server.tool(
    "search_all_speeches",
    "国会と帝国議会の両方から発言を横断検索します。戦前から現在までの発言を一度に調べたいときに使います。国会固有のパラメータ（closing, speakerRole）や帝国議会固有のパラメータ（speakerElection）は使用できません。",
    crossSearchSpeechSchema.shape,
    handleToolCall(async (params) => {
      const [kokkai, teikoku] = await Promise.all([
        searchSpeeches("kokkai", params).catch((e: Error) => ({ error: e.message, system: "kokkai" as const })),
        searchSpeeches("teikoku", params).catch((e: Error) => ({ error: e.message, system: "teikoku" as const })),
      ]);
      return {
        kokkai,
        teikoku,
        hasErrors: hasError(kokkai) || hasError(teikoku),
      };
    }),
  );

  // ---- 件数カウント ----

  server.tool(
    "count_kokkai",
    "国会の検索結果件数を取得します。実際のデータは返さず件数のみ返します。",
    countSchema.shape,
    handleToolCall(async (params) => {
      const { target, ...searchParams } = params;
      return countResults("kokkai", targetToEndpoint(target), searchParams);
    }),
  );

  server.tool(
    "count_teikoku",
    "帝国議会の検索結果件数を取得します。実際のデータは返さず件数のみ返します。",
    countSchema.shape,
    handleToolCall(async (params) => {
      const { target, ...searchParams } = params;
      return countResults("teikoku", targetToEndpoint(target), searchParams);
    }),
  );

  server.tool(
    "count_all",
    "国会と帝国議会の両方の検索結果件数を横断で取得します。戦前から現在までの合計件数を調べたいときに使います。",
    countSchema.shape,
    handleToolCall(async (params) => {
      const { target, ...searchParams } = params;
      const endpoint = targetToEndpoint(target);

      const [kokkai, teikoku] = await Promise.all([
        countResults("kokkai", endpoint, searchParams).catch((e: Error) => ({
          system: "kokkai" as const,
          endpoint,
          error: e.message,
        })),
        countResults("teikoku", endpoint, searchParams).catch((e: Error) => ({
          system: "teikoku" as const,
          endpoint,
          error: e.message,
        })),
      ]);

      const kokkaiCount = "numberOfRecords" in kokkai ? kokkai.numberOfRecords : 0;
      const teikokuCount = "numberOfRecords" in teikoku ? teikoku.numberOfRecords : 0;
      const errors = hasError(kokkai) || hasError(teikoku);

      return {
        kokkai,
        teikoku,
        total: errors ? null : kokkaiCount + teikokuCount,
        hasErrors: errors,
      };
    }),
  );

  // ---- 全件取得 ----

  server.tool(
    "get_all_kokkai_meetings",
    "国会の会議録を全件取得します。1秒間隔でページネーションを行い、最大2,500件まで取得します。件数が多い場合は時間がかかります。",
    getAllMeetingsSchema.shape,
    handleToolCall((params) => getAllMeetings("kokkai", params)),
  );

  server.tool(
    "get_all_teikoku_meetings",
    "帝国議会の会議録を全件取得します。1秒間隔でページネーションを行い、最大2,500件まで取得します。件数が多い場合は時間がかかります。",
    getAllTeikokuMeetingsSchema.shape,
    handleToolCall((params) => getAllMeetings("teikoku", params)),
  );
}
