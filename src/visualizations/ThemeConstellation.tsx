"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ThemeConstellation, ThemeNode, ThemeLink } from "@/types/visualization";

interface ThemeConstellationProps {
  data: ThemeConstellation;
  width?: number;
  height?: number;
  onNodeClick?: (node: ThemeNode) => void;
}

// D3 simulation node type
interface SimulationNode extends ThemeNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// D3 simulation link type
interface SimulationLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
  strength: number;
  type: "primary" | "secondary" | "weak";
}

// Node colors by type
const NODE_COLORS: Record<ThemeNode["type"], string> = {
  core: "#d4a574",
  "sub-theme": "#a8a29e",
  scene: "#78716c",
  character: "#525252",
};

// Node sizes by type
const NODE_SIZES: Record<ThemeNode["type"], number> = {
  core: 40,
  "sub-theme": 25,
  scene: 15,
  character: 20,
};

export function ThemeConstellation({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}: ThemeConstellationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<ThemeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ThemeNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create container group for zoom/pan
    const container = svg.append("g").attr("class", "container");

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Prepare nodes and links for simulation
    const nodes: SimulationNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimulationLink[] = data.links.map((l) => ({ ...l }));

    // Create force simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance((d) => 100 / (d.strength || 0.5))
          .strength((d) => d.strength || 0.5)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<SimulationNode>().radius((d) => NODE_SIZES[d.type] + 10)
      );

    // Create gradient for core node
    const defs = svg.append("defs");
    const gradient = defs
      .append("radialGradient")
      .attr("id", "core-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f5d4a5");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#d4a574");

    // Draw links
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        if (d.type === "primary") return "#d4a574";
        if (d.type === "secondary") return "#78716c";
        return "#3d3a38";
      })
      .attr("stroke-opacity", (d) => d.strength * 0.8)
      .attr("stroke-width", (d) => d.strength * 3);

    // Draw nodes
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d) => NODE_SIZES[d.type])
      .attr("fill", (d) => {
        if (d.type === "core") return "url(#core-gradient)";
        if (!d.isConnected) return "#ef4444"; // Red for disconnected
        return NODE_COLORS[d.type];
      })
      .attr("stroke", (d) => (d.isConnected ? "#f5f5f5" : "#ef4444"))
      .attr("stroke-width", (d) => (d.type === "core" ? 3 : 1.5))
      .attr("stroke-opacity", 0.3);

    // Add labels
    node
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => NODE_SIZES[d.type] + 15)
      .attr("fill", (d) => (d.isConnected ? "#a8a29e" : "#ef4444"))
      .attr("font-size", (d) => (d.type === "core" ? "14px" : "11px"))
      .attr("font-weight", (d) => (d.type === "core" ? "600" : "400"));

    // Add type indicator for core theme
    node
      .filter((d) => d.type === "core")
      .append("text")
      .text("THEME")
      .attr("text-anchor", "middle")
      .attr("dy", -NODE_SIZES.core - 10)
      .attr("fill", "#d4a574")
      .attr("font-size", "10px")
      .attr("letter-spacing", "2px");

    // Hover effects
    node
      .on("mouseenter", function (event, d) {
        setHoveredNode(d);
        d3.select(this).select("circle").attr("stroke-opacity", 1);

        // Highlight connected links
        link.attr("stroke-opacity", (l) => {
          const sourceId = typeof l.source === "object" ? l.source.id : l.source;
          const targetId = typeof l.target === "object" ? l.target.id : l.target;
          if (sourceId === d.id || targetId === d.id) {
            return 1;
          }
          return 0.1;
        });
      })
      .on("mouseleave", function () {
        setHoveredNode(null);
        d3.select(this).select("circle").attr("stroke-opacity", 0.3);
        link.attr("stroke-opacity", (l) => l.strength * 0.8);
      })
      .on("click", (event, d) => {
        setSelectedNode(d);
        onNodeClick?.(d);
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimulationNode).x!)
        .attr("y1", (d) => (d.source as SimulationNode).y!)
        .attr("x2", (d) => (d.target as SimulationNode).x!)
        .attr("y2", (d) => (d.target as SimulationNode).y!);

      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    // Initial zoom to fit content
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.9));

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  // Calculate stats
  const disconnectedNodes = data.nodes.filter((n) => !n.isConnected);
  const connectedScenes = data.nodes.filter((n) => n.type === "scene" && n.isConnected).length;
  const totalScenes = data.nodes.filter((n) => n.type === "scene").length;

  return (
    <div className="relative bg-[#1a1816] rounded-xl border border-[#3d3a38] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-[#1a1816]/90 backdrop-blur-sm border-b border-[#3d3a38] p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#f5f5f5]">Theme Constellation</h3>
            <p className="text-sm text-[#78716c]">
              Visualizing how your story&apos;s theme connects to scenes and characters
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#d4a574]" />
              <span className="text-[#a8a29e]">Core Theme</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#78716c]" />
              <span className="text-[#a8a29e]">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-[#a8a29e]">Floating</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="pt-20"
        style={{ background: "radial-gradient(circle at center, #242220 0%, #0f0f0f 100%)" }}
      />

      {/* Stats Sidebar */}
      <div className="absolute bottom-4 left-4 bg-[#1a1816]/90 backdrop-blur-sm rounded-lg border border-[#3d3a38] p-4 max-w-xs">
        <h4 className="text-sm font-semibold text-[#d4a574] mb-3">Thematic Health</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#78716c]">Core Theme</span>
            <span className="text-[#f5f5f5]">{data.coreTheme}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#78716c]">Sub-themes</span>
            <span className="text-[#f5f5f5]">{data.subThemes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#78716c]">Connected Scenes</span>
            <span className="text-[#f5f5f5]">
              {connectedScenes}/{totalScenes}
            </span>
          </div>
          {disconnectedNodes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#3d3a38]">
              <p className="text-[#ef4444] text-xs mb-2">
                {disconnectedNodes.length} floating element{disconnectedNodes.length > 1 ? "s" : ""}
              </p>
              <ul className="text-xs text-[#78716c] space-y-1">
                {disconnectedNodes.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    {n.type === "scene" ? "Scene" : "Character"}: {n.label}
                  </li>
                ))}
                {disconnectedNodes.length > 3 && (
                  <li className="text-[#525252]">+{disconnectedNodes.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Hovered Node Info */}
      {hoveredNode && (
        <div className="absolute top-24 right-4 bg-[#1a1816]/90 backdrop-blur-sm rounded-lg border border-[#3d3a38] p-4 max-w-xs">
          <div className="text-xs text-[#d4a574] uppercase tracking-wide mb-1">
            {hoveredNode.type}
          </div>
          <div className="text-[#f5f5f5] font-medium">{hoveredNode.label}</div>
          {(hoveredNode.sequenceName || hoveredNode.sequenceId) && (
            <div className="text-xs text-[#78716c] mt-1">
              Sequence: {hoveredNode.sequenceName || hoveredNode.sequenceId}
            </div>
          )}
          {!hoveredNode.isConnected && (
            <div className="text-xs text-[#ef4444] mt-2">
              Not connected to theme. Consider strengthening this element&apos;s thematic purpose.
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 text-xs text-[#525252]">
        Drag nodes to arrange. Scroll to zoom. Click for details.
      </div>
    </div>
  );
}
