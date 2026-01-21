/**
 * Antagonist Audit Lens
 * Analyzes the antagonist(s) in the screenplay for depth, philosophy, and threat level
 */

import type { GenreId } from "@/types/screenplay";
import { GENRE_CONFIGS } from "@/lib/genres/config";

export type AntagonistType = "person" | "system" | "internal" | "nature" | "society";

export interface Antagonist {
  name: string;
  type: AntagonistType;
  philosophy: string;
  mirrorConnection: string;
  competenceScore: number; // 1-10
  presenceBySequence: Record<string, boolean>; // sequenceId -> present
  thanosTestPass: boolean; // Could you write a sympathetic version?
  strengths: string[];
  weaknesses: string[];
}

export interface AntagonistAuditResult {
  antagonists: Antagonist[];
  primaryAntagonist?: string;
  overallThreatLevel: number; // 0-100
  issues: AntagonistIssue[];
  strengths: string[];
}

export interface AntagonistIssue {
  type:
    | "shallow_motivation"
    | "absent_too_long"
    | "incompetent"
    | "no_philosophy"
    | "no_mirror_connection"
    | "multiple_unfocused";
  severity: "critical" | "important" | "suggestion";
  antagonistName?: string;
  sequenceId?: string;
  description: string;
  suggestion: string;
}

/**
 * Build the system prompt for Antagonist Audit
 */
export function buildAntagonistAuditSystemPrompt(genreId: GenreId): string {
  const genreConfig = GENRE_CONFIGS[genreId];
  const antagonistNotes = genreConfig.antagonistNotes || "";

  return `You are a master story analyst specializing in antagonist and opposition analysis. Your task is to evaluate the antagonist(s) in a ${genreConfig.name} screenplay.

WHAT MAKES A GREAT ANTAGONIST:

1. PHILOSOPHY: A great antagonist is the hero of their own story. They have a worldview, a belief system that justifies their actions. "Evil" or "greedy" alone is not a philosophy.

2. THE MIRROR: The best antagonists reflect or contrast the protagonist. They often represent what the protagonist could become, or hold a truth the protagonist needs to confront.

3. COMPETENCE: The antagonist must be a genuine threat. They should make smart moves, force the protagonist to grow, and not make convenient mistakes just to let the hero win.

4. PRESENCE: The antagonist's influence should be felt throughout the story, even when off-screen. Long absences (15+ pages) can deflate tension.

5. THE THANOS TEST: Could you write a version of this story from the antagonist's perspective where they're sympathetic? If no, they're a plot device, not a character.

GENRE CONTEXT FOR ${genreConfig.name.toUpperCase()}:
${antagonistNotes}

TYPES OF ANTAGONISTS:
- "person": A specific individual opposing the protagonist
- "system": An institution, organization, or bureaucracy
- "internal": The protagonist's own flaws, demons, or self-sabotage
- "nature": Environmental forces, survival scenarios
- "society": Social norms, expectations, prejudices

Respond with valid JSON only.`;
}

/**
 * Build the user prompt for Antagonist Audit
 */
