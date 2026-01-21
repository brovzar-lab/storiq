"use client";

import type { Scene, Sequence } from "@/types/screenplay";

interface SequenceDetailProps {
  sequence: Sequence;
  scenes: Scene[];
  onRename: (name: string) => void;
}

function ConfidenceBar({ score }: { score: number }) {
  // Score is out of 14 max
  const percentage = Math.min(100, (score / 14) * 100);
  const color =
    score >= 10
      ? "bg-green-500"
      : score >= 7
      ? "bg-[#d4a574]"
      : score >= 4
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#2e2c2a] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-[#78716c]">{score}/14</span>
    </div>
  );
}

export function SequenceDetail({ sequence, scenes, onRename }: SequenceDetailProps) {
  const sequenceScenes = scenes.filter((s) =>
    sequence.sceneNumbers.includes(s.sceneNumber)
  );

  const pageCount = sequence.pageEnd - sequence.pageStart + 1;
  const intCount = sequenceScenes.filter((s) => s.locationType === "INT").length;
  const extCount = sequenceScenes.filter((s) => s.locationType === "EXT").length;
  const hasAIData = sequence.confidenceScore !== undefined;

  return (
    <div className="bg-[#1a1816] rounded-lg border border-[#3d3a38] p-4">
      {/* Header with editable name and confidence */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-1">
          <input
            type="text"
            value={sequence.name}
            onChange={(e) => onRename(e.target.value)}
            className="
              bg-transparent text-lg font-medium text-[#f5f5f5]
              border-b border-transparent hover:border-[#3d3a38] focus:border-[#d4a574]
              outline-none transition-colors flex-1
            "
          />
          {hasAIData && sequence.confidenceScore !== undefined && (
            <div className="w-24">
              <ConfidenceBar score={sequence.confidenceScore} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#78716c]">
            Pages {sequence.pageStart}-{sequence.pageEnd} ({pageCount} pages)
          </span>
          {sequence.suggestedName && sequence.suggestedName !== sequence.name && (
            <span className="text-xs text-[#d4a574] italic">
              Suggested: {sequence.suggestedName}
            </span>
          )}
        </div>
      </div>

      {/* Dramatic Question (AI field) */}
      {sequence.dramaticQuestion && (
        <div className="mb-4 p-3 bg-[#242220] rounded-lg">
          <h4 className="text-xs text-[#78716c] uppercase tracking-wide mb-1">
            Dramatic Question
          </h4>
          <p className="text-sm text-[#a8a29e] italic">
            {sequence.dramaticQuestion}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold text-[#d4a574]">
            {sequenceScenes.length}
          </div>
          <div className="text-xs text-[#78716c]">Scenes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#f5f5f5]">
            {intCount}/{extCount}
          </div>
          <div className="text-xs text-[#78716c]">INT/EXT</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#f5f5f5]">
            {sequence.characters.length}
          </div>
          <div className="text-xs text-[#78716c]">Characters</div>
        </div>
      </div>

      {/* Scene list */}
      <div className="mb-4">
        <h4 className="text-xs text-[#78716c] uppercase tracking-wide mb-2">
          Scenes
        </h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {sequenceScenes.map((scene) => (
            <div
              key={scene.sceneNumber}
              className="text-sm text-[#a8a29e] flex items-center gap-2"
            >
              <span className="text-[#78716c] w-6">{scene.sceneNumber}.</span>
              <span
                className={`
                  px-1.5 py-0.5 rounded text-xs
                  ${
                    scene.locationType === "INT"
                      ? "bg-[#2e2c2a] text-[#a8a29e]"
                      : "bg-[#3d3a38] text-[#f5f5f5]"
                  }
                `}
              >
                {scene.locationType}
              </span>
              <span className="truncate flex-1">
                {scene.heading.replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, "").slice(0, 30)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Characters */}
      <div className="mb-4">
        <h4 className="text-xs text-[#78716c] uppercase tracking-wide mb-2">
          Characters
        </h4>
        <div className="flex flex-wrap gap-2">
          {sequence.characters.slice(0, 8).map((char) => (
            <span
              key={char}
              className="px-2 py-1 bg-[#242220] rounded text-xs text-[#a8a29e]"
            >
              {char}
            </span>
          ))}
          {sequence.characters.length > 8 && (
            <span className="px-2 py-1 text-xs text-[#78716c]">
              +{sequence.characters.length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Boundary Justification (AI field) */}
      {sequence.boundaryJustification && sequence.boundaryJustification.length > 0 && (
        <div className="pt-3 border-t border-[#2e2c2a]">
          <h4 className="text-xs text-[#78716c] uppercase tracking-wide mb-2">
            Why This Boundary
          </h4>
          <ul className="space-y-1">
            {sequence.boundaryJustification.map((reason, idx) => (
              <li key={idx} className="text-xs text-[#78716c] flex items-start gap-2">
                <span className="text-[#d4a574]">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
