import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface ThemeConnectionsRequest {
  screenplay: {
    title: string;
    scenes: Array<{
      sceneNumber: number;
      heading: string;
      content: string;
    }>;
    characters: Array<{
      name: string;
      dialogueCount: number;
      sceneAppearances: number[];
    }>;
  };
  soul: {
    centralQuestion: string;
    thematicArgument: string;
    controllingIdea: string;
    protagonistLie: string;
    protagonistTruth: string;
  };
  apiKey?: string;
  provider?: "anthropic" | "google";
}

export type ThematicRelevance = "STRONG" | "MODERATE" | "WEAK" | "NONE";

export interface ThemeConnectionsResponse {
  coreTheme: string;
  subThemes: string[];
  sceneConnections: Array<{
    sceneNumber: number;
    slug: string; // Short 2-4 word description (e.g., "First Kiss", "Job Interview", "Betrayal Revealed")
    isConnected: boolean;
    connectedThemes: string[];
    strength: number;
    relevance?: ThematicRelevance;
    note?: string; // For WEAK/NONE: includes suggestion to connect or cut
  }>;
  characterConnections: Array<{
    characterName: string;
    isConnected: boolean;
    thematicRole: string;
    connectedThemes: string[];
    strength: number;
  }>;
  floatingElements: {
    scenes: number[];
    characters: string[];
  };
}

function buildPrompts(
  screenplay: ThemeConnectionsRequest["screenplay"],
  soul: ThemeConnectionsRequest["soul"]
) {
  // For large screenplays, we need to be more concise
  const isLargeScreenplay = screenplay.scenes.length > 40;
  const contentLength = isLargeScreenplay ? 150 : 300;

  // Build condensed scene list
  const sceneDescriptions = screenplay.scenes.map((scene) => {
    const contentPreview = scene.content.slice(0, contentLength).replace(/\n/g, " ");
    return `Sc${scene.sceneNumber}: ${scene.heading} | ${contentPreview}`;
  }).join("\n");

  // Build character list
  const characterList = screenplay.characters
    .slice(0, 15)
    .map((c) => `${c.name} (${c.dialogueCount} lines, appears in ${c.sceneAppearances.length} scenes)`)
    .join("\n");

  const systemPrompt = `You are a master thematic analyst for screenplays. Your task is to determine how each scene connects to the screenplay's central theme.

THEMATIC ANALYSIS FRAMEWORK:

For each scene, ask these diagnostic questions:
1. Does this scene ADVANCE or COMPLICATE the central thematic argument?
2. Does a character EXPRESS or CONTRADICT the theme through action or dialogue?
3. Does this scene show the protagonist moving TOWARD or AWAY from their need?
4. Would REMOVING this scene affect the story's thematic coherence?

THEMATIC RELEVANCE RATINGS:
- STRONG (0.8-1.0): Scene directly advances thematic argument, characters embody theme
- MODERATE (0.5-0.7): Scene has implicit thematic connection, supports overall argument
- WEAK (0.3-0.4): Tangential connection, could be strengthened
- NONE (0.0-0.2): Scene appears disconnected from theme - opportunity for revision

For scenes rated NONE or WEAK, consider:
- Could this scene be CUT without losing thematic integrity?
- How could it be CONNECTED more explicitly to the theme?

Be SPECIFIC and ANALYTICAL. Reference actual scene content when determining connections.
Scenes that don't clearly express or challenge the theme should be marked as "floating" - this is valuable diagnostic information for the writer.

Always respond with valid JSON only, no markdown formatting.`;

  const userPrompt = `Analyze this screenplay's thematic structure and map connections.

SCREENPLAY: "${screenplay.title}"
TOTAL SCENES: ${screenplay.scenes.length}

SOUL (Theme Data):
- Central Question: "${soul.centralQuestion}"
- Thematic Argument: "${soul.thematicArgument}"
- Controlling Idea: "${soul.controllingIdea}"
- Protagonist's Lie: "${soul.protagonistLie}"
- Protagonist's Truth: "${soul.protagonistTruth}"

CHARACTERS:
${characterList}

SCENES:
${sceneDescriptions}

---

ANALYSIS INSTRUCTIONS:

1. EXTRACT CORE THEME: Derive a single core theme word/phrase from the controlling idea (e.g., "Redemption", "Identity", "Power vs Love")

2. EXTRACT SUB-THEMES: Identify 2-4 sub-themes from the thematic argument and lie/truth (e.g., "Sacrifice", "Trust", "Self-deception")

3. ANALYZE EACH SCENE:
   a) Create a SHORT SLUG (2-4 words max) that captures the scene's essence:
      - Focus on the KEY ACTION or EVENT (e.g., "First Kiss", "Job Interview", "Betrayal Revealed")
      - Use active verbs when possible (e.g., "Emma Confronts Dad", "Secrets Exposed")
      - Be SPECIFIC to THIS scene, not generic
      - Examples: "Diner Confession", "Chase Through Market", "Wedding Disaster", "Silent Goodbye"

   b) Assess thematic connection using these questions:
      - Does this scene ADVANCE or COMPLICATE the central argument?
      - Does a character EXPRESS or CONTRADICT the theme through action/dialogue?
      - Does this scene show the protagonist moving TOWARD or AWAY from their need?
      - Would REMOVING this scene affect thematic coherence?

   c) Rate thematic relevance:
      - STRONG (0.8-1.0): Directly advances theme
      - MODERATE (0.5-0.7): Implicit connection
      - WEAK (0.3-0.4): Tangential, could be strengthened
      - NONE (0.0-0.2): Disconnected - consider cutting or connecting

   For WEAK/NONE scenes, include a suggestion in the note field

4. ANALYZE EACH CHARACTER:
   - What is their thematic role? (protagonist, antagonist, mirror, catalyst, tempter, mentor)
   - Which themes do they embody or challenge?
   - Rate connection strength

5. IDENTIFY FLOATING ELEMENTS:
   - List scene numbers that lack thematic connection
   - List character names that lack thematic connection

Respond with ONLY valid JSON in this exact format:
{
  "coreTheme": "Single theme word or short phrase",
  "subThemes": ["Sub-theme 1", "Sub-theme 2", "..."],
  "sceneConnections": [
    {
      "sceneNumber": 1,
      "slug": "Short Scene Name",
      "isConnected": true,
      "connectedThemes": ["Core theme", "Sub-theme 1"],
      "strength": 0.8,
      "relevance": "STRONG|MODERATE|WEAK|NONE",
      "note": "How the scene connects (or for WEAK/NONE: suggestion to connect or cut)"
    }
  ],
  "characterConnections": [
    {
      "characterName": "CHARACTER NAME",
      "isConnected": true,
      "thematicRole": "protagonist|antagonist|mirror|catalyst|tempter|mentor|supporting",
      "connectedThemes": ["Theme 1"],
      "strength": 0.9
    }
  ],
  "floatingElements": {
    "scenes": [5, 12, 23],
    "characters": ["MINOR CHARACTER"]
  }
}`;

  return { systemPrompt, userPrompt };
}

