# STORIQ ENGINE
## Revised Vibecoding Step System (v2.0)

**What Changed from v1:**
- Added 5 new agents (Soul, Want/Need, Antagonist, Moments, Emotional Journey)
- Restructured to 4 levels + Phase 0 (Soul)
- Unified voice interface (not 7 separate agents)
- Two modes: Diagnosis + Development
- New visualizations: Theme Constellation, Character Journey Map, Emotional Waveform
- Progress/version tracking across drafts
- UX principles: criticism as invitation, progressive disclosure

---

## QUICK REFERENCE: PHASES & STEPS

| Phase | Steps | Goal |
|-------|-------|------|
| 1. Foundation | 1-4 | Working app with upload, parsing, core setup |
| 2. Genre & Soul | 5-7 | Genre-aware prompts + Theme detection |
| 3. AI Integration | 8-10 | Provider abstraction, RAG context, unified analysis |
| 4. Character Depth | 11-13 | Want/Need tracking, Antagonist audit, Journey Map |
| 5. Craft & Elevation | 14-16 | Dialogue polish, moment detection, emotional journey |
| 6. Triage & Dashboard | 17-19 | Prioritized feedback, level gating, unified interface |
| 7. Writers' Room | 20-22 | Unified chat, specialist invocation, rewrite mode |
| 8. Polish & Persistence | 23-25 | Version tracking, draft comparison, final polish |

---

## PHASE 1: FOUNDATION (Steps 1-4)
*Goal: Working app with upload, parsing, and core setup*

---

### **STEP 1: Project Setup**
```
Create a Next.js 14 web application with the following:
- TypeScript
- Tailwind CSS for styling
- App Router (not pages router)
- Clean folder structure: /app, /components, /lib, /types, /agents, /visualizations
- A landing page with:
  - Title: "STORIQ ENGINE"
  - Subtitle: "Your AI Development Partner"
  - Dark theme with warm accents (think: writer's room at night, amber desk lamp glow)
  - A large, inviting upload area (not a tiny button)
  - Tagline near upload: "Drop your screenplay here. Let's make it undeniable."

The aesthetic should feel like a creative partner, not a grading system. Warm, professional, inviting.

Initialize the project and show me how to run it locally.
```

---

### **STEP 2: PDF Upload & Screenplay Parsing**
```
Add PDF screenplay upload functionality:

1. Create an elegant drag-and-drop upload component:
   - Large drop zone with subtle animation on hover
   - Accepts PDF files only
   - Shows upload progress with a smooth animation
   - Success state shows the screenplay title prominently

2. Use pdf-parse or pdf.js to extract text from the uploaded PDF

3. Parse the screenplay to identify:
   - Scene headers (INT./EXT. lines)
   - Character names (ALL CAPS before dialogue)
   - Dialogue blocks
   - Action/description paragraphs
   - Page numbers

4. Store parsed result in this structure:
   {
     id: string (uuid),
     title: string,
     uploadedAt: Date,
     totalPages: number,
     scenes: [{
       sceneNumber: number,
       heading: string,
       pageStart: number,
       pageEnd: number,
       content: string,
       characters: string[]
     }],
     characters: [{
       name: string,
       sceneAppearances: number[],
       dialogueCount: number
     }]
   }

5. After parsing, show a "Script Overview" card:
   - Title, page count, scene count
   - Character list with scene counts
   - A friendly message: "Got it. [X] scenes, [Y] characters, [Z] pages. Ready to explore."
   - "Continue" button to proceed

Store the parsed screenplay in React Context or Zustand for global access.
```

---

### **STEP 3: Sequence Builder (The Handshake)**
```
Create the Sequence Builder screen - the first "handshake" where AI suggests and user confirms:

1. Display a horizontal timeline visualization:
   - Each scene as a small block, width proportional to page length
   - Scene numbers visible on hover
   - Color-coded by INT (darker) vs EXT (lighter)

2. AI auto-suggests sequence breaks based on:
   - Approximately every 12-15 pages
   - Major location clusters
   - Time indicators ("LATER", "NEXT DAY", "MORNING")
   - Scene density patterns

3. Show suggested sequences as colored groups with divider lines between them

4. User interaction:
   - Drag dividers to adjust sequence boundaries
   - Click a sequence to see: scenes included, page range, characters present
   - Rename sequences (defaults: "Sequence 1", "Sequence 2", etc.)
   - Visual preview updates in real-time

5. Confirmation:
   - "Confirm Sequences" button locks the structure
   - Message: "Locked. You can always adjust these later in Settings."
   - Store sequences in app state

Make the timeline feel like a film editing interface - visual, tactile, creative.
```

---

### **STEP 4: Genre Selection (The Second Handshake)**
```
After sequence confirmation, show the Genre Selection modal:

1. Create a visually rich modal with genre cards in a grid:

   COSMIC HORROR
   "Dread. The unknowable. Human insignificance."

   PSYCHOLOGICAL THRILLER
   "Paranoia. Unreliable reality. Mind games."

   SCREWBALL COMEDY
   "Rapid wit. Escalating chaos. Verbal sparring."

   ROMANTIC COMEDY
   "Meet-cute. Obstacles. Inevitable union."

   ACTION/ADVENTURE
   "Momentum. Set pieces. Clear stakes."

   FILM NOIR
   "Shadows. Moral ambiguity. Doomed protagonists."

   SCIENCE FICTION
   "Ideas. World-building. Human questions."

   DRAMA
   "Character. Relationships. Emotional truth."

   SLASHER HORROR
   "Tension. Release. Survival."

   MYSTERY/WHODUNIT
   "Clues. Misdirection. Revelation."

2. Each card has:
   - Genre name (large)
   - Tagline (3-4 evocative words)
   - Subtle icon or visual motif
   - Hover state with slight lift/glow

3. Single selection only - highlight selected card clearly

4. "Confirm Genre" button
   - Message: "Got it. I'll evaluate this as a [GENRE]. This shapes everything."

5. Store genre selection in app state - this will modify all agent prompts
```

---

