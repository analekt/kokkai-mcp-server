/**
 * Apify Actor Standby entry point for the MCP server (Streamable HTTP transport).
 *
 * Runs as a persistent HTTP server on the port provided by the Apify platform
 * (ACTOR_WEB_SERVER_PORT env var). Stateless: each request creates a fresh
 * server + transport pair, matching the same model used on Vercel.
 */

import http from "http";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../src/server.js";

const PORT = Number(process.env.ACTOR_WEB_SERVER_PORT ?? 4000);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") ?? [];

function getCorsHeaders(origin: string): Record<string, string> {
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || "*"
      : "";

  if (!allowOrigin) return {};

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, mcp-session-id, mcp-protocol-version",
    ...(allowOrigin !== "*" ? { Vary: "Origin" } : {}),
  };
}

/**
 * Convert a Node.js IncomingMessage to a Web Standard Request.
 */
async function toWebRequest(
  req: http.IncomingMessage,
  body: Buffer,
): Promise<Request> {
  const protocol = "https";
  const host = req.headers.host ?? "localhost";
  const url = `${protocol}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  return new Request(url, {
    method: req.method ?? "GET",
    headers,
    body: body.length > 0 ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer : undefined,
  });
}

/**
 * Write a Web Standard Response back to the Node.js ServerResponse.
 */
async function writeWebResponse(
  res: http.ServerResponse,
  webRes: Response,
  extraHeaders: Record<string, string>,
): Promise<void> {
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.statusCode = webRes.status;

  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

const httpServer = http.createServer(async (req, res) => {
  const start = Date.now();
  const origin = (req.headers.origin as string) ?? "";
  const corsHeaders = getCorsHeaders(origin);

  // Readiness probe from Apify platform
  const isReadinessProbe =
    req.headers["x-apify-container-server-readiness-probe"] !== undefined;
  if (isReadinessProbe || (req.method === "GET" && req.url === "/")) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Collect request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  const webReq = await toWebRequest(req, body);

  const mcpServer = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  await mcpServer.connect(transport);
  const webRes = await transport.handleRequest(webReq);

  await writeWebResponse(res, webRes, corsHeaders);

  console.log(
    JSON.stringify({
      method: req.method,
      url: req.url,
      status: webRes.status,
      durationMs: Date.now() - start,
    }),
  );
});

httpServer.listen(PORT, () => {
  console.log(JSON.stringify({ event: "listening", port: PORT }));
});
