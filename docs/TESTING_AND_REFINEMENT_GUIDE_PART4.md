# TESTING & REFINEMENT GUIDE
## Part 4: Phases 7-8 (Steps 20-25)

For each step, you'll find:
- **✓ TESTS**: How to verify the step works correctly
- **🔧 REFINEMENTS**: Prompts to improve and polish before moving on

---

## PHASE 7: WRITERS' ROOM

---

### STEP 20: Writers' Room Chat Interface

#### ✓ TESTS

1. **Page Loads**
   - `/app/writers-room/page.tsx` exists?
   - Page renders without error?

2. **Layout Structure**
   - Left sidebar with sequence selector?
   - Main area with chat interface?
   - Right sidebar (collapsible) with soul/genre info?

3. **Sequence Selection**
   - Can select different sequences?
   - Current sequence summary displays?
   - Active issues for sequence are clickable?

4. **Chat Functionality**
   - Can type and send messages?
   - AI responds with relevant feedback?
   - Message history persists during session?

5. **AI Voice Quality**
   - Is the AI warm and collaborative?
   - Does it reference specific characters by name?
   - Does it feel like a creative partner?

6. **Context Awareness**
   - AI knows the genre?
   - AI knows the soul/theme?
   - AI references the current sequence specifically?

7. **Quick Prompts**
   - Buttons appear above input?
   - Clicking sends pre-written prompt?
   - Prompts are genre-appropriate?

8. **Persistence**
   - Conversation history saves (localStorage)?
   - "New Conversation" clears history?

#### 🔧 REFINEMENTS

**If AI responses feel generic:**
```
Improve the Writers' Room system prompt:

"You are a creative partner helping develop a {GENRE} screenplay titled '{TITLE}'.

Current context:
- Working on: Sequence {N} (Pages {X}-{Y})
- Theme: {CONTROLLING_IDEA}
- Protagonist's journey: From '{LIE}' to '{TRUTH}'

Your personality:
- Warm but honest—you're not here to flatter, but to help
- Reference specific characters, scenes, and pages when giving feedback
- Ask clarifying questions when needed
- Offer specific, actionable suggestions
- Celebrate what's working before noting problems
- Speak like a collaborator, not a teacher or judge

Never be vague. Never give generic writing advice. Always speak to THIS specific screenplay.

If asked about a scene you haven't read closely, say: 'Let me look at that more carefully...' and then analyze it specifically."
```

**If chat feels impersonal:**
```
Add personalization to the Writers' Room:

1. Remember previous conversations:
   "Last time we talked about strengthening John's motivation in Scene 12. Have you made changes?"

2. Reference writer's patterns:
   "I've noticed you have strong dialogue instincts. Let's apply that same sharpness to the action lines."

3. Use the screenplay's own language:
   "In Scene 8, John says 'Trust is for fools.' That's a perfect encapsulation of his Lie. Can we find a moment where that belief cracks?"
```

**If quick prompts aren't helpful:**
```
Make quick prompts more genre-specific and useful:

FOR HORROR:
- "How can I make this scene scarier?"
- "Is the threat present enough?"
- "Where should the audience feel dread?"

FOR COMEDY:
- "Is this scene funny enough?"
- "Where are the comedic peaks?"
- "Does the dialogue have rhythm?"

FOR THRILLER:
- "Is the tension sustained?"
- "What information should I withhold?"
- "Is the clock ticking?"

Also add universal prompts:
- "What's the weakest page in this sequence?"
- "What would make this unforgettable?"
- "Challenge my choices (Devil's Advocate)"
```

**If context switching is jarring:**
```
Smooth the sequence-switching experience:

When user switches sequences:
1. Save current conversation state
2. Show brief transition: "Moving to Sequence 4..."
3. Load that sequence's context and conversation
4. AI acknowledges: "Alright, let's look at Sequence 4 (the midpoint). What would you like to work on?"

Don't just swap—make it feel like moving to a different room in the same house.
```

---

### STEP 21: Specialist Invocation

#### ✓ TESTS

1. **UI Elements**
   - "Invoke Specialist" section visible in right sidebar?
   - All 5 specialists listed?
   - Each has icon and brief description?

2. **Invocation**
   - Clicking specialist activates them?
   - Visual indicator shows active specialist?
   - AI voice changes to match persona?