## PHASE 2: GENRE & SOUL SYSTEM (Steps 5-7)
*Goal: Genre-aware prompts + the Soul Detector (Theme)*

---

### **STEP 5: Genre Configuration System**
```
Create the genre configuration system in /lib/genres/config.ts:

1. Define the GenreConfig type:
   {
     id: string,
     name: string,
     tagline: string,

     // What this genre prioritizes
     priorities: string[],

     // Expected story beats with typical page ranges
     keyBeats: {
       name: string,
       description: string,
       typicalPageRange: [number, number]
     }[],

     // Common mistakes to flag
     redFlags: string[],

     // Pacing expectations
     paceProfile: 'building' | 'relentless' | 'rhythmic' | 'slow-burn',

     // Tone and dialogue guidelines
     toneGuidelines: string,

     // What makes antagonists work in this genre
     antagonistNotes: string,

     // Audience emotional expectations
     emotionalJourney: string
   }

2. Create full configs for all 10 genres. Examples:

   PSYCHOLOGICAL_THRILLER:
   - priorities: ["paranoia", "unreliable narration", "twist preparation", "audience uncertainty"]
   - keyBeats: [
       { name: "False reality established", typicalPageRange: [1, 15] },
       { name: "First crack in reality", typicalPageRange: [20, 30] },
       { name: "Protagonist doubts themselves", typicalPageRange: [45, 60] },
       { name: "The reveal/twist", typicalPageRange: [85, 100] }
     ]
   - redFlags: ["twist comes from nowhere", "protagonist is too competent", "audience knows more than protagonist for too long"]
   - antagonistNotes: "Often internal or hidden. The best thrillers make us question if there even IS an antagonist until late."

   SCREWBALL_COMEDY:
   - priorities: ["dialogue velocity", "escalating complications", "battle-of-equals dynamic", "comedic set pieces"]
   - keyBeats: [
       { name: "Meet-cute with friction", typicalPageRange: [8, 15] },
       { name: "Forced proximity begins", typicalPageRange: [20, 30] },
       { name: "The big lie/deception peaks", typicalPageRange: [50, 65] },
       { name: "Public humiliation/revelation", typicalPageRange: [75, 90] }
     ]
   - redFlags: ["characters communicate honestly too early", "long dramatic pauses", "mean-spirited humor"]
   - paceProfile: "relentless"

3. Export functions:
   - getGenreConfig(genreId): returns full config
   - getGenrePriorities(genreId): returns priorities array
   - buildGenreSystemPrompt(genreId, agentType): returns customized system prompt

4. The buildGenreSystemPrompt function should inject genre context into any agent:
   "You are analyzing a {GENRE} screenplay.
    This genre prioritizes: {PRIORITIES}.
    Key beats to look for: {BEATS}.
    Red flags for this genre: {RED_FLAGS}.
    Keep this context in mind for all analysis."
```

---

### **STEP 6: The Soul Detector (Theme Handshake)**
```
Create the Soul Detector - the third and most important handshake:

1. After genre confirmation, show a "Soul Detection" screen

2. The AI analyzes the full screenplay and attempts to identify:
   - THE CENTRAL DRAMATIC QUESTION: What question does the audience hold?
   - THE THEMATIC ARGUMENT: What is the screenplay arguing?
   - THE CONTROLLING IDEA: Value + Cause (e.g., "Love prevails when we sacrifice ego")
   - THE LIE/TRUTH: What false belief does the protagonist start with? What truth do they learn?

3. Present this as a conversation, not a form:

   "I've read your screenplay. Let me tell you what I think it's about—correct me if I'm wrong.

   THE BIG QUESTION your audience will hold:
   'Can someone escape their past, or does it always catch up?'

   YOUR ARGUMENT seems to be:
   'The past can be overcome, but only through accepting it, not running from it.'

   YOUR PROTAGONIST'S JOURNEY:
   They start believing: 'If I bury the past deep enough, it can't hurt me.'
   They need to learn: 'The only way out is through.'

   Does this resonate? Or am I missing something?"

4. User can:
   - Confirm: "Yes, that's it"
   - Adjust: Text inputs to refine each element
   - "I don't know yet": App proceeds with AI's best guess, marked as "unconfirmed"

5. Store the confirmed/adjusted Soul in app state:
   {
     centralQuestion: string,
     thematicArgument: string,
     controllingIdea: string,
     protagonistLie: string,
     protagonistTruth: string,
     confirmed: boolean
   }

6. Show a summary card:
   "Soul locked. Every scene should connect to this. Let's see if they do."

This Soul data will be injected into all subsequent agent prompts for thematic consistency checking.
```

---

### **STEP 7: Theme Constellation Visualization**
```
Create the Theme Constellation - a visual map of thematic connections:

1. Create a force-directed graph visualization (use D3.js or react-force-graph):

2. Structure:
   - CENTER NODE: The controlling idea/theme (large, glowing)
   - SECONDARY NODES: Sub-themes derived from the central theme
   - SCENE NODES: Small nodes for each scene, connected to relevant themes
   - CHARACTER NODES: Medium nodes for main characters, connected to themes they embody

3. Visual design:
   - Dark background with constellation aesthetic (stars, subtle nebula)
   - Lines connecting nodes with varying thickness (strength of connection)
   - Nodes glow on hover, showing details
   - Unconnected scenes/characters float at the edges (visual problem indicator)

4. Interaction:
   - Click a theme node: highlights all connected scenes and characters
   - Click a scene node: shows scene summary and theme connection
   - Click a character: shows their thematic role
   - Zoom and pan enabled

5. The "floating" detection:
   - Scenes with no theme connection are colored differently (amber warning)
   - Characters with no theme connection are marked
   - Hovering over floaters shows: "This scene doesn't connect to your theme. Is it necessary?"

6. Generate this visualization from AI analysis:
   - Prompt the AI to identify which scenes connect to which themes
   - Prompt the AI to identify each character's thematic role
   - Store as structured data, render as constellation

7. Add a sidebar showing:
   - "Connected: X scenes, Y characters"
   - "Floating: Z scenes, W characters" (if any)
   - "Theme density by sequence" (bar chart)

This is a diagnostic tool AND a creative map. Writers can see their story's thematic structure at a glance.
```

