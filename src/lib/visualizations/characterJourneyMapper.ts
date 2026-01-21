/**
 * Character Journey Mapper
 * Transforms AI analysis data into visualization-ready format for CharacterJourneyMap
 */

import type { CharacterArc, ArcPoint, ArcPosition, LieStatus } from "@/types/visualization";
import type { WantVsNeedAnalysis, SequenceArcAssessment } from "@/lib/agents/lenses/wantVsNeed";
import type { ParsedScreenplay, Sequence, Soul } from "@/types/screenplay";

/**
 * Fetch AI-powered character arc analysis
 */
export async function fetchAICharacterArc(
  screenplay: ParsedScreenplay,
  sequences: Sequence[],
  soul: Soul,
  genreId: string
): Promise<CharacterArc> {
  const response = await fetch("/api/analyze-character-arc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      screenplay: {
        title: screenplay.title,
        scenes: screenplay.scenes.map((s) => ({
          sceneNumber: s.sceneNumber,
          heading: s.heading,
          content: s.content,
        })),
      },
      sequences: sequences.map((seq) => ({
        id: seq.id,
        name: seq.name,
        sceneNumbers: seq.sceneNumbers,
        pageStart: seq.pageStart,
        pageEnd: seq.pageEnd,
        characters: seq.characters,
        dramaticQuestion: seq.dramaticQuestion,
      })),
      soul: {
        centralQuestion: soul.centralQuestion,
        thematicArgument: soul.thematicArgument,
        controllingIdea: soul.controllingIdea,
        protagonistLie: soul.protagonistLie,
        protagonistTruth: soul.protagonistTruth,
      },
      genreId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to analyze character arc");
  }

  const analysis: WantVsNeedAnalysis = await response.json();
  return transformAnalysisToArc(analysis);
}

/**
 * Transform AI analysis response to CharacterArc format
 */
export function transformAnalysisToArc(analysis: WantVsNeedAnalysis): CharacterArc {
  const arcPoints = analysis.sequenceAssessments.map((seq) =>
    transformSequenceToArcPoint(seq)
  );

  return {
    characterName: analysis.protagonistName,
    want: analysis.want,
    need: analysis.need,
    lie: analysis.lie,
    truth: analysis.truth,
    crisisPoint: analysis.crisisPoint
      ? {
          page: analysis.crisisPoint.page,
          description: analysis.crisisPoint.description,
        }
      : undefined,
    arcPoints,
  };
}

/**
 * Transform a sequence assessment to an arc point
 */
function transformSequenceToArcPoint(seq: SequenceArcAssessment): ArcPoint {
  return {
    sequenceId: seq.sequenceId,
    sequenceName: seq.sequenceName,
    pageRange: seq.pageRange,
    position: arcPositionFromScore(seq.arcPosition),
    lieStatus: mapLieStatus(seq.lieStatus),
    description: buildArcPointDescription(seq),
  };
}

/**
 * Convert arc position score (0-100) to ArcPosition
 */
function arcPositionFromScore(score: number): ArcPosition {
  if (score <= 20) return "want";
  if (score <= 50) return "crisis";
  if (score <= 80) return "need";
  return "resolved";
}

/**
 * Map lie status from analysis to visualization type
 */
function mapLieStatus(status: string): LieStatus {
  switch (status) {
    case "reinforced":
      return "believing";
    case "cracking":
      return "cracking";
    case "shattered":
      return "crisis";
    case "integrated":
      return "truth";
    default:
      return "believing";
  }
}

/**
 * Build a description for the arc point
 */
function buildArcPointDescription(seq: SequenceArcAssessment): string {
  const parts: string[] = [];

  if (seq.isPassive) {
    parts.push("Protagonist is reactive");
  } else if (seq.pursuingWant) {
    parts.push("Actively pursuing goal");
  }

  if (seq.needHints && seq.needHints.length > 0) {
    parts.push(`Need hints: ${seq.needHints.slice(0, 2).join("; ")}`);
  }

  if (seq.keyMoments && seq.keyMoments.length > 0) {
    parts.push(seq.keyMoments[0]);
  }

  if (seq.notes) {
    parts.push(seq.notes);
  }

  return parts.join(". ") || `Arc position: ${seq.arcPosition}%`;
}

/**
 * Generate fallback character arc data using heuristics
 * Used when AI analysis is unavailable
 */
