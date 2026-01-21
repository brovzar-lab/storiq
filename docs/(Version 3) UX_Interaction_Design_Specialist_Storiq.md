# PRODUCT DESIGN REVIEW: STORIQ

**Designer:** UX/Interaction Design Specialist  
**Stakeholder:** Development Executive  
**Session Type:** Discovery & Alignment

---

## INITIAL OBSERVATIONS

*[Designer speaking]*

Alright, I've reviewed the plan and the executive notes. Before I get into interface recommendations, I need to understand some things about how this tool will actually be *used*. Let me work through this with you.

---

## QUESTION 1: Who is the primary user, and what's their emotional state?

**Designer:** When someone opens this app, who are they? A first-time screenwriter with their baby? A professional on deadline? A development exec evaluating acquisitions? The UX for each is radically different.

**Executive:** Good question. The primary user is the **writer themselves**—but not a beginner. This is for someone who has a complete draft and knows it needs work, but can't see their own blind spots. They might be:

- A professional writer between drafts, wanting objective feedback before showing their manager
- A serious amateur who's completed multiple scripts and understands craft
- A showrunner or writer-producer who needs to quickly evaluate and develop material

The emotional state? **Vulnerable but determined.** They've poured months into this draft. They know something's off but can't articulate it. They want help, but they don't want to feel stupid.

**Designer:** That's critical. So we're designing for someone who is:

1. Emotionally invested in the material
2. Sophisticated enough to understand craft feedback
3. Looking for a collaborator, not a teacher
4. Potentially defensive about criticism

This means the interface cannot feel like a **grading system**. It can't feel like they're submitting homework. It needs to feel like sitting down with a trusted colleague who happens to have perfect memory and infinite patience.

---

## QUESTION 2: What's the core workflow tension?

**Designer:** I see two competing needs in your structure:

1. **The Triage System** — You want to force writers to fix fundamentals before polishing dialogue. This is a *gated* experience. "You can't see Level 2 until Level 1 is resolved."
2. **The Writers' Room** — You want freeform, creative brainstorming. This is an *open* experience. "Ask anything, explore freely."

These are philosophically opposite. One is structured and paternalistic. One is unstructured and collaborative. How do you see these coexisting?

**Executive:** Hmm. You're right, there's tension there. But I think they serve different modes of work:

- **Triage Mode** is for when you want the app to *lead*. "Tell me what's wrong in priority order."
- **Writers' Room Mode** is for when you want to *lead*. "I know I have a problem in Scene 42, help me solve it."

Sometimes you need a doctor who runs the tests and tells you what's wrong. Sometimes you need a consultant you can bounce ideas off. Both are valid.

**Designer:** Okay, so these are **two distinct modes**, not one linear flow. That's a major UX decision. Let me sketch this:

```
┌───────────────────────────────────────────────────────────┐
│                     MODE SELECTION                        │
│                                                           │
│    ┌─────────────────┐        ┌─────────────────┐          │
│    │    DIAGNOSIS     │        │    DEVELOPMENT   │          │
│    │    "What's       │        │    "Let's work   │          │
│    │     wrong?"      │        │     on this"     │          │
│    │                  │        │                  │          │
│    │   Triage System  │        │   Writers' Room  │          │
│    │   (AI Leads)     │        │   (You Lead)     │          │
│    └─────────────────┘        └─────────────────┘          │
│                                                           │
│    You can switch between modes at any time.             │
└───────────────────────────────────────────────────────────┘
```

The user isn't forced into one path. They can run diagnosis, get the report, then jump into Writers' Room to work on a specific issue. Or they can skip diagnosis entirely and go straight to brainstorming.

**Executive:** I like that. But I don't want them to *ignore* the diagnosis. The whole point of the triage is to prevent them from polishing scenes they should cut.

**Designer:** Then we make diagnosis **inviting, not mandatory**. When they open Writers' Room without running diagnosis, we show a gentle prompt:

*"You haven't run a full diagnosis yet. Some structural issues might affect the scene you're working on. Run quick diagnosis?"*

But we don't block them. We inform, not restrict.

**Executive:** That works. Trust the user, but guide them.

---

