# TESTING & REFINEMENT GUIDE
## Part 2: Phases 3-4 (Steps 8-13)

For each step, you'll find:
- **✓ TESTS**: How to verify the step works correctly
- **🔧 REFINEMENTS**: Prompts to improve and polish before moving on

---

## PHASE 3: AI INTEGRATION

---

### STEP 8: AI Provider Abstraction Layer

#### ✓ TESTS

1. **File Structure**
   - `/lib/ai/types.ts` exists with AIProvider and AIConfig interfaces?
   - `/lib/ai/providers/openai.ts` exists?
   - `/lib/ai/providers/anthropic.ts` exists?
   - `/lib/ai/index.ts` exists with exports?

2. **OpenAI Provider**
   - Enter a valid OpenAI API key in settings
   - Click "Test Connection" - does it succeed?
   - Does it handle invalid keys gracefully (friendly error)?
   - Test with GPT-4 and GPT-4-turbo models

3. **Anthropic Provider**
   - Enter a valid Anthropic API key in settings
   - Click "Test Connection" - does it succeed?
   - Does it handle invalid keys gracefully?
   - Test with Claude 3 Opus and Sonnet models

4. **Settings Page**
   - Are API key fields password-masked?
   - Are keys stored in localStorage?
   - Is there a warning about local storage?
   - Can you switch between providers?
   - Do model dropdowns update based on provider?

5. **Error Handling**
   - Test with invalid API key - is error message helpful?
   - Test with no internet - is error message helpful?
   - Does the UI not crash on API errors?

6. **Context Provider**
   - Is the AI config available throughout the app?
   - Can other components access `sendAnalysis` function?

#### 🔧 REFINEMENTS

**If error messages are unclear:**
```
Improve error handling for AI providers:

Map common error codes to helpful messages:
- 401: "Invalid API key. Please check your key in Settings."
- 429: "Rate limit reached. Please wait a moment and try again."
- 500: "The AI service is having issues. Try again in a few minutes."
- Network error: "Can't connect. Check your internet connection."

For each error, show:
1. What went wrong (plain language)
2. How to fix it
3. A "Retry" button where appropriate
```

**If settings page feels basic:**
```
Enhance the Settings page:
- Show API key status: "Connected ✓" or "Not configured"
- Show which provider is currently active
- Add "Test with sample prompt" that actually runs a small query
- Show estimated cost per analysis based on model choice
- Add a "Clear all data" option for privacy
- Include links to get API keys (OpenAI, Anthropic)
```

**If provider switching is confusing:**
```
Make provider selection clearer:
- Use radio buttons or toggle switch for provider selection
- Show provider logos (OpenAI, Anthropic)
- When switching providers, show what changes:
  "Switching to Anthropic Claude will use different models with different strengths."
- Remember last successful provider
```

**Add usage tracking (optional but helpful):**
```
Add basic API usage tracking:
- Count tokens used per session
- Show estimated cost (very rough)
- Store in localStorage: { date, provider, tokens, estimatedCost }
- Show simple chart of recent usage
- This helps users manage their API costs
```

**Add response caching:**
```
Implement response caching to save API costs:
- Cache analysis results with a hash of the input
- If same sequence + same genre + same soul = return cached result
- Show "Using cached analysis" indicator
- Add "Re-analyze (ignore cache)" button
- Clear cache when screenplay is re-uploaded
```

---

### STEP 9: RAG Context Management

#### ✓ TESTS

1. **Summarizer Function**
   - `summarizeSequence(sequence, scenes)` returns a summary?
   - Summary is ~200 words or less?
   - Summary includes: plot events, characters, tone, objects introduced?

2. **Context Builder**
   - `buildAnalysisContext(targetIndex, allSequences, summaries)` works?
   - Previous sequences are summaries only?
   - Target sequence is full text?
   - Future sequences are excluded?
   - Soul data is included?
   - Genre config is included?

3. **Formatter**
   - `formatContextForPrompt(context)` produces clean string?
   - Format is readable and structured?
   - All required sections present?

