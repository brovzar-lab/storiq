# TESTING & REFINEMENT GUIDE
## Part 3: Phases 5-6 (Steps 14-19)

For each step, you'll find:
- **✓ TESTS**: How to verify the step works correctly
- **🔧 REFINEMENTS**: Prompts to improve and polish before moving on

---

## PHASE 5: CRAFT & ELEVATION

---

### STEP 14: Voice Fingerprint & Subtext Scanner

#### ✓ TESTS

**Voice Fingerprint:**

1. **Lens Executes**
   - `/lib/agents/lenses/voiceFingerprint.ts` exists?
   - Function runs without error?
   - Returns structured output?

2. **Output Structure**
   Verify voiceAnalysis contains:
   - characters[]: name, fingerprint { sentenceLength, vocabulary, patterns, formality, tics }, sampleLines
   - overlapWarnings[]: char1, char2, overlapScore, suggestion

3. **Fingerprint Quality**
   Test with a screenplay:
   - Are fingerprints distinct for different characters?
   - Do sample lines actually show the character's voice?
   - Do overlap warnings catch characters who sound alike?

4. **Overlap Detection**
   - Characters with >75% overlap are flagged?
   - Suggestions are specific ("Give X shorter sentences")?

**Subtext Scanner:**

5. **Lens Executes**
   - `/lib/agents/lenses/subtextScanner.ts` exists?
   - Function runs without error?
   - Returns structured output?

6. **Output Structure**
   Verify subtextIssues contains:
   - page, line, problem, suggestion

7. **Detection Quality**
   - Does it catch "I'm angry" type lines?
   - Does it catch exposition dumps?
   - Are suggestions actually better (show vs. tell)?

#### 🔧 REFINEMENTS

**If voice fingerprints are too similar:**
```
Improve voice differentiation analysis:

"Analyze each character's UNIQUE voice markers:

1. SENTENCE STRUCTURE:
   - Average length (words per sentence)
   - Complete vs. fragments vs. run-ons
   - Simple vs. compound vs. complex sentences

2. VOCABULARY:
   - Education level indicators
   - Profession-specific jargon
   - Regional/cultural markers
   - Era-specific language (period pieces)

3. VERBAL HABITS:
   - Filler words ('um', 'like', 'you know')
   - Catchphrases or repeated expressions
   - How they say yes/no
   - How they express emotion

4. RHYTHM:
   - Do they interrupt?
   - Do they ramble or stay concise?
   - Do they ask questions or make statements?

Give concrete examples from the text for each marker."
```

**If overlap scores don't match reality:**
```
Calibrate the overlap scoring:

"When comparing two characters' voices, check:

VOCABULARY OVERLAP:
- What % of distinctive words do they share?
- Do they use the same metaphors/expressions?

RHYTHM OVERLAP:
- Similar sentence lengths? (+20% overlap)
- Similar punctuation usage? (+10% overlap)
- Similar use of fragments? (+15% overlap)

EMOTIONAL EXPRESSION:
- Do they express anger the same way? (+15%)
- Do they express affection the same way? (+15%)

COVER TEST:
- Read 5 random lines from each character with names hidden
- Could you tell them apart? If no, overlap is >80%

Provide specific rewrites to differentiate:
'Character A should speak in shorter bursts. Character B should use more formal vocabulary.'"
```

**If subtext detection is missing issues:**
```
Expand on-the-nose detection:

"Flag dialogue where characters:

1. STATE FEELINGS DIRECTLY:
   ❌ 'I'm so angry right now'
   ✅ [Character slams the door]

2. EXPLAIN THEIR THINKING:
   ❌ 'I'm going to pretend to agree so they trust me'
   ✅ 'Sure, that sounds great.' [while making eye contact with ally]

3. PROVIDE UNNECESSARY EXPOSITION:
   ❌ 'As you know, we've been partners for ten years...'
   ✅ [Show their partnership through action]

4. NARRATE THEIR ACTIONS:
   ❌ 'I'm leaving now'
   ✅ [Character leaves]

5. OVER-EXPLAIN SUBTEXT:
   ❌ 'When you say that, I hear your father's voice'
   ✅ [Character winces at the familiar phrase]

For each flagged line, provide a rewrite that SHOWS instead of TELLS."
```

