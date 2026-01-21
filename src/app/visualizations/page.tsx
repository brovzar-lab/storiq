"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { useAppStore } from "@/lib/store";
import { ThemeConstellation } from "@/visualizations/ThemeConstellation";
import { CharacterJourneyMap } from "@/visualizations/CharacterJourneyMap";
import { EmotionalWaveform } from "@/visualizations/EmotionalWaveform";
import { ActionableInsight } from "@/components/ActionableInsight";
import { fetchAIThemeConstellation, generateThemeConstellation } from "@/lib/visualizations/themeMapper";
import {
  fetchAICharacterArc,
  generateHeuristicCharacterArc,
  calculateArcHealth,
} from "@/lib/visualizations/characterJourneyMapper";
import type { ThemeConstellation as ThemeConstellationType, CharacterArc, EmotionalJourney } from "@/types/visualization";

export default function VisualizationsPage() {
  const router = useRouter();
  const { screenplay, genre, soul, sequences, _hasHydrated } = useAppStore();
  const [constellationData, setConstellationData] = useState<ThemeConstellationType | null>(null);
  const [journeyData, setJourneyData] = useState<CharacterArc | null>(null);
  const [waveformData, setWaveformData] = useState<EmotionalJourney | null>(null);
  const [activeViz, setActiveViz] = useState<"constellation" | "journey" | "waveform">("constellation");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingJourney, setIsAnalyzingJourney] = useState(false);
  const [isAnalyzingWaveform, setIsAnalyzingWaveform] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [isAIAnalyzed, setIsAIAnalyzed] = useState(false);
  const [isJourneyAIAnalyzed, setIsJourneyAIAnalyzed] = useState(false);
  const [isWaveformAIAnalyzed, setIsWaveformAIAnalyzed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Ref for visualization container (for PNG export)
  const visualizationRef = useRef<HTMLDivElement>(null);

  // Export PNG handler
  const handleExportPNG = async () => {
    if (!visualizationRef.current || !screenplay) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(visualizationRef.current, {
        backgroundColor: "#0f0f0f",
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      const vizName = activeViz === "constellation" ? "Theme_Constellation" :
                      activeViz === "journey" ? "Character_Journey" :
                      "Emotional_Waveform";
      const filename = `${screenplay.title.replace(/\s+/g, "_")}_${vizName}.png`;
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

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

  // Generate visualization data - try AI first, fall back to heuristics
  const loadConstellationData = useCallback(async () => {
    if (!screenplay || !soul?.confirmed || sequences.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Try AI-powered analysis first
      const aiData = await fetchAIThemeConstellation(screenplay, soul, sequences);
      setConstellationData(aiData);
      setIsAIAnalyzed(true);
    } catch (error) {
      console.error("AI theme analysis failed, using fallback:", error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "AI analysis unavailable, using estimated connections"
      );
      // Fall back to heuristic-based generation
      const fallbackData = generateThemeConstellation(screenplay, soul, sequences);
      setConstellationData(fallbackData);
      setIsAIAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [screenplay, soul, sequences]);

  // Load character journey data
  const loadJourneyData = useCallback(async () => {
    if (!screenplay || !soul?.confirmed || !genre || sequences.length === 0) return;

    setIsAnalyzingJourney(true);
    setJourneyError(null);

    try {
      // Try AI-powered analysis first
      const aiData = await fetchAICharacterArc(screenplay, sequences, soul, genre.id);
      setJourneyData(aiData);
      setIsJourneyAIAnalyzed(true);
    } catch (error) {
      console.error("AI journey analysis failed, using fallback:", error);
      setJourneyError(
        error instanceof Error
          ? error.message
          : "AI analysis unavailable, using estimated arc"
      );
      // Fall back to heuristic-based generation
      const fallbackData = generateHeuristicCharacterArc(screenplay, sequences, soul);
      setJourneyData(fallbackData);
      setIsJourneyAIAnalyzed(false);
    } finally {
      setIsAnalyzingJourney(false);
    }
  }, [screenplay, soul, genre, sequences]);

  // Load emotional waveform data
  const loadWaveformData = useCallback(async () => {
    if (!screenplay || !genre || sequences.length === 0) return;

    setIsAnalyzingWaveform(true);
    setWaveformError(null);

    try {
      const response = await fetch("/api/analyze-emotional-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenplay: {
            title: screenplay.title,
            scenes: screenplay.scenes,
          },
          sequences,
          genreId: genre.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze emotional journey");
      }

      const result = await response.json();

      // Transform the API response to EmotionalJourney format
      const emotionalJourney: EmotionalJourney = {
        beats: result.sequenceEmotions?.map((seq: { dominantEmotion: string; pageStart: number; intensity: number; description: string }) => ({
          sceneNumber: 0,
          page: seq.pageStart,
          emotion: seq.dominantEmotion,
          intensity: seq.intensity,
          description: seq.description,
        })) || [],
        plotPoints: result.plotPoints || [],
        overallArc: result.overallPattern || "wave",
      };

      // Store the full result for the component to use
      setWaveformData({
        ...emotionalJourney,
        sequenceEmotions: result.sequenceEmotions,
        emotionalArcSummary: result.emotionalArcSummary,
        issues: result.issues,
        strengths: result.strengths,
      } as EmotionalJourney & { sequenceEmotions: unknown[]; emotionalArcSummary: string; issues: string[]; strengths: string[] });

      setIsWaveformAIAnalyzed(true);
    } catch (error) {
      console.error("Emotional journey analysis failed:", error);
      setWaveformError(
        error instanceof Error
          ? error.message
          : "AI analysis unavailable"
      );
      // Create fallback data
      const fallbackData: EmotionalJourney = {
        beats: sequences.map((seq, i) => ({
          sceneNumber: i + 1,
          page: seq.pageStart,
          emotion: "tension" as const,
          intensity: 30 + Math.random() * 50,
          description: seq.name,
        })),
        plotPoints: [],
        overallArc: "wave",
      };
      setWaveformData(fallbackData);
      setIsWaveformAIAnalyzed(false);
    } finally {
      setIsAnalyzingWaveform(false);
    }
  }, [screenplay, genre, sequences]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (screenplay && soul?.confirmed && sequences.length > 0 && !constellationData && !isAnalyzing) {
      loadConstellationData();
    }
  }, [screenplay, soul, sequences, _hasHydrated, constellationData, isAnalyzing, loadConstellationData]);

  // Load journey data when switching to that tab
  useEffect(() => {
    if (!_hasHydrated) return;
    if (activeViz === "journey" && !journeyData && !isAnalyzingJourney && screenplay && soul?.confirmed && sequences.length > 0) {
      loadJourneyData();
    }
  }, [activeViz, journeyData, isAnalyzingJourney, screenplay, soul, sequences, _hasHydrated, loadJourneyData]);

  // Load waveform data when switching to that tab
  useEffect(() => {
    if (!_hasHydrated) return;
    if (activeViz === "waveform" && !waveformData && !isAnalyzingWaveform && screenplay && genre && sequences.length > 0) {
      loadWaveformData();
    }
  }, [activeViz, waveformData, isAnalyzingWaveform, screenplay, genre, sequences, _hasHydrated, loadWaveformData]);

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

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#3d3a38] bg-[#1a1816]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#f5f5f5]">Visualizations</h1>
              <p className="text-sm text-[#78716c]">
                {screenplay.title} • {genre.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/analysis")}
                className="px-4 py-2 text-sm text-[#78716c] hover:text-[#a8a29e] transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Visualization Tabs */}
      <div className="border-b border-[#3d3a38] bg-[#1a1816]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveViz("constellation")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeViz === "constellation"
                  ? "text-[#d4a574] border-[#d4a574]"
                  : "text-[#78716c] border-transparent hover:text-[#a8a29e]"
              }`}
            >
              Theme Constellation
            </button>
            <button
              onClick={() => setActiveViz("journey")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeViz === "journey"
                  ? "text-[#d4a574] border-[#d4a574]"
                  : "text-[#78716c] border-transparent hover:text-[#a8a29e]"
              }`}
            >
              Character Journey
            </button>
            <button
              onClick={() => setActiveViz("waveform")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeViz === "waveform"
                  ? "text-[#d4a574] border-[#d4a574]"
                  : "text-[#78716c] border-transparent hover:text-[#a8a29e]"
              }`}
            >
              Emotional Waveform
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={visualizationRef} className="max-w-7xl mx-auto p-6">
        {/* Loading State */}
        {activeViz === "constellation" && isAnalyzing && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#d4a574]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#d4a574] animate-spin"
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
              </div>
            </div>
            <p className="text-[#a8a29e]">Analyzing thematic connections with AI...</p>
            <p className="text-[#78716c] text-sm mt-2">
              Mapping how each scene and character connects to your theme
            </p>
          </div>
        )}

        {activeViz === "constellation" && constellationData && !isAnalyzing && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                    Theme Constellation
                  </h2>
                  <p className="text-[#a8a29e] text-sm mb-4">
                    This visualization shows how your story&apos;s core theme connects to sub-themes,
                    scenes, and characters. Elements that appear &ldquo;floating&rdquo; (shown in red) may
                    lack clear thematic purpose and could be opportunities for strengthening your
                    story&apos;s cohesion.
                  </p>
                </div>
                {/* AI Analysis Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isAIAnalyzed
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {isAIAnalyzed ? "AI Analyzed" : "Estimated"}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-[#78716c]">
                <div>
                  <span className="font-medium text-[#d4a574]">{soul.controllingIdea.slice(0, 60)}...</span>
                </div>
              </div>
              {/* Error/Warning Message */}
              {analysisError && !isAIAnalyzed && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-200 text-sm">
                    {analysisError}. Using pattern-based estimation instead.
                  </p>
                  <button
                    onClick={() => {
                      setConstellationData(null);
                      loadConstellationData();
                    }}
                    className="text-amber-400 text-sm underline hover:text-amber-300 mt-2"
                  >
                    Retry AI Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Visualization */}
            <div className="visualization-export-target">
              <ThemeConstellation
                data={constellationData}
                width={1200}
                height={700}
                onNodeClick={(node) => {
                  console.log("Clicked node:", node);
                }}
              />
            </div>

            {/* Insights Panel */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* What's Working */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#d4a574] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  What&apos;s Working
                </h3>
                <ul className="space-y-2 text-sm text-[#a8a29e]">
                  <li>Your core theme of &ldquo;{constellationData.coreTheme}&rdquo; is well-established</li>
                  <li>
                    {constellationData.nodes.filter((n) => n.type === "scene" && n.isConnected).length} of{" "}
                    {constellationData.nodes.filter((n) => n.type === "scene").length} scenes connect to your theme
                  </li>
                  <li>
                    {constellationData.subThemes.length} sub-themes support your central idea
                  </li>
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#78716c] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Opportunities
                </h3>
                {(() => {
                  const floating = constellationData.nodes.filter((n) => !n.isConnected);
                  if (floating.length === 0) {
                    return (
                      <p className="text-sm text-[#a8a29e]">
                        All elements are thematically connected. Great work!
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {floating.slice(0, 3).map((node) => (
                        <ActionableInsight
                          key={node.id}
                          issue={`${node.type === "scene" ? `Scene ${node.label}` : node.label} could benefit from a clearer thematic connection`}
                          issueType={node.type === "scene" ? "floating-scene" : "floating-character"}
                          issueContext={{
                            elementName: node.label,
                            elementType: node.type as "scene" | "character",
                            sceneNumber: node.type === "scene" ? parseInt(node.label) : undefined,
                          }}
                          screenplayContext={{
                            title: screenplay.title,
                            genreId: genre.id,
                            controllingIdea: soul.controllingIdea,
                            protagonistLie: soul.protagonistLie,
                            protagonistTruth: soul.protagonistTruth,
                            coreTheme: constellationData.coreTheme,
                            subThemes: constellationData.subThemes,
                          }}
                        />
                      ))}
                      {floating.length > 3 && (
                        <p className="text-[#525252] text-sm">
                          +{floating.length - 3} more elements to consider
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Character Journey Loading State */}
        {activeViz === "journey" && isAnalyzingJourney && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#d4a574]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#d4a574] animate-spin"
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
              </div>
            </div>
            <p className="text-[#a8a29e]">Analyzing protagonist&apos;s character arc...</p>
            <p className="text-[#78716c] text-sm mt-2">
              Tracking Want vs. Need, Lie vs. Truth across sequences
            </p>
          </div>
        )}

        {/* Character Journey Content */}
        {activeViz === "journey" && journeyData && !isAnalyzingJourney && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                    Character Journey Map
                  </h2>
                  <p className="text-[#a8a29e] text-sm mb-4">
                    This visualization tracks your protagonist&apos;s internal arc from Want (external goal)
                    to Need (internal growth). The vertical position shows where they are in their
                    transformation, while the color indicates the status of their core &ldquo;Lie.&rdquo;
                  </p>
                </div>
                {/* AI Analysis Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isJourneyAIAnalyzed
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {isJourneyAIAnalyzed ? "AI Analyzed" : "Estimated"}
                </div>
              </div>

              {/* Arc Summary */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#242220] rounded-lg p-4">
                  <div className="text-xs text-[#78716c] mb-1">THE LIE</div>
                  <div className="text-[#ef4444] text-sm italic">
                    &ldquo;{journeyData.lie}&rdquo;
                  </div>
                </div>
                <div className="bg-[#242220] rounded-lg p-4">
                  <div className="text-xs text-[#78716c] mb-1">THE TRUTH</div>
                  <div className="text-[#22c55e] text-sm italic">
                    &ldquo;{journeyData.truth}&rdquo;
                  </div>
                </div>
              </div>

              {/* Error/Warning Message */}
              {journeyError && !isJourneyAIAnalyzed && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-200 text-sm">
                    {journeyError}. Using pattern-based estimation instead.
                  </p>
                  <button
                    onClick={() => {
                      setJourneyData(null);
                      loadJourneyData();
                    }}
                    className="text-amber-400 text-sm underline hover:text-amber-300 mt-2"
                  >
                    Retry AI Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Visualization */}
            <div className="visualization-export-target">
              <CharacterJourneyMap
                data={journeyData}
                width={1200}
                height={450}
                onPointClick={(point) => {
                  console.log("Clicked arc point:", point);
                }}
              />
            </div>

            {/* Insights Panel */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Arc Health */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#d4a574] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Arc Strengths
                </h3>
                {(() => {
                  const { strengths } = calculateArcHealth(journeyData);
                  if (strengths.length === 0) {
                    return (
                      <p className="text-sm text-[#a8a29e]">
                        Arc analysis in progress...
                      </p>
                    );
                  }
                  return (
                    <ul className="space-y-2 text-sm text-[#a8a29e]">
                      {strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#22c55e]">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              {/* Issues */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#78716c] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Opportunities
                </h3>
                {(() => {
                  const { issues } = calculateArcHealth(journeyData);
                  if (issues.length === 0) {
                    return (
                      <p className="text-sm text-[#a8a29e]">
                        No major arc issues detected. Well done!
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {issues.slice(0, 3).map((issue, i) => (
                        <ActionableInsight
                          key={i}
                          issue={issue}
                          issueType={issue.toLowerCase().includes('stall') ? 'arc-stall' : 'arc-regression'}
                          issueContext={{
                            currentArcState: issue,
                          }}
                          screenplayContext={{
                            title: screenplay.title,
                            genreId: genre.id,
                            controllingIdea: soul.controllingIdea,
                            protagonistLie: soul.protagonistLie,
                            protagonistTruth: soul.protagonistTruth,
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Crisis Point Callout */}
            {journeyData.crisisPoint && (
              <div className="bg-[#1a1816] rounded-xl border border-[#ef4444]/30 p-6">
                <h3 className="text-[#ef4444] font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Crisis Point (Page {journeyData.crisisPoint.page})
                </h3>
                <p className="text-[#a8a29e] text-sm">
                  {journeyData.crisisPoint.description}
                </p>
                <p className="text-[#78716c] text-xs mt-2">
                  This is where Want and Need collide — the protagonist can&apos;t have both.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Emotional Waveform Loading State */}
        {activeViz === "waveform" && isAnalyzingWaveform && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#d4a574]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#d4a574] animate-spin"
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
              </div>
            </div>
            <p className="text-[#a8a29e]">Analyzing emotional journey...</p>
            <p className="text-[#78716c] text-sm mt-2">
              Mapping audience emotions across your screenplay
            </p>
          </div>
        )}

        {/* Emotional Waveform Content */}
        {activeViz === "waveform" && waveformData && !isAnalyzingWaveform && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                    Emotional Waveform
                  </h2>
                  <p className="text-[#a8a29e] text-sm mb-4">
                    This visualization shows the emotional intensity your audience experiences
                    throughout the screenplay. Peaks indicate high-intensity moments, while
                    valleys provide breathing room. Well-paced screenplays have varied intensity
                    with a clear climactic peak.
                  </p>
                </div>
                {/* AI Analysis Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isWaveformAIAnalyzed
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {isWaveformAIAnalyzed ? "AI Analyzed" : "Estimated"}
                </div>
              </div>

              {/* Error/Warning Message */}
              {waveformError && !isWaveformAIAnalyzed && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-200 text-sm">
                    {waveformError}. Using pattern-based estimation instead.
                  </p>
                  <button
                    onClick={() => {
                      setWaveformData(null);
                      loadWaveformData();
                    }}
                    className="text-amber-400 text-sm underline hover:text-amber-300 mt-2"
                  >
                    Retry AI Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Visualization */}
            <div className="visualization-export-target">
              <EmotionalWaveform
                data={waveformData}
                width={1200}
                height={500}
                onPointClick={(index) => {
                  console.log("Clicked sequence:", index);
                }}
              />
            </div>

            {/* Insights Panel */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#d4a574] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Emotional Strengths
                </h3>
                {(() => {
                  const extData = waveformData as EmotionalJourney & { strengths?: string[] };
                  const strengths = extData.strengths || [];
                  if (strengths.length === 0) {
                    return (
                      <p className="text-sm text-[#a8a29e]">
                        Your screenplay maintains emotional engagement throughout.
                      </p>
                    );
                  }
                  return (
                    <ul className="space-y-2 text-sm text-[#a8a29e]">
                      {strengths.slice(0, 4).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#22c55e]">+</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              {/* Issues/Opportunities */}
              <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
                <h3 className="text-[#78716c] font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Pacing Opportunities
                </h3>
                {(() => {
                  const extData = waveformData as EmotionalJourney & { issues?: string[] };
                  const issues = extData.issues || [];
                  if (issues.length === 0) {
                    return (
                      <p className="text-sm text-[#a8a29e]">
                        No major pacing issues detected. Good emotional rhythm!
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {issues.slice(0, 3).map((issue, i) => (
                        <ActionableInsight
                          key={i}
                          issue={issue}
                          issueType={issue.toLowerCase().includes('flat') ? 'emotional-flat' : 'pacing-issue'}
                          issueContext={{}}
                          screenplayContext={{
                            title: screenplay.title,
                            genreId: genre.id,
                            controllingIdea: soul.controllingIdea,
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Summary Card */}
            {(() => {
              const extData = waveformData as EmotionalJourney & { emotionalArcSummary?: string };
              if (!extData.emotionalArcSummary) return null;
              return (
                <div className="bg-[#1a1816] rounded-xl border border-[#d4a574]/30 p-6">
                  <h3 className="text-[#d4a574] font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Overall Emotional Arc
                  </h3>
                  <p className="text-[#a8a29e] text-sm">
                    {extData.emotionalArcSummary}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Waveform - No Data State */}
        {activeViz === "waveform" && !waveformData && !isAnalyzingWaveform && (
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d4a574]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#d4a574]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">
              Emotional Waveform
            </h2>
            <p className="text-[#78716c] mb-4">
              Analyze the emotional journey of your audience across the screenplay.
            </p>
            <button
              onClick={loadWaveformData}
              className="px-4 py-2 bg-[#d4a574] text-[#1a1816] rounded-lg hover:bg-[#c4956a] transition-colors"
            >
              Analyze Emotional Journey
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-[#3d3a38] bg-[#1a1816]/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/analysis")}
              className="px-4 py-2 text-[#78716c] hover:text-[#a8a29e] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Analysis Dashboard
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleExportPNG}
                className="px-4 py-2 bg-[#242220] text-[#a8a29e] rounded-lg hover:bg-[#2a2826] transition-colors text-sm"
              >
                Export as PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
