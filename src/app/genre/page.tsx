"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { GenreCard } from "@/components/Genre";
import { GENRE_CONFIGS } from "@/lib/genres/config";
import type { GenreId } from "@/types/screenplay";

const GENRE_IDS: GenreId[] = [
  "cosmic-horror",
  "psychological-thriller",
  "screwball-comedy",
  "romantic-comedy",
  "action-adventure",
  "film-noir",
  "science-fiction",
  "drama",
  "slasher-horror",
  "mystery-whodunit",
];

export default function GenrePage() {
  const router = useRouter();
  const { screenplay, sequencesConfirmed, genre, setGenre, confirmGenre, _hasHydrated } =
    useAppStore();

  const [selectedGenre, setSelectedGenre] = useState<GenreId | null>(
    genre?.id || null
  );

  // Redirect if prerequisites not met (only after hydration)
  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store to hydrate

    if (!screenplay) {
      router.push("/");
    } else if (!sequencesConfirmed) {
      router.push("/sequences");
    }
  }, [screenplay, sequencesConfirmed, router, _hasHydrated]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#78716c]">Loading...</div>
      </main>
    );
  }

  if (!screenplay || !sequencesConfirmed) {
    return null;
  }

  const handleGenreSelect = (genreId: GenreId) => {
    setSelectedGenre(genreId);
    setGenre({
      id: genreId,
      name: GENRE_CONFIGS[genreId].name,
      confirmed: false,
    });
  };

  const handleConfirm = () => {
    if (selectedGenre) {
      confirmGenre();
      router.push("/soul");
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => router.push("/sequences")}
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
          Back to Sequences
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
              Select Your Genre
            </h1>
            <p className="text-[#a8a29e]">
              Genre shapes how I&apos;ll analyze your script. Choose the one that best
              fits {screenplay.title}.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedGenre}
            className={`
              px-6 py-2.5 font-medium rounded-lg transition-colors
              ${
                selectedGenre
                  ? "bg-[#d4a574] text-[#0f0f0f] hover:bg-[#b8956e]"
                  : "bg-[#3d3a38] text-[#78716c] cursor-not-allowed"
              }
            `}
          >
            Confirm Genre
          </button>
        </div>
      </div>

      {/* Genre Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GENRE_IDS.map((genreId) => (
            <GenreCard
              key={genreId}
              genreId={genreId}
              isSelected={selectedGenre === genreId}
              onClick={() => handleGenreSelect(genreId)}
            />
          ))}
        </div>
      </div>

      {/* Selected genre info */}
      {selectedGenre && (
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">
              What I&apos;ll look for in a{" "}
              <span className="text-[#d4a574]">
                {GENRE_CONFIGS[selectedGenre].name}
              </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-2">
                  Priorities
                </h3>
                <ul className="space-y-1">
                  {GENRE_CONFIGS[selectedGenre].priorities.map((priority, i) => (
                    <li key={i} className="text-sm text-[#a8a29e] flex items-start gap-2">
                      <span className="text-[#d4a574] mt-1">•</span>
                      <span className="capitalize">{priority}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm text-[#78716c] uppercase tracking-wide mb-2">
                  Red Flags I&apos;ll Watch For
                </h3>
                <ul className="space-y-1">
                  {GENRE_CONFIGS[selectedGenre].redFlags.slice(0, 4).map((flag, i) => (
                    <li key={i} className="text-sm text-[#a8a29e] flex items-start gap-2">
                      <span className="text-red-400 mt-1">⚠</span>
                      <span className="capitalize">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <p className="text-sm text-[#78716c]">
          Not sure? Pick the closest match. You can always change this in Settings later.
        </p>
      </div>
    </main>
  );
}
