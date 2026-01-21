"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { CharacterArc, ArcPoint, ArcPosition, LieStatus } from "@/types/visualization";

interface CharacterJourneyMapProps {
  data: CharacterArc;
  width?: number;
  height?: number;
  onPointClick?: (point: ArcPoint) => void;
}

// Colors for lie status
const LIE_STATUS_COLORS: Record<LieStatus, string> = {
  believing: "#3b82f6", // Blue - firmly in the lie
  cracking: "#f59e0b", // Amber - lie is being challenged
  crisis: "#ef4444", // Red - crisis point
  truth: "#22c55e", // Green - truth integrated
};

// Y positions for arc positions (percentage from top)
const ARC_POSITION_Y: Record<ArcPosition, number> = {
  want: 0.15, // Top - pursuing Want
  crisis: 0.5, // Middle - crisis point
  need: 0.75, // Lower - moving toward Need
  resolved: 0.9, // Bottom - integrated
};

export function CharacterJourneyMap({
  data,
  width = 1000,
  height = 400,
  onPointClick,
}: CharacterJourneyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<ArcPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ArcPoint | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.arcPoints.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
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

    // Create gradient for the journey line
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "journey-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6");
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#ef4444");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#22c55e");

    // X scale for sequences
    const xScale = d3
      .scaleLinear()
      .domain([0, data.arcPoints.length - 1])
      .range([60, innerWidth - 60]);

    // Y scale for arc position
    const yScale = (position: ArcPosition): number => {
      return innerHeight * ARC_POSITION_Y[position];
    };

    // Draw zone labels
    // WANT zone (top)
    g.append("text")
      .attr("x", 15)
      .attr("y", innerHeight * 0.15)
      .attr("fill", "#3b82f6")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("dominant-baseline", "middle")
      .text("WANT");

    g.append("text")
      .attr("x", 15)
      .attr("y", innerHeight * 0.15 + 14)
      .attr("fill", "#78716c")
      .attr("font-size", "9px")
      .text("External Goal");

    // NEED zone (bottom)
    g.append("text")
      .attr("x", 15)
      .attr("y", innerHeight * 0.85)
      .attr("fill", "#22c55e")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("dominant-baseline", "middle")
      .text("NEED");

    g.append("text")
      .attr("x", 15)
      .attr("y", innerHeight * 0.85 + 14)
      .attr("fill", "#78716c")
      .attr("font-size", "9px")
      .text("Internal Growth");

    // Draw horizontal guide lines
    const guideLines = [0.15, 0.5, 0.85];
    guideLines.forEach((y) => {
      g.append("line")
        .attr("x1", 50)
        .attr("y1", innerHeight * y)
        .attr("x2", innerWidth - 30)
        .attr("y2", innerHeight * y)
        .attr("stroke", "#3d3a38")
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.5);
    });

    // Crisis zone label
    g.append("text")
      .attr("x", innerWidth - 20)
      .attr("y", innerHeight * 0.5)
      .attr("fill", "#ef4444")
      .attr("font-size", "10px")
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("opacity", 0.7)
      .text("CRISIS");

    // Prepare path data
    const lineGenerator = d3
      .line<ArcPoint>()
      .x((d, i) => xScale(i))
      .y((d) => yScale(d.position))
      .curve(d3.curveMonotoneX);

    // Draw the journey path (shadow for depth)
    g.append("path")
      .datum(data.arcPoints)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 6)
      .attr("opacity", 0.3)
      .attr("d", lineGenerator);

    // Draw the journey path (main)
    g.append("path")
      .datum(data.arcPoints)
      .attr("fill", "none")
      .attr("stroke", "url(#journey-gradient)")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("d", lineGenerator);

    // Draw crisis point marker if exists
    if (data.crisisPoint) {
      // Find the crisis point position
      const crisisPointIndex = data.arcPoints.findIndex(
        (p) => p.position === "crisis"
      );
      if (crisisPointIndex >= 0) {
        const crisisX = xScale(crisisPointIndex);
        const crisisY = yScale("crisis");

        // Crisis marker (star/burst effect)
        g.append("circle")
          .attr("cx", crisisX)
          .attr("cy", crisisY)
          .attr("r", 20)
          .attr("fill", "#ef4444")
          .attr("opacity", 0.2);

        g.append("circle")
          .attr("cx", crisisX)
          .attr("cy", crisisY)
          .attr("r", 12)
          .attr("fill", "#ef4444")
          .attr("opacity", 0.3);

        // Crisis label
        g.append("text")
          .attr("x", crisisX)
          .attr("y", crisisY - 25)
          .attr("fill", "#ef4444")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .text("CRISIS");
      }
    }

    // Draw sequence points
    const points = g
      .selectAll(".arc-point")
      .data(data.arcPoints)
      .enter()
      .append("g")
      .attr("class", "arc-point")
      .attr("transform", (d, i) => `translate(${xScale(i)}, ${yScale(d.position)})`)
      .style("cursor", "pointer");

    // Point circles
    points
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => LIE_STATUS_COLORS[d.lieStatus])
      .attr("stroke", "#1a1816")
      .attr("stroke-width", 2);

    // Sequence labels
    points
      .append("text")
      .attr("y", 25)
      .attr("fill", "#a8a29e")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .text((d) => d.sequenceName.replace("Sequence ", "Seq "));

    // Lie status indicator (small icon below)
    points
      .append("text")
      .attr("y", -18)
      .attr("fill", (d) => LIE_STATUS_COLORS[d.lieStatus])
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("opacity", 0.8)
      .text((d) => {
        switch (d.lieStatus) {
          case "believing":
            return "LIE";
          case "cracking":
            return "CRACK";
          case "crisis":
            return "CHOICE";
          case "truth":
            return "TRUTH";
        }
      });

    // Interaction handlers
    points
      .on("mouseenter", function (event, d) {
        d3.select(this).select("circle").transition().duration(200).attr("r", 12);
        setHoveredPoint(d);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").transition().duration(200).attr("r", 8);
        setHoveredPoint(null);
      })
      .on("click", function (event, d) {
        setSelectedPoint(d);
        onPointClick?.(d);
      });

    // Want and Need labels at top and bottom
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -30)
      .attr("fill", "#3b82f6")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text(`"${truncate(data.want, 60)}"`);

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("fill", "#22c55e")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text(`"${truncate(data.need, 60)}"`);

    // Legend
    const legend = g.append("g").attr("transform", `translate(${innerWidth - 150}, 10)`);

    const legendItems: { label: string; color: string }[] = [
      { label: "Believing Lie", color: LIE_STATUS_COLORS.believing },
      { label: "Lie Cracking", color: LIE_STATUS_COLORS.cracking },
      { label: "Crisis Point", color: LIE_STATUS_COLORS.crisis },
      { label: "Truth", color: LIE_STATUS_COLORS.truth },
    ];

    legendItems.forEach((item, i) => {
      legend
        .append("circle")
        .attr("cx", 0)
        .attr("cy", i * 18)
        .attr("r", 5)
        .attr("fill", item.color);

      legend
        .append("text")
        .attr("x", 12)
        .attr("y", i * 18)
        .attr("fill", "#78716c")
        .attr("font-size", "10px")
        .attr("dominant-baseline", "middle")
        .text(item.label);
    });
  }, [data, width, height, onPointClick]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-[#0f0f0f] rounded-xl"
      />

      {/* Character name and arc info */}
      <div className="absolute top-3 left-3 bg-[#242220]/90 px-3 py-2 rounded-lg">
        <div className="text-[#d4a574] font-semibold text-sm">
          {data.characterName}&apos;s Journey
        </div>
        <div className="text-[#78716c] text-xs mt-1">
          {data.arcPoints.length} sequences • Lie → Truth
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#242220] border border-[#3d3a38] px-4 py-3 rounded-lg max-w-md shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: LIE_STATUS_COLORS[hoveredPoint.lieStatus] }}
            />
            <span className="text-[#f5f5f5] font-medium">
              {hoveredPoint.sequenceName}
            </span>
            <span className="text-[#78716c] text-sm">
              (pp. {hoveredPoint.pageRange})
            </span>
          </div>
          <p className="text-[#a8a29e] text-sm">{hoveredPoint.description}</p>
        </div>
      )}

      {/* Selected point details */}
      {selectedPoint && (
        <div className="absolute bottom-4 right-4 bg-[#242220] border border-[#d4a574]/30 px-4 py-3 rounded-lg max-w-xs shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#d4a574] font-medium">
              {selectedPoint.sequenceName}
            </span>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-[#78716c] hover:text-[#a8a29e]"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Status:</span>
              <span
                className="font-medium capitalize"
                style={{ color: LIE_STATUS_COLORS[selectedPoint.lieStatus] }}
              >
                {selectedPoint.lieStatus === "believing"
                  ? "Believing the Lie"
                  : selectedPoint.lieStatus === "cracking"
                  ? "Lie is Cracking"
                  : selectedPoint.lieStatus === "crisis"
                  ? "Crisis Point"
                  : "Truth Integrated"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#78716c]">Position:</span>
              <span className="text-[#a8a29e] capitalize">
                {selectedPoint.position}
              </span>
            </div>
          </div>
          <p className="text-[#a8a29e] text-sm mt-2">{selectedPoint.description}</p>
        </div>
      )}
    </div>
  );
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
