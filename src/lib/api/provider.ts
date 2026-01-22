/**
 * AI Provider detection and configuration utilities
 */

export type AIProvider = "anthropic" | "google";

export interface ProviderConfig {
  apiKey: string;
  provider: AIProvider;
}

/**
 * Resolve API provider from request body or environment variables
 * Priority: request body > environment variables > auto-detect from key
 */
export function resolveProvider(
  bodyApiKey?: string,
  bodyProvider?: AIProvider
): ProviderConfig | null {
  let apiKey = bodyApiKey;
  let provider = bodyProvider;

  // Fall back to environment variables if no key provided
  if (!apiKey) {
    const anthropicKey = process.env.STORIQ_ANTHROPIC_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;
    const defaultProvider = process.env.AI_PROVIDER;

    if (defaultProvider === "google" && googleKey) {
      apiKey = googleKey;
      provider = "google";
    } else if (anthropicKey) {
      apiKey = anthropicKey;
      provider = "anthropic";
    } else if (googleKey) {
      apiKey = googleKey;
      provider = "google";
    }
  }

  // Auto-detect provider from key format if not specified
  if (apiKey && !provider) {
    if (apiKey.startsWith("sk-ant-")) {
      provider = "anthropic";
    } else if (apiKey.startsWith("AIza")) {
      provider = "google";
    }
  }

  if (!apiKey || !provider) {
    return null;
  }

  return { apiKey, provider };
}

/**
 * Error message for missing API configuration
 */
export const NO_API_KEY_ERROR =
  "No API key configured. Add STORIQ_ANTHROPIC_KEY or GOOGLE_API_KEY to your .env.local file, or configure in Settings.";
