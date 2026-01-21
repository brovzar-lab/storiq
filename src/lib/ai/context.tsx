"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AIProvider, AIMessage, AICompletion, AIStreamChunk, AICompletionOptions } from "./types";
import { createAnthropicProvider } from "./providers/anthropic";

interface AIContextValue {
  // Provider state
  provider: AIProvider | null;
  isConfigured: boolean;
  isValidating: boolean;
  providerName: string;

  // Configuration
  setApiKey: (key: string) => Promise<boolean>;
  clearApiKey: () => void;

  // AI Operations
  complete: (messages: AIMessage[], options?: AICompletionOptions) => Promise<AICompletion>;
  stream: (
    messages: AIMessage[],
    options?: AICompletionOptions
  ) => AsyncGenerator<AIStreamChunk, void, unknown>;
}

const AIContext = createContext<AIContextValue | null>(null);

const STORAGE_KEY = "storiq-ai-config";

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load saved API key on mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { apiKey, providerType } = JSON.parse(saved);
          if (apiKey && providerType === "anthropic") {
            const newProvider = createAnthropicProvider(apiKey);
            setProvider(newProvider);
          }
        }
      } catch (error) {
        console.error("Failed to load AI config:", error);
      }
    };

    loadSavedConfig();
  }, []);

  const setApiKey = useCallback(async (key: string): Promise<boolean> => {
    setIsValidating(true);

    try {
      const newProvider = createAnthropicProvider(key);
      const isValid = await newProvider.validateConfig();

      if (isValid) {
        setProvider(newProvider);
        // Save to localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ apiKey: key, providerType: "anthropic" })
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("API key validation failed:", error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    setProvider(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const complete = useCallback(
    async (messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletion> => {
      if (!provider) {
        throw new Error("AI provider not configured. Please add your API key in settings.");
      }
      return provider.complete(messages, options);
    },
    [provider]
  );

  const stream = useCallback(
    function* (
      messages: AIMessage[],
      options?: AICompletionOptions
    ): Generator<Promise<AsyncGenerator<AIStreamChunk, void, unknown>>, void, unknown> {
      if (!provider) {
        throw new Error("AI provider not configured. Please add your API key in settings.");
      }
      yield Promise.resolve(provider.stream(messages, options));
    },
    [provider]
  );

  // Create a proper async generator wrapper
  const streamWrapper = useCallback(
    (messages: AIMessage[], options?: AICompletionOptions) => {
      if (!provider) {
        throw new Error("AI provider not configured. Please add your API key in settings.");
      }
      return provider.stream(messages, options);
    },
    [provider]
  );

  const value: AIContextValue = {
    provider,
    isConfigured: provider?.isConfigured ?? false,
    isValidating,
    providerName: provider?.name ?? "Not configured",
    setApiKey,
    clearApiKey,
    complete,
    stream: streamWrapper,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}