---

## PHASE 3: AI INTEGRATION (Steps 8-10)
*Goal: Provider abstraction, RAG context, unified analysis*

---

### **STEP 8: AI Provider Abstraction Layer**
```
Create a flexible AI provider system in /lib/ai/:

1. /lib/ai/types.ts - Define interfaces:

   interface AIProvider {
     name: string;
     sendMessage(params: {
       systemPrompt: string;
       userPrompt: string;
       temperature?: number;
       maxTokens?: number;
     }): Promise<string>;
   }

   interface AIConfig {
     provider: 'openai' | 'anthropic';
     apiKey: string;
     model: string;
   }

2. /lib/ai/providers/openai.ts:
   - Implement AIProvider for OpenAI
   - Support GPT-4, GPT-4-turbo, GPT-4o
   - Handle rate limiting and errors gracefully
   - Return clean error messages

3. /lib/ai/providers/anthropic.ts:
   - Implement AIProvider for Claude
   - Support Claude 3 Opus, Sonnet, Haiku
   - Handle rate limiting and errors gracefully

4. /lib/ai/index.ts:
   - getProvider(config: AIConfig): AIProvider
   - sendAnalysis(provider, systemPrompt, userPrompt): Promise<string>
   - Unified error handling

5. Create Settings page (/app/settings/page.tsx):
   - API key inputs for OpenAI and Anthropic (password fields)
   - Model selection dropdowns
   - "Test Connection" buttons
   - Store in localStorage with warning: "Keys stored locally for development"
   - Clear visual indicators of connection status

6. Create an AI Context provider that makes the configured AI available throughout the app

Never hardcode API keys. All keys from user input or environment variables.
```

---

### **STEP 9: RAG Context Management**
```
Create the context management system for analyzing sequences without token overflow:

1. /lib/context/summarizer.ts:

   Function: summarizeSequence(sequence, scenes)
   - Takes a sequence and its full scene text
   - Uses AI to generate a compressed summary (~200 words):
     - Key plot events
     - Characters present and their actions
     - Emotional state/tone
     - Important objects or information introduced
     - Thematic elements present
   - Cache summaries to avoid re-generating

2. /lib/context/builder.ts:

   Function: buildAnalysisContext(targetSequenceIndex, allSequences, summaries)
   - For sequences BEFORE target: include summaries only
   - For TARGET sequence: include full scene text
   - For sequences AFTER target: include nothing (avoid spoiling)
   - Include the Soul data (theme, controlling idea)
   - Include Genre config
   - Return structured context object

3. /lib/context/formatter.ts:

   Function: formatContextForPrompt(context)
   - Convert context object to clean prompt string:

   "SCREENPLAY: [Title]
    GENRE: [Genre] - [Genre priorities]
    THEME: [Controlling idea]

    STORY SO FAR (Sequences 1-3 summaries):
    Sequence 1: [summary]
    Sequence 2: [summary]
    Sequence 3: [summary]

    CURRENT SEQUENCE TO ANALYZE (Sequence 4):
    [Full scene text]

    PROTAGONIST'S ARC:
    Wants: [want]
    Needs: [need]
    Currently believes: [lie]"

4. Implement summary caching:
   - Store summaries in app state
   - Only regenerate if sequence content changes
   - Show "Generating context..." loading state
```

---

### **STEP 10: Unified Analysis Engine**
```
Create the unified analysis system - ONE synthesized report, not seven separate agents:

1. /lib/agents/analysisEngine.ts:

   This is the master orchestrator that runs all analytical lenses and synthesizes results.

2. Define the agent "lenses" (these run internally, user doesn't see them separately):

   STRUCTURAL LENSES:
   - GenreBeats: Are key genre beats present at right times?
   - LogicContinuity: Object/information permanence, timeline consistency
   - PacingRhythm: Dialogue/action ratio, energy levels, scene lengths

   CHARACTER LENSES:
   - WantVsNeed: Protagonist's arc tracking
   - AntagonistDepth: Villain philosophy and competence
   - ConflictConsistency: Actions vs established traits
   - VoiceDistinction: Dialogue fingerprinting

   CRAFT LENSES:
   - SubtextQuality: On-the-nose dialogue detection
   - SceneEconomy: Scenes that could be cut or combined

3. Function: runFullAnalysis(sequence, context, genre, soul)
   - Run all lenses in parallel (Promise.all)
   - Each lens returns: { category, issues[], strengths[], score }
   - Synthesize into unified report

4. The UnifiedReport structure:
   {
     sequenceId: string,
     overallScore: number (0-100),

     categories: {
       structure: { score, issues[], strengths[] },
       character: { score, issues[], strengths[] },
       craft: { score, issues[], strengths[] }
     },

     topPriorities: Issue[] (max 5, sorted by impact),

     highlights: string[] (what's working well),

     themeConnection: {
       connected: boolean,
       notes: string
     }
   }

5. Each Issue has:
   {
     id: string,
     category: 'structure' | 'character' | 'craft',
     lens: string (which lens found it),
     severity: 'critical' | 'major' | 'minor',
     page: number,
     scene: number,
     summary: string (one line),
     detail: string (full explanation),
     suggestion: string (actionable fix),
     resolved: boolean
   }

6. Create analysis caching - store results per sequence, invalidate on re-analysis
```

---

## PHASE 4: CHARACTER DEPTH (Steps 11-13)
*Goal: Want/Need tracking, Antagonist audit, Character Journey Map*

---

