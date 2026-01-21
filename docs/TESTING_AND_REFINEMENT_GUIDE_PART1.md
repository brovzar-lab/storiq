# TESTING & REFINEMENT GUIDE
## Part 1: Phases 1-2 (Steps 1-7)

For each step, you'll find:
- **✓ TESTS**: How to verify the step works correctly
- **🔧 REFINEMENTS**: Prompts to improve and polish before moving on

---

## PHASE 1: FOUNDATION

---

### STEP 1: Project Setup

#### ✓ TESTS

1. **Project Runs**
   - Run `npm run dev` - does it start without errors?
   - Open `http://localhost:3000` - does the page load?

2. **Visual Check**
   - Is the theme dark with warm accents?
   - Is the title "Creative Sovereignty Engine" visible?
   - Is the subtitle "Your AI Development Partner" visible?
   - Does it feel inviting, not clinical?

3. **Folder Structure**
   - Verify these folders exist: `/app`, `/components`, `/lib`, `/types`, `/agents`, `/visualizations`

4. **Responsive Check**
   - Resize browser to tablet width - does layout adapt?
   - Check on mobile width - is content still readable?

#### 🔧 REFINEMENTS

**If the theme feels too cold/corporate:**
```
The current theme feels too sterile. Make it warmer and more creative:
- Change the background to a deeper charcoal with subtle warm undertones
- Add an amber/gold accent color for highlights and buttons
- The overall feel should be "writer's room at midnight" - professional but creative
- Add subtle texture or grain to the background
```

**If the upload area is too small or uninviting:**
```
The upload area needs to be more prominent and inviting:
- Make it at least 300px tall
- Add a dashed border that glows subtly on hover
- Include an icon (document or film reel)
- Add encouraging microcopy: "Drop your screenplay here. Let's make it undeniable."
- The hover state should feel welcoming, not just functional
```

**If typography feels generic:**
```
Improve the typography for a more premium feel:
- Use a serif font for headings (like Playfair Display or Merriweather)
- Use a clean sans-serif for body text (like Inter or Source Sans)
- Increase heading sizes for more impact
- Add proper line-height for readability (1.6 for body text)
```

**If the page feels empty:**
```
The landing page feels sparse. Add subtle visual interest:
- A faint grid or constellation pattern in the background
- A subtle gradient from top to bottom
- Maybe a film strip or screenplay page graphic element (very subtle, decorative)
- Keep it minimal but not barren
```

---

### STEP 2: PDF Upload & Screenplay Parsing

#### ✓ TESTS

1. **Upload Functionality**
   - Drag a PDF onto the drop zone - does it accept it?
   - Click the drop zone - does file picker open?
   - Try uploading a non-PDF - does it reject with a message?

2. **Parsing Accuracy** (use a real screenplay PDF)
   - Are scene headers detected? (INT./EXT. lines)
   - Are character names extracted correctly?
   - Is the page count accurate (within 1-2 pages)?
   - Are scene counts reasonable for the script length?

3. **Data Structure**
   - Open browser DevTools → Console
   - Log the parsed screenplay object
   - Verify it has: id, title, scenes array, characters array, totalPages

4. **UI Feedback**
   - Does upload show a progress indicator?
   - Does success state show the screenplay title?
   - Is the "Script Overview" card displaying correctly?

5. **Error Handling**
   - Upload a corrupted PDF - does it show a friendly error?
   - Upload a very large PDF (>10MB) - does it handle gracefully?

#### 🔧 REFINEMENTS

**If scene detection is missing scenes:**
```
The scene header detection is missing some scenes. Improve the parsing:
- Look for patterns: INT., EXT., INT./EXT., I/E.
- Handle variations: INT, INT:, INT -, INT--
- Some scripts use lowercase - detect "Int." and "Ext." too
- Look for scene numbers if present (e.g., "42. INT. HOUSE")
- Handle CONTINUOUS, SAME, LATER suffixes
```

