import { NextRequest, NextResponse } from "next/server";
import type { EmotionType, PlotPoint } from "@/types/visualization";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface EmotionalJourneyRequest {
  screenplay: {
    title: string;
    scenes: Array<{
      sceneNumber: number;
      heading: string;
      content: string;
      pageStart?: number;
    }>;
  };
  sequences: Array<{
    id: string;
    name: string;
    sceneNumbers: number[];
    pageStart: number;
    pageEnd: number;
    dramaticQuestion?: string;
  }>;
  genreId: string;
  apiKey?: string;
  provider?: "anthropic" | "google";
}

interface EmotionalJourneyAnalysis {
  sequenceEmotions: Array<{
    sequenceId: string;
    sequenceName: string;
    pageStart: number;
    pageEnd: number;
    dominantEmotion: EmotionType;
    secondaryEmotion?: EmotionType;
    intensity: number;
    description: string;
    keyMoment?: string;
  }>;
  plotPoints: Array<{
    type: "inciting-incident" | "midpoint" | "climax" | "resolution" | "plot-point-1" | "plot-point-2";
    page: number;
    label: string;
    emotion: EmotionType;
  }>;
  emotionalArcSummary: string;
  overallPattern: "ascending" | "descending" | "wave" | "flat";
  issues: string[];
  strengths: string[];
}

function buildEmotionalJourneySystemPrompt(genreId: string): string {
  return `You are an expert screenwriting analyst specializing in emotional dynamics and audience engagement.

Your task is to analyze a screenplay's emotional journey - the feelings the audience experiences as they watch.

EMOTIONAL TYPES (choose the most dominant for each sequence):
- tension: Building suspense, uncertainty, anticipation of conflict
- fear: Dread, horror, anxiety about danger
- joy: Happiness, delight, celebration
- triumph: Victory, achievement, catharsis
- sadness: Grief, loss, melancholy
- anger: Outrage, frustration, injustice
- hope: Optimism, anticipation of good outcomes
- dread: Impending doom, sense of inevitability
- relief: Release of tension, safety achieved
- surprise: Shock, unexpected revelations

GENRE CONTEXT: ${genreId}
- Each genre has expected emotional patterns
- Comedies: joy peaks with tension valleys
- Thrillers: sustained tension with relief beats
- Dramas: emotional complexity with cathartic climax
- Horror: dread building to fear peaks
- Romance: hope/joy with sadness valleys

PLOT POINT IDENTIFICATION:
- inciting-incident: First major disruption (usually 10-15% in)
- plot-point-1: End of Act 1 commitment (around 25%)
- midpoint: Major reversal or revelation (around 50%)
- plot-point-2: All is lost moment (around 75%)
- climax: Maximum emotional intensity (around 90%)
- resolution: Emotional landing (final 5%)

INTENSITY SCALE (0-100):
- 0-20: Neutral, setup, breathing room
- 21-40: Mild engagement, building
- 41-60: Moderate intensity, engaged
- 61-80: High intensity, gripped
- 81-100: Peak intensity, climactic

You must respond with ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "sequenceEmotions": [
    {
      "sequenceId": "string",
      "sequenceName": "string",
      "pageStart": number,
      "pageEnd": number,
      "dominantEmotion": "tension|fear|joy|triumph|sadness|anger|hope|dread|relief|surprise",
      "secondaryEmotion": "optional emotion",
      "intensity": 0-100,
      "description": "Brief description of emotional experience",
      "keyMoment": "Optional specific moment that defines this sequence's emotion"
    }
  ],
  "plotPoints": [
    {
      "type": "inciting-incident|midpoint|climax|resolution|plot-point-1|plot-point-2",
      "page": number,
      "label": "Brief description of the plot point",
      "emotion": "dominant emotion at this moment"
    }
  ],
  "emotionalArcSummary": "2-3 sentence summary of the overall emotional journey",
  "overallPattern": "ascending|descending|wave|flat",
  "issues": ["List of emotional pacing issues"],
  "strengths": ["List of emotional strengths"]
}`;
}