### **STEP 11: Want vs. Need Tracker**
```
Create the protagonist arc analysis system:

1. /lib/agents/lenses/wantVsNeed.ts:

2. System prompt core:
   "Analyze the protagonist's internal journey in this {GENRE} screenplay.

   Identify:
   1. THE WANT: What does the protagonist consciously pursue? (external goal)
   2. THE NEED: What must they learn or become? (internal growth)
   3. THE LIE: What false belief holds them back at the start?
   4. THE TRUTH: What do they come to understand by the end?

   For the current sequence, assess:
   - Is the protagonist actively pursuing their WANT?
   - Are there moments that hint at or challenge their NEED?
   - Is the LIE being reinforced or cracked?
   - Where are they on the spectrum from Lie → Truth?

   Flag if:
   - The protagonist is passive (not driving action)
   - The arc is stalling (no movement toward or away from Need)
   - The Want is unclear or shifts without reason
   - There's no evidence of internal conflict

   Theme context: {SOUL_DATA}
   The protagonist's arc should connect to the theme: {CONTROLLING_IDEA}"

3. Output structure:
   {
     protagonistName: string,
     want: string,
     need: string,
     lie: string,
     truth: string,

     currentSequenceAssessment: {
       pursuingWant: boolean,
       needHints: string[],
       lieStatus: 'reinforced' | 'cracking' | 'shattered',
       arcPosition: number (0-100, where 0 = full Lie, 100 = full Truth)
     },

     issues: Issue[],
     strengths: string[]
   }

4. This data feeds into the Character Journey Map visualization (next step)
```

---

### **STEP 12: Character Journey Map Visualization**
```
Create the Character Journey Map - a visual arc tracker:

1. Create a visualization component showing the protagonist's journey:

   VISUAL LAYOUT:
   ┌────────────────────────────────────────────────────────────┐
   │  WANT: "Get revenge on his brother"                        │
   │  ─────────────────────────────────────────────────────────│
   │                                                            │
   │  [SEQ1]──[SEQ2]──[SEQ3]──[SEQ4]──[SEQ5]──[SEQ6]──[SEQ7]   │
   │     │       │       │       │       │       │       │      │
   │    LIE    LIE   CRACKING  CRISIS  CHOICE  TRUTH   NEW     │
   │                                                            │
   │  ─────────────────────────────────────────────────────────│
   │  NEED: "Forgive himself for the accident"                 │
   └────────────────────────────────────────────────────────────┘

2. Each sequence is a node on the journey:
   - Vertical position indicates arc position (top = Want/Lie, bottom = Need/Truth)
   - Color indicates status: blue (Lie), amber (Cracking), red (Crisis), green (Truth)
   - Size indicates how much arc movement happens in that sequence
   - Click to see details

3. Special markers:
   - CRISIS POINT: The moment Want and Need collide (should be near climax)
   - CHOICE: Where protagonist chooses Need over Want (or fails to)

4. Interactivity:
   - Hover on sequence: shows summary of arc movement
   - Click sequence: jumps to that sequence's analysis
   - If crisis point is missing or in wrong place, show warning

5. AI generates this data by analyzing each sequence:
   - What Want-pursuing actions happen?
   - What Need-hinting moments happen?
   - What's the arc position at end of sequence?

6. User can adjust:
   - Drag crisis point if AI got it wrong
   - Edit Want/Need/Lie/Truth labels
   - This is another "handshake" - AI proposes, user confirms
```

---

### **STEP 13: Antagonist Audit**
```
Create the antagonist analysis system:

1. /lib/agents/lenses/antagonistAudit.ts:

2. System prompt core:
   "Analyze the antagonist(s) in this {GENRE} screenplay.

   For each antagonist/opposing force, identify:

   1. PHILOSOPHY: What do they believe? What's their worldview?
      (A great antagonist is the hero of their own story)

   2. THE MIRROR: How do they reflect or contrast the protagonist?
      (Thematic connection - they often represent what protagonist could become)

   3. COMPETENCE: Are they a genuine threat?
      (Do they make smart moves, or convenient mistakes?)

   4. PRESENCE: Are they felt throughout, or do they disappear?
      (Track their appearances and influence by sequence)

   5. THE THANOS TEST: Could you write a version where they're sympathetic?
      (If no, they're a plot device, not a character)

   For this genre ({GENRE}): {ANTAGONIST_NOTES_FROM_GENRE_CONFIG}

   Flag if:
   - Antagonist's motivation is just 'evil' or 'greedy' without depth
   - Antagonist is absent for too long (over 15 pages)
   - Antagonist makes stupid mistakes to let hero win
   - No thematic connection to protagonist
   - The 'threat' never feels real"

3. Output structure:
   {
     antagonists: [{
       name: string,
       type: 'person' | 'system' | 'internal' | 'nature',
       philosophy: string,
       mirrorConnection: string,
       competenceScore: number (1-10),
       presenceBySequence: boolean[],
       thanosTestPass: boolean,
       issues: Issue[],
       strengths: string[]
     }],

     overallThreatLevel: number (1-10),
     suggestions: string[]
   }

4. Visualization:
   - Show antagonist "presence bar" - which sequences they appear in
   - Show "threat level" trend line across the script
   - Flag gaps where antagonist disappears
```

---

## PHASE 5: CRAFT & ELEVATION (Steps 14-16)
*Goal: Dialogue polish, moment detection, emotional journey*

---

### **STEP 14: Voice Fingerprint & Subtext Scanner**
```
Create the dialogue analysis lenses:

1. /lib/agents/lenses/voiceFingerprint.ts:

   System prompt core:
   "Analyze dialogue distinctiveness in this {GENRE} screenplay.

   For each speaking character, create a 'voice fingerprint':
   - Average sentence length (words)
   - Vocabulary complexity (simple/moderate/sophisticated)
   - Speech pattern (complete sentences/fragments/run-ons)
   - Formality level (formal/casual/slang)
   - Unique verbal tics or catchphrases
   - Emotional expression style (direct/indirect, verbose/terse)

   Then calculate OVERLAP SCORES between character pairs.
   - 0% = completely distinct voices
   - 100% = indistinguishable

   Flag any pairs with >75% overlap.

   The test: If you covered the character names, could you tell who's speaking?

   Provide specific fixes: 'Give X shorter sentences' or 'Y should use more jargon'"

2. /lib/agents/lenses/subtextScanner.ts:

   System prompt core:
   "Find 'on-the-nose' dialogue - lines where characters state feelings instead of showing them.

   Flag lines where characters:
   - Directly state emotions: 'I'm angry', 'I love you', 'I'm scared'
   - Explain their motivations aloud unnecessarily
   - Narrate their own actions: 'I'm going to...'
   - Deliver exposition that no human would naturally say

   For each flagged line:
   - Quote the line
   - Explain why it's on-the-nose
   - Provide a rewrite that SHOWS instead of TELLS
   - Or suggest cutting it entirely and replacing with action

   Good dialogue has SUBTEXT - what's unsaid is as important as what's said."

3. Combined output structure:
   {
     voiceAnalysis: {
       characters: [{
         name: string,
         fingerprint: { sentenceLength, vocabulary, patterns, formality, tics },
         sampleLines: string[]
       }],
       overlapWarnings: [{
         char1: string,
         char2: string,
         overlapScore: number,
         suggestion: string
       }]
     },

     subtextIssues: [{
       page: number,
       line: string,
       problem: string,
       suggestion: string
     }]
   }
```