3. **Specialist Voices**
   Test each specialist responds differently:
   - 🎭 Genre Guardian: Passionate, references films?
   - 🧠 Story Surgeon: Clinical, precise?
   - 😈 Devil's Advocate: Challenging, contrarian?
   - 💬 Dialogue Doctor: Theatrical, quote-focused?
   - 🎬 Director's Eye: Visual, cinematic?

4. **Exit Specialist**
   - Can say "back to normal" to exit?
   - Default voice resumes?

5. **Persistence**
   - Specialist stays active until dismissed?
   - Works across multiple messages?

#### 🔧 REFINEMENTS

**If specialists sound too similar:**
```
Define sharper specialist personalities:

GENRE GUARDIAN:
"I LIVE for {GENRE}. I've seen every {GENRE} film ever made. When I give you a note, I'm comparing you to the masters. I'll reference specific films constantly. I get genuinely excited when you nail something and genuinely frustrated when you miss opportunities. I'm your {GENRE} superfan—and I have high standards."

STORY SURGEON:
"I approach screenplay analysis like a surgeon approaches an operation. I'm methodical, precise, and unemotional. I'll identify exactly where the problem is, what's causing it, and what procedure will fix it. I don't sugarcoat, but I'm not cruel—I'm clinical. I believe every problem has a structural solution."

DEVIL'S ADVOCATE:
"My job is to argue AGAINST every choice you've made. Not because you're wrong—but to test if you're RIGHT. If your choices can't survive my scrutiny, they won't survive an audience. I'll find the weakest interpretation of every scene, the most unflattering read of every character. Then YOU prove me wrong."

DIALOGUE DOCTOR:
"I'm obsessed with how characters speak. I can tell you in 10 words why a line doesn't work and give you 3 better alternatives. I think in rhythm, subtext, and voice. I'll quote your best lines back to you with admiration and wince visibly at your worst ones. Dialogue is my religion."

DIRECTOR'S EYE:
"I see your screenplay as a FILM, not a document. I think in shots, cuts, lighting, and blocking. When I read a scene, I'm already picturing where the camera goes. I'll push you toward more VISUAL storytelling and away from dialogue-heavy scenes. Every page should be something I can shoot."
```

**If specialist invocation feels clunky:**
```
Make invocation more natural:

1. Allow natural language:
   "Can I talk to the Genre Guardian?"
   "Give me the Devil's Advocate perspective"
   "What would a director think about this?"

2. Suggest specialists contextually:
   "You're asking about pacing. Want me to bring in the Story Surgeon for a more clinical analysis?"

3. Allow multi-specialist:
   "Let me get both the Genre Guardian and Devil's Advocate perspectives on this..."
```

**If specialists forget their role:**
```
Reinforce specialist personas in context:

Each message while specialist is active should:
1. Start with subtle persona marker (not cheesy)
2. Maintain consistent vocabulary and tone
3. Reference their specific expertise
4. Stay in character even when answering follow-ups

Add a hidden system prompt injection:
"[ACTIVE SPECIALIST: {NAME}] - Maintain this persona throughout. Do not break character. Your expertise is {EXPERTISE}. Your communication style is {STYLE}."
```

---

### STEP 22: Rewrite Mode

#### ✓ TESTS

1. **Toggle Works**
   - "REWRITE MODE" toggle visible?
   - Clicking toggles the mode?
   - Layout changes when enabled?

2. **Split View**
   - Script text appears on left?
   - Chat remains on right?
   - Both are scrollable independently?

3. **Text Selection**
   - Can select text in script panel?
   - Selection is highlighted?
   - Selected text appears in chat context?

4. **Rewrite Flow**
   - User selects text + types request?
   - AI provides rewrite in suggestion block?
   - Suggestion block has Apply/Refine/Reject buttons?

5. **Button Actions**
   - Apply copies to clipboard + marks accepted?
   - Refine opens follow-up input?
   - Reject dismisses suggestion?

6. **Rewrite History**
   - History panel shows all suggestions?
   - Original vs. Suggested comparison visible?
   - Can star favorites?
   - Status (Applied/Rejected/Pending) shows?

7. **Export**
   - "Export Rewrite Notes" works?
   - Markdown file downloads?
   - Contains original + accepted rewrites?

#### 🔧 REFINEMENTS