**If suggestions are too generic:**
```
Make subtext suggestions more specific:

Instead of: "Show don't tell"

Provide specific rewrites:

ORIGINAL: 'I'm so scared right now.'
OPTIONS:
1. Cut the line entirely. Add action: 'Her hands trembled as she reached for the doorknob.'
2. Replace with subtext: 'It's fine. Everything's fine.' [while backing away]
3. Physical reaction: She couldn't make her feet move.

Always give 2-3 specific alternatives, not just advice.
```

---

### STEP 15: Unforgettable Moment Scanner

#### ✓ TESTS

1. **Lens Executes**
   - `/lib/agents/lenses/momentScanner.ts` exists?
   - Function runs without error?
   - Returns structured output?

2. **Output Structure**
   Verify output contains:
   - existingPeaks[]: scene, page, description, currentImpact, enhancement
   - potentialPeaks[]: scene, page, currentState, potential, suggestions, potentialImpact
   - peakDeserts[]: pageRange, suggestion
   - trailerMoment: exists, scene, notes

3. **Detection Quality**
   Test with a screenplay:
   - Are actual memorable scenes identified as peaks?
   - Are underwhelming scenes flagged as potential peaks?
   - Are long stretches without peaks flagged?
   - Is there a trailer moment identified?

4. **Scoring**
   - Impact scores (1-10) feel accurate?
   - Enhancement suggestions are actionable?
   - Effort ratings (Low/Medium/High) are helpful?

5. **Genre Awareness**
   - For horror: Are scary moments identified?
   - For comedy: Are comedic peaks identified?
   - For thriller: Are tension peaks identified?

#### 🔧 REFINEMENTS

**If peak detection is too conservative:**
```
Calibrate peak detection:

"A PEAK MOMENT has most of these qualities:
- Stakes: Something important can be won or lost
- Emotion: Strong feeling (fear, joy, shock, sadness, triumph)
- Surprise: Something unexpected happens
- Visual potential: Could be a striking image
- Character change: Someone is transformed or revealed

Rate each scene on these 5 criteria (1-5 each).
Score of 20+: Strong existing peak
Score of 15-19: Solid peak
Score of 10-14: Potential peak (could be elevated)
Score below 10: Not a peak moment

Identify the TOP 5 moments in the script by this measure."
```

**If potential peaks aren't being spotted:**
```
Look for underwritten potential:

"Find scenes that SHOULD be peaks but are currently flat:

1. STRUCTURAL PEAKS: Inciting incident, midpoint twist, climax, resolution
   - These MUST be peaks. If they're not memorable, flag them.

2. REVELATION SCENES: When secrets are exposed, truths revealed
   - These have built-in potential but are often rushed.

3. CONFRONTATION SCENES: When antagonist and protagonist face off
   - These should crackle with tension.

4. TRANSFORMATION SCENES: When characters make irreversible choices
   - The choice should feel momentous.

5. EMOTIONAL PAYOFF SCENES: Reunions, breakups, deaths
   - The groundwork has been laid; is the payoff delivered?

For each, rate: Current state vs. Potential. If gap is >3 points, flag as 'underwritten potential.'"
```

**If peak deserts aren't being flagged:**
```
Define peak desert parameters:

"A PEAK DESERT is:
- 15+ pages without a memorable moment
- Stretches where the script 'goes through the motions'
- Sections audiences would describe as 'the slow part'

For any sequence with no peak:
- Is it setup for a later peak? (Acceptable if <10 pages)
- Is it character development without dramatic event? (Flag for enhancement)
- Is it pure exposition? (Flag for restructuring)

Every 10-15 pages should have SOMETHING that could go in the trailer.
If not, suggest: 'Pages 45-60 are a peak desert. Consider adding [specific suggestion based on genre].'"
```

**If trailer test is unclear:**
```
Define the trailer test concretely:

"THE TRAILER TEST: Imagine the marketing team needs to cut a 2:30 trailer.

For each sequence, could they pull:
- A striking visual? (explosion, kiss, confrontation)
- A memorable line? (quotable, punchy)
- A tension moment? (ticking clock, chase)
- An emotional beat? (tears, laughter, gasp)

If a sequence offers NONE of these, it may not be earning its pages.

For the whole script:
- Can you identify 8-10 'trailer beats'?
- Are they distributed across the runtime?
- Does the final act have the biggest beat?

If the script fails the trailer test, it may struggle to attract an audience."
```

---

### STEP 16: Emotional Journey Map & Waveform

