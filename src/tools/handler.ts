/**
 * Shared error handling wrapper for tool handlers.
 */

/**
 * Wraps an async function with try/catch, returning structured MCP error on failure.
 * Logs tool name, duration, and success/error status to Vercel Logs.
 */
export function handleToolCall<T>(
  toolName: string,
  fn: (params: T) => Promise<unknown>,
): (params: T) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  return async (params: T) => {
    const start = Date.now();
    try {
      const data = await fn(params);
      console.log(JSON.stringify({ tool: toolName, durationMs: Date.now() - start, isError: false }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(JSON.stringify({ tool: toolName, durationMs: Date.now() - start, isError: true, error: message }));
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  };
}
