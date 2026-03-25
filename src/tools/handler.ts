/**
 * Shared error handling wrapper for tool handlers.
 */

/**
 * Wraps an async function with try/catch, returning structured MCP error on failure.
 */
export function handleToolCall<T>(
  fn: (params: T) => Promise<unknown>,
): (params: T) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  return async (params: T) => {
    try {
      const data = await fn(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  };
}