**If character detection is catching non-characters:**
```
The character detection is picking up false positives. Refine it:
- Ignore common non-character caps: CONTINUED, CONT'D, MORE, CUT TO, FADE IN, FADE OUT, THE END
- Ignore single letters (V.O., O.S., O.C.)
- A character name should appear before parenthetical or dialogue
- Character names are typically 1-3 words, all caps
- Ignore caps that appear mid-sentence (those are emphasis, not characters)
```

**If parsing is too slow:**
```
PDF parsing is taking too long. Optimize:
- Show a progress bar with stages: "Reading PDF... Extracting text... Identifying scenes..."
- Consider parsing in a Web Worker to not block the UI
- Cache the raw text extraction separately from the parsing logic
- For very long scripts (150+ pages), show estimated time remaining
```

**If the Script Overview card is missing information:**
```
Enhance the Script Overview card to show more useful information:
- Total page count
- Total scene count (with INT/EXT breakdown)
- Character count with top 5 characters by dialogue lines
- Estimated runtime (1 page ≈ 1 minute)
- A "looks good" or "parsing notes" indicator if anything was unusual
```

**If the upload experience feels abrupt:**
```
Make the upload experience smoother:
- Add a subtle animation when file is dropped
- Show the filename during processing
- When complete, animate the transition to the overview card
- Add a satisfying micro-interaction (subtle pulse, checkmark) on success
```

---

### STEP 3: Sequence Builder (The Handshake)

#### ✓ TESTS

1. **Timeline Display**
   - Are all scenes visible as blocks on the timeline?
   - Is block width proportional to scene length?
   - Can you see scene numbers on hover?
   - Are INT scenes darker than EXT scenes?

2. **Auto-Suggested Sequences**
   - Are sequence breaks suggested (colored groups)?
   - Do breaks roughly align with 12-15 page intervals?
   - Do breaks respect major location changes?

3. **User Interaction**
   - Can you drag dividers to adjust boundaries?
   - Does the visual update in real-time as you drag?
   - Can you click a sequence to see its details?
   - Can you rename sequences?

4. **Confirmation Flow**
   - Does "Confirm Sequences" button work?
   - Is there feedback confirming sequences are locked?
   - Are sequences stored in app state after confirmation?

5. **Edge Cases**
   - Very short script (30 pages) - does it suggest 2-3 sequences?
   - Very long script (150 pages) - does it suggest 10-12 sequences?
   - Script with unusual structure - can user easily adjust?

#### 🔧 REFINEMENTS

**If the timeline is hard to read:**
```
The timeline visualization needs better clarity:
- Add more contrast between sequences (use distinct colors for each)
- Show page numbers at regular intervals below the timeline
- Add act markers (Act 1 end around page 25-30, Act 2 end around page 85-90)
- Make the currently hovered scene highlight more prominently
- Show a tooltip with scene heading on hover
```

**If drag interaction is clunky:**
```
Improve the drag-and-drop experience for sequence dividers:
- Dividers should have a clear grab handle
- Show a vertical line preview while dragging
- Snap to scene boundaries (can't break mid-scene)
- Show page count for each sequence updating in real-time as you drag
- Add a subtle haptic-like visual feedback on drop
```

**If auto-detection is inaccurate:**
```
The automatic sequence detection needs improvement:
- Weight location changes more heavily (major location shift = likely sequence break)
- Detect time jumps: "NEXT DAY", "ONE WEEK LATER", "MORNING", "NIGHT"
- Look for "END OF ACT" markers if present
- Consider scene density - a single long scene might be its own sequence
- Default to 8 sequences for a standard 110-page script
```

**If the sequence detail view is lacking:**
```
When clicking a sequence, show richer information:
- Page range (e.g., "Pages 45-62")
- Scene list with headings
- Characters who appear in this sequence
- Brief AI-generated summary of what happens (optional, can add later)
- Estimated screen time
```

**If there's no undo capability:**
```
Add undo/redo for sequence editing:
- Track history of sequence boundary changes
- Add undo button (Cmd+Z support)
- Add "Reset to Suggested" button to start over
- Warn before confirming if user hasn't reviewed all sequences
```

