/**
 * Want vs. Need Tracker Lens
 * Analyzes the protagonist's internal journey across the screenplay
 */

import type { Sequence, GenreId } from "@/types/screenplay";
import { GENRE_CONFIGS } from "@/lib/genres/config";

export type LieStatus = "reinforced" | "cracking" | "shattered" | "integrated";

export interface SequenceArcAssessment {
  sequenceId: string;
  sequenceName: string;
  pageRange: string;
  pursuingWant: boolean;
  needHints: string[];
  lieStatus: LieStatus;
  arcPosition: number; // 0-100, where 0 = full Lie, 100 = full Truth
  keyMoments: string[];
  isPassive: boolean;
  notes?: string;
}

export interface WantVsNeedAnalysis {
  protagonistName: string;
  want: string;
  need: string;
  lie: string;
  truth: string;
  crisisPoint?: {
    sequenceId: string;
    sequenceName: string;
    page: number;
    description: string;
  };
  choicePoint?: {
    sequenceId: string;
    sequenceName: string;
    page: number;
    choice: "want" | "need" | "ambiguous";
    description: string;
  };
  sequenceAssessments: SequenceArcAssessment[];
  overallArcHealth: number; // 0-100
  issues: WantVsNeedIssue[];
  strengths: string[];
}

export interface WantVsNeedIssue {
  type: "passive" | "stalling" | "unclear_want" | "no_internal_conflict" | "missing_crisis" | "premature_truth";
  severity: "critical" | "important" | "suggestion";
  sequenceId?: string;
  description: string;
  suggestion: string;
}

/**
 * Build the system prompt for Want vs. Need analysis
 */
export function buildWantVsNeedSystemPrompt(genreId: GenreId): string {
  const genreConfig = GENRE_CONFIGS[genreId];

  return `You are a master story analyst specializing in protagonist character arcs. Your task is to track the protagonist's internal journey through a ${genreConfig.name} screenplay.

CHARACTER ARC FUNDAMENTALS:
- WANT: The external, conscious goal the protagonist pursues (what they think they need)
- NEED: The internal growth required for true fulfillment (what they actually need)
- LIE: The false belief that holds them back at the start
- TRUTH: What they must come to understand by the end

THE ARC SPECTRUM:
At the start, protagonists are firmly in the "Lie" - believing their false belief.
Through the story, the Lie gets "cracked" by events and challenges.
At the Crisis Point, Want and Need collide - they can't have both.
At the Choice Point, they choose Need over Want (or fail to).
By the end, they've integrated the Truth (or tragically rejected it).

GENRE CONTEXT FOR ${genreConfig.name.toUpperCase()}:
${genreConfig.toneGuidelines || "Standard character development applies."}
${genreConfig.emotionalJourney || ""}

ANALYSIS GUIDELINES:
1. Be SPECIFIC - reference actual scenes, dialogue, and character actions
2. Track arc MOVEMENT - is the character changing or static?
3. Identify PASSIVE protagonists - are they driving action or being pushed by events?
4. Watch for STALLING - sequences where no arc progress happens
5. Find the CRISIS - the moment Want and Need become mutually exclusive
6. Note the CHOICE - does the protagonist actively choose transformation?

Respond with valid JSON only.`;
}

// Soul data for lens (subset without confirmed status)
export interface SoulData {
  centralQuestion: string;
  thematicArgument: string;
  controllingIdea: string;
  protagonistLie: string;
  protagonistTruth: string;
}

/**
 * Build the user prompt for Want vs. Need analysis
 */
