# THE MASTER PLAN: 6 Phases, 18 Steps

Each step is a self-contained prompt you feed to an AI coding assistant (Claude, Cursor, etc.). Complete one before moving to the next.

---

## PHASE 1: Foundation (Steps 1-3)

*Goal: Get a working app skeleton with file upload*

### STEP 1: Project Setup

```
Create a Next.js 14 web application with the following:
- TypeScript
- Tailwind CSS for styling
- App Router (not pages router)
- A clean folder structure with /app, /components, /lib, /types folders
- A simple landing page with a title "Creative Storiq Engine" and a subtitle "Your AI Screenplay Analysis Partner"
- Dark theme with a professional, creative aesthetic (think: writer's room at night)

Initialize the project and show me how to run it locally.
```

### STEP 2: PDF Upload & Parse

```
Add PDF screenplay upload functionality to my Next.js app:

1. Create a file upload component that accepts PDF files only
2. Use pdf-parse or pdf.js to extract text from the uploaded PDF
3. Parse the screenplay text to identify:
   - Scene headers (lines starting with INT. or EXT.)
   - Dialogue blocks (CHARACTER NAME in caps, followed by dialogue)
   - Action/description paragraphs
4. Store the parsed result in this structure:
   {
     title: string,
     scenes: [{
       sceneNumber: number,
       heading: string,
       pageStart: number,
       pageEnd: number,
       content: string,
       type: 'INT' | 'EXT'
     }],
     characters: string[],
     totalPages: number
   }
5. Display a success message showing: number of scenes found, characters detected, total pages

The upload should happen on the main page. After upload, show a summary card with the parsed info.
```

### STEP 3: Sequence Builder UI (The Handshake)

```
After a screenplay is uploaded and parsed, show an interactive "Sequence Builder" screen:

1. Display a horizontal timeline showing all scenes as small blocks
2. The AI should auto-suggest sequence breaks based on:
   - Every 10-15 pages as a default
   - Major location changes
   - Time jumps (look for "LATER", "NEXT DAY", etc. in scene headers)
3. Show the suggested sequences as colored groups on the timeline
4. Allow the user to:
   - Drag dividers between sequences to adjust boundaries
   - Click a sequence to see which scenes it contains
   - Name each sequence (default: "Sequence 1", "Sequence 2", etc.)
5. Add a "Confirm Sequences" button that locks the structure
6. Store the confirmed sequences in state/context

Visual style: Make it look like a film editing timeline. Each sequence should have a different subtle color.
```

---

## PHASE 2: Genre System (Steps 4-5)

*Goal: Genre selection that changes AI behavior*

### STEP 4: Genre Selection Modal

```
Before the Sequence Builder appears, show a Genre Selection modal:

1. Create a modal with a grid of genre cards. Include these genres:
   - Cosmic Horror
   - Psychological Thriller
   - Screwball Comedy
   - Romantic Comedy
   - Action/Adventure
   - Film Noir
   - Science Fiction
   - Drama
   - Slasher Horror
   - Mystery/Whodunit

2. Each card should have:
   - Genre name
   - A short tagline (e.g., Horror: "Dread, atmosphere, the unknown")
   - An icon or subtle visual

3. Allow selecting ONE genre (highlight selected card)
4. Add a "Confirm Genre" button
5. Store the selected genre in app state/context

This selection will later modify how the AI agents analyze the script.
```

### STEP 5: Genre Prompt Templates

```
Create a genre configuration system in /lib/genres.ts:

1. Define a TypeScript type for GenreConfig:
   {
     id: string,
     name: string,
     priorities: string[],  // What this genre cares about most
     paceExpectations: string,  // How pacing should feel
     keyBeats: { name: string, typicalPage: number }[],  // Expected story beats
     redFlags: string[],  // Common mistakes in this genre
     toneGuidelines: string  // How dialogue/action should feel
   }

2. Create configs for all 10 genres. Examples:

   Horror:
   - priorities: ["building dread", "atmosphere", "mystery of threat", "earned scares"]
   - keyBeats: [{ name: "First hint of threat", typicalPage: 10 }, { name: "First death/attack", typicalPage: 25 }]
   - redFlags: ["showing monster too early", "characters making obviously stupid decisions", "no quiet moments between scares"]

   Screwball Comedy:
   - priorities: ["rapid-fire dialogue", "escalating chaos", "misunderstandings", "witty banter"]
   - keyBeats: [{ name: "Meet cute with friction", typicalPage: 12 }, { name: "The big lie starts", typicalPage: 20 }]
   - redFlags: ["characters communicating clearly", "slow dialogue scenes", "mean-spirited humor"]

3. Export a function getGenreConfig(genreId) that returns the config
4. Export a function buildGenrePrompt(genreId, agentType) that returns a system prompt incorporating genre priorities

This will be injected into all AI agent prompts.
```

