import { v4 as uuidv4 } from "uuid";
import type { ParsedScreenplay, Scene, Character } from "@/types/screenplay";

// Scene header patterns - expanded to catch more formats
const SCENE_HEADER_PATTERNS = [
  // Standard: INT. LOCATION - TIME
  /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+(.+?)(?:\s*[-–—]\s*(.+))?$/i,
  // With scene numbers: 1. INT. LOCATION - TIME or 1) INT. LOCATION
  /^(\d+[\.\)]\s*)?(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+(.+?)(?:\s*[-–—]\s*(.+))?$/i,
  // Without periods: INT LOCATION - TIME or EXT LOCATION - DAY
  /^(INT|EXT|INT\/EXT)\s+(.+?)(?:\s*[-–—]\s*(.+))?$/i,
  // Scene numbers at start: 1 INT. LOCATION or SCENE 1: INT. LOCATION
  /^(?:SCENE\s+)?(\d+)[:\.\s]+\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+(.+?)(?:\s*[-–—]\s*(.+))?$/i,
  // Colon format: INT: LOCATION - TIME
  /^(INT|EXT|INT\/EXT):\s*(.+?)(?:\s*[-–—]\s*(.+))?$/i,
];

// Non-character words to filter out
const NON_CHARACTER_WORDS = new Set([
  "CONTINUED",
  "CONT'D",
  "CONT",
  "MORE",
  "CUT TO",
  "FADE IN",
  "FADE OUT",
  "FADE TO",
  "DISSOLVE TO",
  "THE END",
  "END",
  "BLACKOUT",
  "INTERCUT",
  "FLASHBACK",
  "END FLASHBACK",
  "BACK TO SCENE",
  "LATER",
  "CONTINUOUS",
  "SAME",
  "ANGLE ON",
  "CLOSE ON",
  "INSERT",
  "TITLE CARD",
  "SUPER",
  "SUPERIMPOSE",
  "MATCH CUT",
  "SMASH CUT",
  "TIME CUT",
  "JUMP CUT",
  "V.O.",
  "O.S.",
  "O.C.",
  "VO",
  "OS",
  "OC",
  "(V.O.)",
  "(O.S.)",
  "(O.C.)",
]);

// Parenthetical pattern
const PARENTHETICAL_PATTERN = /^\s*\([^)]+\)\s*$/;

