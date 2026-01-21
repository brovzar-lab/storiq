/**
 * AI Provider Abstraction Types
 * Supports multiple AI providers (Anthropic Claude, OpenAI GPT-4, etc.)
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface AICompletion {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Common interface for all AI providers
 */
export interface AIProvider {
  name: string;
  isConfigured: boolean;

  /**
   * Check if the provider is properly configured with valid credentials
   */
  validateConfig(): Promise<boolean>;

  /**
   * Generate a completion (non-streaming)
   */
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletion>;

  /**
   * Generate a streaming completion
   */
  stream(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>;
}

/**
 * Analysis-specific types
 */

export type AnalysisCategory = "structure" | "character" | "craft" | "logic" | "genre";

export type AnalysisSeverity = "critical" | "important" | "suggestion";

export interface AnalysisIssue {
  id: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  title: string;
  description: string;
  location?: {
    sequenceId?: string;
    sceneNumbers?: number[];
    pageRange?: string;
  };
  suggestion?: string;
  relatedTo?: string[]; // IDs of related issues
}

export interface AnalysisStrength {
  id: string;
  category: AnalysisCategory;
  title: string;
  description: string;
  evidence?: string; // Quote or reference from screenplay
}

export interface SequenceAnalysis {
  sequenceId: string;
  sequenceName: string;
  overallHealth: number; // 0-100
  categoryScores: Record<AnalysisCategory, number>;
  issues: AnalysisIssue[];
  strengths: AnalysisStrength[];
}

export interface UnifiedAnalysis {
  screenplayId: string;
  analyzedAt: string;
  overallScore: number;
  categoryScores: Record<AnalysisCategory, number>;
  sequences: SequenceAnalysis[];
  globalIssues: AnalysisIssue[]; // Issues that span multiple sequences
  globalStrengths: AnalysisStrength[];
}

/**
 * Prompt building types
 */

export interface PromptContext {
  screenplay: {
    title: string;
    totalPages: number;
    totalScenes: number;
    totalCharacters: number;
  };
  genre: {
    id: string;
    name: string;
    systemPrompt: string;
  };
  soul: {
    centralQuestion: string;
    thematicArgument: string;
    controllingIdea: string;
    protagonistLie: string;
    protagonistTruth: string;
  };
  currentSequence?: {
    id: string;
    name: string;
    summary: string;
    scenes: string;
  };
}
