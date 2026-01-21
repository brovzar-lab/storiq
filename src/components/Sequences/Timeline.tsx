"use client";

import { useMemo } from "react";
import type { Scene, Sequence } from "@/types/screenplay";

interface TimelineProps {
  scenes: Scene[];
  sequences: Sequence[];
  totalPages: number;
  onSequenceClick?: (sequence: Sequence) => void;
  selectedSequenceId?: string;
}

// Sequence colors
const SEQUENCE_COLORS = [
  "#d4a574", // amber
  "#60a5fa", // blue
  "#4ade80", // green
  "#f472b6", // pink
  "#a78bfa", // purple
  "#fbbf24", // yellow
  "#34d399", // emerald
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // fuchsia
];

export function Timeline({
  scenes,
  sequences,
  totalPages,
  onSequenceClick,
  selectedSequenceId,
}: TimelineProps) {
  // Map scenes to their sequence
  const sceneToSequence = useMemo(() => {
    const map = new Map<number, { sequence: Sequence; index: number }>();
    sequences.forEach((seq, index) => {
      seq.sceneNumbers.forEach((sceneNum) => {
        map.set(sceneNum, { sequence: seq, index });
      });
    });
    return map;
  }, [sequences]);

  // Calculate scene widths proportional to page length
  const sceneWidths = useMemo(() => {
    return scenes.map((scene) => {
      const pages = scene.pageEnd - scene.pageStart + 1;
      return Math.max(pages / totalPages * 100, 1); // minimum 1% width
    });
  }, [scenes, totalPages]);

  return (
    <div className="w-full">
      {/* Page markers */}
      <div className="flex justify-between text-xs text-[#78716c] mb-2 px-1">
        <span>p.1</span>
        <span>p.{Math.round(totalPages / 4)}</span>
        <span>p.{Math.round(totalPages / 2)}</span>
        <span>p.{Math.round((totalPages * 3) / 4)}</span>
        <span>p.{totalPages}</span>
      </div>

      {/* Timeline */}
      <div className="relative flex h-12 bg-[#1a1816] rounded-lg overflow-hidden border border-[#3d3a38]">
        {scenes.map((scene, i) => {
          const seqData = sceneToSequence.get(scene.sceneNumber);
          const color = seqData
            ? SEQUENCE_COLORS[seqData.index % SEQUENCE_COLORS.length]
            : "#78716c";
          const isSelected = seqData?.sequence.id === selectedSequenceId;
          const isInt = scene.locationType === "INT";

          return (
            <div
              key={scene.sceneNumber}
              className={`
                relative h-full transition-all duration-200 cursor-pointer
                group
                ${isSelected ? "z-10" : ""}
              `}
              style={{
                width: `${sceneWidths[i]}%`,
                backgroundColor: isInt
                  ? `color-mix(in srgb, ${color} 70%, black)`
                  : color,
                opacity: isSelected ? 1 : 0.8,
              }}
              onClick={() => seqData && onSequenceClick?.(seqData.sequence)}
            >
              {/* Hover tooltip */}
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  bg-[#242220] text-[#f5f5f5] text-xs px-2 py-1 rounded
                  whitespace-nowrap pointer-events-none
                  opacity-0 group-hover:opacity-100 transition-opacity
                  z-20
                "
              >
                Scene {scene.sceneNumber}
                <br />
                <span className="text-[#78716c]">{scene.heading.slice(0, 40)}...</span>
              </div>

              {/* Divider line between sequences */}
              {i > 0 && sceneToSequence.get(scenes[i - 1].sceneNumber)?.sequence.id !== seqData?.sequence.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0f0f0f]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Sequence labels */}
      <div className="flex mt-2">
        {sequences.map((seq, index) => {
          const startScene = scenes.find((s) => s.sceneNumber === seq.sceneNumbers[0]);
          const endScene = scenes.find(
            (s) => s.sceneNumber === seq.sceneNumbers[seq.sceneNumbers.length - 1]
          );
          if (!startScene || !endScene) return null;

          const startIndex = scenes.indexOf(startScene);
          const endIndex = scenes.indexOf(endScene);
          const width = sceneWidths
            .slice(startIndex, endIndex + 1)
            .reduce((a, b) => a + b, 0);

          const leftOffset = sceneWidths.slice(0, startIndex).reduce((a, b) => a + b, 0);

          return (
            <div
              key={seq.id}
              className={`
                absolute text-xs transition-all cursor-pointer
                ${selectedSequenceId === seq.id ? "text-[#f5f5f5]" : "text-[#78716c]"}
              `}
              style={{
                left: `${leftOffset}%`,
                width: `${width}%`,
                top: "4rem",
              }}
              onClick={() => onSequenceClick?.(seq)}
            >
              <div className="flex items-center justify-center gap-1 truncate px-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SEQUENCE_COLORS[index % SEQUENCE_COLORS.length] }}
                />
                <span className="truncate">{seq.name}</span>
                <span className="text-[#78716c]">
                  ({seq.pageEnd - seq.pageStart + 1}p)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