---

## PHASE 3: AI Integration (Steps 6-8)

*Goal: Connect to AI with flexible provider support*

### STEP 6: AI Provider Abstraction

```
Create a flexible AI provider system in /lib/ai/:

1. Create /lib/ai/types.ts with:
   - AIProvider interface: { name, sendMessage(prompt, systemPrompt): Promise<string> }
   - AIConfig type for storing API keys and settings

2. Create /lib/ai/providers/openai.ts:
   - Implement AIProvider for OpenAI
   - Use the OpenAI SDK
   - Support GPT-4 and GPT-4-turbo models
   - Handle errors gracefully

3. Create /lib/ai/providers/anthropic.ts:
   - Implement AIProvider for Claude
   - Use the Anthropic SDK
   - Support Claude 3 Opus and Sonnet
   - Handle errors gracefully

4. Create /lib/ai/index.ts:
   - Export a getProvider(providerName) function
   - Export a sendToAI(provider, prompt, systemPrompt) unified function

5. Create a Settings page (/app/settings/page.tsx):
   - Allow user to enter API keys for OpenAI and/or Anthropic
   - Store keys in localStorage (warn user this is for development only)
   - Allow selecting default provider
   - Add a "Test Connection" button

Do not hardcode any API keys. All keys come from user input or environment variables.
```

### STEP 7: RAG Context System

```
Create a context management system for analyzing sequences without overwhelming the AI:

1. Create /lib/context/sequenceContext.ts:

2. Build a function summarizeSequence(sequence, fullScenes):
   - Take a sequence and its full scene text
   - Return a compressed summary: key events, characters present, emotional state, plot points
   - This summary should be ~200 words max per sequence

3. Build a function buildAnalysisContext(targetSequenceIndex, allSequences):
   - For the target sequence: include FULL text
   - For previous sequences: include only summaries
   - For future sequences: include nothing (avoid spoilers for the AI)
   - Return a structured context object

4. Build a function formatContextForPrompt(context):
   - Convert the context object into a clean string for the AI prompt
   - Format like:
     "PREVIOUS CONTEXT:
      Sequence 1 Summary: [summary]
      Sequence 2 Summary: [summary]
      
      CURRENT SEQUENCE (Analyze This):
      [full scene text]"

This prevents token overflow while maintaining story continuity awareness.
```

### STEP 8: First Agent - The Logic Tracker

```
Create the first analysis agent - the Logic & Continuity Tracker:

1. Create /lib/agents/logicTracker.ts

2. Define the agent's system prompt:
   "You are a Script Supervisor AI for a {genre} screenplay. Your job is to find logic holes and continuity errors.
   
   Analyze the current sequence and look for:
   - Objects that appear/disappear without explanation
   - Characters who know information they shouldn't have yet
   - Timeline inconsistencies
   - Spatial impossibilities (character is in two places)
   - Technology/period anachronisms
   
   For each issue found, provide:
   - LOCATION: Scene number and page
   - ISSUE: What the problem is
   - SEVERITY: Critical / Medium / Minor
   - SUGGESTION: How to fix it
   
   Be specific. Quote the problematic text."

3. Create function analyzeLogic(sequence, context, genre):
   - Build the full prompt with genre config
   - Send to AI provider
   - Parse the response into structured issues array
   
4. Create a simple test UI:
   - After sequences are confirmed, add a "Run Logic Check" button
   - Display results in a list with severity colors (red/yellow/green)
```

---

## PHASE 4: The Agent Staff (Steps 9-13)

*Goal: Build remaining analysis agents*

### STEP 9: The Conflict Engine

```
Create the Conflict Engine agent in /lib/agents/conflictEngine.ts:

System prompt core:
"You are the Conflict Engine for a {genre} screenplay. You detect when PLOT contradicts CHARACTER.

Your job:
1. First, identify each character's established traits from the context (fears, skills, beliefs, relationships)
2. Then, scan the current sequence for actions that contradict these traits
3. Flag 'Plot-Driven Character Breaks' - moments where a character acts out of character just to move the plot forward

For each conflict found:
- CHARACTER: Who
- ESTABLISHED TRAIT: What we know about them
- CONTRADICTION: What they do that breaks this
- PAGE: Where
- IS IT INTENTIONAL?: Could this be character growth, or is it lazy writing?
- FIX SUGGESTION: How to maintain both plot AND character

Also flag if characters have NO established traits yet (they feel generic)."

Create the analyzeConflicts(sequence, context, genre) function.
Add a "Character Consistency" button to the test UI.
Display results grouped by character.
```