export function buildAntagonistAuditUserPrompt(
  screenplayTitle: string,
  soulData: {
    centralQuestion: string;
    thematicArgument: string;
    controllingIdea: string;
    protagonistLie: string;
    protagonistTruth: string;
  },
  sequences: Array<{
    id: string;
    name: string;
    pageRange: string;
    characters: string[];
    summary: string;
  }>,
  characters: Array<{
    name: string;
    dialogueCount: number;
    sceneAppearances: number[];
  }>
): string {
  // Build sequence context
  const sequenceContext = sequences
    .map(
      (seq) =>
        `${seq.name} (${seq.pageRange}): ${seq.characters.slice(0, 5).join(", ")}
${seq.summary}`
    )
    .join("\n\n");

  // Build character list
  const characterList = characters
    .slice(0, 20)
    .map(
      (c) =>
        `${c.name}: ${c.dialogueCount} lines, appears in ${c.sceneAppearances.length} scenes`
    )
    .join("\n");

  return `Analyze the antagonist(s) in "${screenplayTitle}".

SOUL (Theme Data):
- Central Question: "${soulData.centralQuestion}"
- Thematic Argument: "${soulData.thematicArgument}"
- Controlling Idea: "${soulData.controllingIdea}"
- Protagonist's Lie: "${soulData.protagonistLie}"
- Protagonist's Truth: "${soulData.protagonistTruth}"

CHARACTERS:
${characterList}

SEQUENCE BREAKDOWN:
${sequenceContext}

---

ANALYSIS INSTRUCTIONS:

1. IDENTIFY ANTAGONIST(S)
   Who or what opposes the protagonist? There may be multiple antagonists or opposing forces.

2. FOR EACH ANTAGONIST, ASSESS:

   a) TYPE: Is it a person, system, internal conflict, nature, or society?

   b) PHILOSOPHY: What do they believe? What's their worldview? What justifies their actions in their own mind?

   c) MIRROR CONNECTION: How do they reflect or contrast the protagonist? Do they represent what the protagonist fears becoming? Do they challenge the protagonist's Lie?

   d) COMPETENCE (1-10): Are they a genuine threat?
      - 1-3: Makes convenient mistakes, easily outsmarted
      - 4-6: Adequate but predictable
      - 7-10: Formidable, forces protagonist to truly grow

   e) PRESENCE: In which sequences are they active or felt?

   f) THANOS TEST: Could you write a sympathetic version of their story?

3. IDENTIFY ISSUES
   Flag problems like:
   - "shallow_motivation": Just "evil" or "greedy" without depth
   - "absent_too_long": Disappears for long stretches
   - "incompetent": Makes stupid mistakes to let hero win
   - "no_philosophy": No clear belief system
   - "no_mirror_connection": No thematic link to protagonist
   - "multiple_unfocused": Too many antagonists diluting focus

4. IDENTIFY STRENGTHS
   What's working well with the antagonist(s)?

Respond with ONLY valid JSON:
{
  "antagonists": [
    {
      "name": "ANTAGONIST NAME",
      "type": "person|system|internal|nature|society",
      "philosophy": "What they believe/their worldview",
      "mirrorConnection": "How they reflect/contrast protagonist",
      "competenceScore": 7,
      "presenceBySequence": {
        "seq-1": true,
        "seq-2": false,
        "seq-3": true
      },
      "thanosTestPass": true,
      "strengths": ["What works about this antagonist"],
      "weaknesses": ["What could be improved"]
    }
  ],
  "primaryAntagonist": "MAIN ANTAGONIST NAME",
  "overallThreatLevel": 75,
  "issues": [
    {
      "type": "absent_too_long",
      "severity": "important",
      "antagonistName": "ANTAGONIST NAME",
      "sequenceId": "seq-3",
      "description": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": [
    "Overall strengths of antagonist design"
  ]
}`;
}

/**
 * Calculate overall threat level from antagonist data
 */
export function calculateOverallThreat(antagonists: Antagonist[]): number {
  if (antagonists.length === 0) return 0;

  // Weight primary antagonist more heavily
  const competenceScores = antagonists.map((a) => a.competenceScore);
  const avgCompetence =
    competenceScores.reduce((sum, s) => sum + s, 0) / competenceScores.length;

  // Bonus for having clear philosophy
  const philosophyBonus = antagonists.filter((a) => a.philosophy.length > 20).length * 5;

  // Bonus for passing Thanos test
  const thanosBonus = antagonists.filter((a) => a.thanosTestPass).length * 5;

  // Penalty for too many antagonists
  const focusPenalty = antagonists.length > 3 ? (antagonists.length - 3) * 5 : 0;

  return Math.min(100, Math.max(0, avgCompetence * 10 + philosophyBonus + thanosBonus - focusPenalty));
}

/**
 * Generate heuristic antagonist assessment when AI unavailable
 */
export function generateHeuristicAntagonistAudit(
  characters: Array<{
    name: string;
    dialogueCount: number;
    sceneAppearances: number[];
  }>,
  protagonist?: string
): AntagonistAuditResult {
  // The character with second-most dialogue is often the antagonist
  const sorted = [...characters].sort((a, b) => b.dialogueCount - a.dialogueCount);

  // Filter out protagonist if known
  const candidates = protagonist
    ? sorted.filter((c) => c.name !== protagonist)
    : sorted.slice(1);

  if (candidates.length === 0) {
    return {
      antagonists: [],
      overallThreatLevel: 50,
      issues: [
        {
          type: "no_philosophy",
          severity: "important",
          description: "Unable to identify a clear antagonist in the screenplay",
          suggestion: "Consider who or what opposes your protagonist's goal",
        },
      ],
      strengths: [],
    };
  }

  const mainAntagonist = candidates[0];

  return {
    antagonists: [
      {
        name: mainAntagonist.name,
        type: "person",
        philosophy: "To be determined by AI analysis",
        mirrorConnection: "To be determined by AI analysis",
        competenceScore: 5,
        presenceBySequence: {},
        thanosTestPass: true,
        strengths: ["Appears in multiple scenes"],
        weaknesses: ["Requires deeper analysis"],
      },
    ],
    primaryAntagonist: mainAntagonist.name,
    overallThreatLevel: 50,
    issues: [],
    strengths: ["Antagonist identified with significant screen presence"],
  };
}