## QUESTION 3: How do we present criticism without crushing the writer?

**Designer:** This is the biggest UX challenge. You have seven agents whose job is to find problems. If I upload my screenplay and immediately see:

- 12 Logic Errors
- 8 Character Inconsistencies
- 15 On-the-Nose Dialogue Flags
- 6 Missing Genre Beats
- "Your antagonist is boring"

...I'm going to close the app and never return. I didn't come here to feel like a failure.

**Executive:** This is real. I've seen writers shut down completely after harsh coverage. But we can't lie to them either—that defeats the purpose.

**Designer:** Right, we're not lying. We're **framing**. Let me propose some principles:

### Principle 1: Lead with what's working.

Before showing any issues, the app should identify strengths:

*"Your dialogue has strong voice differentiation—characters sound distinct. Your pacing in Act 2 builds tension effectively. Now let's look at areas for development..."*

This isn't false praise. Every script has strengths. We find them first.

### Principle 2: Issues are "opportunities," not "errors."

Language matters enormously. Instead of:

*❌ "ERROR: Logic hole on page 34"*

We say:

*✅ "Opportunity: Page 34 has a continuity question worth addressing"*

**Executive:** Doesn't that feel like corporate euphemism? Writers are smart—they'll see through it.

**Designer:** Fair. Let's find the middle ground. What if the framing acknowledges the seriousness without being punitive?

*"Page 34: The protagonist uses their phone after establishing it was lost. This will pull audiences out of the story. Here's a fix..."*

We state the problem clearly, explain *why it matters to the audience*, and immediately offer a path forward. The tone is "colleague pointing something out," not "teacher marking wrong answers."

### Principle 3: Show the path to resolution.

Every issue must have an actionable next step. No naked criticism. If the app says "your antagonist lacks depth," it must immediately offer:

*"Consider: What does your antagonist believe they're right about? Shall we explore their backstory in the Writers' Room?"*

The issue becomes a **door to creative work**, not a dead end.

**Executive:** I like that a lot. Criticism is the beginning of a conversation, not a verdict.

**Designer:** Exactly. Which leads me to...

---

## QUESTION 4: How do we visualize the "Soul" and "Arc" concepts?

**Designer:** Your new agents—Soul Detector, Want vs. Need Tracker—are dealing with abstract concepts. "What is this screenplay about?" isn't a yes/no question. "What does the protagonist need?" is philosophical.

How do we make these tangible in an interface?

**Executive:** That's the challenge. Theme isn't like a logic error you can point to on a page.

**Designer:** Let me propose some visualization approaches:

### For the Soul Detector (Theme):

Instead of a text block saying "Your theme is redemption," we create a **Theme Constellation**:

```
              [REDEMPTION]
                  /    \
                 /      \
        [guilt]          [forgiveness]
           |                  |
    "Scene 12: confession"   "Scene 45: the apology"
           |                  |
      [protagonist]      [daughter]
```

This visual shows:

- The central theme
- The sub-themes branching from it
- Which scenes connect to which themes
- Which characters carry which thematic weight

If a scene or character isn't connected to the constellation, it's visually obvious—they're floating, unconnected. That's a problem the writer can see immediately.

**Executive:** That's powerful. You're making the abstract visible. A floating character with no theme connection—that's a clear signal.

**Designer:** For the **Want vs. Need Tracker**, I'd propose a **Character Journey Map**:

```
PROTAGONIST: MICHAEL

WANT: "Keep my family safe"          NEED: "Accept I can't control everything"
         |                                        |
         ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  START ────────────────────────────────────────────────────────────  END  │
│    │                                                              │    │
│    │   [Seq 1]    [Seq 3]        [Seq 5]      [Seq 7]            │    │
│    │      │           │               │             │                 │    │
│    ● ───── ● ────────── ● ────────────── ● ──────────── ● ──────────────── ●    │
│    │      │           │               │             │                 │    │
│    │   Pursues   Pursues        Crisis:      Chooses          Accepts│
│    │    WANT      WANT         Want vs.       NEED             NEED  │
│    │                            Need                                  │
└─────────────────────────────────────────────────────────────────────────┘

                    ▲ CRISIS POINT: Page 78
                    "The moment they realize Want isn't enough"
```

