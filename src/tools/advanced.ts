/**
 * Advanced tools: 横断検索, 件数カウント, 横断カウント, 全件取得.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  searchMeetings,
  searchSpeeches,
  countResults,
  getAllMeetings,
  sleep,
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
    handleToolCall("search_all_meetings", async (params) => {
      const kokkai = await searchMeetings("kokkai", params).catch((e: Error) => ({ error: e.message, system: "kokkai" as const }));
      await sleep(1000);
      const teikoku = await searchMeetings("teikoku", params).catch((e: Error) => ({ error: e.message, system: "teikoku" as const }));
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
    handleToolCall("search_all_speeches", async (params) => {
      const kokkai = await searchSpeeches("kokkai", params).catch((e: Error) => ({ error: e.message, system: "kokkai" as const }));
      await sleep(1000);
      const teikoku = await searchSpeeches("teikoku", params).catch((e: Error) => ({ error: e.message, system: "teikoku" as const }));
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
    handleToolCall("count_kokkai", async (params) => {
      const { target, ...searchParams } = params;
      return countResults("kokkai", targetToEndpoint(target), searchParams);
    }),
  );

  server.tool(
    "count_teikoku",
    "帝国議会の検索結果件数を取得します。実際のデータは返さず件数のみ返します。",
    countSchema.shape,
    handleToolCall("count_teikoku", async (params) => {
      const { target, ...searchParams } = params;
      return countResults("teikoku", targetToEndpoint(target), searchParams);
    }),
  );

  server.tool(
    "count_all",
    "国会と帝国議会の両方の検索結果件数を横断で取得します。戦前から現在までの合計件数を調べたいときに使います。",
    countSchema.shape,
    handleToolCall("count_all", async (params) => {
      const { target, ...searchParams } = params;
      const endpoint = targetToEndpoint(target);

      const kokkai = await countResults("kokkai", endpoint, searchParams).catch((e: Error) => ({
        system: "kokkai" as const,
        endpoint,
        error: e.message,
      }));
      await sleep(1000);
      const teikoku = await countResults("teikoku", endpoint, searchParams).catch((e: Error) => ({
        system: "teikoku" as const,
        endpoint,
        error: e.message,
      }));

      const kokkaiCount = "numberOfRecords" in kokkai ? kokkai.numberOfRecords : null;
      const teikokuCount = "numberOfRecords" in teikoku ? teikoku.numberOfRecords : null;
      const hasErrors = hasError(kokkai) || hasError(teikoku);

      // `total` is the verified sum of both systems; null when either failed.
      // `partialTotal` provides the available count when one system errored.
      const availableCount = (kokkaiCount ?? 0) + (teikokuCount ?? 0);
      return {
        kokkai,
        teikoku,
        total: !hasErrors ? availableCount : null,
        partialTotal: hasErrors && (kokkaiCount !== null || teikokuCount !== null)
          ? availableCount
          : null,
        hasErrors,
      };
    }),
  );

  // ---- 全件取得 ----
  // Uses meeting_list endpoint which returns meeting metadata only (no speech
  // body text), so response size is bounded even at 1,000 records.

  server.tool(
    "get_all_kokkai_meetings",
    "国会の会議録を全件取得します。1秒間隔でページネーションを行い、最大1,000件まで取得します。件数が多い場合は時間がかかります。",
    getAllMeetingsSchema.shape,
    handleToolCall("get_all_kokkai_meetings", (params) => getAllMeetings("kokkai", params)),
  );

  server.tool(
    "get_all_teikoku_meetings",
    "帝国議会の会議録を全件取得します。1秒間隔でページネーションを行い、最大1,000件まで取得します。件数が多い場合は時間がかかります。",
    getAllTeikokuMeetingsSchema.shape,
    handleToolCall("get_all_teikoku_meetings", (params) => getAllMeetings("teikoku", params)),
  );
}
