"use client";

import { ActionableInsight } from "@/components/ActionableInsight";

export type IssueSeverity = "critical" | "warning" | "note";
export type IssueCategory = "structure" | "character" | "theme" | "pacing" | "craft";

export type IssueType =
  | "floating-scene"
  | "floating-character"
  | "arc-stall"
  | "arc-regression"
  | "emotional-flat"
  | "emotional-spike"
  | "pacing-issue"
  | "theme-disconnect"
  | "antagonist-shallow"
  | "antagonist-absent"
  | "antagonist-incompetent"
  | "antagonist-no-philosophy"
  | "antagonist-no-mirror";

export interface AnalysisIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  issueType: IssueType;
  issueContext: {
    elementName?: string;
    elementType?: "scene" | "character";
    sceneNumber?: number;
    sceneContent?: string;
    sequenceName?: string;
    sequenceContent?: string;
    currentArcState?: string;
    expectedArcState?: string;
    pageRange?: { start: number; end: number };
    currentEmotion?: string;
    currentIntensity?: number;
  };
}

interface IssueCardProps {
  issue: AnalysisIssue;
  screenplayContext: {
    title: string;
    genreId: string;
    controllingIdea: string;
    protagonistLie?: string;
    protagonistTruth?: string;
    coreTheme?: string;
    subThemes?: string[];
  };
}

const severityConfig = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: "text-red-400",
    label: "Critical",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: "text-amber-400",
    label: "Warning",
  },
  note: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: "text-blue-400",
    label: "Note",
  },
};

const categoryConfig = {
  structure: { label: "Structure", icon: "M4 6h16M4 12h16M4 18h16" },
  character: { label: "Character", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  theme: { label: "Theme", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  pacing: { label: "Pacing", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
  craft: { label: "Craft", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
};

export function IssueCard({ issue, screenplayContext }: IssueCardProps) {
  const severity = severityConfig[issue.severity];
  const category = categoryConfig[issue.category];

  return (
    <div className={`rounded-lg border p-4 ${severity.bg} ${severity.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Category Icon */}
          <div className="w-8 h-8 rounded-full bg-[#242220] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#a8a29e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={category.icon}
              />
            </svg>
          </div>
          <div>
            <h4 className="text-[#f5f5f5] font-medium text-sm">{issue.title}</h4>
            <span className="text-xs text-[#78716c]">{category.label}</span>
          </div>
        </div>

        {/* Severity Badge */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severity.badge}`}>
          {severity.label}
        </span>
      </div>

      {/* Actionable Insight */}
      <ActionableInsight
        issue={issue.description}
        issueType={issue.issueType}
        issueContext={issue.issueContext}
        screenplayContext={screenplayContext}
      />
    </div>
  );
}

/**
 * Helper to determine severity from issue type
 */
export function getSeverityFromIssueType(issueType: IssueType, context?: string): IssueSeverity {
  // Critical: Issues that break story logic
  if (issueType === "arc-regression") return "critical";
  if (issueType === "theme-disconnect" && context?.includes("protagonist")) return "critical";

  // Warning: Issues that weaken the story
  if (issueType === "floating-scene") return "warning";
  if (issueType === "floating-character") return "warning";
  if (issueType === "arc-stall") return "warning";
  if (issueType === "emotional-flat") return "warning";

  // Note: Polish opportunities
  if (issueType === "emotional-spike") return "note";
  if (issueType === "pacing-issue") return "note";

  return "note";
}

/**
 * Helper to determine category from issue type
 */
export function getCategoryFromIssueType(issueType: IssueType): IssueCategory {
  switch (issueType) {
    case "floating-scene":
    case "theme-disconnect":
      return "theme";
    case "floating-character":
    case "arc-stall":
    case "arc-regression":
      return "character";
    case "emotional-flat":
    case "emotional-spike":
    case "pacing-issue":
      return "pacing";
    default:
      return "craft";
  }
}
