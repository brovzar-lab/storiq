import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

type IssueType =
  | "floating-scene"
  | "floating-character"
  | "arc-stall"
  | "arc-regression"
  | "emotional-flat"
  | "emotional-spike"
  | "pacing-issue"
  | "theme-disconnect";

interface SuggestFixRequest {
  issueType: IssueType;
  issueContext: {
    // For floating scene/character
    elementName?: string;
    elementType?: "scene" | "character";
    sceneNumber?: number;
    sceneContent?: string;

    // For arc issues
    sequenceName?: string;
    sequenceContent?: string;
    currentArcState?: string;
    expectedArcState?: string;

    // For emotional issues
    pageRange?: { start: number; end: number };
    currentEmotion?: string;
    currentIntensity?: number;
  };
  screenplayContext: {
    title: string;
    genreId: string;
    controllingIdea: string;
    protagonistLie?: string;
    protagonistTruth?: string;
    coreTheme?: string;
    subThemes?: string[];
  };
  apiKey?: string;
  provider?: "anthropic" | "google";
}

interface SuggestFixResponse {
  suggestion: string;
  specificActions: string[];
  exampleDialogue?: string;
  question?: string; // A Socratic question to guide the writer
}

function buildSystemPrompt(genreId: string): string {
  return `You are a supportive development executive and creative collaborator helping a screenwriter strengthen their work.

Your approach:
- Frame all feedback as opportunities, not problems
- Be specific and actionable - vague advice is useless
- Suggest concrete changes the writer can make TODAY
- Include example dialogue or scene beats when possible
- End with a Socratic question to spark the writer's own creativity
- Match the tone to the genre: ${genreId}

Remember: Your job is to make their screenplay GREAT, not to criticize. Every suggestion should feel like an invitation to explore, not a verdict.

You MUST respond with ONLY a JSON object (no markdown, no explanation):
{
  "suggestion": "A warm, specific 2-3 sentence suggestion that addresses the issue directly",
  "specificActions": ["Action 1 the writer can take", "Action 2 they can take", "Action 3 (optional)"],
  "exampleDialogue": "If applicable, a sample line of dialogue or scene beat that demonstrates the fix",
  "question": "A thought-provoking question to help the writer explore further"
}`;
}

function buildUserPrompt(request: SuggestFixRequest): string {
  const { issueType, issueContext, screenplayContext } = request;

  let prompt = `SCREENPLAY: "${screenplayContext.title}" (${screenplayContext.genreId})
CONTROLLING IDEA: ${screenplayContext.controllingIdea}
${screenplayContext.coreTheme ? `CORE THEME: ${screenplayContext.coreTheme}` : ""}
${screenplayContext.protagonistLie ? `PROTAGONIST'S LIE: "${screenplayContext.protagonistLie}"` : ""}
${screenplayContext.protagonistTruth ? `PROTAGONIST'S TRUTH: "${screenplayContext.protagonistTruth}"` : ""}

`;

  switch (issueType) {
    case "floating-scene":
      prompt += `ISSUE: Scene ${issueContext.sceneNumber} appears to be thematically disconnected from the rest of the story.

SCENE CONTENT:
${issueContext.sceneContent || "No content available"}

Help the writer find a way to connect this scene to the theme, or suggest how it might be cut/merged if it's truly unnecessary.`;
      break;

    case "floating-character":
      prompt += `ISSUE: The character "${issueContext.elementName}" doesn't have a clear thematic purpose in the story.

Help the writer either:
1. Find a thematic role for this character
2. Merge them with another character
3. Cut them if they don't serve the story`;
      break;

    case "arc-stall":
      prompt += `ISSUE: The protagonist's arc appears to stall in ${issueContext.sequenceName}.

CURRENT STATE: ${issueContext.currentArcState}
EXPECTED MOVEMENT: The protagonist should be moving toward ${issueContext.expectedArcState}

SEQUENCE CONTENT:
${issueContext.sequenceContent || "No content available"}

Suggest how the writer can add movement to the protagonist's internal journey in this sequence.`;
      break;

    case "arc-regression":
      prompt += `ISSUE: The protagonist appears to regress without clear motivation in ${issueContext.sequenceName}.

This could be intentional (for dramatic effect) or accidental. Help the writer either:
1. Justify the regression with clear cause-and-effect
2. Smooth the arc progression if the regression is unintentional`;
      break;

    case "emotional-flat":
      prompt += `ISSUE: Pages ${issueContext.pageRange?.start}-${issueContext.pageRange?.end} have low emotional intensity, creating a "flat stretch" that might lose audience engagement.

CURRENT EMOTION: ${issueContext.currentEmotion || "neutral"}
INTENSITY: ${issueContext.currentIntensity || 0}%

Suggest how to inject more emotional energy while serving the story's themes and pacing needs.`;
      break;

    case "emotional-spike":
      prompt += `ISSUE: There's an emotional spike that might feel unearned or jarring around pages ${issueContext.pageRange?.start}-${issueContext.pageRange?.end}.

CURRENT EMOTION: ${issueContext.currentEmotion}
INTENSITY: ${issueContext.currentIntensity}%

Suggest how to either:
1. Build up to this moment more effectively
2. Modulate the intensity to fit the surrounding scenes`;
      break;

    case "pacing-issue":
      prompt += `ISSUE: The pacing feels off in ${issueContext.sequenceName || `pages ${issueContext.pageRange?.start}-${issueContext.pageRange?.end}`}.

Help the writer identify what might be causing the pacing problem and how to fix it.`;
      break;

    case "theme-disconnect":
      prompt += `ISSUE: ${issueContext.elementName} doesn't clearly connect to the theme "${screenplayContext.coreTheme}".

Suggest specific ways to weave the theme into this element without being heavy-handed.`;
      break;

    default:
      prompt += `ISSUE: General feedback requested for ${issueContext.elementName || "this element"}.

Provide constructive suggestions for improvement.`;
  }

  prompt += `

Generate a supportive, specific, and actionable suggestion. Remember to include:
1. A warm, specific suggestion
2. 2-3 concrete actions they can take
3. Example dialogue or scene beat if applicable
4. A thought-provoking question

Return ONLY the JSON object.`;

  return prompt;
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
      max_tokens: 2048,
      temperature: 0.7, // Slightly more creative for suggestions
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
        temperature: 0.7,
        maxOutputTokens: 2048,
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

function parseAIResponse(content: string): SuggestFixResponse {
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

  const result = JSON.parse(jsonStr);

  // Ensure required fields
  if (!result.suggestion) {
    result.suggestion = "Consider how this element serves your story's core theme.";
  }
  if (!result.specificActions || !Array.isArray(result.specificActions)) {
    result.specificActions = ["Review the element's purpose in the story"];
  }

  return result as SuggestFixResponse;
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestFixRequest = await request.json();
    const { issueType, issueContext, screenplayContext } = body;

    if (!issueType || !screenplayContext) {
      return NextResponse.json(
        { message: "Missing required data (issueType, screenplayContext)" },
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
    const systemPrompt = buildSystemPrompt(screenplayContext.genreId);
    const userPrompt = buildUserPrompt(body);

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
    console.error("Suggest fix error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate suggestion. Please try again.",
      },
      { status: 500 }
    );
  }
}
