import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// Using Node.js runtime for proper env var access

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface SceneInput {
  sceneNumber: number;
  heading: string;
  pageStart: number;
  pageEnd: number;
  content: string;
  characters: string[];
  locationType: string;
  timeOfDay?: string;
}

interface SequenceAnalysisRequest {
  scenes: SceneInput[];
  totalPages: number;
  title: string;
  apiKey?: string;
  provider?: "anthropic" | "google";
}

interface DetectedSequence {
  name: string;
  suggestedName: string;
  sceneNumbers: number[];
  pageStart: number;
  pageEnd: number;
  dramaticQuestion: string;
  confidenceScore: number;
  boundaryJustification: string[];
}

function buildAnalysisPrompt(scenes: SceneInput[], totalPages: number, title: string): string {
  // Build condensed scene list for analysis
  const sceneDescriptions = scenes.map((scene) => {
    const contentPreview = scene.content.slice(0, 500).replace(/\n/g, " ");
    return `Scene ${scene.sceneNumber} (pp. ${scene.pageStart}-${scene.pageEnd}): ${scene.heading}
Characters: ${scene.characters.join(", ") || "None"}
Content: ${contentPreview}...`;
  }).join("\n\n");

  return `Analyze this screenplay and divide it into sequences.

SCREENPLAY: "${title}"
TOTAL PAGES: ${totalPages}
TOTAL SCENES: ${scenes.length}
TARGET SEQUENCES: ${Math.round(totalPages / 15)} (approximately 7-8 for standard features)

SCENES:
${sceneDescriptions}

---

ANALYSIS INSTRUCTIONS:

Apply the 6-layer sequence detection method:

**Layer 1: Page Grid** - Sequences should roughly align with these zones:
- Seq 1: Pages 1-15, Seq 2: 15-30, Seq 3: 30-45, Seq 4: 45-60 (Midpoint), Seq 5: 60-75, Seq 6: 75-90, Seq 7: 90-105, Seq 8: 105-120

**Layer 2: Goal Continuity (PRIMARY SIGNAL)** - Cluster scenes where the protagonist pursues the same immediate goal. A sequence ends when:
- Goal is ACHIEVED
- Goal FAILS
- Goal TRANSFORMS into a new goal

**Layer 3: Structural Beats** - Align with Save the Cat beats:
- Seq 1 ends ~page 10-12 (Setup complete)
- Seq 2 ends ~page 25-30 (Break into Two)
- Seq 3 ends ~page 45 (Fun & Games peak)
- Seq 4 ends ~page 55-60 (Midpoint)
- Seq 5 ends ~page 75 (Bad Guys Close In)
- Seq 6 ends ~page 85-90 (All Is Lost)
- Seq 7 ends ~page 100-110 (Break into Three)

**Layer 4: Transition Markers** - Look for: time jumps, FADE/DISSOLVE, major location changes

**Layer 5: Value Charge Inversion** - Track positive/negative outcomes; sequences often end at polarity flips

**Layer 6: Tension Delta** - Sequences should end on peaks or sharp tension drops, not low exposition scenes

---

CONFIDENCE SCORING (max 14 points per boundary):
- Goal shift detected: +3
- Aligns with structural beat: +2
- Hard transition marker: +2
- Value charge inversion: +2
- Tension peak/drop: +1
- Within expected page range: +1
- Passes title test: +1
- Has clear Five Commandments: +2

---

NAMING (Title Test):
Create specific, descriptive names like:
- "The Escape from Alcatraz Sequence"
- "The Wedding Disaster Sequence"
- "The Boardroom Betrayal Sequence"

NOT vague names like "The Talking Sequence" or "The Setup Sequence"

---

Respond with ONLY valid JSON in this exact format:
{
  "sequences": [
    {
      "name": "Sequence 1",
      "suggestedName": "The [Specific Action] Sequence",
      "sceneNumbers": [1, 2, 3, ...],
      "pageStart": 1,
      "pageEnd": 15,
      "dramaticQuestion": "Will the protagonist [specific question]?",
      "confidenceScore": 10,
      "boundaryJustification": ["Goal shifts from X to Y", "Aligns with Break into Two", "Time jump marker"]
    }
  ]
}`;
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const systemPrompt = `You are a master screenplay analyst specializing in sequence structure. You apply the 6-layer sequence detection methodology to identify natural dramatic units within screenplays. Your analysis is specific to each screenplay - never generic.

You always respond with valid JSON only, no markdown formatting.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API request failed");
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

async function callGoogle(apiKey: string, prompt: string): Promise<string> {
  const systemPrompt = `You are a master screenplay analyst specializing in sequence structure. You apply the 6-layer sequence detection methodology to identify natural dramatic units within screenplays. Your analysis is specific to each screenplay - never generic.

You always respond with valid JSON only, no markdown formatting.`;

  const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
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

function parseAIResponse(content: string): { sequences: DetectedSequence[] } {
  // Extract JSON from the response (handle markdown code blocks)
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

  const result = JSON.parse(jsonStr);

  if (!result.sequences || !Array.isArray(result.sequences)) {
    throw new Error("Invalid response: missing sequences array");
  }

  // Validate each sequence
  for (const seq of result.sequences) {
    if (!seq.sceneNumbers || !Array.isArray(seq.sceneNumbers) || seq.sceneNumbers.length === 0) {
      throw new Error("Invalid sequence: missing sceneNumbers");
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body: SequenceAnalysisRequest = await request.json();
    const { scenes, totalPages, title } = body;

    if (!scenes || scenes.length === 0) {
      return NextResponse.json(
        { message: "No scenes provided for analysis" },
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

    const prompt = buildAnalysisPrompt(scenes, totalPages, title);

    let content: string;
    if (provider === "google") {
      content = await callGoogle(apiKey, prompt);
    } else {
      content = await callAnthropic(apiKey, prompt);
    }

    const result = parseAIResponse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sequence analysis error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze sequences. Please try again.",
      },
      { status: 500 }
    );
  }
}
