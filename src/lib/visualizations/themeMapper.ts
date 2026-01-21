import type { ThemeConstellation, ThemeNode, ThemeLink } from "@/types/visualization";
import type { ParsedScreenplay, Soul, Sequence } from "@/types/screenplay";
import type { ThemeConnectionsResponse } from "@/app/api/analyze-theme-connections/route";

/**
 * Fetches AI-analyzed theme connections and transforms to constellation data
 */
export async function fetchAIThemeConstellation(
  screenplay: ParsedScreenplay,
  soul: Soul,
  sequences: Sequence[]
): Promise<ThemeConstellation> {
  // Get API key from localStorage if available
  const storageKey = "storiq-ai-config";
  const savedConfig = typeof window !== "undefined"
    ? localStorage.getItem(storageKey)
    : null;
  const clientApiKey = savedConfig ? JSON.parse(savedConfig).apiKey : null;

  const response = await fetch("/api/analyze-theme-connections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      screenplay: {
        title: screenplay.title,
        scenes: screenplay.scenes.map((s) => ({
          sceneNumber: s.sceneNumber,
          heading: s.heading,
          content: s.content,
        })),
        characters: screenplay.characters.map((c) => ({
          name: c.name,
          dialogueCount: c.dialogueCount,
          sceneAppearances: c.sceneAppearances,
        })),
      },
      soul: {
        centralQuestion: soul.centralQuestion,
        thematicArgument: soul.thematicArgument,
        controllingIdea: soul.controllingIdea,
        protagonistLie: soul.protagonistLie,
        protagonistTruth: soul.protagonistTruth,
      },
      ...(clientApiKey && { apiKey: clientApiKey }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to analyze theme connections");
  }

  const aiResult: ThemeConnectionsResponse = await response.json();

  // Transform AI response to ThemeConstellation format
  return transformAIResponseToConstellation(aiResult, screenplay, sequences);
}

/**
 * Transforms AI response into ThemeConstellation format
 */
function transformAIResponseToConstellation(
  aiResult: ThemeConnectionsResponse,
  screenplay: ParsedScreenplay,
  sequences: Sequence[]
): ThemeConstellation {
  const nodes: ThemeNode[] = [];
  const links: ThemeLink[] = [];

  // Create core theme node
  nodes.push({
    id: "core",
    type: "core",
    label: aiResult.coreTheme,
    isConnected: true,
  });

  // Create sub-theme nodes
  aiResult.subThemes.forEach((theme, index) => {
    const nodeId = `subtheme-${index}`;
    nodes.push({
      id: nodeId,
      type: "sub-theme",
      label: theme,
      isConnected: true,
    });

    links.push({
      source: "core",
      target: nodeId,
      strength: 0.8,
      type: "primary",
    });
  });

  // Create scene nodes from AI analysis
  aiResult.sceneConnections.forEach((sceneConn) => {
    const scene = screenplay.scenes.find((s) => s.sceneNumber === sceneConn.sceneNumber);
    if (!scene) return;

    // Find which sequence this scene belongs to
    const sequence = sequences.find(
      (seq) =>
        scene.sceneNumber >= seq.sceneNumbers[0] &&
        scene.sceneNumber <= seq.sceneNumbers[seq.sceneNumbers.length - 1]
    );

    const nodeId = `scene-${sceneConn.sceneNumber}`;
    // Use AI-generated slug if available, fallback to scene number
    const sceneLabel = sceneConn.slug || `Sc ${sceneConn.sceneNumber}`;
    // Get sequence name: prefer suggestedName, fallback to name
    const sequenceName = sequence?.suggestedName || sequence?.name || undefined;
    nodes.push({
      id: nodeId,
      type: "scene",
      label: sceneLabel,
      sequenceId: sequence?.id,
      sequenceName,
      isConnected: sceneConn.isConnected,
      thematicStrength: sceneConn.strength,
    });

    // Create links for connected scenes
    if (sceneConn.isConnected && sceneConn.connectedThemes.length > 0) {
      // Find the best matching sub-theme or connect to core
      const primaryTheme = sceneConn.connectedThemes[0];
      const subThemeIndex = aiResult.subThemes.findIndex(
        (st) => st.toLowerCase() === primaryTheme.toLowerCase() ||
               primaryTheme.toLowerCase().includes(st.toLowerCase()) ||
               st.toLowerCase().includes(primaryTheme.toLowerCase())
      );

      const targetNode = subThemeIndex >= 0 ? `subtheme-${subThemeIndex}` : "core";
      links.push({
        source: targetNode,
        target: nodeId,
        strength: sceneConn.strength,
        type: sceneConn.strength > 0.6 ? "primary" : "secondary",
      });
    }
  });

  // Create character nodes from AI analysis
  aiResult.characterConnections.forEach((charConn, index) => {
    const nodeId = `char-${index}`;
    const character = screenplay.characters.find(
      (c) => c.name.toLowerCase() === charConn.characterName.toLowerCase()
    );

    nodes.push({
      id: nodeId,
      type: "character",
      label: formatCharacterName(charConn.characterName),
      weight: character?.sceneAppearances.length || 1,
      isConnected: charConn.isConnected,
      thematicStrength: charConn.strength,
    });

    // Create links for connected characters
    if (charConn.isConnected && charConn.connectedThemes.length > 0) {
      const primaryTheme = charConn.connectedThemes[0];
      const subThemeIndex = aiResult.subThemes.findIndex(
        (st) => st.toLowerCase() === primaryTheme.toLowerCase() ||
               primaryTheme.toLowerCase().includes(st.toLowerCase()) ||
               st.toLowerCase().includes(primaryTheme.toLowerCase())
      );

      // Protagonist and antagonist connect to core, others to sub-themes
      const isMainCharacter = charConn.thematicRole === "protagonist" ||
                              charConn.thematicRole === "antagonist";
      const targetNode = isMainCharacter ? "core" :
                        (subThemeIndex >= 0 ? `subtheme-${subThemeIndex}` : "core");

      links.push({
        source: targetNode,
        target: nodeId,
        strength: charConn.strength,
        type: isMainCharacter ? "primary" : "secondary",
      });
    }
  });

  return {
    coreTheme: aiResult.coreTheme,
    subThemes: aiResult.subThemes,
    nodes,
    links,
  };
}