export function buildWantVsNeedUserPrompt(
  screenplayTitle: string,
  soul: SoulData,
  sequences: Sequence[],
  sceneContents: string[]
): string {
  // Build sequence descriptions with scene content
  const sequenceDescriptions = sequences.map((seq, i) => {
    const content = sceneContents[i] || "";
    const truncatedContent = content.length > 2000
      ? content.slice(0, 2000) + "..."
      : content;
    return `### ${seq.name} (pp. ${seq.pageStart}-${seq.pageEnd})
Characters: ${seq.characters.slice(0, 5).join(", ")}
${seq.dramaticQuestion ? `Dramatic Question: ${seq.dramaticQuestion}` : ""}

${truncatedContent}`;
  }).join("\n\n---\n\n");

  return `Analyze the protagonist's Want vs. Need arc in "${screenplayTitle}".

SOUL DATA (Writer's Vision):
- Central Question: "${soul.centralQuestion}"
- Thematic Argument: "${soul.thematicArgument}"
- Controlling Idea: "${soul.controllingIdea}"
- Protagonist's Lie (as identified by writer): "${soul.protagonistLie}"
- Protagonist's Truth (as identified by writer): "${soul.protagonistTruth}"

SCREENPLAY SEQUENCES:

${sequenceDescriptions}

---

ANALYSIS INSTRUCTIONS:

1. IDENTIFY THE PROTAGONIST
   - Who is the main character driving the story?
   - (If ensemble, focus on the primary POV character)

2. CLARIFY THE ARC ELEMENTS
   Based on the content, confirm or refine:
   - WANT: Their conscious external goal
   - NEED: Their unconscious internal growth required
   - LIE: The false belief shown in early scenes
   - TRUTH: The understanding they must reach

3. ASSESS EACH SEQUENCE
   For each sequence, evaluate:
   - Is the protagonist actively pursuing their Want? (true/false)
   - Are there hints pointing toward their Need? (list them)
   - What is the Lie status? ("reinforced" | "cracking" | "shattered" | "integrated")
   - Arc position (0-100, where 0 = fully in Lie, 100 = integrated Truth)
   - Key moments that advance or reveal the arc
   - Is the protagonist passive in this sequence?

4. FIND KEY STRUCTURAL POINTS
   - CRISIS POINT: The moment where Want and Need collide
   - CHOICE POINT: Where protagonist chooses Need over Want (or fails to)

5. IDENTIFY ISSUES
   Flag problems like:
   - "passive": Protagonist not driving action
   - "stalling": No arc movement for too long
   - "unclear_want": What they're after is vague
   - "no_internal_conflict": All external, no internal struggle
   - "missing_crisis": No clear Want vs. Need collision
   - "premature_truth": They learn the truth too early

Respond with ONLY valid JSON in this format:
{
  "protagonistName": "CHARACTER NAME",
  "want": "Their conscious external goal",
  "need": "The internal growth they require",
  "lie": "The false belief holding them back",
  "truth": "What they must understand",
  "crisisPoint": {
    "sequenceId": "seq-id",
    "sequenceName": "Sequence Name",
    "page": 75,
    "description": "Brief description of the crisis moment"
  },
  "choicePoint": {
    "sequenceId": "seq-id",
    "sequenceName": "Sequence Name",
    "page": 90,
    "choice": "need",
    "description": "How they choose transformation"
  },
  "sequenceAssessments": [
    {
      "sequenceId": "seq-id",
      "sequenceName": "Sequence Name",
      "pageRange": "1-15",
      "pursuingWant": true,
      "needHints": ["Moment that hints at need"],
      "lieStatus": "reinforced",
      "arcPosition": 10,
      "keyMoments": ["Key moment description"],
      "isPassive": false,
      "notes": "Additional observations"
    }
  ],
  "overallArcHealth": 75,
  "issues": [
    {
      "type": "passive",
      "severity": "important",
      "sequenceId": "seq-id",
      "description": "Description of the issue",
      "suggestion": "Actionable suggestion to fix it"
    }
  ],
  "strengths": [
    "What's working well in the arc"
  ]
}`;
}

/**
 * Get sequence scene content for analysis
 */
export function getSequenceContent(
  sequences: Sequence[],
  scenes: { sceneNumber: number; heading: string; content: string }[]
): string[] {
  return sequences.map((seq) => {
    const seqScenes = scenes.filter((s) =>
      seq.sceneNumbers.includes(s.sceneNumber)
    );
    return seqScenes
      .map((s) => `[Scene ${s.sceneNumber}] ${s.heading}\n${s.content}`)
      .join("\n\n");
  });
}
