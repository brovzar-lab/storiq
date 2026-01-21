"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { EmotionType, PlotPoint, EmotionalJourney } from "@/types/visualization";

interface EmotionalWaveformProps {
  data: EmotionalJourney;
  width?: number;
  height?: number;
  onPointClick?: (sequenceIndex: number) => void;
}

// Emotion colors based on the UX doc
const EMOTION_COLORS: Record<EmotionType, string> = {
  tension: "#f59e0b", // Amber
  fear: "#7c3aed", // Purple
  joy: "#22c55e", // Green
  triumph: "#eab308", // Yellow/Gold
  sadness: "#3b82f6", // Blue
  anger: "#ef4444", // Red
  hope: "#06b6d4", // Cyan
  dread: "#6b21a8", // Dark purple
  relief: "#10b981", // Emerald
  surprise: "#f97316", // Orange
};

// Plot point markers
const PLOT_POINT_LABELS: Record<PlotPoint["type"], string> = {
  "inciting-incident": "Inciting Incident",
  "midpoint": "Midpoint",
  "climax": "Climax",
  "resolution": "Resolution",
  "plot-point-1": "Plot Point 1",
  "plot-point-2": "Plot Point 2",
};

interface EmotionalBeat {
  sequenceId: string;
  sequenceName: string;
  pageStart: number;
  pageEnd: number;
  dominantEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  intensity: number;
  description: string;
  keyMoment?: string;
}

interface ExtendedEmotionalJourney extends EmotionalJourney {
  sequenceEmotions?: EmotionalBeat[];
}

