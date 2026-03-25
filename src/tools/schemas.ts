/**
 * Shared Zod schemas for tool parameters.
 * Both APIs share most parameters; differences are handled per-system.
 */

import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/** Common search parameters shared by both APIs */
const commonSearchFields = {
  startRecord: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("開始位置（デフォルト: 1）"),
  nameOfHouse: z
    .string()
    .optional()
    .describe("院名"),
  nameOfMeeting: z
    .string()
    .optional()
    .describe("会議名（スペース区切りでOR検索）"),
  any: z
    .string()
    .optional()
    .describe("検索語（スペース区切りでAND検索）"),
  speaker: z
    .string()
    .optional()
    .describe("発言者名（スペース区切りでOR検索）"),
  from: z
    .string()
    .regex(datePattern, "YYYY-MM-DD形式で入力してください")
    .optional()
    .describe("開会日付の始点（YYYY-MM-DD）"),
  until: z
    .string()
    .regex(datePattern, "YYYY-MM-DD形式で入力してください")
    .optional()
    .describe("開会日付の終点（YYYY-MM-DD）"),
  supplementAndAppendix: z
    .boolean()
    .optional()
    .describe("追録・附録を検索対象に含める（デフォルト: false）"),
  contentsAndIndex: z
    .boolean()
    .optional()
    .describe("目次・索引を検索対象に含める（デフォルト: false）"),
  searchRange: z
    .enum(["冒頭", "本文", "冒頭・本文"])
    .optional()
    .describe("検索範囲（デフォルト: 冒頭・本文）"),
  speechNumber: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("発言番号（完全一致）"),
  speakerPosition: z
    .string()
    .optional()
    .describe("発言者肩書き"),
  speakerGroup: z
    .string()
    .optional()
    .describe("発言者所属会派"),
  speechID: z
    .string()
    .optional()
    .describe("発言ID（完全一致）"),
  issueID: z
    .string()
    .optional()
    .describe("会議録ID（完全一致）"),
  sessionFrom: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("回次From"),
  sessionTo: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("回次To"),
  issueFrom: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("号数From"),
  issueTo: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("号数To"),
} as const;

/** maximumRecords for meeting_list and speech (max 100) */
const maxRecords100 = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe("最大取得件数（1〜100、デフォルト: 30）");

/** maximumRecords for meeting (max 10) */
const maxRecords10 = z
  .number()
  .int()
  .min(1)
  .max(10)
  .optional()
  .describe("最大取得件数（1〜10、デフォルト: 3）");

// ---- 国会 schemas ----

const kokkaiExtra = {
  closing: z
    .boolean()
    .optional()
    .describe("閉会中の会議を検索対象に含める（デフォルト: false）"),
  speakerRole: z
    .enum(["証人", "参考人", "公述人"])
    .optional()
    .describe("発言者役割"),
};

export const kokkaiMeetingListSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
  ...kokkaiExtra,
});

export const kokkaiMeetingSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords10,
  ...kokkaiExtra,
});

export const kokkaiSpeechSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
  ...kokkaiExtra,
});

// ---- 帝国議会 schemas ----

const teikokuExtra = {
  speakerElection: z
    .string()
    .optional()
    .describe("発言者選出"),
};

export const teikokuMeetingListSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
  ...teikokuExtra,
});

export const teikokuMeetingSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords10,
  ...teikokuExtra,
});

export const teikokuSpeechSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
  ...teikokuExtra,
});

// ---- 横断検索 schemas ----

export const crossSearchMeetingListSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
});

export const crossSearchSpeechSchema = z.object({
  ...commonSearchFields,
  maximumRecords: maxRecords100,
});

// ---- カウント schemas ----

const countTarget = z
  .enum(["meetings", "speeches"])
  .describe("カウント対象（meetings: 会議、speeches: 発言）");

export const countSchema = z.object({
  ...commonSearchFields,
  target: countTarget,
});

// ---- 全件取得 schemas (maximumRecords不要) ----

export const getAllMeetingsSchema = z.object({
  ...commonSearchFields,
  ...kokkaiExtra,
});

export const getAllTeikokuMeetingsSchema = z.object({
  ...commonSearchFields,
  ...teikokuExtra,
});