This shows the arc as a **literal journey**. The writer can see:

- Where the protagonist is pursuing Want
- Where the crisis happens
- Whether they actually transform by the end
- If the arc is front-loaded, back-loaded, or missing entirely

**Executive:** Could the app auto-generate this, or does the writer build it?

**Designer:** Both. The app generates a **draft** based on its analysis:

*"I've mapped your protagonist's arc. It looks like their Want is [X] and their Need is [Y]. The crisis point seems to be page 78. Is this accurate?"*

The writer can then adjust. Drag the crisis point. Edit the Want/Need labels. This becomes a **living document** they refine as they revise.

---

## QUESTION 5: What about the emotional journey map?

**Executive:** You mentioned the Emotional Journey Map—audience emotions across the script. How do we visualize that?

**Designer:** This is where we go cinematic. I'd create a **waveform visualization** similar to audio editing:

```
EMOTIONAL INTENSITY
         ▲
    HIGH │           ╱╲            ╱╲         ╱╲   ╱╲
         │          ╱  ╲     ╱╲    ╱  ╲       ╱  ╲ ╱  ╲
         │    ╱╲    ╱    ╲   ╱  ╲  ╱    ╲     ╱        ╲
   MEDIUM│   ╱  ╲  ╱      ╲ ╱    ╲       ╲   ╱          ╲
         │  ╱    ╲                      ╲ ╱            ╲
    LOW  │ ╱                                          ╲
         └───────────────────────────────────────────────►
           ACT 1      │       ACT 2       │      ACT 3
                      ▲                   ▲
               Inciting Incident     Midpoint

EMOTION COLOR KEY:
━━━  Tension/Fear    ━━━  Joy/Triumph    ━━━  Sadness    ━━━  Anger
```

Each sequence is a section of the wave. The writer can see:

- Where the peaks are (high intensity moments)
- Where the valleys are (breathing room)
- Whether the climax is actually the highest peak
- If there's too much sameness (flat line = boring)

They can click any point on the wave to jump to that sequence. They can see what emotion the AI detected and whether it matches their intent.

**Executive:** What if the writer disagrees with the AI's reading?

**Designer:** They should be able to override it:

*"I detected this scene as 'tense.' Does that match your intent?"*

