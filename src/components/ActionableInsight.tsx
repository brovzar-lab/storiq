"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type IssueType =
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

interface ActionableInsightProps {
  issue: string;
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

interface SuggestFixResponse {
  suggestion: string;
  specificActions: string[];
  exampleDialogue?: string;
  question?: string;
}

export function ActionableInsight({
  issue,
  issueType,
  issueContext,
  screenplayContext,
}: ActionableInsightProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestFixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSuggestFix = async () => {
    if (suggestion) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/suggest-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          issueContext,
          screenplayContext,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to get suggestion");
      }

      const result: SuggestFixResponse = await response.json();
      setSuggestion(result);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWritersRoom = () => {
    // Store context in sessionStorage for Writers' Room to pick up
    const context = {
      issue,
      issueType,
      issueContext,
      suggestion,
    };
    sessionStorage.setItem("writersRoomContext", JSON.stringify(context));
    router.push("/analysis?openWritersRoom=true");
  };

  return (
    <div className="space-y-2">
      {/* Issue Text */}
      <div className="flex items-start gap-2">
        <span className="text-[#f59e0b]">•</span>
        <div className="flex-1">
          <span className="text-[#a8a29e]">{issue}</span>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSuggestFix}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-[#d4a574]/20 text-[#d4a574] rounded hover:bg-[#d4a574]/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Thinking..." : suggestion ? (isExpanded ? "Hide" : "Show Suggestion") : "Suggest Fix"}
            </button>
            <button
              onClick={handleOpenWritersRoom}
              className="text-xs px-3 py-1 bg-[#3d3a38] text-[#a8a29e] rounded hover:bg-[#525252] transition-colors"
            >
              Work on this
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ml-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Suggestion Panel */}
      {suggestion && isExpanded && (
        <div className="ml-4 p-4 bg-[#242220] rounded-lg border border-[#d4a574]/20 space-y-3">
          {/* Main Suggestion */}
          <p className="text-[#f5f5f5] text-sm">{suggestion.suggestion}</p>

          {/* Specific Actions */}
          {suggestion.specificActions.length > 0 && (
            <div>
              <div className="text-xs text-[#78716c] mb-1">TRY THIS:</div>
              <ul className="space-y-1">
                {suggestion.specificActions.map((action, i) => (
                  <li key={i} className="text-sm text-[#a8a29e] flex items-start gap-2">
                    <span className="text-[#d4a574]">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Example Dialogue */}
          {suggestion.exampleDialogue && (
            <div>
              <div className="text-xs text-[#78716c] mb-1">EXAMPLE:</div>
              <div className="p-2 bg-[#1a1816] rounded text-sm text-[#a8a29e] italic font-mono">
                {suggestion.exampleDialogue}
              </div>
            </div>
          )}

          {/* Socratic Question */}
          {suggestion.question && (
            <div className="pt-2 border-t border-[#3d3a38]">
              <p className="text-sm text-[#d4a574] italic">
                {suggestion.question}
              </p>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={() => {
              const text = `${suggestion.suggestion}\n\n${suggestion.specificActions.join('\n')}\n\n${suggestion.question || ''}`;
              navigator.clipboard.writeText(text);
            }}
            className="text-xs px-3 py-1 bg-[#3d3a38] text-[#78716c] rounded hover:bg-[#525252] transition-colors"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