#### ✓ TESTS

1. **Lens Executes**
   - `/lib/agents/lenses/emotionalJourney.ts` exists?
   - Function runs without error?
   - Returns scene-by-scene emotional data?

2. **Waveform Renders**
   - X-axis shows pages/sequences?
   - Y-axis shows intensity (0-10)?
   - Line graph is visible?
   - Colors indicate emotion types?

3. **Interactivity**
   - Click a point shows scene details?
   - Emotional assessment is displayed?
   - Key plot points are overlaid (inciting incident, midpoint, climax)?

4. **Analysis Quality**
   - Primary emotions match the scenes?
   - Intensity ratings feel accurate?
   - "Unearned" emotions are flagged?

5. **Architecture Insights**
   - Flat zones are highlighted?
   - Climax peak is checked (is it highest?)?
   - Genre template comparison available?

6. **Catharsis Check**
   - Does ending deliver payoff?
   - Are unresolved threads noted?

#### 🔧 REFINEMENTS

**If emotion detection is too basic:**
```
Expand the emotional palette:

"Identify the PRIMARY and SECONDARY emotions for each scene:

TENSION family: suspense, dread, anxiety, worry, anticipation
FEAR family: terror, horror, unease, creeping dread
JOY family: happiness, triumph, relief, satisfaction, delight
SADNESS family: grief, melancholy, loss, nostalgia, heartbreak
ANGER family: rage, frustration, indignation, resentment
SURPRISE family: shock, revelation, twist, wonder, confusion
LOVE family: romance, warmth, connection, tenderness, passion

Rate intensity 1-10 and note if emotion BUILDS, PEAKS, or RELEASES in the scene.

Also note emotional TRANSITIONS within scenes:
'Scene starts at tension 7, builds to 9, releases to 4 when hero escapes.'"
```

**If the waveform is too smooth:**
```
Add more detail to the emotional waveform:

1. Show beat-level detail, not just scene averages
2. Mark specific moments:
   - 📍 Emotional peaks (local maxima)
   - ⬇️ Release points (sudden drops)
   - ↗️ Building sections
   - 〰️ Sustained tension
3. Add a "volatility" indicator - how much the emotion swings
4. Show when emotions CHANGE TYPE (tension → relief → joy)
```

**If "unearned" detection is missing:**
```
Define earned vs. unearned emotion:

"An emotion is EARNED when:
- The groundwork has been laid (we know why this matters)
- The character's journey has built to this moment
- The audience has reason to care

An emotion is UNEARNED when:
- We're told to feel something without setup
- A character's death/success means nothing because we don't know them
- The script relies on clichés (sad music, slow motion) instead of story
- It's manipulative rather than organic

CHECK FOR:
- Does the character who dies have enough screen time? (< 5 scenes = probably unearned)
- Does the romance have chemistry built up? (< 3 scenes together = probably unearned)
- Does the triumph feel deserved? (Was there real struggle?)

Flag any scene asking for strong emotion (intensity 8+) that doesn't have foundation."
```

**If catharsis isn't properly analyzed:**
```
Define catharsis check criteria:

"CATHARSIS is the emotional release at the end. Check:

1. PROMISE KEPT: Does the ending deliver what the genre promised?
   - Horror: Is the threat truly faced/resolved?
   - Romance: Is the relationship status resolved?
   - Thriller: Is the mystery solved, villain defeated?

2. TRANSFORMATION VISIBLE: Do we see the protagonist changed?
   - The Lie should be replaced by Truth
   - Their behavior should be different than page 1

3. EMOTIONAL THREADS: Are all emotional threads resolved?
   - Relationships: Where do they end?
   - Losses: Are they grieved?
   - Questions: Are they answered (or intentionally left open)?

4. RELEASE: Does the final emotion feel like a RELEASE?
   - After tension, we need relief
   - After sadness, we need hope or acceptance
   - The audience should exhale

If catharsis is missing: 'The script builds emotional tension but doesn't release it. Consider adding [specific beat] to provide closure.'"
```

---

## PHASE 6: TRIAGE & DASHBOARD

---

### STEP 17: Triage Algorithm

#### ✓ TESTS

1. **Function Exists**
   - `/lib/triage/triageEngine.ts` exists?
   - `runTriage(allAnalysisResults)` function works?