---

### **STEP 15: Unforgettable Moment Scanner**
```
Create the peak moment detection system:

1. /lib/agents/lenses/momentScanner.ts:

2. System prompt core:
   "Identify PEAK MOMENTS - scenes with potential to become iconic and unforgettable.

   A peak moment has:
   - High emotional stakes
   - Visual or dramatic potential
   - Surprise, revelation, or transformation
   - Audience catharsis

   For this {GENRE}, peak moments typically involve: {GENRE_EMOTIONAL_NOTES}

   Analyze this sequence and identify:

   1. EXISTING PEAKS: Scenes that ARE memorable
      - What makes them work?
      - How could they be even stronger?

   2. POTENTIAL PEAKS: Scenes that COULD be memorable but are underwritten
      - What's holding them back?
      - Specific suggestions to elevate them

   3. MISSING PEAKS: If this sequence has 15+ pages without a memorable moment, flag it
      - Where SHOULD a peak occur?
      - What kind of moment would fit?

   4. THE TRAILER TEST: Could you cut a 30-second clip from this sequence that would make someone want to see the movie?

   For each peak, rate:
   - Current impact: 1-10
   - Potential impact if improved: 1-10
   - Effort to improve: Low/Medium/High"

3. Output structure:
   {
     existingPeaks: [{
       scene: number,
       page: number,
       description: string,
       currentImpact: number,
       enhancement: string
     }],

     potentialPeaks: [{
       scene: number,
       page: number,
       currentState: string,
       potential: string,
       suggestions: string[],
       potentialImpact: number
     }],

     peakDeserts: [{
       pageRange: [number, number],
       suggestion: string
     }],

     trailerMoment: {
       exists: boolean,
       scene: number | null,
       notes: string
     }
   }
```

---

### **STEP 16: Emotional Journey Map & Waveform**
```
Create the emotional journey visualization:

1. /lib/agents/lenses/emotionalJourney.ts:

   System prompt core:
   "Map the INTENDED AUDIENCE EMOTIONAL EXPERIENCE across this screenplay.

   For each scene, identify:
   - PRIMARY EMOTION: What should the audience feel?
     (tension, joy, sadness, fear, anger, hope, confusion, relief, triumph)
   - INTENSITY: 1-10 scale
   - EARNED OR UNEARNED: Has the script built up to this emotion, or is it asking for tears without doing the work?

   Then analyze the overall EMOTIONAL ARCHITECTURE:
   - Is there variety, or is it monotone?
   - Are there release valves after intense sections?
   - Does the climax have the highest emotional intensity?
   - Is the ending cathartic?

   For {GENRE}, the emotional journey typically: {GENRE_EMOTIONAL_JOURNEY_NOTES}"

2. Create the Emotional Waveform visualization:

   VISUAL:
   - X-axis: Pages/sequences (timeline)
   - Y-axis: Emotional intensity (0-10)
   - Line graph showing intensity over time
   - Color-coded by emotion type (warm colors for positive, cool for negative)
   - Click any point to see scene details

   FEATURES:
   - Overlay key plot points (inciting incident, midpoint, climax)
   - Show "flat zones" where intensity doesn't vary (potential problem)
   - Show if climax is actually the peak (if not, flag it)
   - Comparison to genre template (ideal shape vs. actual shape)

3. Interactive elements:
   - Click a point on the wave: see scene summary and emotional assessment
   - If "unearned" emotion flagged: click for explanation and suggestion
   - Toggle between full script view and single sequence view

4. Catharsis Check:
   - Does the ending deliver payoff for what was set up?
   - Are there emotional threads left unresolved?
   - Is the final emotion appropriate for the genre?
```

---

## PHASE 6: TRIAGE & DASHBOARD (Steps 17-19)
*Goal: Prioritized feedback, level gating, unified interface*

---

### **STEP 17: Triage Algorithm**
```
Create the triage prioritization system:

1. /lib/triage/triageEngine.ts:

2. Define the four levels:

   LEVEL 0: SOUL (always runs first)
   - Theme clarity
   - Controlling idea identified
   - Protagonist want/need defined

   LEVEL 1: SKELETON (Structure)
   - Genre beats present
   - Logic/continuity solid
   - Pacing functional
   - Antagonist present

   LEVEL 2: HEART (Character)
   - Protagonist arc working
   - Antagonist has depth
   - Character consistency
   - Voice distinction

   LEVEL 3: SKIN (Craft)
   - Subtext over on-the-nose
   - Scene economy
   - Dialogue polish

   LEVEL 4: ELEVATION (Greatness)
   - Peak moments identified and maximized
   - Emotional journey mapped and tuned
   - Catharsis check

3. Triage rules:
   - Issues are tagged with severity: CRITICAL, MAJOR, MINOR
   - CRITICAL issues in Level 1 → Levels 2-4 are locked
   - CRITICAL issues in Level 2 → Levels 3-4 are locked
   - Level 4 only unlocks when no CRITICAL issues remain

4. Function: runTriage(allAnalysisResults):

   Returns:
   {
     levels: [{
       number: 0-4,
       name: string,
       status: 'complete' | 'has_issues' | 'locked',
       issueCount: { critical, major, minor },
       issues: Issue[],
       strengths: string[],
       unlockMessage: string | null
     }],

     currentLevel: number (highest unlocked level with issues),
     overallProgress: number (0-100),

     topPriorities: Issue[] (top 5 across all levels)
   }

5. Gating messages:
   - "Level 2 is locked. You have 3 structural issues to resolve. Don't polish dialogue in scenes you might cut."
   - "Level 4 unlocked! Your foundation is solid. Now let's make it unforgettable."
```