async function callAnthropic(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API request failed");
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

async function callGoogle(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 16384,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google API request failed");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function repairTruncatedJSON(jsonStr: string): string {
  // Try to repair truncated JSON by closing open brackets/braces
  let repaired = jsonStr.trim();

  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of repaired) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
  }

  // If we're in a string, close it
  if (inString) {
    repaired += '"';
  }

  // Remove trailing comma if present before closing
  repaired = repaired.replace(/,\s*$/, '');

  // Close any incomplete object/array entries
  // If the last non-whitespace is a comma or colon, add a placeholder
  if (/[,:][\s]*$/.test(repaired)) {
    repaired = repaired.replace(/[,:]\s*$/, '');
  }

  // Close brackets and braces
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  return repaired;
}

function parseAIResponse(content: string): ThemeConnectionsResponse {
  // Extract JSON from the response
  let jsonStr = content;

  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // Try to find raw JSON
    const rawJsonMatch = content.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      jsonStr = rawJsonMatch[0];
    }
  }

  // Try to parse, if it fails try to repair truncated JSON
  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (parseError) {
    console.log("Initial JSON parse failed, attempting repair...");
    const repaired = repairTruncatedJSON(jsonStr);
    try {
      result = JSON.parse(repaired);
      console.log("JSON repair successful");
    } catch (repairError) {
      // Last resort: try to extract partial data
      console.error("JSON repair failed, attempting partial extraction");
      result = extractPartialData(jsonStr);
    }
  }

  // Validate required fields
  if (!result.coreTheme || !result.subThemes || !result.sceneConnections || !result.characterConnections) {
    throw new Error("Invalid response: missing required fields");
  }

  // Ensure floatingElements exists
  if (!result.floatingElements) {
    result.floatingElements = { scenes: [], characters: [] };
  }

  return result as ThemeConnectionsResponse;
}

