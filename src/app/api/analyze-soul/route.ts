import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// Using Node.js runtime for proper env var access

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface SoulAnalysisRequest {
  screenplay: {
    title: string;
    rawText: string;
    totalPages: number;
    scenes: Array<{
      sceneNumber: number;
      heading: string;
      content: string;
    }>;
    characters: Array<{
      name: string;
      dialogueCount: number;
    }>;
  };
  genre: {
    id: string;
    name: string;
  };
  apiKey?: string; // Optional - will use env var if not provided
  provider?: "anthropic" | "google"; // Optional - will auto-detect
}

function buildPrompts(screenplay: SoulAnalysisRequest["screenplay"], genre: SoulAnalysisRequest["genre"]) {
  // Build a condensed version of the screenplay for the prompt
  const sceneCount = screenplay.scenes.length;
  const sceneSamples: string[] = [];

  // Always include first 3 scenes
  screenplay.scenes.slice(0, 3).forEach((scene) => {
    sceneSamples.push(`SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`);
  });

  // Include midpoint scenes
  if (sceneCount > 10) {
    const midpoint = Math.floor(sceneCount / 2);
    screenplay.scenes.slice(midpoint - 1, midpoint + 2).forEach((scene) => {
      sceneSamples.push(`SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`);
    });
  }

  // Include last 3 scenes
  screenplay.scenes.slice(-3).forEach((scene) => {
    sceneSamples.push(`SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`);
  });

  // Get top characters
  const topCharacters = screenplay.characters.slice(0, 5).map((c) => c.name).join(", ");

  const systemPrompt = `You are a master story analyst specializing in screenplay development. Your task is to identify the "soul" of a screenplay - its thematic core, central dramatic question, and character transformation arc.

You will analyze screenplay content and extract:
1. The Central Dramatic Question - the question that keeps the audience engaged
2. The Thematic Argument - what the story is arguing about life/humanity
3. The Controlling Idea - value + cause (e.g., "Love prevails when we sacrifice ego")
4. The Protagonist's Lie - the false belief they start with
5. The Protagonist's Truth - what they must learn

Be SPECIFIC to this screenplay. Reference actual character names, situations, and themes from the text.
Do NOT give generic answers. Every response should feel tailored to THIS story.

Respond in JSON format only:
{
  "centralQuestion": "The question the audience will hold throughout",
  "thematicArgument": "What the story argues about life",
  "controllingIdea": "Value + Cause statement",
  "protagonistLie": "The false belief the protagonist starts with",
  "protagonistTruth": "What the protagonist must learn"
}`;

  const userPrompt = `Analyze this ${genre.name} screenplay and identify its soul:

TITLE: ${screenplay.title}
PAGES: ${screenplay.totalPages}
TOTAL SCENES: ${sceneCount}
MAIN CHARACTERS: ${topCharacters}

KEY SCENES FROM THE SCREENPLAY:

${sceneSamples.join("\n\n---\n\n")}

Based on these scenes, what is the soul of this screenplay? Be specific to this story - reference actual characters, situations, and conflicts you see in the text.`;

  return { systemPrompt, userPrompt };
}

async function callAnthropic(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0.7,
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

async function callGoogle(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
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

function parseAIResponse(content: string) {
  // Extract JSON from the response (in case there's any extra text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const soul = JSON.parse(jsonMatch[0]);

  // Validate required fields
  if (
    !soul.centralQuestion ||
    !soul.thematicArgument ||
    !soul.controllingIdea ||
    !soul.protagonistLie ||
    !soul.protagonistTruth
  ) {
    throw new Error("Missing required soul fields");
  }

  return soul;
}

export async function POST(request: NextRequest) {
  try {
    const body: SoulAnalysisRequest = await request.json();
    const { screenplay, genre } = body;

    // Determine which API key to use (priority: request body > env var)
    let apiKey = body.apiKey;
    let provider = body.provider;

    // Check environment variables if no key provided
    if (!apiKey) {
      const anthropicKey = process.env.STORIQ_ANTHROPIC_KEY;
      const googleKey = process.env.GOOGLE_API_KEY;
      const defaultProvider = process.env.AI_PROVIDER;

      console.log("ENV DEBUG - ANTHROPIC_API_KEY exists:", !!anthropicKey);
      console.log("ENV DEBUG - GOOGLE_API_KEY exists:", !!googleKey);
      console.log("ENV DEBUG - AI_PROVIDER:", defaultProvider);

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

    // Auto-detect provider from key format if not specified
    if (apiKey && !provider) {
      if (apiKey.startsWith("sk-ant-")) {
        provider = "anthropic";
      } else if (apiKey.startsWith("AIza")) {
        provider = "google";
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: "No API key configured. Add ANTHROPIC_API_KEY or GOOGLE_API_KEY to your .env.local file, or configure in Settings." },
        { status: 401 }
      );
    }

    const { systemPrompt, userPrompt } = buildPrompts(screenplay, genre);

    let content: string;

    if (provider === "google") {
      content = await callGoogle(apiKey, systemPrompt, userPrompt);
    } else {
      // Default to Anthropic
      content = await callAnthropic(apiKey, systemPrompt, userPrompt);
    }

    const soul = parseAIResponse(content);

    return NextResponse.json({
      ...soul,
      confirmed: false,
    });
  } catch (error) {
    console.error("Soul analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze screenplay. Please try again.",
      },
      { status: 500 }
    );
  }
}
