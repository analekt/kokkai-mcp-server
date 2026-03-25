/**
 * Shared types for 国会 (National Diet) and 帝国議会 (Imperial Diet) APIs.
 */

export type ApiSystem = "kokkai" | "teikoku";

export type EndpointType = "meeting_list" | "meeting" | "speech";

export const BASE_URLS: Record<ApiSystem, string> = {
  kokkai: "https://kokkai.ndl.go.jp/api",
  teikoku: "https://teikokugikai-i.ndl.go.jp/api/emp",
} as const;

/** Houses available per system */
export const HOUSES: Record<ApiSystem, readonly string[]> = {
  kokkai: ["衆議院", "参議院", "両院", "両院協議会"],
  teikoku: ["衆議院", "貴族院", "両院", "両院協議会"],
} as const;

/** Common search parameters shared by both APIs */
export interface CommonSearchParams {
  readonly startRecord?: number;
  readonly maximumRecords?: number;
  readonly nameOfHouse?: string;
  readonly nameOfMeeting?: string;
  readonly any?: string;
  readonly speaker?: string;
  readonly from?: string;
  readonly until?: string;
  readonly supplementAndAppendix?: boolean;
  readonly contentsAndIndex?: boolean;
  readonly searchRange?: string;
  readonly speechNumber?: number;
  readonly speakerPosition?: string;
  readonly speakerGroup?: string;
  readonly speechID?: string;
  readonly issueID?: string;
  readonly sessionFrom?: number;
  readonly sessionTo?: number;
  readonly issueFrom?: number;
  readonly issueTo?: number;
}

/** 国会 API has additional parameters */
export interface KokkaiSearchParams extends CommonSearchParams {
  readonly closing?: boolean;
  readonly speakerRole?: string;
}

/** 帝国議会 API has additional parameters */
export interface TeikokuSearchParams extends CommonSearchParams {
  readonly speakerElection?: string;
}

/** Pagination metadata in API responses */
export interface PaginationInfo {
  readonly numberOfRecords: number;
  readonly numberOfReturn: number;
  readonly startRecord: number;
  readonly nextRecordPosition?: number;
}

/** Speech record from meeting endpoint */
export interface SpeechRecord {
  readonly speechID: string;
  readonly speechOrder: number;
  readonly speaker: string;
  readonly speakerYomi?: string;
  readonly speakerGroup?: string;
  readonly speakerPosition?: string;
  readonly speakerRole?: string;
  readonly speakerElection?: string;
  readonly officeTerm?: string;
  readonly speech?: string;
  readonly startPage?: number;
  readonly createTime?: string;
  readonly updateTime?: string;
  readonly speechURL: string;
}

/** Meeting record */
export interface MeetingRecord {
  readonly issueID: string;
  readonly imageKind: string;
  readonly searchObject: string;
  readonly session: number;
  readonly nameOfHouse: string;
  readonly nameOfMeeting: string;
  readonly issue: string;
  readonly date: string;
  readonly closing?: string;
  readonly speechRecord: readonly SpeechRecord[];
  readonly meetingURL: string;
  readonly pdfURL?: string;
}

/** Response for meeting_list and meeting endpoints */
export interface MeetingResponse extends PaginationInfo {
  readonly meetingRecord: readonly MeetingRecord[];
}

/** Speech record with meeting info (from speech endpoint) */
export interface SpeechWithMeetingInfo extends SpeechRecord {
  readonly issueID: string;
  readonly imageKind: string;
  readonly searchObject: string;
  readonly session: number;
  readonly nameOfHouse: string;
  readonly nameOfMeeting: string;
  readonly issue: string;
  readonly date: string;
  readonly closing?: string;
  readonly meetingURL: string;
  readonly pdfURL?: string;
}

/** Response for speech endpoint */
export interface SpeechResponse extends PaginationInfo {
  readonly speechRecord: readonly SpeechWithMeetingInfo[];
}

/** Error response */
export interface ErrorResponse {
  readonly message: string;
  readonly details?: readonly string[];
}