4. **Caching**
   - Generate summary for Sequence 1
   - Request same summary again - is it instant (cached)?
   - Modify sequence - does cache invalidate?

5. **Token Management**
   - Check formatted prompt length - is it reasonable?
   - Long screenplay (150 pages) doesn't overflow context?

#### 🔧 REFINEMENTS

**If summaries are too long or verbose:**
```
Improve the sequence summarization prompt:

"Summarize this sequence in EXACTLY 150-200 words. Be ruthlessly concise.

Include ONLY:
- 2-3 key plot events (what happens)
- Characters present and their main actions
- Emotional tone shift (if any)
- Critical information introduced (secrets revealed, objects found)
- How it ends (what's the sequence's cliffhanger or resolution)

Do NOT include:
- Scene-by-scene breakdown
- Dialogue quotes
- Minor character actions
- Description of settings

Format as a tight paragraph, not bullet points."
```

**If context is missing important information:**
```
Enhance the context builder to include:

1. Character tracker:
   "CHARACTERS PRESENT IN CURRENT SEQUENCE:
   - JOHN (protagonist): Last seen in Seq 2, pursuing [want]
   - MARY (antagonist): Last seen in Seq 1, last action was [X]"

2. Open threads:
   "UNRESOLVED FROM PREVIOUS SEQUENCES:
   - The letter John found but hasn't opened
   - Mary's secret about the accident"

3. Theme checkpoint:
   "THEME STATUS:
   - Controlling idea: [X]
   - Last thematic beat: Seq 2, Scene 12 - protagonist chose fear over trust"
```

**If context window is running out:**
```
Implement smarter context compression:

1. Tiered summaries:
   - Sequence N-1 (previous): 200 words
   - Sequence N-2: 100 words
   - Sequences N-3 and earlier: 50 words each

2. Relevance scoring:
   - If analyzing character, weight character info higher
   - If analyzing structure, weight plot events higher

3. Token counting:
   - Calculate tokens before sending
   - If over limit, compress older summaries further
   - Never truncate current sequence
```

**If summaries are losing important details:**
```
Add a "critical details" extractor:

Before summarizing, identify:
- Any object introduced that might be important later (Chekhov's gun)
- Any information that only certain characters know
- Any promise/threat made that needs to pay off
- Any lie told that might be revealed

Store these separately and always include them, even in compressed summaries.
```

---

### STEP 10: Unified Analysis Engine

#### ✓ TESTS

1. **Engine Runs**
   - `runFullAnalysis(sequence, context, genre, soul)` executes without error?
   - Returns a UnifiedReport object?
   - All lenses run (check console for progress)?

2. **Lenses Execute**
   Verify each lens produces output:
   - GenreBeats: { issues, strengths, score }
   - LogicContinuity: { issues, strengths, score }
   - PacingRhythm: { issues, strengths, score }
   - WantVsNeed: (may be placeholder for now)
   - AntagonistDepth: (may be placeholder)
   - ConflictConsistency: { issues, strengths, score }
   - VoiceDistinction: (may be placeholder)
   - SubtextQuality: { issues, strengths, score }
   - SceneEconomy: { issues, strengths, score }

3. **Report Structure**
   Verify UnifiedReport contains:
   - sequenceId
   - overallScore (0-100)
   - categories.structure, .character, .craft
   - topPriorities (max 5)
   - highlights (strengths)
   - themeConnection

4. **Issue Format**
   Each issue has:
   - id, category, lens, severity
   - page, scene
   - summary, detail, suggestion
   - resolved (boolean)

5. **Parallel Execution**
   - Multiple lenses run simultaneously (Promise.all)?
   - Performance is reasonable (not sequential slowness)?

6. **Caching**
   - Results cached per sequence?
   - Cache invalidates on re-analysis?

#### 🔧 REFINEMENTS

**If analysis is too slow:**
```
Optimize the analysis engine:

1. Parallel all independent lenses:
   const [structure, character, craft] = await Promise.all([
     runStructuralLenses(sequence, context),
     runCharacterLenses(sequence, context),
     runCraftLenses(sequence, context)
   ]);

2. Within each category, parallelize further where possible

3. Show progress: "Analyzing... (3 of 9 checks complete)"

4. Consider background processing with status updates
```

