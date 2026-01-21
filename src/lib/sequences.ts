import { v4 as uuidv4 } from "uuid";
import type { Scene, Sequence } from "@/types/screenplay";

interface AISequenceResponse {
  sequences: Array<{
    name: string;
    suggestedName: string;
    sceneNumbers: number[];
    pageStart: number;
    pageEnd: number;
    dramaticQuestion: string;
    confidenceScore: number;
    boundaryJustification: string[];
  }>;
}

/**
 * Generate sequences using AI-powered 6-layer detection method
 * Falls back to heuristic method if AI unavailable
 */
export async function generateAISequenceSuggestions(
  scenes: Scene[],
  totalPages: number,
  title: string
): Promise<{ sequences: Sequence[]; usedAI: boolean }> {
  if (scenes.length === 0) {
    return { sequences: [], usedAI: false };
  }

  try {
    const response = await fetch("/api/analyze-sequences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenes: scenes.map((s) => ({
          sceneNumber: s.sceneNumber,
          heading: s.heading,
          pageStart: s.pageStart,
          pageEnd: s.pageEnd,
          content: s.content,
          characters: s.characters,
          locationType: s.locationType,
          timeOfDay: s.timeOfDay,
        })),
        totalPages,
        title,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn("AI sequence analysis failed:", error.message);
      // Fall back to heuristic method
      return {
        sequences: generateSequenceSuggestions(scenes, totalPages),
        usedAI: false,
      };
    }

    const result: AISequenceResponse = await response.json();

    // Convert AI response to Sequence format with all characters
    const sequences: Sequence[] = result.sequences.map((aiSeq, index) => {
      // Get all characters from the scenes in this sequence
      const sequenceScenes = scenes.filter((s) =>
        aiSeq.sceneNumbers.includes(s.sceneNumber)
      );
      const allCharacters = new Set<string>();
      sequenceScenes.forEach((s) =>
        s.characters.forEach((c) => allCharacters.add(c))
      );

      return {
        id: uuidv4(),
        name: aiSeq.name || `Sequence ${index + 1}`,
        sceneNumbers: aiSeq.sceneNumbers,
        pageStart: aiSeq.pageStart,
        pageEnd: aiSeq.pageEnd,
        characters: Array.from(allCharacters),
        // AI-enhanced fields
        dramaticQuestion: aiSeq.dramaticQuestion,
        confidenceScore: aiSeq.confidenceScore,
        suggestedName: aiSeq.suggestedName,
        boundaryJustification: aiSeq.boundaryJustification,
      };
    });

    return { sequences, usedAI: true };
  } catch (error) {
    console.error("AI sequence generation error:", error);
    // Fall back to heuristic method
    return {
      sequences: generateSequenceSuggestions(scenes, totalPages),
      usedAI: false,
    };
  }
}

// Time indicators that suggest sequence breaks
const TIME_INDICATORS = [
  /\bNEXT DAY\b/i,
  /\bONE WEEK LATER\b/i,
  /\bLATER\b$/i,
  /\bMORNING\b$/i,
  /\bNIGHT\b$/i,
  /\bDAWN\b$/i,
  /\bDUSK\b$/i,
  /\bNEXT MORNING\b/i,
  /\bTHE NEXT\b/i,
  /\bDAYS LATER\b/i,
  /\bMONTHS LATER\b/i,
  /\bYEARS LATER\b/i,
];

/**
 * Auto-generate sequence suggestions based on screenplay structure
 */