---

### STEP 4: Genre Selection (The Second Handshake)

#### ✓ TESTS

1. **Modal Appearance**
   - Does the modal appear after sequence confirmation?
   - Are all 10 genres displayed as cards?
   - Is each genre name and tagline visible?

2. **Visual Design**
   - Do cards have hover states?
   - Is the selected card clearly highlighted?
   - Does the grid layout look balanced?

3. **Selection Behavior**
   - Can you select only one genre at a time?
   - Does clicking a different genre deselect the previous?
   - Is there visual feedback on selection?

4. **Confirmation**
   - Does "Confirm Genre" button work?
   - Is there a confirmation message with the selected genre?
   - Is the genre stored in app state?

5. **Edge Cases**
   - Try to proceed without selecting - is there validation?
   - Is there a way to change genre later? (settings)

#### 🔧 REFINEMENTS

**If genre cards look too plain:**
```
Make the genre cards more visually distinctive:
- Add a subtle icon or visual motif for each genre
- Use different accent colors per genre (horror = deep red, comedy = warm yellow, etc.)
- Add a film frame or poster-like border
- Include 1-2 example films in smaller text: "Think: Alien, The Thing"
- Make selected state more dramatic (glow, scale up slightly)
```

**If the taglines aren't evocative enough:**
```
Rewrite the genre taglines to be more evocative:

COSMIC HORROR: "Dread. The unknowable. Human insignificance."
PSYCHOLOGICAL THRILLER: "Paranoia. Unreliable minds. Nothing is certain."
SCREWBALL COMEDY: "Rapid wit. Glorious chaos. Battle of equals."
ROMANTIC COMEDY: "Meet-cute. Obstacles. The inevitable surrender."
ACTION/ADVENTURE: "Momentum. Stakes. The impossible made possible."
FILM NOIR: "Shadows. Sins. Doomed from the start."
SCIENCE FICTION: "Big ideas. Strange worlds. Human questions."
DRAMA: "Truth. Relationships. The weight of choices."
SLASHER HORROR: "Tension. Release. Who survives?"
MYSTERY/WHODUNIT: "Clues. Misdirection. The satisfying reveal."
```

**If the modal feels disconnected from the flow:**
```
Make the genre selection feel like part of the journey:
- Add a progress indicator showing steps: Upload → Sequences → Genre → Soul
- Include a brief explanation: "Genre shapes how I'll analyze your script. A comedy and horror have different rules."
- Show a preview of what changes based on genre (e.g., "For Horror, I'll check: atmosphere, dread building, earned scares...")
```

**If users might not know their genre:**
```
Add a "Help me choose" option:
- "Not sure? Describe your script in a sentence and I'll suggest a genre."
- Text input that uses AI to suggest the best genre match
- Or a simple quiz: "Is your script primarily funny? Scary? Tense? Romantic?"
- Always allow override of the suggestion
```

---

## PHASE 2: GENRE & SOUL SYSTEM

---

### STEP 5: Genre Configuration System

#### ✓ TESTS

1. **File Structure**
   - Does `/lib/genres/config.ts` exist?
   - Is the GenreConfig type properly defined?
   - Are all 10 genres configured?

2. **Configuration Completeness**
   For each genre, verify these fields exist:
   - id, name, tagline
   - priorities (array of 4-6 items)
   - keyBeats (array with name, description, typicalPageRange)
   - redFlags (array of 3-5 common mistakes)
   - paceProfile (one of: building, relentless, rhythmic, slow-burn)
   - toneGuidelines (paragraph)
   - antagonistNotes (paragraph)
   - emotionalJourney (paragraph)

3. **Function Tests**
   - `getGenreConfig('horror')` returns full config?
   - `getGenrePriorities('comedy')` returns priorities array?
   - `buildGenreSystemPrompt('thriller', 'structure')` returns valid prompt string?

4. **Type Safety**
   - No TypeScript errors?
   - All fields properly typed?

#### 🔧 REFINEMENTS

