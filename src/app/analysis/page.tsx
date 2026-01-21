"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function AnalysisPage() {
  const router = useRouter();
  const { screenplay, genre, soul, _hasHydrated } = useAppStore();

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
    <main className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
          Analysis Dashboard
        </h1>
        <p className="text-[#a8a29e]">
          {screenplay.title} • {genre.name}
        </p>
      </div>

      {/* Placeholder content */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d4a574]/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#d4a574]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">
            Phase 1 Complete!
          </h2>
          <p className="text-[#a8a29e] mb-6">
            Your screenplay has been parsed and set up successfully.
          </p>

          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-8">
            <div className="bg-[#242220] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#d4a574]">
                {screenplay.scenes.length}
              </div>
              <div className="text-sm text-[#78716c]">Scenes parsed</div>
            </div>
            <div className="bg-[#242220] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#d4a574]">
                {screenplay.characters.length}
              </div>
              <div className="text-sm text-[#78716c]">Characters found</div>
            </div>
            <div className="bg-[#242220] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#d4a574]">
                {screenplay.totalPages}
              </div>
              <div className="text-sm text-[#78716c]">Pages</div>
            </div>
          </div>

          <div className="bg-[#242220] rounded-lg p-4 max-w-2xl mx-auto mb-6">
            <div className="text-sm text-[#78716c] mb-2">Soul Confirmed</div>
            <p className="text-[#d4a574] italic">
              &ldquo;{soul.controllingIdea}&rdquo;
            </p>
          </div>

          <p className="text-sm text-[#78716c] mb-6">
            The full analysis dashboard with AI-powered feedback and Writers&apos; Room
            will be built in the next phases.
          </p>

          {/* Visualizations CTA */}
          <button
            onClick={() => router.push("/visualizations")}
            className="px-6 py-3 bg-[#d4a574] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#c49664] transition-colors"
          >
            Explore Visualizations
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto mt-8 grid md:grid-cols-3 gap-4">
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
            Theme Constellation
          </h3>
          <p className="text-sm text-[#78716c]">
            Visualize how your theme connects to scenes and characters
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
          onClick={() => router.push("/genre")}
          className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6 text-left hover:border-[#d4a574]/50 transition-colors group"
        >
          <div className="w-10 h-10 mb-4 rounded-full bg-[#78716c]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="text-[#f5f5f5] font-semibold mb-1 group-hover:text-[#d4a574] transition-colors">
            Change Genre
          </h3>
          <p className="text-sm text-[#78716c]">
            Update the genre lens for analysis
          </p>
        </button>
      </div>

      {/* Secondary Navigation */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm text-[#78716c] hover:text-[#a8a29e] transition-colors"
          >
            Upload New Script
          </button>
          <button
            onClick={() => router.push("/soul")}
            className="px-4 py-2 text-sm text-[#78716c] hover:text-[#a8a29e] transition-colors"
          >
            Edit Soul
          </button>
        </div>
      </div>
    </main>
  );
}
