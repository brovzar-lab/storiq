/**
 * AI API client utilities for Anthropic and Google
 */

import { fetchWithTimeout, API_TIMEOUTS, TimeoutDuration } from "./timeout";
import { AIProvider } from "./provider";

export const API_URLS = {
  ANTHROPIC: "https://api.anthropic.com/v1/messages",
  GOOGLE:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
} as const;

export const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
export const ANTHROPIC_VERSION = "2023-06-01";

export interface AICallOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: TimeoutDuration;
}

const DEFAULT_OPTIONS: Required<AICallOptions> = {
  maxTokens: 4096,
  temperature: 0.3,
  timeout: API_TIMEOUTS.STANDARD,
};

/**
 * Call Anthropic Claude API
 */
export async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options: AICallOptions = {}
): Promise<string> {
  const { maxTokens, temperature, timeout } = { ...DEFAULT_OPTIONS, ...options };

  const response = await fetchWithTimeout(
    API_URLS.ANTHROPIC,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    },
    timeout
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API request failed");
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

/**
 * Call Google Gemini API
 */
export async function callGoogle(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options: AICallOptions = {}
): Promise<string> {
  const { maxTokens, temperature, timeout } = { ...DEFAULT_OPTIONS, ...options };

  const response = await fetchWithTimeout(
    `${API_URLS.GOOGLE}?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    },
    timeout
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google API request failed");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Call AI API based on provider
 */
export async function callAI(
  apiKey: string,
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string,
  options: AICallOptions = {}
): Promise<string> {
  if (provider === "google") {
    return callGoogle(apiKey, systemPrompt, userPrompt, options);
  }
  return callAnthropic(apiKey, systemPrompt, userPrompt, options);
}