2. **Level Structure**
   Verify 5 levels return correctly:
   - Level 0: Soul
   - Level 1: Skeleton (Structure)
   - Level 2: Heart (Character)
   - Level 3: Skin (Craft)
   - Level 4: Elevation

3. **Level Status**
   Each level has:
   - status: 'complete' | 'has_issues' | 'locked'
   - issueCount: { critical, major, minor }
   - issues[], strengths[]
   - unlockMessage (if locked)

4. **Gating Logic**
   - Critical issues in Level 1 → Levels 2-4 locked?
   - Critical issues in Level 2 → Levels 3-4 locked?
   - No critical issues → All levels unlocked?

5. **Priority Sorting**
   - topPriorities contains max 5 issues?
   - Sorted by impact, not just severity?

6. **Overall Progress**
   - Progress percentage calculates correctly (0-100)?
   - currentLevel identifies the right level to focus on?

#### 🔧 REFINEMENTS

**If gating feels too strict:**
```
Calibrate the gating logic:

Consider a more nuanced approach:

HARD LOCKS (truly blocks progress):
- No clear protagonist
- Fundamental logic breaks that affect everything
- No discernible structure

SOFT LOCKS (recommend but allow override):
- Genre beats are late but present
- Minor logic holes
- Pacing issues

Show soft locks as: "⚠️ Recommended to fix first, but you can proceed"
Show hard locks as: "🔒 Must be resolved to continue"

Let users acknowledge and bypass soft locks if they choose.
```

**If priority sorting is wrong:**
```
Improve priority scoring:

Score each issue on:
- SEVERITY: Critical (10), Major (6), Minor (2)
- SPREAD: Affects many scenes (+3), Affects one scene (+0)
- DOMINO EFFECT: Causes other issues (+5), Isolated (+0)
- EFFORT: Easy fix (0), Hard fix (-2) [easier = higher priority]

Sort by total score, not just severity.

Example:
- "Logic hole on page 34" → Severity 6, Spread 0, Domino 0 = 6
- "Protagonist is passive throughout" → Severity 6, Spread 3, Domino 5 = 14

The protagonist issue has higher priority despite same severity.
```

**If progress percentage feels inaccurate:**
```
Make progress calculation more meaningful:

Don't just count issues. Weight by level:

Level 0 (Soul): 10% of total
Level 1 (Structure): 25% of total
Level 2 (Character): 30% of total
Level 3 (Craft): 20% of total
Level 4 (Elevation): 15% of total

Within each level:
- No issues = full points
- Only minor issues = 80% points
- Major issues = 50% points
- Critical issues = 20% points

This makes a structurally sound script with craft issues show ~70%, not 50%.
```

**If unlock messages aren't helpful:**
```
Make unlock messages specific:

Instead of: "Fix Level 1 issues to unlock Level 2"

Say: "Level 2 (Character) is locked. You have 2 critical structural issues:
1. The midpoint occurs on page 78 (should be ~55)
2. No clear inciting incident

Fix these first—character work depends on solid structure. [Jump to issues]"
```

---

### STEP 18: Unified Analysis Dashboard

#### ✓ TESTS

1. **Layout Renders**
   - Top bar with title, genre, score, mode toggle?
   - Left sidebar with sequence selector?
   - Main area changes based on selection?
   - Right sidebar with stats and navigation?

2. **Diagnosis Mode - All Sequences**
   - Script-wide health overview visible?
   - Level progress bars (0-4) visible?
   - Top 5 priorities across whole script?
   - Sequence health grid?

3. **Diagnosis Mode - Single Sequence**
   - Sequence health score?
   - Three category cards (Structure | Character | Craft)?
   - Score bars and issue counts?
   - Strengths section?

4. **Expanded Category View**
   - Full list of issues?
   - Severity badges (red/yellow/blue)?
   - Expand/Resolve/Ignore buttons work?

5. **Issue Interactions**
   - Resolve marks complete, fades out?
   - Ignore asks confirmation?
   - "Work on this" opens Writers' Room?

6. **Level Locking**
   - Locked levels show padlock?
   - Unlock message explains what to fix?
   - Progress bar shows proximity to unlock?

7. **Strengths Display**
   - "What's Working" banner visible?
   - Rotates through strengths?
   - Positive tone before criticism?

#### 🔧 REFINEMENTS