/**
 * Generates a Theme Constellation from screenplay data and soul using heuristics
 * This is the fallback when AI analysis is unavailable
 */
export function generateThemeConstellation(
  screenplay: ParsedScreenplay,
  soul: Soul,
  sequences: Sequence[]
): ThemeConstellation {
  const nodes: ThemeNode[] = [];
  const links: ThemeLink[] = [];

  // Extract core theme from controlling idea
  const coreTheme = extractCoreTheme(soul.controllingIdea);

  // Create core theme node
  nodes.push({
    id: "core",
    type: "core",
    label: coreTheme,
    isConnected: true,
  });

  // Generate sub-themes from thematic argument and lie/truth
  const subThemes = extractSubThemes(soul);
  subThemes.forEach((theme, index) => {
    const nodeId = `subtheme-${index}`;
    nodes.push({
      id: nodeId,
      type: "sub-theme",
      label: theme,
      isConnected: true,
    });

    links.push({
      source: "core",
      target: nodeId,
      strength: 0.8,
      type: "primary",
    });
  });

  // Add scene nodes
  screenplay.scenes.forEach((scene, index) => {
    // Determine which sequence this scene belongs to
    const sequence = sequences.find(
      (seq) =>
        scene.sceneNumber >= seq.sceneNumbers[0] &&
        scene.sceneNumber <= seq.sceneNumbers[seq.sceneNumbers.length - 1]
    );

    // Simulate thematic connection (in reality, this would be AI-analyzed)
    // For now, connect ~70% of scenes
    const isConnected = Math.random() > 0.3;
    const connectedSubTheme = isConnected
      ? `subtheme-${Math.floor(Math.random() * subThemes.length)}`
      : null;

    const nodeId = `scene-${scene.sceneNumber}`;
    // Generate a slug from scene heading for heuristic mode
    const sceneSlug = generateSceneSlug(scene.heading, scene.sceneNumber);
    // Get sequence name: prefer suggestedName, fallback to name
    const sequenceName = sequence?.suggestedName || sequence?.name || undefined;
    nodes.push({
      id: nodeId,
      type: "scene",
      label: sceneSlug,
      sequenceId: sequence?.id,
      sequenceName,
      isConnected,
      thematicStrength: isConnected ? Math.random() * 0.5 + 0.5 : 0,
    });

    if (connectedSubTheme) {
      links.push({
        source: connectedSubTheme,
        target: nodeId,
        strength: Math.random() * 0.3 + 0.3,
        type: "secondary",
      });
    }
  });

  // Add character nodes
  screenplay.characters.slice(0, 10).forEach((character, index) => {
    // Characters with more appearances are more likely to be connected
    const connectionChance = Math.min(character.sceneAppearances.length / 10, 1);
    const isConnected = Math.random() < connectionChance + 0.2;

    const nodeId = `char-${index}`;
    nodes.push({
      id: nodeId,
      type: "character",
      label: formatCharacterName(character.name),
      weight: character.sceneAppearances.length,
      isConnected,
      thematicStrength: isConnected ? connectionChance : 0,
    });

    if (isConnected) {
      // Connect to core or a sub-theme
      const targetNode = Math.random() > 0.5 ? "core" : `subtheme-${Math.floor(Math.random() * subThemes.length)}`;
      links.push({
        source: targetNode,
        target: nodeId,
        strength: connectionChance * 0.6 + 0.2,
        type: index < 3 ? "primary" : "secondary",
      });
    }
  });

  return {
    coreTheme,
    subThemes,
    nodes,
    links,
  };
}

