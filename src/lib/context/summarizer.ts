/**
 * Sequence Summarizer
 * Generates concise summaries of sequences for efficient context injection
 */

import type { ParsedScreenplay, Scene, Sequence } from "@/types/screenplay";

export interface SequenceSummary {
  sequenceId: string;
  sequenceName: string;
  pageRange: string;
  sceneCount: number;
  summary: string;
  characters: string[];
  locations: string[];
  keyEvents: string[];
}

/**
 * Generate a summary of a single sequence
 */
export function summarizeSequence(
  sequence: Sequence,
  scenes: Scene[]
): SequenceSummary {
  const sequenceScenes = scenes.filter((s) =>
    sequence.sceneNumbers.includes(s.sceneNumber)
  );

  // Extract locations
  const locations = [...new Set(sequenceScenes.map((s) => s.heading))];

  // Extract characters
  const allCharacters = sequenceScenes.flatMap((s) => s.characters);
  const characterCounts = allCharacters.reduce((acc, char) => {
    acc[char] = (acc[char] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCharacters = Object.entries(characterCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  // Extract key events (simplified - looks for action descriptions)
  const keyEvents = extractKeyEvents(sequenceScenes);

  // Generate summary text
  const summary = generateSummaryText(sequenceScenes, topCharacters, locations);

  return {
    sequenceId: sequence.id,
    sequenceName: sequence.name,
    pageRange: `pp. ${sequence.pageStart}-${sequence.pageEnd}`,
    sceneCount: sequenceScenes.length,
    summary,
    characters: topCharacters,
    locations: locations.slice(0, 5),
    keyEvents,
  };
}

/**
 * Generate summaries for all sequences
 */
export function summarizeAllSequences(
  screenplay: ParsedScreenplay,
  sequences: Sequence[]
): SequenceSummary[] {
  return sequences.map((seq) => summarizeSequence(seq, screenplay.scenes));
}

/**
 * Extract key events from scenes (simplified heuristic)
 */
function extractKeyEvents(scenes: Scene[]): string[] {
  const events: string[] = [];

  for (const scene of scenes) {
    const lines = scene.content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for significant action lines (uppercase phrases, dramatic descriptions)
      if (trimmed.length > 20 && trimmed.length < 150) {
        // Check for dramatic keywords
        const dramaticKeywords = [
          "suddenly",
          "realizes",
          "discovers",
          "reveals",
          "confronts",
          "escapes",
          "attacks",
          "dies",
          "kisses",
          "shoots",
          "explosion",
          "screams",
          "cries",
          "laughs",
          "runs",
          "falls",
        ];

        if (dramaticKeywords.some((kw) => trimmed.toLowerCase().includes(kw))) {
          events.push(trimmed.slice(0, 100) + (trimmed.length > 100 ? "..." : ""));
          if (events.length >= 5) break;
        }
      }
    }

    if (events.length >= 5) break;
  }

  return events;
}

/**
 * Generate summary text for a sequence
 */
function generateSummaryText(
  scenes: Scene[],
  characters: string[],
  locations: string[]
): string {
  const sceneCount = scenes.length;
  const primaryLocation = locations[0] || "various locations";
  const primaryCharacters = characters.slice(0, 3).join(", ");

  // Get first scene heading for context
  const firstScene = scenes[0];
  const lastScene = scenes[scenes.length - 1];

  let summary = `${sceneCount} scene${sceneCount > 1 ? "s" : ""} `;

  if (locations.length === 1) {
    summary += `at ${primaryLocation}`;
  } else {
    summary += `across ${locations.length} locations, primarily ${primaryLocation}`;
  }

  if (characters.length > 0) {
    summary += `. Features ${primaryCharacters}`;
    if (characters.length > 3) {
      summary += ` and ${characters.length - 3} others`;
    }
  }

  summary += ".";

  // Add time-of-day progression if varied
  const timeOfDays = scenes.map((s) => s.timeOfDay).filter(Boolean);
  const uniqueTimes = [...new Set(timeOfDays)];
  if (uniqueTimes.length > 1) {
    summary += ` Spans from ${uniqueTimes[0]} to ${uniqueTimes[uniqueTimes.length - 1]}.`;
  }

  return summary;
}

/**
 * Create a compact context string for AI prompts
 */
export function createSequenceContext(
  summaries: SequenceSummary[],
  currentSequenceId?: string
): string {
  let context = "SCREENPLAY STRUCTURE:\n\n";

  for (const summary of summaries) {
    const isCurrent = summary.sequenceId === currentSequenceId;
    const marker = isCurrent ? ">>> " : "";

    context += `${marker}${summary.sequenceName} (${summary.pageRange})\n`;
    context += `  ${summary.summary}\n`;

    if (isCurrent) {
      context += `  Characters: ${summary.characters.join(", ")}\n`;
      context += `  Locations: ${summary.locations.join("; ")}\n`;
      if (summary.keyEvents.length > 0) {
        context += `  Key moments:\n`;
        for (const event of summary.keyEvents) {
          context += `    - ${event}\n`;
        }
      }
    }

    context += "\n";
  }

  return context;
}
