"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useAI } from "@/lib/ai/context";
import type { Soul } from "@/types/screenplay";

// Fallback placeholder if AI fails
const FALLBACK_SOUL: Soul = {
  centralQuestion:
    "What central question drives your story?",
  thematicArgument:
    "What is your story arguing about life or human nature?",
  controllingIdea:
    "What value does your story express, and what causes it?",
  protagonistLie: "What false belief does your protagonist start with?",
  protagonistTruth: "What truth must your protagonist learn?",
  confirmed: false,
};

export default function SoulPage() {
  const router = useRouter();
  const { screenplay, genre, soul, setSoul, updateSoul, confirmSoul, _hasHydrated } =
    useAppStore();
  const { isConfigured: clientConfigured } = useAI();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [localSoul, setLocalSoul] = useState<Soul | null>(soul);
  const [userResponse, setUserResponse] = useState<
    "confirm" | "adjust" | "unsure" | null
  >(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);

  // Check server-side configuration on mount
  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        const response = await fetch("/api/check-config");
        if (response.ok) {
          const config = await response.json();
          setServerConfigured(config.isConfigured);
        }
      } catch (err) {
        console.error("Failed to check server config:", err);
      }
    };
    checkServerConfig();
  }, []);

  // Combined configuration status
  const isConfigured = clientConfigured || serverConfigured;

  // Redirect if prerequisites not met (only after hydration)
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!screenplay) {
      router.push("/");
    } else if (!genre?.confirmed) {
      router.push("/genre");
    }
  }, [screenplay, genre, router, _hasHydrated]);

  // Analyze screenplay with AI on first load
  useEffect(() => {
    if (!_hasHydrated) return;

    if (screenplay && genre?.confirmed && !soul && !localSoul && !isAnalyzing) {
      const analyzeWithAI = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        // Get API key from localStorage (optional - server will use env vars if not provided)
        const storageKey = "storiq-ai-config";
        const savedConfig = localStorage.getItem(storageKey);
        const clientApiKey = savedConfig ? JSON.parse(savedConfig).apiKey : null;

        try {
          const response = await fetch("/api/analyze-soul", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              screenplay: {
                title: screenplay.title,
                rawText: screenplay.rawText,
                totalPages: screenplay.totalPages,
                scenes: screenplay.scenes.map((s) => ({
                  sceneNumber: s.sceneNumber,
                  heading: s.heading,
                  content: s.content,
                })),
                characters: screenplay.characters.map((c) => ({
                  name: c.name,
                  dialogueCount: c.dialogueCount,
                })),
              },
              genre: {
                id: genre.id,
                name: genre.name,
              },
              // Only send apiKey if user configured one in Settings
              ...(clientApiKey && { apiKey: clientApiKey }),
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Analysis failed");
          }

          const soulData: Soul = await response.json();
          setLocalSoul(soulData);
          setSoul(soulData);
        } catch (error) {
          console.error("Soul analysis failed:", error);
          setAnalysisError(
            error instanceof Error
              ? error.message
              : "Failed to analyze screenplay. Using template - please fill in manually."
          );
          setLocalSoul(FALLBACK_SOUL);
          setSoul(FALLBACK_SOUL);
          setShowForm(true);
        } finally {
          setIsAnalyzing(false);
        }
      };

      analyzeWithAI();
    }
  }, [screenplay, genre, soul, localSoul, setSoul, _hasHydrated, isAnalyzing]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#78716c]">Loading...</div>
      </main>
    );
  }

  if (!screenplay || !genre?.confirmed) {
    return null;
  }

  const handleConfirm = () => {
    setUserResponse("confirm");
    if (localSoul) {
      confirmSoul();
      router.push("/analysis");
    }
  };

  const handleAdjust = () => {
    setUserResponse("adjust");
    setShowForm(true);
  };

  const handleUnsure = () => {
    setUserResponse("unsure");
    if (localSoul) {
      confirmSoul(); // Proceed with AI's guess
      router.push("/analysis");
    }
  };

  const handleFieldChange = (field: keyof Soul, value: string) => {
    if (localSoul) {
      const updated = { ...localSoul, [field]: value };
      setLocalSoul(updated);
      updateSoul({ [field]: value });
    }
  };

  const handleSaveAdjustments = () => {
    confirmSoul();
    router.push("/analysis");
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.push("/genre")}
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
          Back to Genre
        </button>

        <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">Soul Detector</h1>
        <p className="text-[#a8a29e]">
          Let me tell you what I think your screenplay is really about.
        </p>
      </div>

      {/* Error Message */}
      {analysisError && !isAnalyzing && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-amber-200 text-sm">{analysisError}</p>
                {!isConfigured && (
                  <button
                    onClick={() => router.push("/settings")}
                    className="text-amber-400 text-sm underline hover:text-amber-300 mt-2"
                  >
                    Go to Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="max-w-4xl mx-auto">
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
            <p className="text-[#a8a29e]">Analyzing your screenplay&apos;s soul with AI...</p>
            <p className="text-[#78716c] text-sm mt-2">This may take a moment...</p>
          </div>
        </div>
      )}

      {/* Soul Analysis */}
      {!isAnalyzing && localSoul && !showForm && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8">
            {/* Intro */}
            <p className="text-lg text-[#a8a29e] mb-8 italic">
              I&apos;ve read your screenplay. Let me tell you what I think it&apos;s
              about—correct me if I&apos;m wrong.
            </p>

            {/* Central Question */}
            <div className="mb-8">
              <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-2">
                The Big Question
              </h3>
              <p className="text-xl text-[#f5f5f5]">
                &ldquo;{localSoul.centralQuestion}&rdquo;
              </p>
              <p className="text-sm text-[#78716c] mt-1">
                The question your audience will hold throughout
              </p>
            </div>

            {/* Thematic Argument */}
            <div className="mb-8">
              <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-2">
                Your Argument
              </h3>
              <p className="text-lg text-[#a8a29e]">
                {localSoul.thematicArgument}
              </p>
            </div>

            {/* Controlling Idea */}
            <div className="mb-8">
              <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-2">
                Controlling Idea
              </h3>
              <p className="text-lg text-[#d4a574] italic">
                {localSoul.controllingIdea}
              </p>
            </div>

            {/* Protagonist Journey */}
            <div className="mb-8 bg-[#242220] rounded-lg p-6">
              <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-4">
                Your Protagonist&apos;s Journey
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-[#78716c] uppercase mb-1">
                    They start believing
                  </p>
                  <p className="text-[#f5f5f5]">
                    &ldquo;{localSoul.protagonistLie}&rdquo;
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#78716c] uppercase mb-1">
                    They need to learn
                  </p>
                  <p className="text-[#d4a574]">
                    &ldquo;{localSoul.protagonistTruth}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="border-t border-[#3d3a38] pt-6">
              <p className="text-lg text-[#a8a29e] mb-6">
                Does this resonate? Or am I missing something?
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-[#d4a574] text-[#0f0f0f] font-medium rounded-lg hover:bg-[#b8956e] transition-colors"
                >
                  Yes, that&apos;s it
                </button>
                <button
                  onClick={handleAdjust}
                  className="px-6 py-2.5 bg-[#242220] text-[#f5f5f5] font-medium rounded-lg hover:bg-[#3d3a38] transition-colors border border-[#3d3a38]"
                >
                  Let me adjust
                </button>
                <button
                  onClick={handleUnsure}
                  className="px-6 py-2.5 text-[#78716c] hover:text-[#a8a29e] transition-colors"
                >
                  I don&apos;t know yet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Form */}
      {showForm && localSoul && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8">
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-6">
              Refine the Soul
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-[#78716c] uppercase tracking-wide mb-2">
                  Central Dramatic Question
                </label>
                <input
                  type="text"
                  value={localSoul.centralQuestion}
                  onChange={(e) =>
                    handleFieldChange("centralQuestion", e.target.value)
                  }
                  className="w-full bg-[#242220] border border-[#3d3a38] rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#d4a574] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#78716c] uppercase tracking-wide mb-2">
                  Thematic Argument
                </label>
                <textarea
                  value={localSoul.thematicArgument}
                  onChange={(e) =>
                    handleFieldChange("thematicArgument", e.target.value)
                  }
                  rows={2}
                  className="w-full bg-[#242220] border border-[#3d3a38] rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#d4a574] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#78716c] uppercase tracking-wide mb-2">
                  Controlling Idea
                </label>
                <input
                  type="text"
                  value={localSoul.controllingIdea}
                  onChange={(e) =>
                    handleFieldChange("controllingIdea", e.target.value)
                  }
                  className="w-full bg-[#242220] border border-[#3d3a38] rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#d4a574] focus:outline-none"
                />
                <p className="text-xs text-[#78716c] mt-1">
                  Value + Cause (e.g., &quot;Love prevails when we sacrifice ego&quot;)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#78716c] uppercase tracking-wide mb-2">
                    Protagonist&apos;s Lie
                  </label>
                  <input
                    type="text"
                    value={localSoul.protagonistLie}
                    onChange={(e) =>
                      handleFieldChange("protagonistLie", e.target.value)
                    }
                    className="w-full bg-[#242220] border border-[#3d3a38] rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#d4a574] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#78716c] uppercase tracking-wide mb-2">
                    Protagonist&apos;s Truth
                  </label>
                  <input
                    type="text"
                    value={localSoul.protagonistTruth}
                    onChange={(e) =>
                      handleFieldChange("protagonistTruth", e.target.value)
                    }
                    className="w-full bg-[#242220] border border-[#3d3a38] rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#d4a574] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveAdjustments}
                  className="px-6 py-2.5 bg-[#d4a574] text-[#0f0f0f] font-medium rounded-lg hover:bg-[#b8956e] transition-colors"
                >
                  Save & Continue
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-[#78716c] hover:text-[#a8a29e] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-[#242220] rounded-lg p-4 text-sm text-[#78716c]">
          <p>
            <strong className="text-[#a8a29e]">Why this matters:</strong> Your
            screenplay&apos;s soul—its theme, argument, and character arc—is the
            foundation everything else builds on. Every scene should connect to
            this. I&apos;ll use it to evaluate thematic consistency throughout.
          </p>
        </div>
      </div>
    </main>
  );
}