**If text selection is finicky:**
```
Improve the text selection experience:

1. Add line numbers for easy reference
2. Allow click-and-drag OR shift-click for range
3. Highlight entire scenes on double-click
4. Show a floating "Suggest rewrite" button near selection
5. Allow selecting multiple non-contiguous sections
6. Show character count / line count of selection
```

**If rewrite suggestions are poor:**
```
Improve the rewrite prompt:

"The user has selected the following text from their {GENRE} screenplay:

---
{SELECTED_TEXT}
---

They are asking: {USER_REQUEST}

Provide a rewrite that:
1. Addresses their specific request
2. Maintains the CHARACTER VOICES established in this screenplay
3. Fits the GENRE tone
4. Keeps roughly the same length (unless they asked for shorter/longer)
5. Preserves any ESSENTIAL plot information

Present your rewrite in a clear block, followed by:
- What you changed and why
- What you preserved and why
- One alternative approach they might consider"
```

**If the history panel is cluttered:**
```
Improve rewrite history UX:

1. Group by sequence, then by session date
2. Show snippet of original (first 20 words...)
3. Compact view by default, expand on click
4. Add search/filter by status
5. Show which rewrites were ultimately used
6. Add "Clear rejected" button to clean up
```

**If Apply doesn't feel satisfying:**
```
Enhance the Apply action:

1. Show toast: "Rewrite copied to clipboard ✓"
2. Mark the original text in the script view with a subtle highlight: "Rewrite pending"
3. Offer: "Apply to document" if we integrate with actual screenplay files
4. Track: "You've applied 12 rewrites this session"
5. Celebrate milestones: "10 rewrites applied! Your script is evolving."
```

**Add comparison view:**
```
Create a before/after comparison:

When viewing a suggestion, offer:

[Before]                    [After]
JOHN                        JOHN
I'm so angry right now.     (slams the table)
I can't believe you         You knew. The whole time,
would do this to me.        you knew.

Show deletions in red strikethrough, additions in green.
This makes the change visually clear.
```

---

## PHASE 8: POLISH & PERSISTENCE

---

### STEP 23: Version Tracking System

#### ✓ TESTS

1. **Data Structure**
   - `/lib/versions/versionManager.ts` exists?
   - Version tracking structure is defined?

2. **New Upload Detection**
   - Upload a new PDF
   - Does it ask "Is this a new draft of [TITLE]?"
   - Choosing "Yes" adds as new version?
   - Choosing "No" creates new script?

3. **Version Storage**
   Each version stores:
   - versionId, versionNumber, uploadedAt
   - filename
   - analysisResults
   - resolvedIssues[], ignoredIssues[]
   - overallScore

4. **Version Selector**
   - Dropdown in header shows all versions?
   - Format: "v1 (Jan 5) → v2 (Jan 12)"?
   - Current version is highlighted?
   - Can view any version's analysis?

5. **Storage Persistence**
   - Close browser, reopen—data persists?
   - Storage warning is displayed?

#### 🔧 REFINEMENTS

**If version detection is inaccurate:**
```
Improve version matching:

1. Compare by title (fuzzy match for typos)
2. Compare by character names present
3. Compare by scene count (within 20%)
4. Compare by total pages (within 10%)

If 3+ of these match: "This looks like a new version of '{TITLE}'. Is that right?"

If unsure: "I'm not sure if this is a new script or a new version of an existing one. Which is it?"
- [New version of: dropdown of existing scripts]
- [New script entirely]
```

**If version switching is confusing:**
```
Make version context clearer:

When viewing an old version, show banner:
"📁 You're viewing v2 (January 12). Current version is v4."
[View current] [Compare to current]

In version selector, show:
v1 (Jan 5) - 62% - Initial draft
v2 (Jan 12) - 68% - After structure pass ✓
v3 (Jan 18) - 74% - After character pass ✓
v4 (Jan 25) - 81% - Current ★
```

**If storage fills up:**
```
Handle localStorage limits:

1. Show storage usage: "Using 3.2 MB of ~5 MB available"
2. Warn at 80% capacity
3. Offer cleanup: "Delete analysis results older than 30 days?"
4. Allow exporting all data as JSON backup
5. Consider IndexedDB for larger storage needs
```

**Add version notes:**
```
Let users annotate versions:

When uploading a new version, prompt:
"What changed in this draft? (optional)"
- [x] Structural changes
- [x] Character work
- [ ] Dialogue polish
- [ ] Other: ___________

Store these notes for context when comparing later.
```

---

