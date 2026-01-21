/**
 * Anthropic Claude AI Provider
 */

import type {
  AIProvider,
  AIProviderConfig,
  AIMessage,
  AICompletionOptions,
  AICompletion,
  AIStreamChunk,
} from "../types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic Claude";
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      ...config,
      model: config.model || DEFAULT_MODEL,
    };
  }

  get isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.startsWith("sk-ant-");
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      // Make a minimal API call to validate the key
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletion> {
    const { systemPrompt, temperature = 0.7, maxTokens = 4096 } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Combine system prompts
    const systemMessage = [
      messages.find((m) => m.role === "system")?.content,
      systemPrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage || undefined,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API request failed");
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || "",
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  async *stream(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const { systemPrompt, temperature = 0.7, maxTokens = 4096 } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Combine system prompts
    const systemMessage = [
      messages.find((m) => m.role === "system")?.content,
      systemPrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        system: systemMessage || undefined,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API request failed");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: "", done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") {
              yield { content: "", done: true };
              return;
            }

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === "content_block_delta" && data.delta?.text) {
                yield { content: data.delta.text, done: false };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(apiKey: string, model?: string): AnthropicProvider {
  return new AnthropicProvider({ apiKey, model });
}
