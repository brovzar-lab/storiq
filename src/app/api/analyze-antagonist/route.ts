import { NextRequest, NextResponse } from "next/server";
import {
  buildAntagonistAuditSystemPrompt,
  buildAntagonistAuditUserPrompt,
  generateHeuristicAntagonistAudit,
  type AntagonistAuditResult,
} from "@/lib/agents/lenses/antagonistAudit";
import type { GenreId } from "@/types/screenplay";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface AntagonistAnalysisRequest {
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
  protagonistName?: string;
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
      max_tokens: 8192,
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
        maxOutputTokens: 8192,
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

function parseAIResponse(content: string): AntagonistAuditResult {
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
    } catch (repairError) {
      console.error("JSON repair failed:", repairError);
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  // Ensure arrays exist
  if (!result.antagonists) {
    result.antagonists = [];
  }
  if (!result.issues) {
    result.issues = [];
  }
  if (!result.strengths) {
    result.strengths = [];
  }
  if (typeof result.overallThreatLevel !== 'number') {
    result.overallThreatLevel = 50;
  }

  return result as AntagonistAuditResult;
}

/**
 * Generate sequence summaries for the prompt
 */
function generateSequenceSummaries(
  sequences: AntagonistAnalysisRequest['sequences'],
  scenes: AntagonistAnalysisRequest['screenplay']['scenes']
): Array<{ id: string; name: string; pageRange: string; characters: string[]; summary: string }> {
  return sequences.map((seq) => {
    // Get scenes in this sequence
    const seqScenes = scenes.filter((s) => seq.sceneNumbers.includes(s.sceneNumber));

    // Generate a summary from scene headings
    const summary = seqScenes
      .slice(0, 3)
      .map((s) => s.heading)
      .join(" → ");

    return {
      id: seq.id,
      name: seq.name,
      pageRange: `pp. ${seq.pageStart}-${seq.pageEnd}`,
      characters: seq.characters,
      summary: summary || seq.dramaticQuestion || "No summary available",
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: AntagonistAnalysisRequest = await request.json();
    const { screenplay, sequences, soul, genreId, protagonistName } = body;

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
      // Return heuristic analysis when no API key
      const heuristicResult = generateHeuristicAntagonistAudit(
        screenplay.characters,
        protagonistName
      );
      return NextResponse.json(heuristicResult);
    }

    // Build prompts
    const systemPrompt = buildAntagonistAuditSystemPrompt(genreId);
    const sequenceSummaries = generateSequenceSummaries(sequences, screenplay.scenes);
    const userPrompt = buildAntagonistAuditUserPrompt(
      screenplay.title,
      soul,
      sequenceSummaries,
      screenplay.characters
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
    console.error("Antagonist analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze antagonist. Please try again.",
      },
      { status: 500 }
    );
  }
}
