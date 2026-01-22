/**
 * Issue Aggregator
 * Collects and categorizes issues from all analysis types into a unified list
 */

import { v4 as uuid } from "uuid";
import type { ThemeConstellation, CharacterArc, EmotionalJourney } from "@/types/visualization";
import type {
  AnalysisIssue,
  IssueType,
  IssueSeverity,
  IssueCategory,
} from "@/components/Analysis/IssueCard";
import { calculateArcHealth } from "@/lib/visualizations/characterJourneyMapper";
import type { AntagonistAuditResult } from "@/lib/agents/lenses/antagonistAudit";

/**
 * Extract issues from Theme Constellation data
 */
export function extractThemeIssues(
  constellation: ThemeConstellation
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Find floating (disconnected) nodes
  const floatingNodes = constellation.nodes.filter((node) => !node.isConnected);

  floatingNodes.forEach((node) => {
    if (node.type === "scene") {
      issues.push({
        id: uuid(),
        title: `Disconnected Scene: ${node.label}`,
        description: `Scene "${node.label}" doesn't have a clear connection to your theme "${constellation.coreTheme}". Consider how this scene advances or complicates your thematic argument.`,
        severity: "warning",
        category: "theme",
        issueType: "floating-scene",
        issueContext: {
          elementName: node.label,
          elementType: "scene",
          sceneNumber: parseInt(node.id.replace("scene-", "")) || undefined,
        },
      });
    } else if (node.type === "character") {
      issues.push({
        id: uuid(),
        title: `Disconnected Character: ${node.label}`,
        description: `Character "${node.label}" doesn't have a clear thematic purpose. Consider what they represent in relation to your theme or if they could be merged/cut.`,
        severity: "warning",
        category: "character",
        issueType: "floating-character",
        issueContext: {
          elementName: node.label,
          elementType: "character",
        },
      });
    }
  });

  // Check for weak connections (scenes with low thematic strength)
  const weakScenes = constellation.nodes.filter(
    (node) =>
      node.type === "scene" &&
      node.isConnected &&
      node.thematicStrength !== undefined &&
      node.thematicStrength < 0.4
  );

  if (weakScenes.length > 3) {
    issues.push({
      id: uuid(),
      title: "Multiple Weak Theme Connections",
      description: `${weakScenes.length} scenes have weak thematic connections. Your theme might benefit from being more explicitly woven through these scenes.`,
      severity: "note",
      category: "theme",
      issueType: "theme-disconnect",
      issueContext: {
        elementName: `${weakScenes.length} scenes`,
      },
    });
  }

  return issues;
}

/**
 * Extract issues from Character Arc data
 */
export function extractCharacterArcIssues(arc: CharacterArc): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  const { issues: arcIssues } = calculateArcHealth(arc);

  arcIssues.forEach((issueText) => {
    // Determine issue type based on text
    let issueType: IssueType = "arc-stall";
    let severity: IssueSeverity = "warning";

    if (issueText.toLowerCase().includes("regress")) {
      issueType = "arc-regression";
      severity = "critical";
    } else if (issueText.toLowerCase().includes("crisis")) {
      issueType = "arc-stall";
      severity = "warning";
    } else if (issueText.toLowerCase().includes("resolution")) {
      issueType = "arc-stall";
      severity = "note";
    }

    issues.push({
      id: uuid(),
      title: `Character Arc Issue`,
      description: issueText,
      severity,
      category: "character",
      issueType,
      issueContext: {
        currentArcState: issueText,
        elementName: arc.characterName,
      },
    });
  });

  // Check for passive protagonist in early sequences
  const earlyPassive = arc.arcPoints
    .slice(0, Math.ceil(arc.arcPoints.length / 3))
    .filter((point) => point.description.toLowerCase().includes("reactive") || point.description.toLowerCase().includes("passive"));

  if (earlyPassive.length > 1) {
    issues.push({
      id: uuid(),
      title: "Passive Protagonist",
      description: `${arc.characterName} appears to be reactive rather than proactive in the early sequences. Consider giving them more agency in pursuing their Want.`,
      severity: "warning",
      category: "character",
      issueType: "arc-stall",
      issueContext: {
        elementName: arc.characterName,
        currentArcState: "passive/reactive",
        expectedArcState: "actively pursuing goal",
      },
    });
  }

  return issues;
}

