import { NextRequest, NextResponse } from "next/server";
import {
  buildWantVsNeedSystemPrompt,
  buildWantVsNeedUserPrompt,
  getSequenceContent,
  type WantVsNeedAnalysis,
} from "@/lib/agents/lenses/wantVsNeed";
import type { GenreId } from "@/types/screenplay";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface CharacterArcRequest {
  screenplay: {
    title: string;
    scenes: Array<{
      sceneNumber: number;
      heading: string;
      content: string;
    }>;
  };
  sequences: Array<{
    id: string;
    name: string;
    sceneNumbers: number[];
    pageStart: number;
    pageEnd: number;
    characters: string[];
    dramaticQuestion?: string;
  }>;
  soul: {
    centralQuestion: string;
    thematicArgument: string;
    controllingIdea: string;
    protagonistLie: string;
    protagonistTruth: string;
  };
  genreId: GenreId;
  apiKey?: string;
  provider?: "anthropic" | "google";
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

function parseAIResponse(content: string): WantVsNeedAnalysis {
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
    } catch {
      console.error("JSON repair failed, attempting partial extraction");
      result = extractPartialData(jsonStr);
    }
  }

  // Validate required fields
  if (!result.protagonistName || !result.want || !result.need) {
    throw new Error("Invalid response: missing required fields (protagonistName, want, need)");
  }

  // Ensure arrays exist
  if (!result.sequenceAssessments) {
    result.sequenceAssessments = [];
  }
  if (!result.issues) {
    result.issues = [];
  }
  if (!result.strengths) {
    result.strengths = [];
  }

  return result as WantVsNeedAnalysis;
}

function extractPartialData(jsonStr: string): Partial<WantVsNeedAnalysis> {
  const result: Partial<WantVsNeedAnalysis> = {
    protagonistName: "Unknown",
    want: "",
    need: "",
    lie: "",
    truth: "",
    sequenceAssessments: [],
    issues: [],
    strengths: [],
    overallArcHealth: 50,
  };

  // Extract protagonist name
  const protagonistMatch = jsonStr.match(/"protagonistName"\s*:\s*"([^"]+)"/);
  if (protagonistMatch) {
    result.protagonistName = protagonistMatch[1];
  }

  // Extract want
  const wantMatch = jsonStr.match(/"want"\s*:\s*"([^"]+)"/);
  if (wantMatch) {
    result.want = wantMatch[1];
  }

  // Extract need
  const needMatch = jsonStr.match(/"need"\s*:\s*"([^"]+)"/);
  if (needMatch) {
    result.need = needMatch[1];
  }

  // Extract lie
  const lieMatch = jsonStr.match(/"lie"\s*:\s*"([^"]+)"/);
  if (lieMatch) {
    result.lie = lieMatch[1];
  }

  // Extract truth
  const truthMatch = jsonStr.match(/"truth"\s*:\s*"([^"]+)"/);
  if (truthMatch) {
    result.truth = truthMatch[1];
  }

  // Extract overall arc health
  const healthMatch = jsonStr.match(/"overallArcHealth"\s*:\s*(\d+)/);
  if (healthMatch) {
    result.overallArcHealth = parseInt(healthMatch[1]);
  }

  // Extract sequence assessments
  const seqPattern = /\{\s*"sequenceId"\s*:\s*"([^"]+)"\s*,\s*"sequenceName"\s*:\s*"([^"]+)"\s*,\s*"pageRange"\s*:\s*"([^"]+)"\s*,\s*"pursuingWant"\s*:\s*(true|false)\s*,[\s\S]*?"lieStatus"\s*:\s*"([^"]+)"\s*,\s*"arcPosition"\s*:\s*(\d+)/g;
  let seqMatch;
  while ((seqMatch = seqPattern.exec(jsonStr)) !== null) {
    result.sequenceAssessments!.push({
      sequenceId: seqMatch[1],
      sequenceName: seqMatch[2],
      pageRange: seqMatch[3],
      pursuingWant: seqMatch[4] === 'true',
      needHints: [],
      lieStatus: seqMatch[5] as "reinforced" | "cracking" | "shattered" | "integrated",
      arcPosition: parseInt(seqMatch[6]),
      keyMoments: [],
      isPassive: false,
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body: CharacterArcRequest = await request.json();
    const { screenplay, sequences, soul, genreId } = body;

    if (!screenplay || !sequences || !soul || !genreId) {
      return NextResponse.json(
        { message: "Missing required data (screenplay, sequences, soul, genreId)" },
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
    const systemPrompt = buildWantVsNeedSystemPrompt(genreId);
    const sceneContents = getSequenceContent(sequences, screenplay.scenes);
    const userPrompt = buildWantVsNeedUserPrompt(
      screenplay.title,
      soul,
      sequences,
      sceneContents
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
    console.error("Character arc analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze character arc. Please try again.",
      },
      { status: 500 }
    );
  }
}
