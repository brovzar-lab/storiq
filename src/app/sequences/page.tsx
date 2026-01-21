"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { generateAISequenceSuggestions, generateSequenceSuggestions } from "@/lib/sequences";
import { Timeline, SequenceDetail } from "@/components/Sequences";
import type { Sequence } from "@/types/screenplay";

export default function SequencesPage() {
  const router = useRouter();
  const {
    screenplay,
    sequences,
    setSequences,
    updateSequence,
    confirmSequences,
    _hasHydrated,
  } = useAppStore();

  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [usedAI, setUsedAI] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Redirect if no screenplay (only after hydration)
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!screenplay) {
      router.push("/");
    }
  }, [screenplay, router, _hasHydrated]);

  // Generate sequences with AI
  const analyzeWithAI = useCallback(async () => {
    if (!screenplay) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await generateAISequenceSuggestions(
        screenplay.scenes,
        screenplay.totalPages,
        screenplay.title
      );

      setSequences(result.sequences);
      setUsedAI(result.usedAI);

      if (result.sequences.length > 0) {
        setSelectedSequence(result.sequences[0]);
      }

      if (!result.usedAI) {
        setAnalysisError("AI analysis unavailable. Using heuristic fallback.");
      }
    } catch (error) {
      console.error("Sequence analysis error:", error);
      setAnalysisError("Analysis failed. Using heuristic fallback.");
      // Fallback to basic generation
      const fallback = generateSequenceSuggestions(screenplay.scenes, screenplay.totalPages);
      setSequences(fallback);
      setUsedAI(false);
      if (fallback.length > 0) {
        setSelectedSequence(fallback[0]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [screenplay, setSequences]);

  // Auto-generate sequences on first load
  useEffect(() => {
    if (!_hasHydrated) return;

    if (screenplay && sequences.length === 0) {
      analyzeWithAI();
    } else if (sequences.length > 0 && !selectedSequence) {
      setSelectedSequence(sequences[0]);
      // Check if existing sequences have AI fields to set usedAI flag
      if (sequences[0].confidenceScore !== undefined) {
        setUsedAI(true);
      }
    }
  }, [screenplay, sequences, selectedSequence, _hasHydrated, analyzeWithAI]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#78716c]">Loading...</div>
      </main>
    );
  }

  if (!screenplay) {
    return null;
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a574] mx-auto mb-4"></div>
          <div className="text-[#f5f5f5] font-medium mb-2">Analyzing Screenplay Structure</div>
          <div className="text-[#78716c] text-sm">
            Applying 6-layer sequence detection methodology...
          </div>
        </div>
      </main>
    );
  }

  const handleSequenceClick = (seq: Sequence) => {
    setSelectedSequence(seq);
  };

  const handleRename = (name: string) => {
    if (selectedSequence) {
      updateSequence(selectedSequence.id, { name });
      setSelectedSequence({ ...selectedSequence, name });
    }
  };

  const handleConfirm = () => {
    confirmSequences();
    router.push("/genre");
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-[#78716c] hover:text-[#a8a29e] text-sm mb-4 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
              Sequence Builder
              {usedAI && (
                <span className="ml-3 px-2 py-1 bg-[#2e2c2a] text-[#d4a574] text-xs font-normal rounded">
                  AI-Powered
                </span>
              )}
            </h1>
            <p className="text-[#a8a29e]">
              {screenplay.title} — {screenplay.totalPages} pages,{" "}
              {screenplay.scenes.length} scenes
            </p>
            {analysisError && (
              <p className="text-sm text-[#f59e0b] mt-1">{analysisError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="
                px-4 py-2.5 bg-[#2e2c2a] text-[#a8a29e] font-medium rounded-lg
                hover:bg-[#3d3a38] hover:text-[#f5f5f5] transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Re-analyze
            </button>
            <button
              onClick={handleConfirm}
              className="
                px-6 py-2.5 bg-[#d4a574] text-[#0f0f0f] font-medium rounded-lg
                hover:bg-[#b8956e] transition-colors
              "
            >
              Confirm Sequences
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
          <h2 className="text-sm text-[#78716c] uppercase tracking-wide mb-4">
            Timeline
          </h2>
          <div className="relative pb-8">
            <Timeline
              scenes={screenplay.scenes}
              sequences={sequences}
              totalPages={screenplay.totalPages}
              selectedSequenceId={selectedSequence?.id}
              onSequenceClick={handleSequenceClick}
            />
          </div>
        </div>
      </div>

      {/* Sequence Details Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm text-[#78716c] uppercase tracking-wide mb-4">
          Sequences ({sequences.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              onClick={() => setSelectedSequence(seq)}
              className={`
                cursor-pointer transition-all
                ${
                  selectedSequence?.id === seq.id
                    ? "ring-2 ring-[#d4a574] ring-offset-2 ring-offset-[#0f0f0f]"
                    : ""
                }
              `}
            >
              <SequenceDetail
                sequence={seq}
                scenes={screenplay.scenes}
                onRename={selectedSequence?.id === seq.id ? handleRename : () => {}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <p className="text-sm text-[#78716c]">
          Click a sequence to view details. You can rename sequences by clicking
          on their names.
        </p>
      </div>
    </main>
  );
}
