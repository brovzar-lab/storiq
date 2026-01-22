import { NextRequest, NextResponse } from "next/server";
import {
  callAI,
  API_TIMEOUTS,
  resolveProvider,
  NO_API_KEY_ERROR,
  parseAIResponseJSON,
} from "@/lib/api";

export const dynamic = "force-dynamic";

type IssueType =
  | "floating-scene"
  | "floating-character"
  | "arc-stall"
  | "arc-regression"
  | "emotional-flat"
  | "emotional-spike"
  | "pacing-issue"
  | "theme-disconnect"
  | "antagonist-shallow"
  | "antagonist-absent"
  | "antagonist-incompetent"
  | "antagonist-no-philosophy"
  | "antagonist-no-mirror";

interface SuggestFixRequest {
  issueType: IssueType;
  issueContext: {
    elementName?: string;
    elementType?: "scene" | "character";
    sceneNumber?: number;
    sceneContent?: string;
    sequenceName?: string;
    sequenceContent?: string;
    currentArcState?: string;
    expectedArcState?: string;
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
  question?: string;
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

    case "antagonist-shallow":
      prompt += `ISSUE: The antagonist "${issueContext.elementName}" feels one-dimensional or lacks depth.

Help the writer add complexity to this antagonist by:
1. Giving them a clear worldview/philosophy
2. Making them the hero of their own story
3. Adding layers beyond "evil" or "greedy"`;
      break;

    case "antagonist-absent":
      prompt += `ISSUE: The antagonist "${issueContext.elementName}" disappears for too long in ${issueContext.sequenceName || "parts of the story"}.

Suggest ways to maintain their presence/threat even when off-screen, or explain how their absence could be used intentionally for effect.`;
      break;

    case "antagonist-incompetent":
      prompt += `ISSUE: The antagonist "${issueContext.elementName}" doesn't feel like a genuine threat.

Help the writer make this antagonist more formidable by:
1. Having them win sometimes or make smart moves
2. Removing convenient mistakes that let the hero win
3. Raising the stakes of confronting them`;
      break;

    case "antagonist-no-philosophy":
      prompt += `ISSUE: The antagonist "${issueContext.elementName}" lacks a clear belief system or worldview.

Great antagonists believe they're RIGHT. Help the writer develop:
1. What does this antagonist believe?
2. How did they come to this belief?
3. How does this belief justify their actions in their own mind?`;
      break;

    case "antagonist-no-mirror":
      prompt += `ISSUE: The antagonist "${issueContext.elementName}" doesn't reflect or contrast the protagonist thematically.

The best antagonists mirror the protagonist or represent what they could become. Suggest how to:
1. Connect the antagonist to the protagonist's lie/truth
2. Make them represent the dark side of the theme
3. Create a meaningful contrast that raises the stakes`;
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

export async function POST(request: NextRequest) {
  try {
    const body: SuggestFixRequest = await request.json();
    const { issueType, screenplayContext } = body;

    if (!issueType || !screenplayContext) {
      return NextResponse.json(
        { message: "Missing required data (issueType, screenplayContext)" },
        { status: 400 }
      );
    }

    const providerConfig = resolveProvider(body.apiKey, body.provider);

    if (!providerConfig) {
      return NextResponse.json({ message: NO_API_KEY_ERROR }, { status: 401 });
    }

    const systemPrompt = buildSystemPrompt(screenplayContext.genreId);
    const userPrompt = buildUserPrompt(body);

    const content = await callAI(
      providerConfig.apiKey,
      providerConfig.provider,
      systemPrompt,
      userPrompt,
      { maxTokens: 2048, temperature: 0.7, timeout: API_TIMEOUTS.QUICK }
    );

    const result = parseAIResponseJSON<SuggestFixResponse>(content);

    // Ensure required fields
    if (!result.suggestion) {
      result.suggestion =
        "Consider how this element serves your story's core theme.";
    }
    if (!result.specificActions || !Array.isArray(result.specificActions)) {
      result.specificActions = ["Review the element's purpose in the story"];
    }

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