### STEP 10: The Genre Guardian

```
Create the Genre Guardian agent in /lib/agents/genreGuardian.ts:

System prompt core:
"You are the Genre Guardian for a {genre} screenplay. You ensure the script delivers on genre expectations.

Using the genre config provided, check:
1. Are the KEY BEATS happening at the expected pages? (List which are present, missing, or late)
2. Are the PRIORITIES being served? (Is horror building dread? Is comedy getting laughs?)
3. Are any RED FLAGS present?
4. Does the TONE match the genre?

For this sequence specifically:
- What genre expectations should be met HERE based on its position in the story?
- Is this sequence doing its job for the genre?

Be specific about what's working and what's missing. Reference successful films in this genre as examples."

Inject the full genreConfig into the prompt.
Create analyzeGenreCompliance(sequence, context, genre, sequencePosition) function.
Add "Genre Check" to test UI.
```

### STEP 11: The Pacing Heatmap

```
Create the Pacing Heatmap agent in /lib/agents/pacingAnalyzer.ts:

System prompt core:
"You are a Pacing Editor for a {genre} screenplay. Analyze the rhythm and flow.

For each scene in this sequence, calculate:
1. DIALOGUE DENSITY: What percentage is dialogue vs action/description?
2. SCENE LENGTH: Short (under 1 page), Medium (1-3 pages), Long (3+ pages)
3. ENERGY LEVEL: Rate 1-10 based on action, tension, or emotional intensity
4. PACING ISSUE: Is it dragging? Rushed? Just right?

Then provide:
- An overall RHYTHM PATTERN for the sequence (e.g., "slow-slow-BURST-slow" or "constant high energy")
- FLAG any 'talking heads' sections (pure dialogue with no visual storytelling)
- FLAG any 'action fatigue' sections (too much action without breathing room)
- SUGGESTIONS for where to add/remove energy"

Create analyzePacing(sequence, context, genre) function.

For the UI, create a visual heatmap:
- Each scene as a bar
- Color coded by energy level (cool blues for slow, hot reds for intense)
- Width based on page length
```

### STEP 12: The Voice Fingerprint

```
Create the Voice Fingerprint agent in /lib/agents/voiceAnalyzer.ts:

System prompt core:
"You are a Dialogue Coach for a {genre} screenplay. Analyze character voice distinctiveness.

For each speaking character in this sequence:
1. Extract 3-5 sample dialogue lines
2. Analyze their 'fingerprint':
   - Average sentence length (short/medium/long)
   - Vocabulary level (simple/average/sophisticated)
   - Speech patterns (formal/casual, complete sentences/fragments)
   - Unique verbal tics or catchphrases
   - Emotional expression style (direct/indirect, verbose/terse)

Then:
- Calculate OVERLAP SCORE between character pairs (0-100%, where 100% means they sound identical)
- Flag any characters with >80% overlap
- Provide specific suggestions: 'Give Character X shorter sentences' or 'Character Y should use more slang'

The goal: Could you identify who's speaking without the character name? If not, that's a problem."

Create analyzeVoices(sequence, context, genre) function.
Display as character cards with their 'fingerprint' stats and overlap warnings.
```

### STEP 13: The Subtext Scanner & Devil's Advocate

```
Create two more agents:

1. /lib/agents/subtextScanner.ts:
System prompt:
"You are a Director analyzing a {genre} screenplay for 'on-the-nose' dialogue - lines where characters state their feelings instead of showing them.

Find lines where characters:
- Directly state emotions ('I'm angry', 'I love you', 'I'm scared')
- Explain their motivations out loud
- Describe what they're about to do before doing it
- Have dialogue that could be replaced by action

For each issue:
- The exact line
- Why it's on-the-nose
- A rewrite suggestion that SHOWS instead of TELLS
- Or suggest cutting the line entirely and replacing with action"

2. /lib/agents/devilsAdvocate.ts:
System prompt:
"You are the Devil's Advocate for a {genre} screenplay. Your job is to argue AGAINST the writer's choices to test their strength.

Look at this sequence and:
1. Find moments intended to make the hero likable - argue why they might backfire
2. Find 'clever' moments - argue why they might be confusing
3. Find emotional beats - argue why they might feel unearned
4. Find plot twists/surprises - argue why they might be predictable
5. Ask 'What is the writer NOT seeing?'

Be constructively harsh. If a choice is actually strong, acknowledge it. But your default mode is skepticism.

End with: 'Questions the writer should ask themselves: [list]'"

Create functions for both. Add both to the test UI with a special 'Challenge My Choices' button for the Devil's Advocate.
```

