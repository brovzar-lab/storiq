/**
 * Timeout utility for API calls using AbortController
 */

export const API_TIMEOUTS = {
  QUICK: 15000,      // 15s - simple calls (analyze-soul, check-config)
  STANDARD: 30000,   // 30s - most analysis (antagonist, sequences)
  LONG: 45000,       // 45s - heavy analysis (character-arc, emotional, theme)
} as const;

export type TimeoutDuration = typeof API_TIMEOUTS[keyof typeof API_TIMEOUTS];

/**
 * Wrap a fetch call with a timeout using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUTS.STANDARD
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Request timeout after ${Math.round(timeoutMs / 1000)}s. The AI service may be busy - please try again.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