### STEP 24: Draft Comparison View

#### ✓ TESTS

1. **Page Loads**
   - `/app/drafts/page.tsx` exists?
   - Page renders without error?

2. **Draft Journey Visualization**
   - All versions displayed as progression?
   - Scores shown for each version?
   - Visual progress bars?
   - Issue counts visible?

3. **Compare Button**
   - "Compare vX ↔ vY" buttons present?
   - Clicking shows comparison view?

4. **Comparison Content**
   - RESOLVED issues listed?
   - NEW issues listed?
   - NET CHANGE calculated?

5. **Progress Celebration**
   - Positive improvements acknowledged?
   - New issues contextualized (not punished)?
   - Trend indicator (↑ ↓ →) accurate?

6. **Insights**
   - Category-level insights shown?
   - "Biggest improvement" identified?
   - "Biggest opportunity" identified?

#### 🔧 REFINEMENTS

**If comparisons are hard to read:**
```
Improve comparison visualization:

1. Use color coding:
   - Green: Resolved issues
   - Red: New issues
   - Gray: Unchanged issues

2. Group by category:
   STRUCTURE: 3 resolved, 1 new
   CHARACTER: 2 resolved, 0 new
   CRAFT: 2 resolved, 2 new

3. Show specific changes:
   ✓ "Logic hole on page 34" - RESOLVED
   ⚠ "Pacing in Act 3" - NEW (didn't exist in v2)
   ○ "Voice overlap: Sarah/Mike" - UNCHANGED
```

**If progress feels invisible:**
```
Celebrate progress more visibly:

1. Show score change prominently:
   "v3 → v4: +7 points 🎉"

2. Milestone markers:
   "You've crossed the 80% threshold! This is a strong draft."

3. Comparative statements:
   "Your structure improved the most (+15 points since v1)"
   "Character depth has improved steadily across all versions"

4. Time tracking:
   "You've been developing this script for 3 weeks. Here's your journey..."
```

**If new issues feel like failures:**
```
Reframe new issues positively:

Instead of: "NEW ISSUES (3)"

Show: "New areas to explore (3)"

With context:
"When you fixed the structure, it revealed some character opportunities that weren't visible before. This is normal—it means you're digging deeper."

Or: "These new issues appeared because your revision touched these areas. That's healthy iteration."
```

**Add trend analysis:**
```
Show patterns across versions:

"TREND ANALYSIS:

Structure: ████████░░ (peaked at v3, stable)
Character: ██████░░░░ (steadily improving)
Craft: ████░░░░░░ (hasn't been addressed yet)

Recommendation: Your structure is solid. Focus v5 on craft—particularly the dialogue overlap issues that have persisted since v1."
```

---

### STEP 25: Final Polish & Onboarding

#### ✓ TESTS

**Onboarding:**

1. First-time user sees onboarding flow?
2. Screen 1: Welcome message?
3. Screen 2: API key setup?
4. Screen 3: Upload prompt?
5. Can skip or complete onboarding?
6. Onboarding doesn't show on return visits?

**Empty States:**

7. No screenplay: friendly upload prompt?
8. No analysis: "Ready to analyze" message?
9. No issues: "Looking good!" message?

**Loading States:**

10. Parsing shows progress?
11. Analysis shows which lens is active?
12. Progress bar with estimated time?

**Error Handling:**

13. API error shows friendly message + retry?
14. Parse error shows helpful guidance?
15. Timeout offers options?

**Keyboard Shortcuts:**

16. Cmd+Enter sends chat message?
17. Cmd+/ toggles rewrite mode?
18. Cmd+1-9 jumps to sequences?
19. Escape closes modals?

**Responsive:**

20. Sidebars collapse on smaller screens?
21. Mobile view works (simplified)?
22. Below 1024px shows warning?

**Polish:**

23. Transitions are smooth?
24. Animations feel consistent?
25. Toast notifications work?

#### 🔧 REFINEMENTS

**If onboarding feels long:**
```
Streamline onboarding:

Option 1: Progressive onboarding
- Only show what's needed now
- API keys can be entered when first analysis is triggered
- Spread learning across first session

Option 2: Single-screen onboarding
- Combine welcome + API + upload into one elegant screen
- Left side: brief explanation
- Right side: action (upload or setup)

Option 3: Skip option with tooltip tutorials
- Let users jump in immediately
- Show contextual tips on first use of each feature
- "Did you know?" tooltips that can be dismissed
```