---

### **STEP 18: Unified Analysis Dashboard**
```
Create the main analysis dashboard at /app/analysis/page.tsx:

1. Layout structure:

   TOP BAR:
   - Screenplay title
   - Genre badge
   - Overall score: ██████░░░░ 68%
   - Mode toggle: [DIAGNOSIS] / [DEVELOPMENT]
   - "Re-analyze" button

   LEFT SIDEBAR:
   - Sequence selector (vertical list)
   - Each sequence shows: name, mini health indicator, page range
   - "All Sequences" option for overview
   - Currently selected highlighted

   MAIN AREA:
   - Changes based on mode and selection

   RIGHT SIDEBAR:
   - Quick stats
   - Soul summary (theme, want/need)
   - Navigation to visualizations

2. DIAGNOSIS MODE (main area):

   If viewing ALL SEQUENCES:
   - Script-wide health overview
   - Level progress bars (0-4)
   - Top 5 priorities across whole script
   - Sequence health grid (which sequences need work)

   If viewing SINGLE SEQUENCE:
   - Sequence health score
   - Three category cards: Structure | Character | Craft
   - Each card shows: score bar, issue count, expand arrow
   - Top 3 priorities for this sequence
   - "Strengths" section at bottom (what's working)

3. Expanded category view (when clicking a category card):
   - Full list of issues in that category
   - Each issue shows:
     - Severity badge (red/yellow/blue)
     - One-line summary
     - Page/scene reference
     - [Expand] [Resolve] [Ignore] buttons
   - Expanded issue shows full detail + suggestion + "Work on this" button

4. Issue interactions:
   - [Resolve]: Marks complete, fades out with strikethrough, updates counts
   - [Ignore]: Asks "Are you sure? This might affect your script." then hides
   - [Work on this]: Opens Writers' Room with this issue as context

5. Level locking visualization:
   - Locked levels show padlock icon and are grayed out
   - Message explains what needs fixing to unlock
   - Progress bar shows how close to unlocking

6. Lead with strengths:
   - Before showing issues, show a "What's Working" banner
   - Rotate through 2-3 identified strengths
   - Sets positive tone before criticism
```

---

### **STEP 19: Visualizations Hub**
```
Create a Visualizations section accessible from the dashboard:

1. /app/visualizations/page.tsx

2. Hub layout - cards for each visualization:

   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
   │ THEME           │  │ CHARACTER       │  │ EMOTIONAL       │
   │ CONSTELLATION   │  │ JOURNEY         │  │ WAVEFORM        │
   │                 │  │                 │  │                 │
   │ [Visual preview]│  │ [Visual preview]│  │ [Visual preview]│
   │                 │  │                 │  │                 │
   │ See how themes  │  │ Track your      │  │ Map the         │
   │ connect across  │  │ protagonist's   │  │ audience's      │
   │ your story      │  │ arc             │  │ experience      │
   └─────────────────┘  └─────────────────┘  └─────────────────┘

   ┌─────────────────┐  ┌─────────────────┐
   │ PACING          │  │ ANTAGONIST      │
   │ HEATMAP         │  │ PRESENCE        │
   │                 │  │                 │
   │ [Visual preview]│  │ [Visual preview]│
   │                 │  │                 │
   │ See the rhythm  │  │ Track your      │
   │ and energy flow │  │ villain's       │
   │                 │  │ impact          │
   └─────────────────┘  └─────────────────┘

3. Each visualization opens in a focused view:
   - Full-screen or large modal
   - Explanation panel on side
   - Interactivity as defined in earlier steps
   - "Back to Dashboard" button

4. Visualizations update when analysis is re-run

5. Export option: "Download as PNG" for each visualization
```

---

## PHASE 7: WRITERS' ROOM (Steps 20-22)
*Goal: Unified chat interface, creative brainstorming, rewrite assistance*

---

### **STEP 20: Writers' Room Chat Interface**
```
Create the Writers' Room at /app/writers-room/page.tsx:

1. Layout:

   LEFT SIDEBAR:
   - Sequence selector (which sequence to discuss)
   - Current sequence summary
   - Active issues for this sequence (clickable to add to context)

   MAIN AREA:
   - Chat interface
   - Message history
   - Input area with quick prompts

   RIGHT SIDEBAR (collapsible):
   - Soul summary (theme, want/need)
   - Genre info
   - "Invoke Specialist" buttons

2. The AI personality:
   - Default: A unified, warm, collaborative voice
   - Speaks like a trusted creative partner
   - References the specific screenplay, characters by name
   - Draws on all agent lenses but synthesizes into one perspective
   - Never robotic or generic

3. Context injection:
   - Every message includes: genre, soul, current sequence context
   - If user clicked an issue to "Work on this", that issue is pre-loaded
   - AI acknowledges: "I see you want to work on the logic issue on page 34. Let's dig in."

4. Quick prompt buttons above input:
   - "What's the weakest part of this sequence?"
   - "How can I make this more [GENRE-APPROPRIATE WORD]?" (e.g., "scarier" for horror)
   - "Is my protagonist active here?"
   - "What would make this scene unforgettable?"
   - "Challenge my choices" (invokes Devil's Advocate mode)

5. Conversation memory:
   - Full conversation history per sequence
   - Can start fresh with "New Conversation" button
   - Conversations persist across sessions (localStorage)

6. Message UI:
   - User messages: right-aligned, subtle background
   - AI messages: left-aligned, clean formatting with markdown support
   - Code blocks for rewrite suggestions
   - Typing indicator when AI is generating
```