---

## PHASE 5: Triage System (Steps 14-16)

*Goal: Intelligent feedback prioritization*

### STEP 14: The Triage Algorithm

```
Create the feedback prioritization system in /lib/triage/triageEngine.ts:

1. Define severity levels:
   - STRUCTURAL (blocks everything else)
   - CHARACTER (important but secondary)
   - CRAFT (polish level)

2. Create a TriageResult type:
   {
     level: 1 | 2 | 3,
     levelName: 'Structure' | 'Character' | 'Craft',
     unlocked: boolean,
     issues: Issue[],
     summary: string,
     blockers: string[]  // What must be fixed to unlock next level
   }

3. Create function runTriage(allAgentResults):
   
   Level 1 checks (Structure):
   - Pull issues from: Genre Guardian (missing beats), Logic Tracker (critical issues), Pacing (major problems)
   - If any CRITICAL structural issues exist, Level 2 stays locked
   
   Level 2 checks (Character):
   - Pull issues from: Conflict Engine, Voice Fingerprint, Devil's Advocate
   - Only process if Level 1 has no critical issues
   
   Level 3 checks (Craft):
   - Pull issues from: Subtext Scanner, Pacing (minor issues)
   - Only process if Level 2 has no critical issues

4. Return all three TriageResults with appropriate lock states

5. Create a message for locked levels:
   "Level 2 is locked. You have [X] structural issues to resolve first. Don't fix dialogue in scenes you might cut."
```

### STEP 15: The Triage Dashboard UI

```
Create the main analysis dashboard at /app/analysis/page.tsx:

1. Three-column layout representing the three triage levels:
   - Column 1: "THE SKELETON" (Structure) - Always visible
   - Column 2: "THE BLOOD" (Character) - Grayed/locked if Level 1 has blockers
   - Column 3: "THE SKIN" (Craft) - Grayed/locked if Level 1 or 2 have blockers

2. Each column shows:
   - Level name and icon
   - Issue count badge
   - List of issues, each with:
     - Severity indicator (color)
     - Short description
     - Page/scene reference
     - Expand to see full details and suggestions
     - "Mark Resolved" checkbox
     - "Ignore" button (with confirmation: "Are you sure? This might affect your script.")

3. Add a progress bar at the top:
   - "Analysis Progress: Level 1 of 3"
   - "Fix 2 more structural issues to unlock Character analysis"

4. When an issue is marked resolved:
   - It fades out with a strikethrough
   - The blocker count updates
   - If all blockers cleared, next level animates unlocking

5. Add a "Run Full Analysis" button that:
   - Shows a loading state with agent names ("Logic Tracker analyzing...")
   - Runs all agents in parallel
   - Populates the triage dashboard with results
```

### STEP 16: Sequence Selector & Focused Analysis

```
Enhance the dashboard to work with sequences:

1. Add a sequence selector bar above the triage columns:
   - Show all sequences as tabs/pills
   - Highlight currently selected sequence
   - Show a mini status icon per sequence (green check, yellow warning, red alert)

2. When a sequence is selected:
   - The triage dashboard shows only issues from that sequence
   - Add a "Analyze This Sequence" button if not yet analyzed
   - Show "Last analyzed: [timestamp]" if previously analyzed

3. Add a "Script Overview" tab that shows:
   - All sequences with their overall health status
   - A mini heatmap showing problem density across the whole script
   - Top 5 most critical issues across all sequences

4. Add the ability to re-analyze a sequence:
   - "Re-analyze" button appears after changes are marked resolved
   - Warn: "This will reset resolved status. Continue?"

5. Persist analysis results:
   - Save to localStorage for now
   - Structure: { scriptId, sequences: { [seqId]: { analysisResults, resolvedIssues, timestamp } } }
```

---

## PHASE 6: Writers' Room (Steps 17-18)

*Goal: Interactive brainstorming mode*

### STEP 17: The Writers' Room Chat