**If genre configs are too shallow:**
```
Deepen the genre configurations with more specific guidance:

For each genre, add:
- "masterExamples": 3-5 films that exemplify the genre done well
- "commonMistakes": Specific errors beginners make
- "audienceExpectations": What viewers come for, what disappoints them
- "subgenreVariants": e.g., Horror has slasher, supernatural, psychological
- "dialogueNotes": How characters typically speak in this genre
```

**If keyBeats are too generic:**
```
Make the key beats more specific to each genre:

HORROR example:
- { name: "Normalcy established", typicalPageRange: [1, 10], description: "Show the world before the threat" }
- { name: "First hint of wrongness", typicalPageRange: [10, 15], description: "Something's off but explainable" }
- { name: "Point of no return", typicalPageRange: [25, 35], description: "Characters can't go back to normal" }
- { name: "First major scare/death", typicalPageRange: [30, 45], description: "The threat becomes undeniable" }
- { name: "Darkest moment", typicalPageRange: [75, 85], description: "All seems lost" }
- { name: "Final confrontation", typicalPageRange: [90, 105], description: "Face the threat directly" }
```

**If the system prompt builder is too simple:**
```
Make buildGenreSystemPrompt more sophisticated:

The prompt should vary based on agent type:
- For structure agents: emphasize keyBeats and paceProfile
- For character agents: emphasize antagonistNotes and emotional expectations
- For dialogue agents: emphasize toneGuidelines and genre-specific speech patterns

Include specific examples from masterExamples films when relevant.
```

**Add genre blending support (for future):**
```
Add support for genre blending:
- Primary genre (main rules apply)
- Secondary genre (influences tone)
- e.g., "Horror-Comedy" uses horror structure but comedy pacing rules
- Create a blendGenres(primary, secondary) function
- Weight primary at 70%, secondary at 30% in prompts
```

---

### STEP 6: The Soul Detector (Theme Handshake)

#### ✓ TESTS

1. **Screen Appears**
   - Does the Soul Detection screen appear after genre confirmation?
   - Is the AI analysis triggered automatically?
   - Is there a loading state while analyzing?

2. **AI Output Quality**
   Test with a screenplay you know well:
   - Is the Central Dramatic Question relevant?
   - Does the Thematic Argument make sense?
   - Is the Controlling Idea formatted as "Value + Cause"?
   - Do the Lie/Truth feel connected to the protagonist?

3. **Conversation Format**
   - Is it presented as a conversation, not a form?
   - Does the AI ask "Does this resonate?"
   - Is the tone warm and collaborative?

4. **User Actions**
   - Can you confirm the AI's suggestions?
   - Can you adjust/edit each field?
   - Does "I don't know yet" option work?

5. **Data Storage**
   - Is the Soul stored in app state after confirmation?
   - Does it include: centralQuestion, thematicArgument, controllingIdea, protagonistLie, protagonistTruth, confirmed?

#### 🔧 REFINEMENTS

**If AI theme detection is too vague:**
```
Improve the Soul Detector prompt for more specific results:

"Analyze this screenplay and identify its thematic core. Be SPECIFIC, not generic.

BAD example of Central Question: 'Can love conquer all?' (too vague)
GOOD example: 'Can a man who's never trusted anyone learn to rely on others before his paranoia destroys his family?'

The Controlling Idea should be a complete argument with cause and effect:
BAD: 'Love is important'
GOOD: 'Trust is earned when we risk vulnerability despite past betrayals'

Look for:
- What does the protagonist want vs. what do they need?
- What belief do they hold at the start that changes by the end?
- What is the screenplay ARGUING about life, love, power, justice, etc.?

Be bold. Take a stance on what this script is really about."
```

**If the conversation feels robotic:**
```
Make the Soul Detector's voice more human and collaborative:

Instead of:
"Central Dramatic Question: Can redemption be achieved?"

Use:
"After reading your script, here's what I think you're really exploring—tell me if I'm off base.

The question your audience will be holding, whether they know it or not:
'Can someone who's done terrible things ever truly start over, or does the past always find a way to collect its debts?'

If that doesn't feel right, help me understand what you're going for."
```

