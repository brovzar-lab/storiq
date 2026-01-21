/**
 * Unified Analysis Engine
 * Orchestrates all analysis lenses and produces unified reports
 */

import type { ParsedScreenplay, Sequence, Soul, GenreId } from "@/types/screenplay";
import type { AIProvider, AIMessage, UnifiedAnalysis, SequenceAnalysis, AnalysisIssue, AnalysisStrength, AnalysisCategory } from "@/lib/ai/types";
import { buildAnalysisContext, buildAnalysisSystemPrompt, buildSequenceAnalysisPrompt } from "@/lib/context/builder";
import { summarizeAllSequences } from "@/lib/context/summarizer";

export interface AnalysisOptions {
  includeSequences?: string[]; // Specific sequence IDs to analyze, or all if not specified
  forceReanalyze?: boolean;
}

export interface AnalysisProgress {
  phase: "preparing" | "analyzing" | "synthesizing" | "complete";
  currentSequence?: string;
  totalSequences: number;
  completedSequences: number;
  message: string;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * Run unified analysis on a screenplay
 */
export async function runAnalysis(
  provider: AIProvider,
  screenplay: ParsedScreenplay,
  sequences: Sequence[],
  genreId: GenreId,
  soul: Soul,
  options: AnalysisOptions = {},
  onProgress?: ProgressCallback
): Promise<UnifiedAnalysis> {
  const sequencesToAnalyze = options.includeSequences
    ? sequences.filter((s) => options.includeSequences?.includes(s.id))
    : sequences;

  // Build context
  const context = buildAnalysisContext(screenplay, sequences, genreId, soul);
  const systemPrompt = buildAnalysisSystemPrompt(context);
  const sequenceSummaries = summarizeAllSequences(screenplay, sequences);

  onProgress?.({
    phase: "preparing",
    totalSequences: sequencesToAnalyze.length,
    completedSequences: 0,
    message: "Preparing analysis context...",
  });

  const sequenceAnalyses: SequenceAnalysis[] = [];

  // Analyze each sequence
  for (let i = 0; i < sequencesToAnalyze.length; i++) {
    const sequence = sequencesToAnalyze[i];

    onProgress?.({
      phase: "analyzing",
      currentSequence: sequence.name,
      totalSequences: sequencesToAnalyze.length,
      completedSequences: i,
      message: `Analyzing ${sequence.name}...`,
    });

    // Build sequence-specific context
    const sequenceContext = buildAnalysisContext(
      screenplay,
      sequences,
      genreId,
      soul,
      sequence.id
    );

    const prompt = buildSequenceAnalysisPrompt(sequenceContext, sequenceSummaries);

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    try {
      const response = await provider.complete(messages, {
        temperature: 0.7,
        maxTokens: 4000,
      });

      const analysis = parseSequenceAnalysis(sequence, response.content);
      sequenceAnalyses.push(analysis);
    } catch (error) {
      console.error(`Failed to analyze sequence ${sequence.name}:`, error);
      // Create placeholder analysis for failed sequences
      sequenceAnalyses.push(createPlaceholderAnalysis(sequence));
    }
  }

  onProgress?.({
    phase: "synthesizing",
    totalSequences: sequencesToAnalyze.length,
    completedSequences: sequencesToAnalyze.length,
    message: "Synthesizing overall analysis...",
  });

  // Synthesize global analysis
  const unifiedAnalysis = synthesizeAnalysis(
    screenplay.id,
    sequenceAnalyses,
    context
  );

  onProgress?.({
    phase: "complete",
    totalSequences: sequencesToAnalyze.length,
    completedSequences: sequencesToAnalyze.length,
    message: "Analysis complete!",
  });

  return unifiedAnalysis;
}

/**
 * Parse AI response into structured SequenceAnalysis
 */
function parseSequenceAnalysis(
  sequence: Sequence,
  response: string
): SequenceAnalysis {
  const issues: AnalysisIssue[] = [];
  const strengths: AnalysisStrength[] = [];

  // Parse strengths section
  const strengthsMatch = response.match(/STRENGTH[S]?[:\s]*([\s\S]*?)(?=OPPORTUNIT|ISSUE|SUMMARY|$)/i);
  if (strengthsMatch) {
    const strengthLines = strengthsMatch[1]
      .split(/\n[-•*]\s*/)
      .filter((line) => line.trim().length > 10);

    for (const line of strengthLines.slice(0, 5)) {
      const strength = parseStrength(line, sequence.id);
      if (strength) strengths.push(strength);
    }
  }

  // Parse opportunities/issues section
  const issuesMatch = response.match(/OPPORTUNIT[IES]*[:\s]*([\s\S]*?)(?=SUMMARY|STRENGTH|$)/i);
  if (issuesMatch) {
    const issueLines = issuesMatch[1]
      .split(/\n[-•*]\s*/)
      .filter((line) => line.trim().length > 10);

    for (const line of issueLines.slice(0, 8)) {
      const issue = parseIssue(line, sequence.id);
      if (issue) issues.push(issue);
    }
  }

  // Calculate scores based on issues and strengths
  const categoryScores = calculateCategoryScores(issues, strengths);
  const overallHealth = calculateOverallHealth(categoryScores, issues);

  return {
    sequenceId: sequence.id,
    sequenceName: sequence.name,
    overallHealth,
    categoryScores,
    issues,
    strengths,
  };
}

/**
 * Parse a strength from text
 */
function parseStrength(text: string, sequenceId: string): AnalysisStrength | null {
  const cleaned = text.trim();
  if (cleaned.length < 15) return null;

  // Detect category from keywords
  const category = detectCategory(cleaned);

  // Extract title (first sentence or phrase)
  const titleMatch = cleaned.match(/^([^.!?]+[.!?]?)/);
  const title = titleMatch
    ? titleMatch[1].slice(0, 80)
    : cleaned.slice(0, 80);

  return {
    id: `str-${sequenceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    title: title.replace(/^[-•*]\s*/, ""),
    description: cleaned,
  };
}

/**
 * Parse an issue from text
 */
function parseIssue(text: string, sequenceId: string): AnalysisIssue | null {
  const cleaned = text.trim();
  if (cleaned.length < 15) return null;

  // Detect category from keywords
  const category = detectCategory(cleaned);

  // Detect severity from keywords
  const severity = detectSeverity(cleaned);

  // Extract title (first sentence or phrase)
  const titleMatch = cleaned.match(/^([^.!?]+[.!?]?)/);
  const title = titleMatch
    ? titleMatch[1].slice(0, 80)
    : cleaned.slice(0, 80);

  // Look for suggestion
  const suggestionMatch = cleaned.match(/(?:consider|try|could|should|might)[:\s]+([^.]+\.)/i);
  const suggestion = suggestionMatch ? suggestionMatch[1] : undefined;

  return {
    id: `iss-${sequenceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    severity,
    title: title.replace(/^[-•*]\s*/, ""),
    description: cleaned,
    location: { sequenceId },
    suggestion,
  };
}

/**
 * Detect category from text content
 */
function detectCategory(text: string): AnalysisCategory {
  const lower = text.toLowerCase();

  if (
    lower.includes("pacing") ||
    lower.includes("structure") ||
    lower.includes("beat") ||
    lower.includes("act ") ||
    lower.includes("sequence") ||
    lower.includes("scene order")
  ) {
    return "structure";
  }

  if (
    lower.includes("character") ||
    lower.includes("protagonist") ||
    lower.includes("antagonist") ||
    lower.includes("arc") ||
    lower.includes("motivation") ||
    lower.includes("want") ||
    lower.includes("need")
  ) {
    return "character";
  }

  if (
    lower.includes("dialogue") ||
    lower.includes("subtext") ||
    lower.includes("voice") ||
    lower.includes("writing") ||
    lower.includes("economy") ||
    lower.includes("description")
  ) {
    return "craft";
  }

  if (
    lower.includes("logic") ||
    lower.includes("continuity") ||
    lower.includes("inconsisten") ||
    lower.includes("contradiction") ||
    lower.includes("plot hole")
  ) {
    return "logic";
  }

  if (
    lower.includes("genre") ||
    lower.includes("thriller") ||
    lower.includes("horror") ||
    lower.includes("comedy") ||
    lower.includes("convention") ||
    lower.includes("expectation")
  ) {
    return "genre";
  }

  return "craft"; // Default
}

/**
 * Detect severity from text content
 */
function detectSeverity(text: string): AnalysisIssue["severity"] {
  const lower = text.toLowerCase();

  if (
    lower.includes("critical") ||
    lower.includes("fundamental") ||
    lower.includes("core issue") ||
    lower.includes("major problem") ||
    lower.includes("breaks the")
  ) {
    return "critical";
  }

  if (
    lower.includes("important") ||
    lower.includes("significant") ||
    lower.includes("notable") ||
    lower.includes("needs attention")
  ) {
    return "important";
  }

  return "suggestion";
}

/**
 * Calculate category scores
 */
function calculateCategoryScores(
  issues: AnalysisIssue[],
  strengths: AnalysisStrength[]
): Record<AnalysisCategory, number> {
  const categories: AnalysisCategory[] = ["structure", "character", "craft", "logic", "genre"];
  const scores: Record<AnalysisCategory, number> = {
    structure: 75,
    character: 75,
    craft: 75,
    logic: 75,
    genre: 75,
  };

  // Adjust based on issues
  for (const issue of issues) {
    const penalty =
      issue.severity === "critical" ? 15 : issue.severity === "important" ? 8 : 3;
    scores[issue.category] = Math.max(0, scores[issue.category] - penalty);
  }

  // Boost based on strengths
  for (const strength of strengths) {
    scores[strength.category] = Math.min(100, scores[strength.category] + 5);
  }

  return scores;
}

/**
 * Calculate overall health score
 */
function calculateOverallHealth(
  categoryScores: Record<AnalysisCategory, number>,
  issues: AnalysisIssue[]
): number {
  const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / 5;

  // Critical issues have extra penalty
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const penalty = criticalCount * 5;

  return Math.max(0, Math.round(avgScore - penalty));
}

/**
 * Create placeholder analysis for failed sequences
 */
function createPlaceholderAnalysis(sequence: Sequence): SequenceAnalysis {
  return {
    sequenceId: sequence.id,
    sequenceName: sequence.name,
    overallHealth: 0,
    categoryScores: {
      structure: 0,
      character: 0,
      craft: 0,
      logic: 0,
      genre: 0,
    },
    issues: [
      {
        id: `err-${sequence.id}`,
        category: "craft",
        severity: "important",
        title: "Analysis failed",
        description: "Unable to analyze this sequence. Please try again.",
      },
    ],
    strengths: [],
  };
}

/**
 * Synthesize sequence analyses into unified report
 */
function synthesizeAnalysis(
  screenplayId: string,
  sequenceAnalyses: SequenceAnalysis[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: ReturnType<typeof buildAnalysisContext>
): UnifiedAnalysis {
  // Aggregate scores
  const categoryTotals: Record<AnalysisCategory, number[]> = {
    structure: [],
    character: [],
    craft: [],
    logic: [],
    genre: [],
  };

  for (const seq of sequenceAnalyses) {
    for (const [cat, score] of Object.entries(seq.categoryScores)) {
      categoryTotals[cat as AnalysisCategory].push(score);
    }
  }

  const categoryScores: Record<AnalysisCategory, number> = {
    structure: 0,
    character: 0,
    craft: 0,
    logic: 0,
    genre: 0,
  };

  for (const [cat, scores] of Object.entries(categoryTotals)) {
    categoryScores[cat as AnalysisCategory] =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 75;
  }

  const overallScore = Math.round(
    Object.values(categoryScores).reduce((a, b) => a + b, 0) / 5
  );

  // Aggregate strengths (deduplicate similar ones)
  const allStrengths = sequenceAnalyses.flatMap((s) => s.strengths);
  const globalStrengths = deduplicateItems(allStrengths).slice(0, 10);

  // Find global issues (appear in multiple sequences)
  const globalIssues = findGlobalIssues(sequenceAnalyses);

  return {
    screenplayId,
    analyzedAt: new Date().toISOString(),
    overallScore,
    categoryScores,
    sequences: sequenceAnalyses,
    globalIssues,
    globalStrengths,
  };
}

/**
 * Find issues that appear across multiple sequences
 */
function findGlobalIssues(sequenceAnalyses: SequenceAnalysis[]): AnalysisIssue[] {
  // For now, just collect critical issues from all sequences
  const criticalIssues = sequenceAnalyses.flatMap((s) =>
    s.issues.filter((i) => i.severity === "critical")
  );

  return criticalIssues.slice(0, 10);
}

/**
 * Deduplicate items by similar titles
 */
function deduplicateItems<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}