function buildEmotionalJourneyUserPrompt(
  title: string,
  sequences: EmotionalJourneyRequest["sequences"],
  scenes: EmotionalJourneyRequest["screenplay"]["scenes"]
): string {
  const sequenceDetails = sequences.map((seq) => {
    const seqScenes = scenes.filter((s) => seq.sceneNumbers.includes(s.sceneNumber));
    const sceneContent = seqScenes
      .map((s) => `Scene ${s.sceneNumber}: ${s.heading}\n${s.content.slice(0, 500)}...`)
      .join("\n\n");

    return `## ${seq.name} (Pages ${seq.pageStart}-${seq.pageEnd})
${seq.dramaticQuestion ? `Dramatic Question: ${seq.dramaticQuestion}` : ""}

${sceneContent}
---`;
  }).join("\n\n");

  return `Analyze the emotional journey of this screenplay:

TITLE: ${title}
TOTAL PAGES: ${sequences.length > 0 ? sequences[sequences.length - 1].pageEnd : 0}
TOTAL SEQUENCES: ${sequences.length}

=== SCREENPLAY CONTENT BY SEQUENCE ===

${sequenceDetails}

=== END SCREENPLAY CONTENT ===

Analyze the emotional journey. For each sequence, determine:
1. What emotion does the audience primarily feel?
2. How intense is that emotion (0-100)?
3. What moment defines this emotional beat?

Also identify the major plot points and their emotional character.

Return ONLY the JSON object, no explanation.`;
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
      temperature: 0.3,
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
        temperature: 0.3,
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
  let repaired = jsonStr.trim();

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

  if (inString) {
    repaired += '"';
  }

  repaired = repaired.replace(/,\s*$/, '');

  if (/[,:][\s]*$/.test(repaired)) {
    repaired = repaired.replace(/[,:]\s*$/, '');
  }

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

function parseAIResponse(content: string): EmotionalJourneyAnalysis {
  let jsonStr = content;

  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const rawJsonMatch = content.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      jsonStr = rawJsonMatch[0];
    }
  }

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    console.log("Initial JSON parse failed, attempting repair...");
    const repaired = repairTruncatedJSON(jsonStr);
    try {
      result = JSON.parse(repaired);
      console.log("JSON repair successful");
    } catch (e) {
      console.error("JSON repair failed:", e);
      throw new Error("Failed to parse AI response");
    }
  }

  // Validate and ensure defaults
  if (!result.sequenceEmotions || !Array.isArray(result.sequenceEmotions)) {
    result.sequenceEmotions = [];
  }
  if (!result.plotPoints || !Array.isArray(result.plotPoints)) {
    result.plotPoints = [];
  }
  if (!result.issues || !Array.isArray(result.issues)) {
    result.issues = [];
  }
  if (!result.strengths || !Array.isArray(result.strengths)) {
    result.strengths = [];
  }
  if (!result.emotionalArcSummary) {
    result.emotionalArcSummary = "Emotional arc analysis in progress.";
  }
  if (!result.overallPattern) {
    result.overallPattern = "wave";
  }

  return result as EmotionalJourneyAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmotionalJourneyRequest = await request.json();
    const { screenplay, sequences, genreId } = body;

    if (!screenplay || !sequences || !genreId) {
      return NextResponse.json(
        { message: "Missing required data (screenplay, sequences, genreId)" },
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

    // Build prompts
    const systemPrompt = buildEmotionalJourneySystemPrompt(genreId);
    const userPrompt = buildEmotionalJourneyUserPrompt(
      screenplay.title,
      sequences,
      screenplay.scenes
    );

    // Call AI
    let content: string;
    if (provider === "google") {
      content = await callGoogle(apiKey, systemPrompt, userPrompt);
    } else {
      content = await callAnthropic(apiKey, systemPrompt, userPrompt);
    }

    const result = parseAIResponse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Emotional journey analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze emotional journey. Please try again.",
      },
      { status: 500 }
    );
  }
}
