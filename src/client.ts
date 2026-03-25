/**
 * Shared HTTP client for 国会/帝国議会 APIs.
 * Handles URL construction, fetching, and pagination.
 */

import {
  type ApiSystem,
  type EndpointType,
  BASE_URLS,
  type MeetingResponse,
  type SpeechResponse,
  type ErrorResponse,
} from "./types.js";

const DELAY_MS = 1000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_PAGES = 25;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a URL from system, endpoint, and params.
 * Always requests JSON format.
 */
function buildUrl(
  system: ApiSystem,
  endpoint: EndpointType,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const base = `${BASE_URLS[system]}/${endpoint}`;
  const searchParams = new URLSearchParams();
  searchParams.set("recordPacking", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  return `${base}?${searchParams.toString()}`;
}

/**
 * Determine if a parsed JSON response is an NDL API error envelope.
 * Error responses contain `message` and optionally `details`,
 * but never contain `meetingRecord`, `speechRecord`, or `numberOfRecords`.
 */
function isErrorResponse(data: unknown): data is ErrorResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.message === "string" &&
    obj.meetingRecord === undefined &&
    obj.speechRecord === undefined &&
    obj.numberOfRecords === undefined
  );
}

/**
 * Fetch JSON from the API with timeout.
 * Returns parsed response or throws on HTTP/network/API error.
 */
async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();

    if (isErrorResponse(data)) {
      const details = data.details ? `\n${data.details.join("\n")}` : "";
      throw new Error(`API Error: ${data.message}${details}`);
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Search meetings (meeting_list endpoint).
 */
export async function searchMeetings(
  system: ApiSystem,
  params: Record<string, string | number | boolean | undefined>,
): Promise<MeetingResponse> {
  const url = buildUrl(system, "meeting_list", params);
  return fetchJson<MeetingResponse>(url);
}

/**
 * Get meeting details (meeting endpoint).
 */
export async function getMeeting(
  system: ApiSystem,
  params: Record<string, string | number | boolean | undefined>,
): Promise<MeetingResponse> {
  const url = buildUrl(system, "meeting", params);
  return fetchJson<MeetingResponse>(url);
}

/**
 * Search speeches (speech endpoint).
 */
export async function searchSpeeches(
  system: ApiSystem,
  params: Record<string, string | number | boolean | undefined>,
): Promise<SpeechResponse> {
  const url = buildUrl(system, "speech", params);
  return fetchJson<SpeechResponse>(url);
}

/**
 * Count results by fetching 1 record and returning numberOfRecords.
 */
export async function countResults(
  system: ApiSystem,
  endpoint: EndpointType,
  params: Record<string, string | number | boolean | undefined>,
): Promise<{ system: ApiSystem; endpoint: EndpointType; numberOfRecords: number }> {
  const countParams = { ...params, maximumRecords: 1 };
  const url = buildUrl(system, endpoint, countParams);
  const data = await fetchJson<MeetingResponse | SpeechResponse>(url);
  return {
    system,
    endpoint,
    numberOfRecords: data.numberOfRecords,
  };
}

/**
 * Fetch all meeting_list results with pagination.
 * Waits DELAY_MS between subsequent requests to respect NDL rate limits.
 * Capped at MAX_PAGES (25 pages = 2,500 records) to prevent unbounded loops.
 * Returns a `truncated` flag when results exceed the cap.
 */
export async function getAllMeetings(
  system: ApiSystem,
  params: Record<string, string | number | boolean | undefined>,
): Promise<MeetingResponse & { truncated: boolean }> {
  const allRecords: MeetingResponse["meetingRecord"][number][] = [];
  let startRecord = 1;
  let totalRecords = 0;
  const pageSize = 100;
  let pageCount = 0;
  let truncated = false;

  while (true) {
    const pageParams = {
      ...params,
      startRecord,
      maximumRecords: pageSize,
    };

    if (pageCount > 0) {
      await sleep(DELAY_MS);
    }
    pageCount++;

    const page = await searchMeetings(system, pageParams);
    totalRecords = page.numberOfRecords;

    if (!page.meetingRecord || page.meetingRecord.length === 0) {
      break;
    }

    allRecords.push(...page.meetingRecord);

    if (!page.nextRecordPosition || allRecords.length >= totalRecords) {
      break;
    }

    if (pageCount >= MAX_PAGES) {
      truncated = true;
      break;
    }

    startRecord = page.nextRecordPosition;
  }

  return {
    numberOfRecords: totalRecords,
    numberOfReturn: allRecords.length,
    startRecord: 1,
    meetingRecord: allRecords,
    truncated,
  };
}
