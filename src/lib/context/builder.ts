/**
 * Analysis Context Builder
 * Builds context for AI analysis prompts
 */

import type { ParsedScreenplay, Sequence, Soul, GenreId } from "@/types/screenplay";
import type { PromptContext } from "@/lib/ai/types";
import { GENRE_CONFIGS, buildGenreSystemPrompt } from "@/lib/genres/config";
import { summarizeSequence, createSequenceContext, summarizeAllSequences } from "./summarizer";

/**
 * Build complete context for analysis
 */
export function buildAnalysisContext(
  screenplay: ParsedScreenplay,
  sequences: Sequence[],
  genreId: GenreId,
  soul: Soul,
  currentSequenceId?: string
): PromptContext {
  const genreConfig = GENRE_CONFIGS[genreId];

  // Get current sequence info if specified
  let currentSequence: PromptContext["currentSequence"] | undefined;

  if (currentSequenceId) {
    const sequence = sequences.find((s) => s.id === currentSequenceId);
    if (sequence) {
      const summary = summarizeSequence(sequence, screenplay.scenes);
      currentSequence = {
        id: sequence.id,
        name: sequence.name,
        summary: summary.summary,
        scenes: getSequenceSceneText(screenplay, sequence),
      };
    }
  }

  return {
    screenplay: {
      title: screenplay.title,
      totalPages: screenplay.totalPages,
      totalScenes: screenplay.scenes.length,
      totalCharacters: screenplay.characters.length,
    },
    genre: {
      id: genreId,
      name: genreConfig.name,
      systemPrompt: buildGenreSystemPrompt(genreId, "general"),
    },
    soul: {
      centralQuestion: soul.centralQuestion,
      thematicArgument: soul.thematicArgument,
      controllingIdea: soul.controllingIdea,
      protagonistLie: soul.protagonistLie,
      protagonistTruth: soul.protagonistTruth,
    },
    currentSequence,
  };
}

/**
 * Get full scene text for a sequence
 */
function getSequenceSceneText(
  screenplay: ParsedScreenplay,
  sequence: Sequence
): string {
  const scenes = screenplay.scenes.filter((s) =>
    sequence.sceneNumbers.includes(s.sceneNumber)
  );

  return scenes
    .map((s) => `${s.heading}\n\n${s.content}`)
    .join("\n\n---\n\n");
}

/**
 * Build the complete system prompt for analysis
 */
export function buildAnalysisSystemPrompt(context: PromptContext): string {
  return `You are STORIQ, an expert screenplay development partner. You provide honest, specific, actionable feedback while maintaining a warm, collegial tone.

${context.genre.systemPrompt}

SCREENPLAY INFORMATION:
- Title: "${context.screenplay.title}"
- Pages: ${context.screenplay.totalPages}
- Scenes: ${context.screenplay.totalScenes}
- Characters: ${context.screenplay.totalCharacters}

THE SOUL OF THIS SCREENPLAY:
- Central Question: ${context.soul.centralQuestion}
- Thematic Argument: ${context.soul.thematicArgument}
- Controlling Idea: "${context.soul.controllingIdea}"
- Protagonist's Lie: ${context.soul.protagonistLie}
- Protagonist's Truth: ${context.soul.protagonistTruth}

ANALYSIS GUIDELINES:
1. LEAD WITH STRENGTHS - Always identify what's working before discussing issues
2. BE SPECIFIC - Reference exact scenes, pages, and moments
3. EXPLAIN THE WHY - Don't just identify problems, explain why they matter to the audience
4. OFFER PATHS FORWARD - Every critique should come with a constructive suggestion
5. RESPECT THE WRITER - They know this story better than you; you're a collaborator, not a judge
6. STAY FOCUSED - Address what's most important to the story's success
7. USE THEIR LANGUAGE - Mirror their genre and tone in your feedback

Remember: You're sitting across from a writer who has poured months into this work. Be honest, but be kind. Be thorough, but be focused. Your goal is to help them make this screenplay undeniable.`;
}

/**
 * Build a focused prompt for sequence analysis
 */
export function buildSequenceAnalysisPrompt(
  context: PromptContext,
  sequenceSummaries: ReturnType<typeof summarizeAllSequences>
): string {
  const sequenceContext = createSequenceContext(
    sequenceSummaries,
    context.currentSequence?.id
  );

  return `Analyze the following sequence from the screenplay "${context.screenplay.title}".

${sequenceContext}

${context.currentSequence ? `CURRENT SEQUENCE CONTENT:\n\n${context.currentSequence.scenes}` : ""}

Provide analysis covering:
1. STRUCTURE - How does this sequence fit into the overall story? Is the pacing appropriate?
2. CHARACTER - Are characters behaving consistently? Is the protagonist active or passive?
3. CRAFT - Is the dialogue sharp? Are scenes economical? Is there subtext?
4. GENRE - Does this sequence deliver on genre expectations?
5. THEME - How does this sequence reinforce or explore the story's themes?

Format your response as follows:
- Start with 2-3 specific STRENGTHS
- Then list OPPORTUNITIES for improvement (most important first)
- Each item should be specific, citing scenes or moments
- End with a brief SUMMARY of overall sequence health`;
}

/**
 * Build prompt for Writers' Room chat
 */
export function buildChatPrompt(
  context: PromptContext,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): string {
  let prompt = `The writer is asking about their screenplay "${context.screenplay.title}".

SCREENPLAY CONTEXT:
- Genre: ${context.genre.name}
- Central Question: ${context.soul.centralQuestion}
- Controlling Idea: "${context.soul.controllingIdea}"

`;

  if (context.currentSequence) {
    prompt += `CURRENTLY FOCUSED ON: ${context.currentSequence.name}
${context.currentSequence.summary}

`;
  }

  if (conversationHistory.length > 0) {
    prompt += "RECENT CONVERSATION:\n";
    for (const msg of conversationHistory.slice(-4)) {
      prompt += `${msg.role === "user" ? "Writer" : "STORIQ"}: ${msg.content}\n`;
    }
    prompt += "\n";
  }

  prompt += `Writer's current question/request: ${userMessage}

Respond as a collaborative development partner. Be specific to THIS screenplay. Offer concrete suggestions when appropriate. If the writer is working on a specific problem, help them solve it step by step.`;

  return prompt;
}