**If scores feel arbitrary:**
```
Make scoring more consistent and meaningful:

Define clear criteria for scores:
- 90-100: Professional quality, ready for production
- 70-89: Strong work, minor issues to address
- 50-69: Functional but needs significant work
- 30-49: Major issues affecting story quality
- 0-29: Fundamental problems, may need restructuring

For each lens, define what earns/loses points:
- Logic: -10 per critical logic hole, -3 per minor
- Pacing: -15 for "the slog" sections, -5 for rushed
- Etc.
```

**If issues are too vague:**
```
Improve issue specificity:

BAD issue:
{ summary: "Pacing issue", detail: "The pacing is off in this sequence" }

GOOD issue:
{
  summary: "Dialogue-heavy section drags (pages 45-52)",
  detail: "Pages 45-52 contain 7 pages of continuous dialogue with no visual storytelling. The scene in the coffee shop has characters sitting and talking with no action, movement, or visual variety. This creates 'talking heads' syndrome.",
  suggestion: "Break up the dialogue with: (1) Have John walk to the window mid-conversation, (2) Add a physical task - maybe Mary is packing while talking, (3) Cut 2-3 pages of redundant dialogue - they repeat the same point about trust three times."
}
```

**If synthesis is just concatenating:**
```
Make the synthesis smarter:

When combining lens outputs:
1. Remove duplicate issues (different lenses might flag same problem)
2. Connect related issues: "These 3 issues may have a common cause..."
3. Identify conflicts: "The pacing agent suggests cutting Scene 12, but the theme agent notes it's thematically important. Consider rewriting rather than cutting."
4. Prioritize by impact, not just severity
```

**If strengths are being overlooked:**
```
Explicitly prompt for strengths:

"Before listing issues, identify 3-5 things this sequence does WELL:
- A particularly effective scene
- Strong dialogue exchange
- Good use of visual storytelling
- Effective tension building
- Clear character motivation
- Genre expectations met or exceeded

Be specific. Quote examples where possible."
```

---

## PHASE 4: CHARACTER DEPTH

---

### STEP 11: Want vs. Need Tracker

#### ✓ TESTS

1. **Lens Executes**
   - `/lib/agents/lenses/wantVsNeed.ts` exists?
   - Function runs without error?
   - Returns structured output?

2. **Output Structure**
   Verify output contains:
   - protagonistName
   - want, need, lie, truth
   - currentSequenceAssessment: { pursuingWant, needHints, lieStatus, arcPosition }
   - issues[], strengths[]

3. **Analysis Quality**
   Test with a screenplay you know:
   - Is the WANT correctly identified?
   - Is the NEED meaningful (not generic)?
   - Does the LIE make sense for the character?
   - Does arcPosition progress through the script?

4. **Sequence Tracking**
   Run on Sequence 1, then Sequence 5:
   - Does arcPosition increase/change?
   - Does lieStatus shift (reinforced → cracking)?
   - Are needHints relevant to each sequence?

5. **Integration**
   - Does output feed into the main analysis engine?
   - Are issues properly formatted for the dashboard?

#### 🔧 REFINEMENTS

**If want/need detection is too generic:**
```
Improve the Want vs. Need prompt:

"Analyze the protagonist's arc. Avoid generic answers.

For WANT, identify the SPECIFIC external goal:
BAD: 'Wants to be happy'
GOOD: 'Wants to win the custody battle for his daughter'

For NEED, identify the SPECIFIC internal change:
BAD: 'Needs to grow'
GOOD: 'Needs to accept that being a good father means putting his daughter's needs above his pride'

For LIE, state the false belief AS THE CHARACTER WOULD:
BAD: 'Believes wrong things about love'
GOOD: 'Believes: If I show vulnerability, I'll be seen as weak and lose everything'

The Want and Need should be in TENSION - pursuing the Want should make achieving the Need harder."
```