**If users struggle to engage with theme:**
```
Add guidance for users who aren't sure about theme:

Include helper text:
"Not sure about theme? That's okay. Many writers discover their theme through revision.

Here are some questions that might help:
- Why did you want to tell this particular story?
- What do you want audiences to feel when the credits roll?
- What would you say your protagonist learns (or fails to learn)?

Or just hit 'I don't know yet' and we'll work with what's on the page."
```

**If the Lie/Truth needs more depth:**
```
Expand the Lie/Truth analysis:

Add:
- "The Wound": What past event created this false belief?
- "The Lie in Action": How does this belief manifest in their behavior?
- "Moments of Doubt": Where in the script does the Lie get challenged?
- "The Truth Glimpse": The moment they first see another way (but aren't ready)
- "The Choice": Where they must choose between Lie and Truth

This creates a richer character arc framework.
```

---

### STEP 7: Theme Constellation Visualization

#### ✓ TESTS

1. **Visualization Renders**
   - Does the constellation appear after Soul is confirmed?
   - Is the central theme node visible and prominent?
   - Are secondary theme nodes connected?
   - Are scene and character nodes visible?

2. **Node Structure**
   - Central node (controlling idea) is largest
   - Secondary nodes (sub-themes) are medium
   - Scene nodes are small
   - Character nodes are medium with different shape

3. **Connections**
   - Are lines visible between related nodes?
   - Do line thicknesses vary based on connection strength?
   - Are unconnected nodes floating at edges?

4. **Interactions**
   - Click a theme → connected items highlight?
   - Click a scene → shows scene summary?
   - Click a character → shows thematic role?
   - Zoom and pan working?

5. **Floating Detection**
   - Are disconnected scenes colored differently (amber)?
   - Does hovering show "This scene doesn't connect to your theme"?

6. **Sidebar Stats**
   - Connected count: X scenes, Y characters
   - Floating count: Z scenes, W characters
   - Theme density by sequence (bar chart)

#### 🔧 REFINEMENTS

**If the constellation is too cluttered:**
```
Improve constellation readability:
- Add zoom controls (+/- buttons)
- Add a "Focus on theme" button that zooms to just the theme nodes
- Implement semantic zoom: zoomed out shows only themes, zoomed in shows scenes
- Add clustering: scenes in same sequence group together
- Allow collapsing: click a theme to hide/show its connected scenes
```

**If connections are hard to follow:**
```
Improve connection visualization:
- Use curved lines instead of straight (bezier curves)
- Animate a subtle pulse along connections when hovering on a node
- Color-code connections by type (theme→scene vs theme→character)
- Add labels on hover showing the nature of the connection
- Use varying opacity: strong connections are solid, weak are faded
```

**If floating nodes aren't obvious enough:**
```
Make disconnected elements more prominent:
- Floating scenes pulse gently with an amber glow
- Add a filter button: "Show only unconnected"
- Create a "Floating" section in the sidebar listing all disconnected items
- Click a floating item to see AI suggestion: "This scene might connect to [theme] if..."
```

**If the AI analysis for connections is weak:**
```
Improve the prompt for theme-scene connection analysis:

"For each scene in this screenplay, determine its thematic connection.

Questions to ask:
- Does this scene advance or complicate the central argument?
- Does a character express or contradict the theme through action or dialogue?
- Does this scene show the protagonist moving toward or away from their need?
- Would removing this scene affect the thematic coherence?

Rate each scene's thematic relevance: STRONG, MODERATE, WEAK, NONE

For NONE scenes, suggest: Could this scene be cut? Or how could it be connected?"
```

**Add animation for visual interest:**
```
Add subtle animations to the constellation:
- Nodes gently float/drift (very subtle, like stars)
- Connections occasionally pulse
- When analysis updates, new connections animate in
- Smooth transitions when zooming/panning
- Consider a "starfield" background that parallax scrolls slightly
```

---

## END OF PART 1

Continue to Part 2 for Phases 3-4 (Steps 8-13).