/**
 * Extract issues from Emotional Journey data
 */
export function extractEmotionalIssues(
  journey: EmotionalJourney & { issues?: string[]; sequenceEmotions?: Array<{ sequenceName: string; pageStart: number; pageEnd: number; intensity: number }> }
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Use AI-detected issues if available
  if (journey.issues && journey.issues.length > 0) {
    journey.issues.forEach((issueText) => {
      let issueType: IssueType = "pacing-issue";
      let severity: IssueSeverity = "note";
      const category: IssueCategory = "pacing";

      if (issueText.toLowerCase().includes("flat")) {
        issueType = "emotional-flat";
        severity = "warning";
      } else if (issueText.toLowerCase().includes("spike") || issueText.toLowerCase().includes("jarring")) {
        issueType = "emotional-spike";
        severity = "note";
      }

      issues.push({
        id: uuid(),
        title: "Pacing Issue",
        description: issueText,
        severity,
        category,
        issueType,
        issueContext: {},
      });
    });
  }

  // Detect flat stretches from data
  if (journey.beats && journey.beats.length > 2) {
    const intensities = journey.beats.map((b) => b.intensity);

    // Check for consecutive low-intensity beats
    for (let i = 0; i < intensities.length - 2; i++) {
      if (intensities[i] < 30 && intensities[i + 1] < 30 && intensities[i + 2] < 30) {
        const startPage = journey.beats[i].page;
        const endPage = journey.beats[i + 2].page;

        issues.push({
          id: uuid(),
          title: "Low Intensity Stretch",
          description: `Pages ${startPage}-${endPage} have consistently low emotional intensity. Consider adding tension, conflict, or emotional stakes to maintain audience engagement.`,
          severity: "warning",
          category: "pacing",
          issueType: "emotional-flat",
          issueContext: {
            pageRange: { start: startPage, end: endPage },
            currentIntensity: Math.round((intensities[i] + intensities[i + 1] + intensities[i + 2]) / 3),
          },
        });
        break; // Only report one flat stretch
      }
    }
  }

  // Check overall arc pattern
  if (journey.overallArc === "flat") {
    issues.push({
      id: uuid(),
      title: "Flat Emotional Arc",
      description: "Your screenplay's emotional intensity stays relatively constant throughout. Consider building to a climactic peak and varying the intensity more.",
      severity: "warning",
      category: "pacing",
      issueType: "emotional-flat",
      issueContext: {},
    });
  }

  return issues;
}

/**
 * Extract issues from Antagonist Audit data
 */