**If arc tracking isn't nuanced enough:**
```
Add more granular arc tracking:

Instead of just 0-100 arcPosition, track:
- wantPursuit: { active: true/false, intensity: 1-10 }
- needAwareness: { unaware | glimpsed | struggling | accepting | embraced }
- lieStrength: { absolute | cracking | shattered | transformed }

For each sequence, note specific moments:
- "Page 47: John refuses help (lie reinforced)"
- "Page 52: Sees daughter's drawing of them together (need glimpsed)"
```

**If passive protagonists aren't flagged:**
```
Add active protagonist detection:

"In this sequence, is the protagonist DRIVING the action or REACTING to events?

ACTIVE markers:
- Makes decisions that change the situation
- Pursues goals despite obstacles
- Takes initiative

PASSIVE markers:
- Things happen TO them
- They wait for others to act
- They go along with others' plans
- Information is handed to them

A protagonist can be reactive in early sequences but should become increasingly active. Flag any sequence past the midpoint where protagonist is passive for more than 5 pages."
```

**If want/need never connect to theme:**
```
Add explicit theme connection check:

"Does the protagonist's arc connect to the screenplay's theme?

Theme: [CONTROLLING_IDEA]

The protagonist's journey from Lie to Truth should EMBODY the theme.

Example:
- Theme: 'Trust is earned when we risk vulnerability despite past betrayals'
- Protagonist Lie: 'I can't trust anyone again'
- Protagonist Truth: 'This person is worth the risk'

Does this protagonist's arc explore/prove/complicate the theme? If not, either the arc or the theme may need adjustment."
```

---

### STEP 12: Character Journey Map Visualization

#### ✓ TESTS

1. **Visualization Renders**
   - Does the journey map appear?
   - Is WANT label visible at top?
   - Is NEED label visible at bottom?
   - Are all sequences represented as nodes?

2. **Node Display**
   - Vertical position reflects arc position?
   - Colors indicate status (blue=Lie, amber=Cracking, red=Crisis, green=Truth)?
   - Node sizes vary based on arc movement?

3. **Special Markers**
   - Is CRISIS POINT marked?
   - Is CHOICE point marked?
   - Are markers in appropriate positions?

4. **Interactions**
   - Hover on sequence shows arc summary?
   - Click jumps to that sequence's analysis?
   - Missing crisis point shows warning?

5. **User Adjustments**
   - Can drag crisis point?
   - Can edit Want/Need/Lie/Truth labels?
   - Do changes persist?

#### 🔧 REFINEMENTS

**If the visualization is hard to read:**
```
Improve visual clarity:

1. Add a clear "arc line" connecting all nodes
2. Label each node with sequence number and pages
3. Use clear icons for special points:
   - 💥 Crisis point
   - ⚖️ Choice moment
   - 🎭 Lie established
   - ✨ Truth accepted
4. Add vertical grid lines showing Lie→Truth spectrum
5. Show a "healthy arc" ghost line for comparison
```

**If the arc feels flat visually:**
```
Add visual drama to the arc:

- The path should feel like a JOURNEY, not just dots
- Use a curved line that swoops down toward Need
- Add "elevation" - make the crisis point literally the lowest point
- Use color gradients along the line (cool to warm as they grow)
- Add subtle particles or glow at key moments
```

**If AI arc detection is wrong:**
```
Make the handshake more robust:

When presenting the arc, show confidence levels:
"I'm fairly confident about the Want (John clearly pursues the promotion).
I'm less sure about the Need - it might be 'learn to value family over work' OR 'accept his own limitations.' Which feels right?"

Let user pick from AI's top 2-3 guesses rather than free-form editing.
```

**Add comparison to genre templates:**
```
Show how this arc compares to genre expectations:

"For a THRILLER, protagonist arcs typically:
- Start competent but flawed
- Face an external threat that exposes internal flaw
- Crisis point around page 75-85
- Choice involves personal sacrifice for greater good

Your arc: [comparison notes]"

Highlight where the arc deviates - not as error, but as awareness.
```

---

