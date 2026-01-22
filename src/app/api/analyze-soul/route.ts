import { NextRequest, NextResponse } from "next/server";
import {
  callAI,
  API_TIMEOUTS,
  resolveProvider,
  NO_API_KEY_ERROR,
  parseAIResponseJSON,
} from "@/lib/api";

export const dynamic = "force-dynamic";

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
  apiKey?: string;
  provider?: "anthropic" | "google";
}

interface SoulResponse {
  centralQuestion: string;
  thematicArgument: string;
  controllingIdea: string;
  protagonistLie: string;
  protagonistTruth: string;
}

function buildPrompts(
  screenplay: SoulAnalysisRequest["screenplay"],
  genre: SoulAnalysisRequest["genre"]
) {
  const sceneCount = screenplay.scenes.length;
  const sceneSamples: string[] = [];

  // Always include first 3 scenes
  screenplay.scenes.slice(0, 3).forEach((scene) => {
    sceneSamples.push(
      `SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`
    );
  });

  // Include midpoint scenes
  if (sceneCount > 10) {
    const midpoint = Math.floor(sceneCount / 2);
    screenplay.scenes.slice(midpoint - 1, midpoint + 2).forEach((scene) => {
      sceneSamples.push(
        `SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`
      );
    });
  }

  // Include last 3 scenes
  screenplay.scenes.slice(-3).forEach((scene) => {
    sceneSamples.push(
      `SCENE ${scene.sceneNumber}: ${scene.heading}\n${scene.content.slice(0, 1000)}`
    );
  });

  const topCharacters = screenplay.characters
    .slice(0, 5)
    .map((c) => c.name)
    .join(", ");

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

export async function POST(request: NextRequest) {
  try {
    const body: SoulAnalysisRequest = await request.json();
    const { screenplay, genre } = body;

    const providerConfig = resolveProvider(body.apiKey, body.provider);

    if (!providerConfig) {
      return NextResponse.json({ message: NO_API_KEY_ERROR }, { status: 401 });
    }

    const { systemPrompt, userPrompt } = buildPrompts(screenplay, genre);

    const content = await callAI(
      providerConfig.apiKey,
      providerConfig.provider,
      systemPrompt,
      userPrompt,
      { maxTokens: 1024, temperature: 0.7, timeout: API_TIMEOUTS.QUICK }
    );

    const soul = parseAIResponseJSON<SoulResponse>(content);

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