```
Create an interactive chat interface at /app/writers-room/page.tsx:

1. Layout:
   - Left sidebar: Sequence selector (which sequence to discuss)
   - Left sidebar below: Agent selector (which 'staff member' to consult)
   - Main area: Chat interface
   - Right sidebar: Current sequence summary and active issues

2. Agent personas for chat (each has a distinct personality):
   - Genre Guardian: Speaks like a passionate genre fan, references other films
   - Logic Tracker: Methodical, precise, slightly nitpicky
   - Conflict Engine: Empathetic, focused on character psychology
   - Pacing Editor: Energetic, thinks in rhythms and beats
   - Voice Coach: Theatrical, loves dialogue, quotes great lines
   - Devil's Advocate: Contrarian, challenging, but ultimately helpful

3. Chat functionality:
   - User types a message
   - System prompt includes: genre config, sequence context, agent persona, any existing issues
   - Agent responds in character
   - Conversation history maintained per agent per sequence

4. Quick prompts (buttons above chat input):
   - "How can I make this scarier?" (if Horror)
   - "Is this sequence working?"
   - "What's the weakest part?"
   - "Suggest a rewrite"

5. The chat should be able to reference specific issues:
   - "Looking at the Logic issue on page 34..."
   - Link issues to chat responses
```

### STEP 18: Collaborative Rewrite Mode

```
Add a rewrite assistance feature to the Writers' Room:

1. Add a "Rewrite Mode" toggle in the chat

2. When enabled:
   - Show the current sequence's script text in a split view
   - User can highlight any section of text
   - Highlighted text is automatically included in the next chat message
   - "Suggest rewrite for this" button appears on highlight

3. Rewrite workflow:
   - User: "This dialogue feels flat" + [highlighted text]
   - Agent: Provides rewritten version with explanation
   - User can: "Apply Suggestion" (copies to clipboard) or "Refine" (continue iterating)

4. Add a "Rewrite History" panel:
   - Shows all suggested rewrites for this sequence
   - User can compare original vs suggestions
   - Mark favorites to export later

5. Export feature:
   - "Export Rewrite Notes" button
   - Generates a document with:
     - Original text
     - All accepted/favorited rewrites
     - Reasoning for each change
   - Format: Markdown or PDF

6. Final polish:
   - Add keyboard shortcuts (Cmd+Enter to send, Cmd+H to toggle history)
   - Add a "New Session" button to clear chat history
   - Add typing indicators when AI is generating
```

---

## How To Use This System

1. **Start with Step 1.** Copy the entire step prompt into your AI coding assistant.
2. **Test before moving on.** Make sure each step works before proceeding.
3. **If something breaks,** tell the AI: "Step X is not working. The error is: [error]. Fix it."
4. **Steps build on each other.** Don't skip ahead.
5. **Take breaks between phases.** Each phase is a natural stopping point.

---

## Creative Storiq Engine - Vibecoding Step System

### Overview

A web-based screenplay analysis app that provides AI-powered feedback through specialized "agent" personas, with genre-specific analysis and a triage-based feedback system.

| Attribute | Value |
|-----------|-------|
| **Platform** | Next.js Web App |
| **AI Backend** | Flexible (OpenAI + Anthropic) |
| **Approach** | MVP-first, 6 phases, 18 steps |

### Phase Summary

| Phase | Steps | Goal |
|-------|-------|------|
| 1. Foundation | 1-3 | Working app with PDF upload & sequence builder |
| 2. Genre System | 4-5 | Genre selection that modifies AI behavior |
| 3. AI Integration | 6-8 | Connect to LLMs with RAG context system |
| 4. Agent Staff | 9-13 | Build all 7 analysis agents |
| 5. Triage System | 14-16 | Prioritized feedback with level unlocking |
| 6. Writers' Room | 17-18 | Interactive brainstorming chat |

### Key Architecture Decisions

- **Sequence Handshake:** AI suggests sequence breaks, user confirms/adjusts
- **Genre Injection:** Selected genre modifies all agent system prompts
- **RAG Context:** Summaries for past sequences, full text for current (token management)
- **Triage Locking:** Can't see Level 2 until Level 1 issues resolved (prevents premature polish)
- **Agent Personas:** Each agent has distinct personality in Writers' Room chat

### Verification

After completing all steps:

1. Upload a sample screenplay PDF
2. Confirm sequence detection works
3. Select a genre and run full analysis
4. Verify triage levels lock/unlock correctly
5. Test Writers' Room chat with different agents
6. Export rewrite notes