function extractPartialData(jsonStr: string): Partial<ThemeConnectionsResponse> {
  // Try to extract whatever data we can from malformed JSON
  const result: Partial<ThemeConnectionsResponse> = {
    coreTheme: "Theme",
    subThemes: [],
    sceneConnections: [],
    characterConnections: [],
    floatingElements: { scenes: [], characters: [] }
  };

  // Try to extract coreTheme
  const coreMatch = jsonStr.match(/"coreTheme"\s*:\s*"([^"]+)"/);
  if (coreMatch) {
    result.coreTheme = coreMatch[1];
  }

  // Try to extract subThemes array
  const subThemesMatch = jsonStr.match(/"subThemes"\s*:\s*\[([\s\S]*?)\]/);
  if (subThemesMatch) {
    const themes = subThemesMatch[1].match(/"([^"]+)"/g);
    if (themes) {
      result.subThemes = themes.map(t => t.replace(/"/g, ''));
    }
  }

  // Extract scene connections - match individual objects (with or without slug)
  const scenePattern = /\{\s*"sceneNumber"\s*:\s*(\d+)\s*,\s*(?:"slug"\s*:\s*"([^"]*?)"\s*,\s*)?"isConnected"\s*:\s*(true|false)\s*,\s*"connectedThemes"\s*:\s*\[(.*?)\]\s*,\s*"strength"\s*:\s*([\d.]+)/g;
  let sceneMatch;
  while ((sceneMatch = scenePattern.exec(jsonStr)) !== null) {
    const sceneNumber = parseInt(sceneMatch[1]);
    const slug = sceneMatch[2] || `Sc ${sceneNumber}`;
    const themes = sceneMatch[4].match(/"([^"]+)"/g) || [];
    result.sceneConnections!.push({
      sceneNumber,
      slug,
      isConnected: sceneMatch[3] === 'true',
      connectedThemes: themes.map(t => t.replace(/"/g, '')),
      strength: parseFloat(sceneMatch[5])
    });
  }

  // Extract character connections
  const charPattern = /\{\s*"characterName"\s*:\s*"([^"]+)"\s*,\s*"isConnected"\s*:\s*(true|false)\s*,\s*"thematicRole"\s*:\s*"([^"]+)"\s*,\s*"connectedThemes"\s*:\s*\[(.*?)\]\s*,\s*"strength"\s*:\s*([\d.]+)/g;
  let charMatch;
  while ((charMatch = charPattern.exec(jsonStr)) !== null) {
    const themes = charMatch[4].match(/"([^"]+)"/g) || [];
    result.characterConnections!.push({
      characterName: charMatch[1],
      isConnected: charMatch[2] === 'true',
      thematicRole: charMatch[3],
      connectedThemes: themes.map(t => t.replace(/"/g, '')),
      strength: parseFloat(charMatch[5])
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body: ThemeConnectionsRequest = await request.json();
    const { screenplay, soul } = body;

    if (!screenplay || !soul) {
      return NextResponse.json(
        { message: "Missing required screenplay or soul data" },
        { status: 400 }
      );
    }

    // Determine API key and provider
    let apiKey = body.apiKey;
    let provider = body.provider;

    if (!apiKey) {
      const anthropicKey = process.env.STORIQ_ANTHROPIC_KEY;
      const googleKey = process.env.GOOGLE_API_KEY;
      const defaultProvider = process.env.AI_PROVIDER;

      if (defaultProvider === "google" && googleKey) {
        apiKey = googleKey;
        provider = "google";
      } else if (anthropicKey) {
        apiKey = anthropicKey;
        provider = "anthropic";
      } else if (googleKey) {
        apiKey = googleKey;
        provider = "google";
      }
    }

    if (apiKey && !provider) {
      if (apiKey.startsWith("sk-ant-")) {
        provider = "anthropic";
      } else if (apiKey.startsWith("AIza")) {
        provider = "google";
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: "No API key configured. Add ANTHROPIC_API_KEY or GOOGLE_API_KEY to your .env.local file." },
        { status: 401 }
      );
    }

    const { systemPrompt, userPrompt } = buildPrompts(screenplay, soul);

    let content: string;
    if (provider === "google") {
      content = await callGoogle(apiKey, systemPrompt, userPrompt);
    } else {
      content = await callAnthropic(apiKey, systemPrompt, userPrompt);
    }

    const result = parseAIResponse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Theme connections analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze theme connections. Please try again.",
      },
      { status: 500 }
    );
  }
}