---

### **STEP 21: Specialist Invocation**
```
Enhance the Writers' Room with specialist personas:

1. In the right sidebar, add "Invoke Specialist" section:

   Specialists available:
   - 🎭 Genre Guardian: "Speak as a passionate [GENRE] expert"
   - 🧠 Story Surgeon: "Analyze this with clinical precision"
   - 😈 Devil's Advocate: "Challenge every choice I've made"
   - 💬 Dialogue Doctor: "Focus only on how these characters speak"
   - 🎬 Director's Eye: "Think about how this will play on screen"

2. When a specialist is invoked:
   - Show a subtle indicator: "Speaking as Genre Guardian..."
   - System prompt shifts to that persona
   - Responses adopt that character's voice and focus
   - User can say "Thanks, back to normal" to exit specialist mode

3. Specialist personalities:

   GENRE GUARDIAN (passionate, referential):
   "Look, as a horror fan, this scene is killing me—and not in a good way. You're explaining the monster's origin on page 30. PAGE 30! In Alien, we don't understand the xenomorph until the third act. The mystery IS the horror. Can we cut this exposition entirely?"

   DEVIL'S ADVOCATE (challenging, contrarian):
   "You think this makes your hero look brave? Let me offer another read: they just got three people killed with that decision. The audience might see recklessness, not courage. Is that what you want?"

   DIALOGUE DOCTOR (theatrical, specific):
   "This line—'I never meant to hurt you'—is what I call a 'filling' line. It fills space without revealing character. What if instead: 'I told myself it was for you.' Same meaning, but now we see self-deception. Subtext."

4. Invocation is optional - the default unified voice handles most needs
```

---

### **STEP 22: Rewrite Mode**
```
Add collaborative rewrite functionality to the Writers' Room:

1. Toggle button: "REWRITE MODE" at top of chat area

2. When enabled, layout changes:

   ┌─────────────────────────────────────────────────────────────┐
   │  SEQUENCE 4 - REWRITE MODE                          [Exit] │
   ├─────────────────────────────┬───────────────────────────────┤
   │                             │                               │
   │  SCRIPT TEXT                │   CHAT                        │
   │                             │                               │
   │  [Scene 18 text]            │   "Let's work on the scene    │
   │  [Scene 19 text]            │   18 dialogue. It feels flat."│
   │  [Scene 20 text]            │                               │
   │                             │   AI: "I see what you mean.   │
   │  (Selectable text with      │   The problem is..."          │
   │   line numbers)             │                               │
   │                             │   ┌──────────────────────────┐│
   │  ███████████████████████    │   │ Suggestion:              ││
   │  (Selected section          │   │ [Rewritten dialogue]     ││
   │   highlighted)              │   │                          ││
   │                             │   │ [Apply] [Refine] [Reject]││
   │                             │   └──────────────────────────┘│
   │                             │                               │
   └─────────────────────────────┴───────────────────────────────┘

3. Workflow:
   - User selects text in left panel (click and drag)
   - Selected text appears in chat context
   - User types request: "Make this dialogue sharper"
   - AI provides rewrite in a special "Suggestion" block

4. Suggestion block actions:
   - [Apply]: Copies rewritten text to clipboard, marks as accepted
   - [Refine]: "Make it shorter" / "More aggressive" / custom input
   - [Reject]: Dismiss this suggestion

5. Rewrite History panel (below chat):
   - Shows all suggestions for this sequence
   - Original → Suggested comparison
   - Status: Applied / Rejected / Pending
   - Star favorites for export

6. Export function:
   - "Export Rewrite Notes" button
   - Generates markdown document:
     - Original text
     - Accepted rewrites
     - Reasoning/notes
   - Download as .md file
```

---

## PHASE 8: POLISH & PERSISTENCE (Steps 23-25)
*Goal: Version tracking, draft comparison, final polish*

---

### **STEP 23: Version Tracking System**
```
Create the draft management system:

1. /lib/versions/versionManager.ts:

2. Data structure for version tracking:
   {
     scriptId: string,
     versions: [{
       versionId: string,
       versionNumber: number,
       uploadedAt: Date,
       filename: string,
       analysisResults: AnalysisResults,
       resolvedIssues: string[],
       ignoredIssues: string[],
       overallScore: number
     }],
     currentVersion: string
   }

3. When uploading a new PDF:
   - Check if it matches existing script (by title or user confirmation)
   - If match: "Is this a new draft of [TITLE]?"
     - Yes: Add as new version
     - No: Create new script
   - Preserve previous version data

4. Version selector in header:
   - Dropdown showing all versions: "v1 (Jan 5) → v2 (Jan 12) → v3 (Jan 20)"
   - Current version highlighted
   - Click to view any version's analysis

5. Storage:
   - Use localStorage for MVP
   - Structure data for future cloud sync
   - Warn about browser storage limitations
```

---

### **STEP 24: Draft Comparison View**
```
Create the Draft Journey / comparison interface:

1. /app/drafts/page.tsx:

2. Draft Journey visualization:

   ┌─────────────────────────────────────────────────────────────┐
   │  DRAFT JOURNEY                                              │
   │                                                              │
   │  v1 (Jan 5)        v2 (Jan 12)       v3 (Jan 20)           │
   │  Score: 62%   →    Score: 74%   →    Score: 81%            │
   │                                                              │
   │  ██████░░░░        ███████░░░        ████████░░             │
   │                                                              │
   │  24 issues         15 issues         8 issues               │
   │                                                              │
   │  [Compare v1↔v2]   [Compare v2↔v3]                          │
   └─────────────────────────────────────────────────────────────┘

3. Comparison view (when clicking Compare):

   BETWEEN v2 AND v3:

   ✓ RESOLVED (7 issues)
   ──────────────────────────
   • Logic hole on page 34 - phone after lost
   • Protagonist passive in Sequence 4
   • Missing antagonist in midpoint
   • Voice overlap: Sarah/Detective
   • On-the-nose dialogue page 67
   • Pacing drag in Sequence 3
   • Genre beat: First scare too late

   ⚠ NEW ISSUES (3)
   ──────────────────────────
   • Scene 42 dialogue now feels rushed
   • New character introduced but not developed
   • Pacing in Act 3 front-loaded

   📊 NET CHANGE: +12 points

4. Celebrate progress:
   - If score improved: "Nice work. 7 issues resolved."
   - If new issues appeared: "3 new issues to address, but you're still ahead overall."
   - Trend indicator: ↑ improving, → stable, ↓ declining

5. Insights:
   - "Your structure scores have improved the most"
   - "Character depth is your biggest remaining opportunity"
   - Based on which categories improved most/least
```

