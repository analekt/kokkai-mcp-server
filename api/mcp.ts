/**
 * Vercel Function endpoint for the MCP server (Streamable HTTP transport).
 *
 * Stateless mode: each request creates a fresh server + transport pair.
 * This is compatible with Vercel's serverless model where there is no
 * persistent in-memory state between requests.
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../src/server.js";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") ?? [];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";

  // If ALLOWED_ORIGINS is configured, restrict to those origins.
  // If not configured (empty), allow all origins for public access.
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || "*"
      : "";

  if (!allowOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, mcp-session-id, mcp-protocol-version",
    ...(allowOrigin !== "*" ? { Vary: "Origin" } : {}),
  };
}

async function handler(request: Request): Promise<Response> {
  const start = Date.now();
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  console.log(JSON.stringify({
    method: request.method,
    status: response.status,
    durationMs: Date.now() - start,
  }));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