**If the dashboard is overwhelming:**
```
Simplify the initial view:

On first load, show ONLY:
1. Overall score (big, central)
2. One-sentence summary: "Your structure is solid. Character depth needs work."
3. Top 3 priorities
4. "See full analysis" button

Let users opt into complexity rather than drowning in it immediately.
```

**If score presentation feels judgmental:**
```
Reframe scores as progress, not grades:

Instead of: "Score: 62%" (feels like a failing grade)

Show: "Script Health: ████████░░░░ Growing"

With status labels:
- 90+: "Production Ready"
- 75-89: "Strong Draft"
- 60-74: "Solid Foundation"
- 45-59: "Taking Shape"
- Below 45: "Early Draft"

Everyone starts somewhere. The score is a progress marker, not a judgment.
```

**If category cards are confusing:**
```
Make category cards clearer:

Each card should show:
┌─────────────────────────────────┐
│ STRUCTURE            ████░░ 72% │
│                                  │
│ ● 1 critical issue              │
│ ● 3 opportunities               │
│                                  │
│ ✓ Genre beats present           │
│ ✓ Clear three-act structure     │
│                                  │
│ [See Details →]                 │
└─────────────────────────────────┘

Show issues AND strengths on the card itself.
```

**If transitions feel jarring:**
```
Add smooth transitions:

- When switching sequences, crossfade content
- When resolving an issue, animate it sliding out
- When unlocking a level, show celebratory animation
- When switching modes (Diagnosis/Development), smooth transition
- Loading states should have consistent skeleton UI
```

**If strengths feel like afterthoughts:**
```
Make strengths more prominent:

1. Before ANY issues, show a "What's Working" section:
   "Before we dig into opportunities, here's what you're doing well:
   - Your dialogue has distinct voices
   - The pacing in Act 2 builds tension effectively
   - Theme is consistently present"

2. For each category, lead with strengths:
   "CHARACTER: Your protagonist has a clear want (revenge).
    Now let's work on their internal need..."

3. End each session with a strength reminder:
   "Remember: Your premise is strong. These refinements will make it shine."
```

---

### STEP 19: Visualizations Hub

#### ✓ TESTS

1. **Hub Page Loads**
   - `/app/visualizations/page.tsx` exists?
   - Page renders without error?

2. **All Cards Present**
   - Theme Constellation card?
   - Character Journey card?
   - Emotional Waveform card?
   - Pacing Heatmap card?
   - Antagonist Presence card?

3. **Card Information**
   - Each has visual preview?
   - Each has brief description?
   - Each is clickable?

4. **Navigation**
   - Clicking card opens full visualization?
   - Full view has explanation panel?
   - "Back to Dashboard" works?

5. **Updates**
   - Visualizations update after re-analysis?

6. **Export**
   - "Download as PNG" works for each?

#### 🔧 REFINEMENTS

**If previews aren't useful:**
```
Make visualization previews actually informative:

Instead of a static placeholder:
- Theme Constellation: Show the actual constellation, miniaturized
- Character Journey: Show the arc line
- Emotional Waveform: Show the actual waveform
- Pacing Heatmap: Show the actual heatmap
- Antagonist Presence: Show the presence bars

Each preview should show REAL data so users can glance and know the state.
```

**If the hub feels disconnected:**
```
Add context to the visualizations hub:

At the top, show:
"VISUALIZATIONS: See your story from different angles"

And quick insights:
- "Your theme constellation has 3 disconnected scenes"
- "Your emotional waveform peaks at page 78 (the climax)"
- "Your antagonist is absent for 22 pages mid-story"

This gives users a reason to explore each visualization.
```

**If export quality is poor:**
```
Improve PNG export:

1. Export at 2x resolution for crisp images
2. Include the screenplay title and export date
3. Add a subtle watermark: "Creative Sovereignty Engine"
4. For Theme Constellation: Export with dark background
5. For all: Include a legend/key in the export
6. Offer multiple formats: PNG, SVG (for vectors), PDF
```

**Add a "Story Overview" combined view:**
```
Create a single-page story overview:

A printable/exportable summary showing:
- Title, genre, theme (one line each)
- Tiny character journey map
- Tiny emotional waveform
- Key stats (page count, scene count, character count)
- Top 3 strengths
- Top 3 priorities

This becomes a "state of the script" snapshot that writers can print or share.
```

---

## END OF PART 3

Continue to Part 4 for Phases 7-8 (Steps 20-25).