// Character name pattern - all caps, 1-3 words, may have (V.O.) etc.
const CHARACTER_NAME_PATTERN =
  /^([A-Z][A-Z\s\.''-]{0,30})(?:\s*\((?:V\.?O\.?|O\.?S\.?|O\.?C\.?|CONT'?D?|CONTINUING)\))?$/;

/**
 * Parse a PDF file into a structured screenplay
 */
export async function parseScreenplay(file: File): Promise<ParsedScreenplay> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Dynamic import for pdf-parse (only works server-side, so we need an API route)
  // For now, we'll create an API endpoint
  const response = await fetch("/api/parse-pdf", {
    method: "POST",
    body: buffer,
    headers: {
      "Content-Type": "application/pdf",
      "X-Filename": encodeURIComponent(file.name),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to parse PDF");
  }

  return response.json();
}

/**
 * Parse raw text into screenplay structure
 * @param text - The raw text extracted from the PDF
 * @param filename - Original filename
 * @param actualPageCount - Actual page count from PDF metadata (optional)
 */
export function parseScreenplayText(
  text: string,
  filename: string,
  actualPageCount?: number
): Omit<ParsedScreenplay, "id" | "uploadedAt"> {
  const lines = text.split("\n");
  const scenes: Scene[] = [];
  const characterMap = new Map<
    string,
    { sceneAppearances: Set<number>; dialogueCount: number; firstAppearance: number }
  >();

  let currentScene: Scene | null = null;
  let currentSceneNumber = 0;
  let currentPage = 1;
  let lastCharacterName: string | null = null;

  // Use actual page count if provided, otherwise estimate
  const totalLines = lines.length;
  const linesPerPage = actualPageCount ? Math.ceil(totalLines / actualPageCount) : 55;

  // Estimate page based on line count
  const estimatePage = (lineIndex: number): number => {
    if (actualPageCount) {
      return Math.min(Math.floor(lineIndex / linesPerPage) + 1, actualPageCount);
    }
    return Math.floor(lineIndex / 55) + 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    currentPage = estimatePage(i);

    // Skip empty lines
    if (!line) {
      lastCharacterName = null;
      continue;
    }

    // Check for scene header
    const sceneMatch = matchSceneHeader(line);
    if (sceneMatch) {
      // Save previous scene
      if (currentScene) {
        currentScene.pageEnd = currentPage;
        scenes.push(currentScene);
      }

      currentSceneNumber++;
      currentScene = {
        sceneNumber: currentSceneNumber,
        heading: line,
        pageStart: currentPage,
        pageEnd: currentPage,
        content: "",
        characters: [],
        locationType: sceneMatch.type,
        timeOfDay: sceneMatch.timeOfDay,
      };
      lastCharacterName = null;
      continue;
    }

    // Check for character name (dialogue cue)
    if (currentScene && isCharacterName(line)) {
      const cleanName = cleanCharacterName(line);
      if (cleanName && !NON_CHARACTER_WORDS.has(cleanName)) {
        lastCharacterName = cleanName;

        // Track character
        if (!characterMap.has(cleanName)) {
          characterMap.set(cleanName, {
            sceneAppearances: new Set([currentSceneNumber]),
            dialogueCount: 0,
            firstAppearance: currentSceneNumber,
          });
        } else {
          characterMap.get(cleanName)!.sceneAppearances.add(currentSceneNumber);
        }

        // Add to scene characters
        if (!currentScene.characters.includes(cleanName)) {
          currentScene.characters.push(cleanName);
        }
      }
      continue;
    }

    // Check for parenthetical - skip but keep lastCharacterName
    if (PARENTHETICAL_PATTERN.test(line)) {
      continue;
    }

    // If we have a character name, this is likely dialogue
    if (lastCharacterName && currentScene) {
      const charData = characterMap.get(lastCharacterName);
      if (charData) {
        charData.dialogueCount++;
      }
      lastCharacterName = null; // Reset after counting dialogue
    }

    // Add to scene content
    if (currentScene) {
      currentScene.content += line + "\n";
    }
  }

  // Save last scene
  if (currentScene) {
    currentScene.pageEnd = currentPage;
    scenes.push(currentScene);
  }

  // Convert character map to array
  const characters: Character[] = Array.from(characterMap.entries())
    .map(([name, data]) => ({
      name,
      sceneAppearances: Array.from(data.sceneAppearances),
      dialogueCount: data.dialogueCount,
      firstAppearance: data.firstAppearance,
    }))
    .sort((a, b) => b.dialogueCount - a.dialogueCount);

  // Extract title from filename or first few lines
  const title = extractTitle(filename, lines.slice(0, 20));

  // Use actual page count if available, otherwise use last estimated page
  const finalPageCount = actualPageCount || currentPage;

  return {
    title,
    filename,
    totalPages: finalPageCount,
    scenes,
    characters,
    rawText: text,
  };
}

/**
 * Match scene header patterns
 */
function matchSceneHeader(
  line: string
): { type: Scene["locationType"]; timeOfDay?: string } | null {
  for (const pattern of SCENE_HEADER_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      // Find the INT/EXT indicator
      const typeIndicator = match
        .slice(1)
        .find((g) => g && /^(INT|EXT|I\/E)/i.test(g.trim()));

      if (typeIndicator) {
        const typeStr = typeIndicator.trim().toUpperCase();
        let type: Scene["locationType"] = "UNKNOWN";

        if (typeStr.includes("INT/EXT") || typeStr.includes("I/E")) {
          type = "INT/EXT";
        } else if (typeStr.startsWith("INT")) {
          type = "INT";
        } else if (typeStr.startsWith("EXT")) {
          type = "EXT";
        }

        // Extract time of day if present
        const lastGroup = match[match.length - 1];
        const timeOfDay = lastGroup?.trim();

        return { type, timeOfDay };
      }
    }
  }

  return null;
}

/**
 * Check if a line is a character name (dialogue cue)
 */
function isCharacterName(line: string): boolean {
  // Must be relatively short
  if (line.length > 40) return false;

  // Must be all caps (with possible parenthetical)
  if (!CHARACTER_NAME_PATTERN.test(line)) return false;

  // Filter out known non-character words
  const cleanName = cleanCharacterName(line);
  if (!cleanName || NON_CHARACTER_WORDS.has(cleanName)) return false;

  // Check it's not a scene header
  if (matchSceneHeader(line)) return false;

  return true;
}

/**
 * Clean character name by removing parenthetical extensions
 */
function cleanCharacterName(line: string): string {
  return line
    .replace(/\s*\([^)]+\)\s*$/, "")
    .trim()
    .toUpperCase();
}

/**
 * Extract title from filename or script content
 */
function extractTitle(filename: string, firstLines: string[]): string {
  // Try to find title in first few lines (often centered, larger)
  for (const line of firstLines) {
    const trimmed = line.trim();
    // Skip empty lines and very short lines
    if (trimmed.length < 3) continue;
    // Skip obvious non-title lines
    if (/^(FADE|INT\.|EXT\.|by|written|draft)/i.test(trimmed)) continue;
    // If line looks like a title (not too long, not all lowercase)
    if (trimmed.length > 2 && trimmed.length < 60 && trimmed !== trimmed.toLowerCase()) {
      return trimmed;
    }
  }

  // Fall back to filename
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
}