### STEP 13: Antagonist Audit

#### ✓ TESTS

1. **Lens Executes**
   - `/lib/agents/lenses/antagonistAudit.ts` exists?
   - Function runs without error?
   - Returns structured output?

2. **Output Structure**
   Verify output contains:
   - antagonists[] array with: name, type, philosophy, mirrorConnection, competenceScore, presenceBySequence, thanosTestPass, issues, strengths
   - overallThreatLevel (1-10)
   - suggestions[]

3. **Analysis Quality**
   Test with a screenplay:
   - Are all antagonists identified?
   - Is the philosophy specific (not just "evil")?
   - Does mirror connection make sense?
   - Is presence tracking accurate?
   - Does competence score reflect actual threat?

4. **Thanos Test**
   - Does the analysis explain if antagonist passes "Thanos test"?
   - If they fail, is there a suggestion for improvement?

5. **Visualization**
   - Presence bar shows which sequences?
   - Threat level trend line visible?
   - Gaps are flagged?

#### 🔧 REFINEMENTS

**If antagonist detection misses antagonists:**
```
Improve antagonist identification:

"Identify ALL opposing forces in this screenplay:

1. HUMAN ANTAGONISTS: Characters who directly oppose the protagonist
2. SYSTEM ANTAGONISTS: Institutions, organizations, rules that create obstacles
3. INTERNAL ANTAGONISTS: The protagonist's own flaws, fears, or past
4. NATURE/FATE: Environmental or circumstantial opposition

Some screenplays have multiple antagonists or antagonist types.
A romantic comedy might have: the rival love interest (human), social expectations (system), and the protagonist's fear of commitment (internal).

List all and rank by importance to the story."
```

**If philosophy analysis is shallow:**
```
Deepen the antagonist philosophy prompt:

"For each antagonist, articulate their worldview as THEY would express it.

Don't write: 'They want power.'
Write: 'They believe that strength is the only thing that matters in this world. Mercy is weakness. The strong survive and the weak deserve their fate. They see themselves as a realist while everyone else is naive.'

Ask: If this antagonist gave a TED talk, what would their thesis be?
Ask: What would they say to defend their actions?
Ask: What do they think is WRONG with the protagonist?

A great antagonist has a philosophy that is wrong... but understandable."
```

**If presence tracking doesn't show influence:**
```
Track antagonist INFLUENCE, not just appearances:

The antagonist doesn't have to be on screen to be present.

Track:
- Direct appearances (scenes where they appear)
- Indirect presence (scenes where they're discussed, their actions have consequences)
- Threat presence (scenes where protagonist fears them or prepares for them)
- Shadow presence (scenes where their influence is felt but unnamed)

A good antagonist should have INFLUENCE in at least 70% of sequences, even if they only APPEAR in 40%.
```

**If competence scoring is arbitrary:**
```
Define clear competence criteria:

Score antagonist competence on:
1. Do they have a plan? (+2 if yes)
2. Do they adapt when things go wrong? (+2 if yes)
3. Do they have resources/advantages the protagonist lacks? (+2 if yes)
4. Do they ever win a round? (+2 if yes)
5. Could they plausibly defeat the protagonist? (+2 if yes)

Deductions:
- Makes obvious mistakes for plot convenience (-2 each)
- Monologues instead of acting (-1)
- Reveals plan unnecessarily (-2)
- Underestimates protagonist clichély (-1)

Score out of 10.
```

**Add mirror analysis depth:**
```
Deepen the mirror/reflection analysis:

"How does the antagonist reflect or contrast the protagonist?

REFLECTION: They represent what the protagonist could become
- Same origin, different choices
- Same skills, different morality
- What the protagonist fears becoming

CONTRAST: They represent the opposite
- Different values, clashing worldviews
- What the protagonist is fighting against

FOIL: They highlight protagonist's qualities by comparison

The best antagonists have THEMATIC CONNECTION to the protagonist. Their conflict should be about IDEAS, not just goals."
```

---

## END OF PART 2

Continue to Part 3 for Phases 5-6 (Steps 14-19).
