"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/Upload";
import { useAppStore } from "@/lib/store";
import { parseScreenplay } from "@/lib/parser";

export default function Home() {
  const router = useRouter();
  const { setScreenplay, setLoading, setError, isLoading } = useAppStore();

  const handleFileSelect = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      try {
        const screenplay = await parseScreenplay(file);
        setScreenplay(screenplay);
        router.push("/sequences");
      } catch (err) {
        console.error("Parse error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to parse screenplay. Please try a different file."
        );
      } finally {
        setLoading(false);
      }
    },
    [setScreenplay, setLoading, setError, router]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f0f0f] via-[#131211] to-[#0f0f0f] -z-10" />

      {/* Settings Button */}
      <button
        onClick={() => router.push("/settings")}
        className="fixed top-4 right-4 p-2 text-[#78716c] hover:text-[#a8a29e] transition-colors"
        title="Settings"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="text-[#f5f5f5]">STORIQ</span>
          <span className="text-[#d4a574]"> ENGINE</span>
        </h1>
        <p className="text-xl text-[#a8a29e]">Your AI Development Partner</p>
      </div>

      {/* Upload Area */}
      <UploadZone onFileSelect={handleFileSelect} />

      {/* Features hint */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-center">
        <div className="p-4">
          <div className="text-[#d4a574] text-2xl mb-2">01</div>
          <h3 className="text-[#f5f5f5] font-medium mb-1">Structure</h3>
          <p className="text-sm text-[#78716c]">
            Genre-aware beat analysis
          </p>
        </div>
        <div className="p-4">
          <div className="text-[#d4a574] text-2xl mb-2">02</div>
          <h3 className="text-[#f5f5f5] font-medium mb-1">Character</h3>
          <p className="text-sm text-[#78716c]">
            Arc tracking & voice fingerprints
          </p>
        </div>
        <div className="p-4">
          <div className="text-[#d4a574] text-2xl mb-2">03</div>
          <h3 className="text-[#f5f5f5] font-medium mb-1">Craft</h3>
          <p className="text-sm text-[#78716c]">
            Dialogue polish & scene economy
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-4 text-center text-xs text-[#78716c]">
        <p>
          Upload your screenplay. Get honest, actionable feedback.
        </p>
      </footer>
    </main>
  );
}