- [Yes, that's right]
- [No, it should feel: ________]

If they say "No, it should feel hopeful," the AI can respond:

*"Got it. Here's why it might be reading as tense: the action lines emphasize danger, and there's no release moment. Want to work on shifting the tone in the Writers' Room?"*

Again—every observation leads to collaborative work, not just a grade.

---

## QUESTION 6: How do we handle the "seven agents" without overwhelming the user?

**Designer:** You have seven agents, potentially more with the additions. If each one generates a report, the user is drowning in tabs, panels, and feedback streams. How do we unify this?

**Executive:** The triage system was supposed to handle this—only showing what's relevant at each level.

**Designer:** That helps, but it's not enough. Let me propose a different model: **One Voice, Multiple Perspectives.**

Instead of seven separate agents with seven separate interfaces, there's ONE analysis interface that synthesizes all the agents into a unified report. The user doesn't interact with "the Logic Tracker" and "the Genre Guardian" separately. They see:

```
┌───────────────────────────────────────────────────────────┐
│   SEQUENCE 4 ANALYSIS                                    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   OVERALL HEALTH: ████████░░  78%                         │
│                                                           │
│   STRUCTURE      ████████░░   Strong                      │
│   CHARACTER      ██████░░░░   Needs Work                  │
│   CRAFT          ████████░░   Strong                      │
│                                                           │
├───────────────────────────────────────────────────────────┤
│   TOP PRIORITIES (3 items)                               │
│                                                           │
│   1. [CHARACTER] The protagonist is passive in this      │
│      sequence—they react but don't drive action.         │
│      ▸  Work on this                                      │
│                                                           │
│   2. [STRUCTURE] The midpoint beat is late by 5 pages.   │
│      Consider tightening Scenes 18-20.                   │
│      ▸  Work on this                                      │
│                                                           │
│   3. [CHARACTER] Antagonist doesn't appear in this       │
│      sequence. The threat feels distant.                 │
│      ▸  Work on this                                      │
│                                                           │
├───────────────────────────────────────────────────────────┤
│   STRENGTHS                                              │
│                                                           │
│   • Dialogue in Scene 19 is sharp and distinctive        │
│   • Pacing accelerates well toward sequence end          │
│   • Theme of "control vs. surrender" is reinforced       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

The user sees ONE synthesized view. The agents work behind the scenes, but the user never thinks about "which agent said what." They just see priorities, strengths, and health scores.

**Executive:** But what if they want to dig deeper? What if they want to know *why* the character score is low?

**Designer:** They expand:

```
  CHARACTER      ██████░░░░   Needs Work           [▼  Details]

  ┌──────────────────────────────────────────────────────┐
  │   Character Analysis Details                          │
  │                                                        │
  │   From CONFLICT ENGINE:                               │
  │   • Protagonist's established fear of heights not     │
  │     utilized in the rooftop scene (missed opportunity)│
  │                                                        │
  │   From WANT VS. NEED TRACKER:                         │
  │   • Protagonist is still pursuing Want with no        │
  │     movement toward Need—arc is stalling              │
  │                                                        │
  │   From ANTAGONIST AUDIT:                              │
  │   • Antagonist absent for 15 pages. Consider adding   │
  │     a reminder of the threat.                         │
  └──────────────────────────────────────────────────────┘
```

Now they see the agent-level detail, but only when they ask for it. Progressive disclosure. Surface level is simple. Depth is available on demand.

**Executive:** That's clean. The complexity is there, but it doesn't assault them upfront.

---

## QUESTION 7: What about the Writers' Room chat interface?

**Designer:** You proposed distinct agent personas in the chat—the Genre Guardian speaks like a passionate genre fan, the Logic Tracker is methodical, etc. Is this actually useful, or is it gimmicky?

**Executive:** I thought it would make the experience feel less robotic. Like you're talking to different people with different expertise.

**Designer:** I have concerns. Here's the problem:

If I'm working on a scene and I have a question, I don't want to think "Hmm, is this a Genre Guardian question or a Conflict Engine question?" That's cognitive overhead. I just want to ask my question and get help.

What if, instead of choosing agents, the **single Writers' Room AI draws on all agents contextually**?

**User:** "This scene feels flat. How do I fix it?"

**Writers' Room AI:** "Let me look at this from a few angles:

**Structurally:** This scene is doing the work it needs to—it advances the plot. That's not the problem.

**Character-wise:** Your protagonist is passive here. They're receiving information but not reacting emotionally. What if they pushed back?

**Genre-wise:** For a thriller, this scene lacks a ticking clock. The conversation feels leisurely when it should feel pressured.

**My suggestion:** Add a deadline. Someone's waiting. A phone that might ring. Suddenly passive listening becomes active tension."

The user gets multi-perspective feedback without having to route their question to the right "agent."

**Executive:** So one unified voice, but it's drawing on multiple lenses?

**Designer:** Exactly. The agents are the **backend**—the different analytical engines. But the **frontend** is a single, integrated creative partner who synthesizes those perspectives.

Think of it like a real development exec. You don't have separate meetings with "the structure person" and "the character person." You have one exec who considers all dimensions and gives you integrated notes.

**Executive:** I like it. Simpler for the user. The complexity lives under the hood.

**Designer:** However—I'd keep the **ability to specifically invoke an agent** if the user wants depth:

*User: "Give me the Genre Guardian's take on this."*

*AI: [switches to Genre Guardian persona] "Okay, speaking as a horror devotee—this scene is violating a core principle. You're explaining the monster's origin too early. The mystery IS the horror. Every answer you give reduces the dread. Look at how ALIEN handles the xenomorph—we know almost nothing until the third act. Can you hold back this exposition?"*

So the default is unified, but specialists are invokable.

---

## QUESTION 8: How do we handle version tracking across rewrites?

**Designer:** A screenplay goes through many drafts. Right now, your plan treats each upload as a fresh analysis. But real development is iterative. If I fix the logic errors in v2, I want to see:

- What issues from v1 are resolved?
- What new issues appeared?
- Is v2 actually better, or did I break something?

**Executive:** Absolutely. Version tracking is essential. But how do we do that without making it feel like a project management tool?

**Designer:** Let me propose a **Draft Journey** view:

```
DRAFT HISTORY
────────────────────────────────────────────────────────────

  v1 (Jan 5)         v2 (Jan 12)        v3 (Jan 20)
  ───────────         ───────────         ───────────
  Score: 62%    →     Score: 74%    →     Score: 81%

  Issues: 24         Issues: 15         Issues: 8
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │█████████│         │█████░░░░│         │███░░░░░░│
  │█████████│         │██████░░░│         │████░░░░░│
  │█████████│    →    │█████░░░░│    →    │██░░░░░░░│
  └─────────┘         └─────────┘         └─────────┘

  [Compare v1 to v2]  [Compare v2 to v3]

────────────────────────────────────────────────────────────

BETWEEN v2 AND v3:

  ✓ RESOLVED (7 issues)
  • Logic hole on page 34 (phone after lost)
  • Passive protagonist in Sequence 4
  • Missing antagonist in midpoint
  ...

  ⚠ NEW (3 issues)
  • Scene 42 dialogue now feels rushed
  • New character introduced but underutilized
  • Pacing in Act 3 now front-loaded

  → NET IMPROVEMENT: +7 points
```

The user can see their progress as a **journey**, not just isolated snapshots. This is motivating—they can see they're getting better. And when new issues appear, they're contextualized as tradeoffs, not failures.

**Executive:** This is great for morale. Writers need to see they're making progress.

---

## SYNTHESIS: THE UX PRINCIPLES

*[Designer summarizing]*

Based on our conversation, here are the core UX principles I'd propose:

### 1. TWO MODES, ONE TOOL

- **Diagnosis Mode:** The AI leads, structured triage, gated levels
- **Development Mode:** The user leads, freeform chat, creative exploration
- User can switch freely; neither is mandatory

### 2. UNIFIED VOICE, MULTIPLE LENSES

- One integrated AI partner, not seven separate agents
- Agent expertise synthesized into cohesive feedback
- Specialists invokable on demand, not required

### 3. CRITICISM AS INVITATION

- Lead with strengths before issues
- Every issue has an actionable path forward
- Tone is "colleague," not "judge"

### 4. ABSTRACT MADE VISIBLE

- Theme as constellation map
- Arc as journey visualization
- Emotion as waveform
- Complex concepts become interactive diagrams

### 5. PROGRESSIVE DISCLOSURE

- Surface level is simple and scannable
- Depth available on expansion
- User controls how deep they go

### 6. PROGRESS AS JOURNEY

- Version comparison built in
- Show what's resolved, what's new
- Celebrate improvement

### 7. GUIDANCE WITHOUT GATES

- Triage informs, doesn't block
- Recommendations, not restrictions
- Trust the writer to prioritize

---

## NEXT STEPS

**Executive:** This is exactly what I needed. You've solved the core tension—structure vs. freedom—by making them two modes. And the "one voice, multiple lenses" approach simplifies everything.

**Designer:** I'd want to prototype a few key screens:

1. The Mode Selection screen
2. The Unified Analysis view (with expandable agent details)
3. The Theme Constellation visualization
4. The Character Journey Map
5. The Emotional Waveform
6. The Writers' Room chat (with unified voice + specialist invocation)
7. The Draft Journey comparison view

Once those are validated, we can build out the full system.

**Executive:** One last question—what's the single most important thing to get right?

**Designer:** The **first five minutes**.

When a writer uploads their screenplay—their baby, months of work, their vulnerable creative soul—what happens in the next five minutes determines if they'll ever come back.

If they see a wall of red errors, they'll feel attacked and leave.

If they see a thoughtful, balanced assessment that acknowledges what's working AND invites them to explore what could be better—with clear paths forward—they'll feel like they've found a partner.

That first analysis screen, that first report, that first moment of feedback: that's where we earn trust or lose it forever.

Get that right, and everything else follows.

---

*End of Design Review Session*