export function generateSequenceSuggestions(
  scenes: Scene[],
  totalPages: number
): Sequence[] {
  if (scenes.length === 0) return [];

  // Target sequence length: 12-15 pages
  const targetSequenceLength = 13;
  const targetSequenceCount = Math.max(
    3,
    Math.round(totalPages / targetSequenceLength)
  );

  // Find potential break points
  const breakScores: { sceneIndex: number; score: number }[] = [];

  for (let i = 1; i < scenes.length; i++) {
    const prevScene = scenes[i - 1];
    const currScene = scenes[i];
    let score = 0;

    // Check for time jump
    if (hasTimeIndicator(currScene.heading)) {
      score += 10;
    }

    // Check for major location change
    if (isLocationChange(prevScene, currScene)) {
      score += 5;
    }

    // Check for INT/EXT flip
    if (prevScene.locationType !== currScene.locationType) {
      score += 2;
    }

    // Prefer breaks near ideal page intervals
    const pagePosition = currScene.pageStart;
    const idealPositions = Array.from(
      { length: targetSequenceCount - 1 },
      (_, i) => ((i + 1) * totalPages) / targetSequenceCount
    );
    const nearIdeal = idealPositions.some(
      (pos) => Math.abs(pagePosition - pos) < 5
    );
    if (nearIdeal) {
      score += 3;
    }

    breakScores.push({ sceneIndex: i, score });
  }

  // Sort by score and select top breaks
  breakScores.sort((a, b) => b.score - a.score);
  const selectedBreaks = breakScores
    .slice(0, targetSequenceCount - 1)
    .map((b) => b.sceneIndex)
    .sort((a, b) => a - b);

  // Build sequences
  const sequences: Sequence[] = [];
  let startIndex = 0;

  for (let i = 0; i <= selectedBreaks.length; i++) {
    const endIndex = i < selectedBreaks.length ? selectedBreaks[i] : scenes.length;
    const sequenceScenes = scenes.slice(startIndex, endIndex);

    if (sequenceScenes.length > 0) {
      const allCharacters = new Set<string>();
      sequenceScenes.forEach((s) =>
        s.characters.forEach((c) => allCharacters.add(c))
      );

      sequences.push({
        id: uuidv4(),
        name: `Sequence ${sequences.length + 1}`,
        sceneNumbers: sequenceScenes.map((s) => s.sceneNumber),
        pageStart: sequenceScenes[0].pageStart,
        pageEnd: sequenceScenes[sequenceScenes.length - 1].pageEnd,
        characters: Array.from(allCharacters),
      });
    }

    startIndex = endIndex;
  }

  return sequences;
}

/**
 * Check if scene heading contains a time indicator
 */
function hasTimeIndicator(heading: string): boolean {
  return TIME_INDICATORS.some((pattern) => pattern.test(heading));
}

/**
 * Check if there's a significant location change between scenes
 */
function isLocationChange(prev: Scene, curr: Scene): boolean {
  // Extract location from heading (everything between INT./EXT. and the dash)
  const extractLocation = (heading: string): string => {
    const match = heading.match(/(?:INT\.|EXT\.|INT\/EXT\.)\s+(.+?)(?:\s*[-–—]|$)/i);
    return match ? match[1].trim().toLowerCase() : "";
  };

  const prevLocation = extractLocation(prev.heading);
  const currLocation = extractLocation(curr.heading);

  // If locations are very different (not sharing significant words), it's a change
  if (!prevLocation || !currLocation) return false;

  const prevWords = new Set(prevLocation.split(/\s+/));
  const currWords = currLocation.split(/\s+/);

  const sharedWords = currWords.filter((w) => prevWords.has(w));
  return sharedWords.length < currWords.length / 2;
}

/**
 * Recalculate sequence data after boundary changes
 */
export function recalculateSequence(
  sequence: Partial<Sequence>,
  scenes: Scene[]
): Sequence {
  const sequenceScenes = scenes.filter((s) =>
    sequence.sceneNumbers?.includes(s.sceneNumber)
  );

  const allCharacters = new Set<string>();
  sequenceScenes.forEach((s) =>
    s.characters.forEach((c) => allCharacters.add(c))
  );

  return {
    id: sequence.id || uuidv4(),
    name: sequence.name || "Sequence",
    sceneNumbers: sequence.sceneNumbers || [],
    pageStart: sequenceScenes[0]?.pageStart || 1,
    pageEnd: sequenceScenes[sequenceScenes.length - 1]?.pageEnd || 1,
    characters: Array.from(allCharacters),
  };
}