export function generateHeuristicCharacterArc(
  screenplay: ParsedScreenplay,
  sequences: Sequence[],
  soul: Soul
): CharacterArc {
  // Use soul data for arc elements
  const arcPoints: ArcPoint[] = sequences.map((seq, index) => {
    const totalSequences = sequences.length;
    const progressRatio = index / (totalSequences - 1 || 1);

    // Simulate arc progression
    let position: ArcPosition;
    let lieStatus: LieStatus;

    if (progressRatio < 0.25) {
      position = "want";
      lieStatus = "believing";
    } else if (progressRatio < 0.5) {
      position = "want";
      lieStatus = "cracking";
    } else if (progressRatio < 0.75) {
      position = "crisis";
      lieStatus = "crisis";
    } else if (progressRatio < 0.9) {
      position = "need";
      lieStatus = "truth";
    } else {
      position = "resolved";
      lieStatus = "truth";
    }

    return {
      sequenceId: seq.id,
      sequenceName: seq.name,
      pageRange: `${seq.pageStart}-${seq.pageEnd}`,
      position,
      lieStatus,
      description: seq.dramaticQuestion || `Sequence ${index + 1}`,
    };
  });

  // Find crisis point (around 75% through)
  const crisisIndex = Math.floor(sequences.length * 0.75);
  const crisisSequence = sequences[crisisIndex];

  return {
    characterName: findProtagonist(screenplay),
    want: deriveWant(soul),
    need: deriveNeed(soul),
    lie: soul.protagonistLie,
    truth: soul.protagonistTruth,
    crisisPoint: crisisSequence
      ? {
          page: crisisSequence.pageStart,
          description: "Crisis point where Want and Need collide",
        }
      : undefined,
    arcPoints,
  };
}

/**
 * Find the likely protagonist from screenplay data
 */
function findProtagonist(screenplay: ParsedScreenplay): string {
  // The character with most dialogue is likely the protagonist
  const sorted = [...screenplay.characters].sort(
    (a, b) => b.dialogueCount - a.dialogueCount
  );
  return sorted[0]?.name || "Protagonist";
}

/**
 * Derive Want from soul data
 */
function deriveWant(soul: Soul): string {
  // Extract want from controlling idea if possible
  const match = soul.controllingIdea.match(/^([^,]+)/);
  if (match) {
    return `Pursue: ${match[1].toLowerCase()}`;
  }
  return "External goal derived from thematic argument";
}

/**
 * Derive Need from soul data
 */
function deriveNeed(soul: Soul): string {
  return soul.protagonistTruth || "Internal growth required for true fulfillment";
}

/**
 * Calculate arc health score from arc data
 */
export function calculateArcHealth(arc: CharacterArc): {
  score: number;
  issues: string[];
  strengths: string[];
} {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 70; // Start with baseline

  // Check if crisis point exists
  if (arc.crisisPoint) {
    strengths.push("Clear crisis point identified");
    score += 10;
  } else {
    issues.push("No clear crisis point where Want and Need collide");
    score -= 15;
  }

  // Check arc progression
  const positions = arc.arcPoints.map((p) => p.position);
  const hasWant = positions.includes("want");
  const hasCrisis = positions.includes("crisis");
  const hasNeed = positions.includes("need");
  const hasResolution = positions.includes("resolved");

  if (hasWant && hasCrisis && hasNeed) {
    strengths.push("Complete arc from Want through Crisis to Need");
    score += 10;
  }

  if (!hasWant) {
    issues.push("Arc doesn't clearly establish protagonist's Want phase");
    score -= 10;
  }

  if (!hasCrisis) {
    issues.push("No clear Crisis phase in the arc");
    score -= 10;
  }

  if (!hasResolution && hasNeed) {
    // This might be intentional (tragedy)
    issues.push("Arc doesn't reach full resolution (may be intentional)");
  }

  // Check for arc movement
  const lieProgression = arc.arcPoints.map((p) => p.lieStatus);
  const hasProgression =
    lieProgression.includes("believing") &&
    (lieProgression.includes("cracking") || lieProgression.includes("crisis"));

  if (hasProgression) {
    strengths.push("Lie is properly challenged and cracked through the story");
    score += 10;
  } else {
    issues.push("Lie doesn't appear to be challenged across sequences");
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths,
  };
}