---

### **STEP 25: Final Polish & Onboarding**
```
Add final polish for a complete experience:

1. ONBOARDING FLOW (first-time users):

   Screen 1: "Welcome to the Storiq Engine"
   - Brief intro: "Your AI development partner for screenplays"
   - What to expect: "Upload your draft. Get honest, actionable feedback. Make it undeniable."
   - [Get Started]

   Screen 2: "Set Up Your AI"
   - API key configuration
   - Model selection
   - [Continue]

   Screen 3: "Upload Your First Screenplay"
   - Prominent upload zone
   - Sample screenplay option: "Or try with a sample script"

2. EMPTY STATES:
   - No screenplay: Friendly upload prompt
   - No analysis yet: "Ready to analyze. This takes about 2 minutes."
   - No issues in a category: "Looking good! No issues found here."

3. LOADING STATES:
   - Screenplay parsing: "Reading your screenplay..."
   - Analysis running: Show which lens is active: "Checking structure... Analyzing characters... Scanning dialogue..."
   - Progress bar with estimated time

4. ERROR HANDLING:
   - API errors: Friendly message + retry button
   - Parse errors: "Couldn't read this PDF. Try a different file."
   - Timeout: "This is taking longer than expected. [Keep Waiting] [Cancel]"

5. KEYBOARD SHORTCUTS:
   - Cmd/Ctrl + Enter: Send chat message
   - Cmd/Ctrl + /: Toggle rewrite mode
   - Cmd/Ctrl + 1-9: Jump to sequence
   - Escape: Close modals/panels

6. RESPONSIVE BEHAVIOR:
   - Collapsible sidebars for smaller screens
   - Mobile: Simplified view, one panel at a time
   - Minimum supported width: 1024px (warn below)

7. POLISH DETAILS:
   - Smooth transitions between views
   - Subtle animations on interactions
   - Consistent loading spinners
   - Toast notifications for actions (issue resolved, draft saved, etc.)
```

---

## HOW TO USE THIS SYSTEM

1. **Start with Step 1.** Copy the entire prompt into your AI coding assistant.
2. **Test before moving on.** Make sure each step works.
3. **Steps build on each other.** Don't skip ahead.
4. **Natural break points:** After each Phase is a good stopping point.
5. **If something breaks:** Tell the AI "Step X is not working. Error: [error]. Fix it."

---

## COMPARISON: v1 vs v2

| v1 (Original) | v2 (Revised) |
|---------------|--------------|
| 6 Phases, 18 Steps | 8 Phases, 25 Steps |
| 7 separate agents | Unified voice + specialist invocation |
| 3 triage levels | 5 levels (0-4) including Soul & Elevation |
| No theme/soul detection | Soul Detector as Phase 0 handshake |
| No character arc tracking | Want/Need Tracker + Journey Map |
| No antagonist analysis | Full Antagonist Audit |
| No peak moment detection | Unforgettable Moment Scanner |
| No emotional journey | Emotional Waveform visualization |
| Basic chat interface | Unified voice + Rewrite Mode |
| No version tracking | Full Draft Journey system |
| Issues presented as errors | Criticism as invitation, lead with strengths |

---

## THE NEW GAUNTLET (Analysis Levels)

```
PHASE 0: SOUL
├── Upload & Parse
├── Sequence Builder (handshake)
├── Genre Selection (handshake)
└── Soul Detector (handshake)
    "What is this screenplay about? Confirm or correct."

LEVEL 1: SKELETON (Structure)
├── Genre Guardian (are key beats present?)
├── Logic Tracker (continuity errors?)
└── Pacing Heatmap (flow and rhythm?)

    🔒 Must resolve critical issues to unlock Level 2

LEVEL 2: HEART (Character)
├── Want vs. Need Tracker (protagonist architecture)
├── Antagonist Audit (runs parallel)
├── Conflict Engine (plot vs. character)
├── Voice Fingerprint (dialogue distinctiveness)
└── Devil's Advocate (blind spot check)

    🔒 Must resolve critical issues to unlock Level 3

LEVEL 3: SKIN (Craft)
├── Subtext Scanner (on-the-nose dialogue)
└── Scene Economy (trim the fat)

    🔒 Must resolve critical issues to unlock Level 4

LEVEL 4: ELEVATION
├── Unforgettable Moment Scanner (where are the peaks?)
├── Emotional Journey Map (macro emotional architecture)
└── Catharsis Check (does the ending deliver?)

    This level is about excellence, not debugging.
```

---

## UX PRINCIPLES (from Design Review)

1. **TWO MODES, ONE TOOL**
   - Diagnosis Mode: AI leads, structured triage
   - Development Mode: User leads, freeform chat

2. **UNIFIED VOICE, MULTIPLE LENSES**
   - One AI partner, not seven separate agents
   - Specialists invokable on demand

3. **CRITICISM AS INVITATION**
   - Lead with strengths before issues
   - Every issue has an actionable path forward

4. **ABSTRACT MADE VISIBLE**
   - Theme as constellation map
   - Arc as journey visualization
   - Emotion as waveform

5. **PROGRESSIVE DISCLOSURE**
   - Surface level is simple
   - Depth available on expansion

6. **PROGRESS AS JOURNEY**
   - Version comparison built in
   - Celebrate improvement

7. **GUIDANCE WITHOUT GATES**
   - Triage informs, doesn't block
   - Trust the writer to prioritize