**If empty states feel cold:**
```
Make empty states encouraging:

No screenplay:
"Every great film started as a blank page.
Drop your screenplay here and let's find its potential."

No analysis yet:
"Your screenplay is loaded and ready.
When you're ready, I'll analyze it for structure, character, and craft.
This usually takes about 2 minutes."

No issues found:
"Clean slate in this area! ✨
Either you're a genius, or we should double-check.
Want me to look again with fresh eyes?"
```

**If loading feels slow:**
```
Make loading feel faster:

1. Start showing partial results immediately
   - Structure analysis done? Show it, even while character runs

2. Engaging loading messages:
   - "Reading your screenplay..."
   - "Meeting your characters..."
   - "Checking the structure..."
   - "Listening to the dialogue..."
   - "Almost there..."

3. Fun facts while waiting:
   - "Did you know? The average screenplay has 50-60 scenes."
   - "Fun fact: Chinatown went through 7 major revisions."

4. Show meaningful progress:
   - "Analyzed 4 of 8 sequences..."
   - Progress bar that actually reflects work done
```

**If errors feel scary:**
```
Humanize error messages:

API Error:
"Hmm, I couldn't connect to the AI service. This usually means:
- Check your internet connection
- Your API key might have expired
- The service might be temporarily busy

[Try Again] [Check Settings]"

Parse Error:
"I had trouble reading this PDF. A few things that might help:
- Make sure it's a standard screenplay format
- Try exporting from your screenwriting software again
- If it's a scanned document, it needs to be a searchable PDF

[Try Different File] [Get Help]"

Timeout:
"This is taking longer than expected. Happens sometimes with longer scripts.
[Keep Waiting] [Cancel and Try Later]"
```

**Add final polish touches:**
```
Small details that elevate the experience:

1. Subtle sound design (optional, toggle-able):
   - Soft click on button press
   - Gentle chime when analysis completes
   - Satisfying pop when issue resolved

2. Micro-animations:
   - Buttons have slight bounce on hover
   - Cards lift subtly on hover
   - Progress bars have gentle pulse

3. Delightful details:
   - Confetti when hitting 90% score
   - Custom cursor in creative areas
   - Easter egg: Konami code shows credits

4. Accessibility:
   - Full keyboard navigation
   - Screen reader friendly
   - High contrast mode option
   - Reduce motion option
```

---

## FINAL CHECKLIST: Before Shipping

Use this checklist before considering the app "complete":

### Core Functionality
- [ ] Can upload and parse any standard screenplay PDF
- [ ] Sequence detection works reliably
- [ ] All 10 genres have full configurations
- [ ] Soul detection produces meaningful results
- [ ] All analysis lenses run without error
- [ ] Triage system correctly gates levels
- [ ] Writers' Room chat is responsive and helpful
- [ ] All 5 visualizations render correctly
- [ ] Version tracking preserves data between sessions

### User Experience
- [ ] First-time user can complete onboarding in <2 minutes
- [ ] Analysis completes in <3 minutes for standard script
- [ ] All error states have friendly messages
- [ ] All loading states have meaningful feedback
- [ ] Keyboard shortcuts work
- [ ] Mobile view is functional (or clearly warns)

### Quality Bar
- [ ] AI responses feel human and specific (not generic)
- [ ] Strengths are presented before issues
- [ ] Every issue has an actionable suggestion
- [ ] Scores feel fair and meaningful
- [ ] Progress between versions is celebrated

### Polish
- [ ] No layout shifts during loading
- [ ] Animations are smooth (60fps)
- [ ] Colors are consistent throughout
- [ ] Typography is readable
- [ ] Touch targets are large enough

---

## END OF TESTING & REFINEMENT GUIDE

You now have comprehensive testing criteria and refinement prompts for all 25 steps across 8 phases.

**Files created:**
1. `TESTING_AND_REFINEMENT_GUIDE_PART1.md` - Phases 1-2 (Steps 1-7)
2. `TESTING_AND_REFINEMENT_GUIDE_PART2.md` - Phases 3-4 (Steps 8-13)
3. `TESTING_AND_REFINEMENT_GUIDE_PART3.md` - Phases 5-6 (Steps 14-19)
4. `TESTING_AND_REFINEMENT_GUIDE_PART4.md` - Phases 7-8 (Steps 20-25)

Happy building!