export function EmotionalWaveform({
  data,
  width = 1200,
  height = 500,
  onPointClick,
}: EmotionalWaveformProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Use sequenceEmotions if available, otherwise fall back to beats
  const extendedData = data as ExtendedEmotionalJourney;
  const emotionalData: EmotionalBeat[] = extendedData.sequenceEmotions || data.beats.map((beat, i) => ({
    sequenceId: `seq-${i}`,
    sequenceName: `Sequence ${i + 1}`,
    pageStart: beat.page,
    pageEnd: beat.page + 10,
    dominantEmotion: beat.emotion,
    intensity: beat.intensity,
    description: beat.description,
    keyMoment: undefined,
  }));

  useEffect(() => {
    if (!svgRef.current || !emotionalData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 50, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Background
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#1a1816")
      .attr("rx", 8);

    // X scale - based on page numbers
    const totalPages = emotionalData.length > 0
      ? emotionalData[emotionalData.length - 1].pageEnd
      : 100;

    const xScale = d3
      .scaleLinear()
      .domain([0, totalPages])
      .range([0, innerWidth]);

    // Y scale - intensity (0-100)
    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Draw intensity zones (background gradient bands)
    const zones = [
      { y: 0, height: 20, label: "Low", color: "rgba(120, 113, 108, 0.1)" },
      { y: 20, height: 20, label: "Building", color: "rgba(212, 165, 116, 0.05)" },
      { y: 40, height: 20, label: "Moderate", color: "rgba(212, 165, 116, 0.1)" },
      { y: 60, height: 20, label: "High", color: "rgba(212, 165, 116, 0.15)" },
      { y: 80, height: 20, label: "Peak", color: "rgba(212, 165, 116, 0.2)" },
    ];

    zones.forEach((zone) => {
      g.append("rect")
        .attr("x", 0)
        .attr("y", yScale(zone.y + zone.height))
        .attr("width", innerWidth)
        .attr("height", yScale(zone.y) - yScale(zone.y + zone.height))
        .attr("fill", zone.color);
    });

    // Draw act dividers (estimated for a 100-page script)
    const actBreaks = [
      { page: totalPages * 0.25, label: "ACT 1", sublabel: "Setup" },
      { page: totalPages * 0.75, label: "ACT 2", sublabel: "Confrontation" },
      { page: totalPages, label: "ACT 3", sublabel: "Resolution" },
    ];

    actBreaks.forEach((act, i) => {
      if (i < actBreaks.length - 1) {
        g.append("line")
          .attr("x1", xScale(act.page))
          .attr("y1", 0)
          .attr("x2", xScale(act.page))
          .attr("y2", innerHeight)
          .attr("stroke", "#3d3a38")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");
      }
    });

    // Act labels at bottom
    g.append("text")
      .attr("x", xScale(totalPages * 0.125))
      .attr("y", innerHeight + 25)
      .attr("fill", "#78716c")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .text("ACT 1");

    g.append("text")
      .attr("x", xScale(totalPages * 0.5))
      .attr("y", innerHeight + 25)
      .attr("fill", "#78716c")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .text("ACT 2");

    g.append("text")
      .attr("x", xScale(totalPages * 0.875))
      .attr("y", innerHeight + 25)
      .attr("fill", "#78716c")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .text("ACT 3");

    // Create area generator for the waveform
    const areaGenerator = d3
      .area<typeof emotionalData[0]>()
      .x((d) => xScale((d.pageStart + d.pageEnd) / 2))
      .y0(innerHeight)
      .y1((d) => yScale(d.intensity))
      .curve(d3.curveMonotoneX);

    // Create line generator
    const lineGenerator = d3
      .line<typeof emotionalData[0]>()
      .x((d) => xScale((d.pageStart + d.pageEnd) / 2))
      .y((d) => yScale(d.intensity))
      .curve(d3.curveMonotoneX);

    // Draw gradient definitions for each emotion
    const defs = svg.append("defs");

    // Create a gradient for the waveform fill
    const waveGradient = defs
      .append("linearGradient")
      .attr("id", "wave-fill-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    waveGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#d4a574")
      .attr("stop-opacity", 0.6);

    waveGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#d4a574")
      .attr("stop-opacity", 0.05);

    // Draw the area (filled waveform)
    g.append("path")
      .datum(emotionalData)
      .attr("fill", "url(#wave-fill-gradient)")
      .attr("d", areaGenerator);

    // Draw the line (waveform outline)
    g.append("path")
      .datum(emotionalData)
      .attr("fill", "none")
      .attr("stroke", "#d4a574")
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("d", lineGenerator);

    // Draw plot point markers
    if (data.plotPoints && data.plotPoints.length > 0) {
      data.plotPoints.forEach((plotPoint) => {
        const x = xScale(plotPoint.page);

        // Vertical line
        g.append("line")
          .attr("x1", x)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", innerHeight)
          .attr("stroke", plotPoint.emotion ? EMOTION_COLORS[plotPoint.emotion] : "#ef4444")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "6,3")
          .attr("opacity", 0.7);

        // Label background
        g.append("rect")
          .attr("x", x - 50)
          .attr("y", -35)
          .attr("width", 100)
          .attr("height", 22)
          .attr("fill", "#242220")
          .attr("rx", 4);

        // Label text
        g.append("text")
          .attr("x", x)
          .attr("y", -20)
          .attr("fill", plotPoint.emotion ? EMOTION_COLORS[plotPoint.emotion] : "#ef4444")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .text(PLOT_POINT_LABELS[plotPoint.type] || plotPoint.type);
      });
    }

    // Draw data points
    const points = g
      .selectAll(".emotion-point")
      .data(emotionalData)
      .enter()
      .append("g")
      .attr("class", "emotion-point")
      .attr("transform", (d) => {
        const x = xScale((d.pageStart + d.pageEnd) / 2);
        const y = yScale(d.intensity);
        return `translate(${x}, ${y})`;
      })
      .style("cursor", "pointer");

    // Point circles with emotion color
    points
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => EMOTION_COLORS[d.dominantEmotion] || "#d4a574")
      .attr("stroke", "#1a1816")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    // Interaction handlers
    points
      .on("mouseenter", function (event, d) {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 12);
        const index = emotionalData.indexOf(d);
        setHoveredPoint(index);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 8);
        setHoveredPoint(null);
      })
      .on("click", function (event, d) {
        const index = emotionalData.indexOf(d);
        setSelectedPoint(index);
        onPointClick?.(index);
      });

    // Y-axis labels
    const yAxisTicks = [0, 25, 50, 75, 100];
    yAxisTicks.forEach((tick) => {
      g.append("text")
        .attr("x", -10)
        .attr("y", yScale(tick))
        .attr("fill", "#78716c")
        .attr("font-size", "10px")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text(tick);

      g.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(tick))
        .attr("x2", innerWidth)
        .attr("y2", yScale(tick))
        .attr("stroke", "#3d3a38")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.3);
    });

    // Axis label
    g.append("text")
      .attr("x", -40)
      .attr("y", innerHeight / 2)
      .attr("fill", "#78716c")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90, -40, ${innerHeight / 2})`)
      .text("EMOTIONAL INTENSITY");

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 55)
      .attr("fill", "#78716c")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .text("PAGE NUMBER");

  }, [data, emotionalData, width, height, onPointClick]);

  const currentPoint = hoveredPoint !== null ? emotionalData[hoveredPoint] : null;
  const selectedData = selectedPoint !== null ? emotionalData[selectedPoint] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-[#0f0f0f] rounded-xl"
      />

      {/* Title */}
      <div className="absolute top-3 left-3 bg-[#242220]/90 px-3 py-2 rounded-lg">
        <div className="text-[#d4a574] font-semibold text-sm">
          Emotional Journey
        </div>
        <div className="text-[#78716c] text-xs mt-1">
          {emotionalData.length} sequences analyzed
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-[#242220]/90 px-3 py-2 rounded-lg">
        <div className="text-[#78716c] text-xs mb-2">EMOTION KEY</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(EMOTION_COLORS).slice(0, 6).map(([emotion, color]) => (
            <div key={emotion} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#a8a29e] text-xs capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {currentPoint && hoveredPoint !== null && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#242220] border border-[#3d3a38] px-4 py-3 rounded-lg max-w-sm shadow-xl z-10">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: EMOTION_COLORS[currentPoint.dominantEmotion] }}
            />
            <span className="text-[#f5f5f5] font-medium">
              {currentPoint.sequenceName}
            </span>
            <span className="text-[#78716c] text-sm">
              (pp. {currentPoint.pageStart}-{currentPoint.pageEnd})
            </span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div>
              <span className="text-[#78716c] text-xs">Emotion: </span>
              <span className="text-[#a8a29e] capitalize">{currentPoint.dominantEmotion}</span>
            </div>
            <div>
              <span className="text-[#78716c] text-xs">Intensity: </span>
              <span className="text-[#a8a29e]">{currentPoint.intensity}%</span>
            </div>
          </div>
          <p className="text-[#a8a29e] text-sm">{currentPoint.description}</p>
          {currentPoint.keyMoment && (
            <p className="text-[#d4a574] text-xs mt-2 italic">&ldquo;{currentPoint.keyMoment}&rdquo;</p>
          )}
        </div>
      )}

      {/* Selected point details */}
      {selectedData && selectedPoint !== null && (
        <div className="absolute bottom-4 right-4 bg-[#242220] border border-[#d4a574]/30 px-4 py-3 rounded-lg max-w-xs shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#d4a574] font-medium">
              {selectedData.sequenceName}
            </span>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-[#78716c] hover:text-[#a8a29e]"
            >
              x
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Emotion:</span>
              <span
                className="font-medium capitalize"
                style={{ color: EMOTION_COLORS[selectedData.dominantEmotion] }}
              >
                {selectedData.dominantEmotion}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Intensity:</span>
              <span className="text-[#a8a29e]">{selectedData.intensity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Pages:</span>
              <span className="text-[#a8a29e]">
                {selectedData.pageStart} - {selectedData.pageEnd}
              </span>
            </div>
          </div>
          <p className="text-[#a8a29e] text-sm mt-2">{selectedData.description}</p>
        </div>
      )}
    </div>
  );
}