export function extractAntagonistIssues(
  audit: AntagonistAuditResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Convert AntagonistIssue to AnalysisIssue
  audit.issues.forEach((issue) => {
    let issueType: IssueType = "antagonist-shallow";
    let severity: IssueSeverity = "warning";

    // Map antagonist issue types
    switch (issue.type) {
      case "shallow_motivation":
        issueType = "antagonist-shallow";
        severity = "warning";
        break;
      case "absent_too_long":
        issueType = "antagonist-absent";
        severity = "warning";
        break;
      case "incompetent":
        issueType = "antagonist-incompetent";
        severity = "critical";
        break;
      case "no_philosophy":
        issueType = "antagonist-no-philosophy";
        severity = "warning";
        break;
      case "no_mirror_connection":
        issueType = "antagonist-no-mirror";
        severity = "note";
        break;
      case "multiple_unfocused":
        issueType = "antagonist-shallow";
        severity = "note";
        break;
    }

    // Override with API-provided severity if available
    if (issue.severity === "critical") severity = "critical";
    else if (issue.severity === "important") severity = "warning";
    else if (issue.severity === "suggestion") severity = "note";

    issues.push({
      id: uuid(),
      title: `Antagonist: ${issue.antagonistName || "Opposition"}`,
      description: issue.description + (issue.suggestion ? ` ${issue.suggestion}` : ""),
      severity,
      category: "character",
      issueType,
      issueContext: {
        elementName: issue.antagonistName,
        sequenceName: issue.sequenceId,
      },
    });
  });

  // Check overall threat level
  if (audit.overallThreatLevel < 40) {
    issues.push({
      id: uuid(),
      title: "Low Antagonist Threat Level",
      description: `Your antagonist(s) register a threat level of only ${audit.overallThreatLevel}/100. Consider making them more competent, more present, or giving them a clearer philosophy.`,
      severity: "warning",
      category: "character",
      issueType: "antagonist-incompetent",
      issueContext: {},
    });
  }

  // Check for antagonist weaknesses
  audit.antagonists.forEach((ant) => {
    if (ant.competenceScore < 4) {
      issues.push({
        id: uuid(),
        title: `Weak Antagonist: ${ant.name}`,
        description: `${ant.name} has a low competence score (${ant.competenceScore}/10). They may not feel like a genuine threat to your protagonist.`,
        severity: "warning",
        category: "character",
        issueType: "antagonist-incompetent",
        issueContext: {
          elementName: ant.name,
        },
      });
    }

    if (!ant.thanosTestPass) {
      issues.push({
        id: uuid(),
        title: `One-Dimensional: ${ant.name}`,
        description: `${ant.name} doesn't pass the "Thanos Test" - could you write a version where they're sympathetic? Consider deepening their motivation.`,
        severity: "note",
        category: "character",
        issueType: "antagonist-no-philosophy",
        issueContext: {
          elementName: ant.name,
        },
      });
    }
  });

  return issues;
}

/**
 * Aggregate all issues from different analysis types
 */
export function aggregateAllIssues(
  themeData: ThemeConstellation | null,
  characterData: CharacterArc | null,
  emotionalData: (EmotionalJourney & { issues?: string[] }) | null,
  antagonistData?: AntagonistAuditResult | null
): AnalysisIssue[] {
  const allIssues: AnalysisIssue[] = [];

  if (themeData) {
    allIssues.push(...extractThemeIssues(themeData));
  }

  if (characterData) {
    allIssues.push(...extractCharacterArcIssues(characterData));
  }

  if (emotionalData) {
    allIssues.push(...extractEmotionalIssues(emotionalData));
  }

  if (antagonistData) {
    allIssues.push(...extractAntagonistIssues(antagonistData));
  }

  // Sort by severity (critical first, then warning, then note)
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    note: 2,
  };

  return allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Get issue counts by severity
 */
export function getIssueCounts(issues: AnalysisIssue[]): {
  critical: number;
  warning: number;
  note: number;
  total: number;
} {
  return {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    note: issues.filter((i) => i.severity === "note").length,
    total: issues.length,
  };
}

/**
 * Get issues grouped by category
 */
export function getIssuesByCategory(issues: AnalysisIssue[]): Record<IssueCategory, AnalysisIssue[]> {
  return {
    structure: issues.filter((i) => i.category === "structure"),
    character: issues.filter((i) => i.category === "character"),
    theme: issues.filter((i) => i.category === "theme"),
    pacing: issues.filter((i) => i.category === "pacing"),
    craft: issues.filter((i) => i.category === "craft"),
  };
}

/**
 * Calculate overall screenplay health score
 */
export function calculateHealthScore(
  issues: AnalysisIssue[],
  themeData: ThemeConstellation | null,
  characterData: CharacterArc | null
): number {
  let score = 100;

  // Deduct for issues
  issues.forEach((issue) => {
    switch (issue.severity) {
      case "critical":
        score -= 15;
        break;
      case "warning":
        score -= 8;
        break;
      case "note":
        score -= 3;
        break;
    }
  });

  // Bonus for good theme connections
  if (themeData) {
    const connectedRatio = themeData.nodes.filter((n) => n.isConnected).length / themeData.nodes.length;
    if (connectedRatio > 0.8) score += 5;
    if (connectedRatio > 0.9) score += 5;
  }

  // Bonus for complete character arc
  if (characterData) {
    const { score: arcScore } = calculateArcHealth(characterData);
    score += Math.round((arcScore - 70) / 10); // Normalize arc score contribution
  }

  return Math.max(0, Math.min(100, score));
}