/**
 * Extract core theme from controlling idea
 */
function extractCoreTheme(controllingIdea: string): string {
  // Extract the first key concept (simplified - AI would do this better)
  const words = controllingIdea.toLowerCase().split(/\s+/);
  const abstractConcepts = [
    "love",
    "redemption",
    "power",
    "freedom",
    "truth",
    "justice",
    "fear",
    "hope",
    "identity",
    "belonging",
    "sacrifice",
    "revenge",
    "forgiveness",
    "ambition",
    "loyalty",
    "control",
    "chaos",
    "order",
    "survival",
    "courage",
  ];

  for (const concept of abstractConcepts) {
    if (words.some((w) => w.includes(concept))) {
      return concept.charAt(0).toUpperCase() + concept.slice(1);
    }
  }

  // Fallback: use first noun-like word
  return "Core Theme";
}

/**
 * Extract sub-themes from soul data
 */
function extractSubThemes(soul: Soul): string[] {
  const subThemes: string[] = [];

  // From protagonist lie/truth
  if (soul.protagonistLie) {
    const lieTheme = extractKeyword(soul.protagonistLie);
    if (lieTheme) subThemes.push(lieTheme);
  }

  if (soul.protagonistTruth) {
    const truthTheme = extractKeyword(soul.protagonistTruth);
    if (truthTheme) subThemes.push(truthTheme);
  }

  // From thematic argument
  const argWords = soul.thematicArgument.split(/\s+/);
  const potentialThemes = ["vs", "versus", "over", "through", "despite"];
  potentialThemes.forEach((connector) => {
    const idx = argWords.findIndex((w) => w.toLowerCase() === connector);
    if (idx > 0 && idx < argWords.length - 1) {
      subThemes.push(argWords[idx - 1]);
      subThemes.push(argWords[idx + 1]);
    }
  });

  // Ensure we have at least 2-4 sub-themes
  const defaults = ["Choice", "Consequence", "Transformation"];
  while (subThemes.length < 2) {
    subThemes.push(defaults[subThemes.length]);
  }

  return [...new Set(subThemes)].slice(0, 4);
}

/**
 * Extract a keyword from a phrase
 */
function extractKeyword(phrase: string): string | null {
  const words = phrase.split(/\s+/);
  // Skip common words
  const skipWords = ["the", "a", "an", "is", "are", "was", "were", "i", "you", "they", "we", "to", "for", "of", "in", "on", "that", "this"];
  const keyword = words.find((w) => w.length > 3 && !skipWords.includes(w.toLowerCase()));
  return keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase() : null;
}

/**
 * Format character name for display
 */
function formatCharacterName(name: string): string {
  // Shorten long names
  if (name.length > 12) {
    return name.slice(0, 10) + "...";
  }
  // Title case
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Generate a short slug from scene heading for display
 * Extracts location from scene heading (e.g., "INT. OFFICE - DAY" -> "Office")
 */
function generateSceneSlug(heading: string, sceneNumber: number): string {
  if (!heading) return `Sc ${sceneNumber}`;

  // Parse scene heading: INT./EXT. LOCATION - TIME
  // Extract the location part
  const headingUpper = heading.toUpperCase();

  // Remove INT./EXT. prefix
  let location = headingUpper
    .replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.?)\s*/i, "")
    .trim();

  // Remove time suffix (- DAY, - NIGHT, - CONTINUOUS, etc.)
  location = location
    .replace(/\s*-\s*(DAY|NIGHT|CONTINUOUS|LATER|SAME|MORNING|EVENING|DUSK|DAWN|MOMENTS? LATER).*$/i, "")
    .trim();

  // Title case the location
  location = location
    .toLowerCase()
    .split(/[\s-]+/)
    .slice(0, 3) // Max 3 words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // If location is too long, truncate
  if (location.length > 20) {
    location = location.slice(0, 18) + "...";
  }

  return location || `Sc ${sceneNumber}`;
}
