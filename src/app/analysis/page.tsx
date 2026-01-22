"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { IssueCard } from "@/components/Analysis/IssueCard";
import {
  aggregateAllIssues,
  getIssueCounts,
  getIssuesByCategory,
  calculateHealthScore,
} from "@/lib/analysis/issueAggregator";
import { fetchAIThemeConstellation, generateThemeConstellation } from "@/lib/visualizations/themeMapper";
import {
  fetchAICharacterArc,
  generateHeuristicCharacterArc,
  calculateArcHealth,
} from "@/lib/visualizations/characterJourneyMapper";
import type { ThemeConstellation, CharacterArc, EmotionalJourney } from "@/types/visualization";

type AnalysisStatus = "idle" | "analyzing" | "complete" | "error";
type CategoryFilter = "all" | "theme" | "character" | "pacing" | "structure" | "craft";

export default function AnalysisPage() {
  const router = useRouter();
  const { screenplay, genre, soul, sequences, _hasHydrated } = useAppStore();

  // Analysis data
  const [themeData, setThemeData] = useState<ThemeConstellation | null>(null);
  const [characterData, setCharacterData] = useState<CharacterArc | null>(null);
  const [emotionalData, setEmotionalData] = useState<(EmotionalJourney & { issues?: string[]; strengths?: string[] }) | null>(null);

  // Analysis status
  const [themeStatus, setThemeStatus] = useState<AnalysisStatus>("idle");
  const [characterStatus, setCharacterStatus] = useState<AnalysisStatus>("idle");
  const [emotionalStatus, setEmotionalStatus] = useState<AnalysisStatus>("idle");

  // UI state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showAIBadges, setShowAIBadges] = useState({
    theme: false,
    character: false,
    emotional: false,
  });

  // Redirect if prerequisites not met (only after hydration)
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!screenplay) {
      router.push("/");
    } else if (!genre?.confirmed) {
      router.push("/genre");
    } else if (!soul?.confirmed) {
      router.push("/soul");
    }
  }, [screenplay, genre, soul, router, _hasHydrated]);

  // Run theme analysis
  const runThemeAnalysis = useCallback(async () => {
    if (!screenplay || !soul?.confirmed || sequences.length === 0) return;

    setThemeStatus("analyzing");
    try {
      const data = await fetchAIThemeConstellation(screenplay, soul, sequences);
      setThemeData(data);
      setShowAIBadges((prev) => ({ ...prev, theme: true }));
      setThemeStatus("complete");
    } catch (error) {
      console.error("Theme analysis failed:", error);
      const fallback = generateThemeConstellation(screenplay, soul, sequences);
      setThemeData(fallback);
      setShowAIBadges((prev) => ({ ...prev, theme: false }));
      setThemeStatus("complete");
    }
  }, [screenplay, soul, sequences]);

  // Run character analysis
  const runCharacterAnalysis = useCallback(async () => {
    if (!screenplay || !soul?.confirmed || !genre || sequences.length === 0) return;

    setCharacterStatus("analyzing");
    try {
      const data = await fetchAICharacterArc(screenplay, sequences, soul, genre.id);
      setCharacterData(data);
      setShowAIBadges((prev) => ({ ...prev, character: true }));
      setCharacterStatus("complete");
    } catch (error) {
      console.error("Character analysis failed:", error);
      const fallback = generateHeuristicCharacterArc(screenplay, sequences, soul);
      setCharacterData(fallback);
      setShowAIBadges((prev) => ({ ...prev, character: false }));
      setCharacterStatus("complete");
    }
  }, [screenplay, soul, genre, sequences]);

  // Run emotional analysis
  const runEmotionalAnalysis = useCallback(async () => {
    if (!screenplay || !genre || sequences.length === 0) return;

    setEmotionalStatus("analyzing");
    try {
      const response = await fetch("/api/analyze-emotional-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenplay: { title: screenplay.title, scenes: screenplay.scenes },
          sequences,
          genreId: genre.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze emotional journey");

      const result = await response.json();
      const emotionalJourney: EmotionalJourney & { issues?: string[]; strengths?: string[] } = {
        beats: result.sequenceEmotions?.map((seq: { dominantEmotion: string; pageStart: number; intensity: number; description: string }) => ({
          sceneNumber: 0,
          page: seq.pageStart,
          emotion: seq.dominantEmotion,
          intensity: seq.intensity,
          description: seq.description,
        })) || [],
        plotPoints: result.plotPoints || [],
        overallArc: result.overallPattern || "wave",
        issues: result.issues || [],
        strengths: result.strengths || [],
      };

      setEmotionalData(emotionalJourney);
      setShowAIBadges((prev) => ({ ...prev, emotional: true }));
      setEmotionalStatus("complete");
    } catch (error) {
      console.error("Emotional analysis failed:", error);
      // Create fallback
      const fallback: EmotionalJourney & { issues?: string[]; strengths?: string[] } = {
        beats: sequences.map((seq, i) => ({
          sceneNumber: i + 1,
          page: seq.pageStart,
          emotion: "tension" as const,
          intensity: 30 + Math.random() * 50,
          description: seq.name,
        })),
        plotPoints: [],
        overallArc: "wave",
        issues: [],
        strengths: [],
      };
      setEmotionalData(fallback);
      setShowAIBadges((prev) => ({ ...prev, emotional: false }));
      setEmotionalStatus("complete");
    }
  }, [screenplay, genre, sequences]);

  // Run all analyses on mount
  useEffect(() => {
    if (!_hasHydrated || !screenplay || !soul?.confirmed || !genre?.confirmed) return;

    // Run analyses in parallel
    if (themeStatus === "idle") runThemeAnalysis();
    if (characterStatus === "idle") runCharacterAnalysis();
    if (emotionalStatus === "idle") runEmotionalAnalysis();
  }, [
    _hasHydrated,
    screenplay,
    soul,
    genre,
    themeStatus,
    characterStatus,
    emotionalStatus,
    runThemeAnalysis,
    runCharacterAnalysis,
    runEmotionalAnalysis,
  ]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#78716c]">Loading...</div>
      </main>
    );
  }

  if (!screenplay || !genre?.confirmed || !soul?.confirmed) {
    return null;
  }

  // Aggregate issues
  const allIssues = aggregateAllIssues(themeData, characterData, emotionalData);
  const issueCounts = getIssueCounts(allIssues);
  const issuesByCategory = getIssuesByCategory(allIssues);
  const healthScore = calculateHealthScore(allIssues, themeData, characterData);

  // Filter issues
  const filteredIssues =
    categoryFilter === "all"
      ? allIssues
      : issuesByCategory[categoryFilter] || [];

  // Analysis progress
  const isAnalyzing = themeStatus === "analyzing" || characterStatus === "analyzing" || emotionalStatus === "analyzing";
  const analysisComplete = themeStatus === "complete" && characterStatus === "complete" && emotionalStatus === "complete";

  // Screen context for ActionableInsight
  const screenplayContext = {
    title: screenplay.title,
    genreId: genre.id,
    controllingIdea: soul.controllingIdea,
    protagonistLie: soul.protagonistLie,
    protagonistTruth: soul.protagonistTruth,
    coreTheme: themeData?.coreTheme,
    subThemes: themeData?.subThemes,
  };

  // Arc health for display
  const arcHealth = characterData ? calculateArcHealth(characterData) : null;

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#3d3a38] bg-[#1a1816]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#f5f5f5]">Analysis Dashboard</h1>
              <p className="text-sm text-[#78716c]">
                {screenplay.title} • {genre.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/visualizations")}
                className="px-4 py-2 bg-[#d4a574] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#c49664] transition-colors text-sm"
              >
                View Visualizations
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="px-4 py-2 text-[#78716c] hover:text-[#a8a29e] transition-colors text-sm"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[#d4a574] animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div>
                <p className="text-[#f5f5f5] text-sm font-medium">Running AI Analysis...</p>
                <p className="text-[#78716c] text-xs">
                  {themeStatus === "analyzing" && "Analyzing theme connections... "}
                  {characterStatus === "analyzing" && "Analyzing character arc... "}
                  {emotionalStatus === "analyzing" && "Analyzing emotional journey... "}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Health Score */}
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="text-xs text-[#78716c] mb-1">Health Score</div>
            <div className={`text-3xl font-bold ${
              healthScore >= 70 ? "text-green-400" :
              healthScore >= 50 ? "text-amber-400" : "text-red-400"
            }`}>
              {analysisComplete ? healthScore : "--"}
            </div>
          </div>

          {/* Scenes */}
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="text-xs text-[#78716c] mb-1">Scenes</div>
            <div className="text-3xl font-bold text-[#d4a574]">{screenplay.scenes.length}</div>
          </div>

          {/* Characters */}
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="text-xs text-[#78716c] mb-1">Characters</div>
            <div className="text-3xl font-bold text-[#d4a574]">{screenplay.characters.length}</div>
          </div>

          {/* Pages */}
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="text-xs text-[#78716c] mb-1">Pages</div>
            <div className="text-3xl font-bold text-[#d4a574]">{screenplay.totalPages}</div>
          </div>

          {/* Issues */}
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-4">
            <div className="text-xs text-[#78716c] mb-1">Issues Found</div>
            <div className="text-3xl font-bold text-[#f5f5f5]">
              {analysisComplete ? issueCounts.total : "--"}
            </div>
          </div>
        </div>

        {/* Issue Summary Cards */}
        {analysisComplete && issueCounts.total > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {/* Critical */}
            <div className={`rounded-xl border p-4 ${
              issueCounts.critical > 0
                ? "bg-red-500/10 border-red-500/30"
                : "bg-[#1a1816] border-[#3d3a38]"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#78716c] mb-1">Critical</div>
                  <div className={`text-2xl font-bold ${issueCounts.critical > 0 ? "text-red-400" : "text-[#525252]"}`}>
                    {issueCounts.critical}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  issueCounts.critical > 0 ? "bg-red-500/20" : "bg-[#242220]"
                }`}>
                  <svg className={`w-5 h-5 ${issueCounts.critical > 0 ? "text-red-400" : "text-[#525252]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-[#78716c] mt-2">
                {issueCounts.critical > 0 ? "Story logic issues" : "No critical issues"}
              </p>
            </div>

            {/* Warnings */}
            <div className={`rounded-xl border p-4 ${
              issueCounts.warning > 0
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-[#1a1816] border-[#3d3a38]"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#78716c] mb-1">Warnings</div>
                  <div className={`text-2xl font-bold ${issueCounts.warning > 0 ? "text-amber-400" : "text-[#525252]"}`}>
                    {issueCounts.warning}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  issueCounts.warning > 0 ? "bg-amber-500/20" : "bg-[#242220]"
                }`}>
                  <svg className={`w-5 h-5 ${issueCounts.warning > 0 ? "text-amber-400" : "text-[#525252]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-[#78716c] mt-2">
                {issueCounts.warning > 0 ? "Areas to strengthen" : "No warnings"}
              </p>
            </div>

            {/* Notes */}
            <div className={`rounded-xl border p-4 ${
              issueCounts.note > 0
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-[#1a1816] border-[#3d3a38]"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#78716c] mb-1">Notes</div>
                  <div className={`text-2xl font-bold ${issueCounts.note > 0 ? "text-blue-400" : "text-[#525252]"}`}>
                    {issueCounts.note}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  issueCounts.note > 0 ? "bg-blue-500/20" : "bg-[#242220]"
                }`}>
                  <svg className={`w-5 h-5 ${issueCounts.note > 0 ? "text-blue-400" : "text-[#525252]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-[#78716c] mt-2">
                {issueCounts.note > 0 ? "Polish opportunities" : "No notes"}
              </p>
            </div>
          </div>
        )}

        {/* Soul/Theme Summary */}
        <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Story Soul</h2>
            <button
              onClick={() => router.push("/soul")}
              className="text-xs text-[#d4a574] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#78716c] mb-1">Controlling Idea</div>
              <p className="text-[#a8a29e] text-sm italic">&ldquo;{soul.controllingIdea}&rdquo;</p>
            </div>
            <div>
              <div className="text-xs text-[#78716c] mb-1">Central Question</div>
              <p className="text-[#a8a29e] text-sm">{soul.centralQuestion}</p>
            </div>
          </div>
          {themeData && (
            <div className="mt-4 pt-4 border-t border-[#3d3a38]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#78716c]">Core Theme:</span>
                <span className="text-[#d4a574] font-medium">{themeData.coreTheme}</span>
                {showAIBadges.theme && (
                  <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">AI</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {themeData.subThemes.map((theme, i) => (
                  <span key={i} className="px-2 py-1 bg-[#242220] rounded text-xs text-[#a8a29e]">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Character Arc Summary */}
        {characterData && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#f5f5f5]">
                Character Arc: {characterData.characterName}
              </h2>
              <div className="flex items-center gap-2">
                {showAIBadges.character && (
                  <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">AI</span>
                )}
                <button
                  onClick={() => router.push("/visualizations")}
                  className="text-xs text-[#d4a574] hover:underline"
                >
                  View Journey
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#242220] rounded-lg p-3">
                <div className="text-xs text-[#78716c] mb-1">The Lie</div>
                <p className="text-red-400 text-sm italic">&ldquo;{characterData.lie}&rdquo;</p>
              </div>
              <div className="bg-[#242220] rounded-lg p-3">
                <div className="text-xs text-[#78716c] mb-1">The Truth</div>
                <p className="text-green-400 text-sm italic">&ldquo;{characterData.truth}&rdquo;</p>
              </div>
            </div>
            {arcHealth && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#78716c]">Arc Health:</span>
                  <span className={`font-bold ${
                    arcHealth.score >= 70 ? "text-green-400" :
                    arcHealth.score >= 50 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {arcHealth.score}%
                  </span>
                </div>
                {arcHealth.strengths.length > 0 && (
                  <span className="text-xs text-green-400">
                    + {arcHealth.strengths.length} strength{arcHealth.strengths.length !== 1 ? "s" : ""}
                  </span>
                )}
                {arcHealth.issues.length > 0 && (
                  <span className="text-xs text-amber-400">
                    {arcHealth.issues.length} issue{arcHealth.issues.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Issues Section */}
        {analysisComplete && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#f5f5f5]">
                Issues & Opportunities
              </h2>
              <div className="flex items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="bg-[#242220] border border-[#3d3a38] rounded px-3 py-1 text-sm text-[#a8a29e] focus:outline-none focus:border-[#d4a574]"
                >
                  <option value="all">All Categories</option>
                  <option value="theme">Theme</option>
                  <option value="character">Character</option>
                  <option value="pacing">Pacing</option>
                  <option value="structure">Structure</option>
                  <option value="craft">Craft</option>
                </select>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#a8a29e]">
                  {categoryFilter === "all"
                    ? "No issues found! Your screenplay is in great shape."
                    : `No ${categoryFilter} issues found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    screenplayContext={screenplayContext}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/visualizations")}
            className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6 text-left hover:border-[#d4a574]/50 transition-colors group"
          >
            <div className="w-10 h-10 mb-4 rounded-full bg-[#d4a574]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#d4a574]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-[#f5f5f5] font-semibold mb-1 group-hover:text-[#d4a574] transition-colors">
              Visualizations
            </h3>
            <p className="text-sm text-[#78716c]">
              Explore theme constellation, character journey, and emotional waveform
            </p>
          </button>

          <button
            onClick={() => router.push("/sequences")}
            className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6 text-left hover:border-[#d4a574]/50 transition-colors group"
          >
            <div className="w-10 h-10 mb-4 rounded-full bg-[#78716c]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-[#f5f5f5] font-semibold mb-1 group-hover:text-[#d4a574] transition-colors">
              Edit Sequences
            </h3>
            <p className="text-sm text-[#78716c]">
              Adjust your screenplay&apos;s sequence structure
            </p>
          </button>

          <button
            onClick={() => router.push("/")}
            className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6 text-left hover:border-[#d4a574]/50 transition-colors group"
          >
            <div className="w-10 h-10 mb-4 rounded-full bg-[#78716c]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-[#f5f5f5] font-semibold mb-1 group-hover:text-[#d4a574] transition-colors">
              Upload New Script
            </h3>
            <p className="text-sm text-[#78716c]">
              Analyze a different screenplay
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
