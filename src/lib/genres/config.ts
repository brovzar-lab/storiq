import type { GenreId } from "@/types/screenplay";

export interface GenreConfig {
  id: GenreId;
  name: string;
  tagline: string;

  // What this genre prioritizes
  priorities: string[];

  // Expected story beats with typical page ranges
  keyBeats: {
    name: string;
    description: string;
    typicalPageRange: [number, number];
  }[];

  // Common mistakes to flag
  redFlags: string[];

  // Pacing expectations
  paceProfile: "building" | "relentless" | "rhythmic" | "slow-burn";

  // Tone and dialogue guidelines
  toneGuidelines: string;

  // What makes antagonists work in this genre
  antagonistNotes: string;

  // Audience emotional expectations
  emotionalJourney: string;
}

export const GENRE_CONFIGS: Record<GenreId, GenreConfig> = {
  "cosmic-horror": {
    id: "cosmic-horror",
    name: "Cosmic Horror",
    tagline: "Dread. The unknowable. Human insignificance.",
    priorities: [
      "atmosphere and dread over jump scares",
      "the unknown remaining unknowable",
      "human insignificance in the face of cosmic entities",
      "sanity as a fragile construct",
      "isolation and paranoia",
    ],
    keyBeats: [
      {
        name: "Normalcy with undercurrents",
        description: "Establish the mundane world with hints something is wrong",
        typicalPageRange: [1, 12],
      },
      {
        name: "First contact with the unknowable",
        description: "Protagonist encounters something that defies explanation",
        typicalPageRange: [15, 25],
      },
      {
        name: "Investigation deepens the mystery",
        description: "Seeking answers only reveals how little can be understood",
        typicalPageRange: [30, 50],
      },
      {
        name: "Reality fractures",
        description: "The line between real and unreal begins to blur",
        typicalPageRange: [55, 75],
      },
      {
        name: "Confrontation with insignificance",
        description: "Full revelation of how small humanity is",
        typicalPageRange: [80, 100],
      },
      {
        name: "Ambiguous resolution",
        description: "Survival at the cost of sanity, or acceptance of the void",
        typicalPageRange: [100, 115],
      },
    ],
    redFlags: [
      "monster fully explained or understood",
      "happy ending without cost",
      "protagonist defeats cosmic entity through conventional means",
      "too many jump scares diluting dread",
      "mystery fully resolved",
    ],
    paceProfile: "slow-burn",
    toneGuidelines:
      "Dialogue should become increasingly fragmented as characters confront the unknowable. Academic or investigative tone that deteriorates. Characters should resist naming what they're experiencing.",
    antagonistNotes:
      "The antagonist is often abstract—a presence, an entity beyond comprehension. If there's a human antagonist, they should be a cultist or someone already touched by cosmic forces. The real threat is incomprehensible.",
    emotionalJourney:
      "Curiosity → Unease → Dread → Terror → Despair → Acceptance/Madness. The audience should feel increasingly claustrophobic and existentially threatened.",
  },

  "psychological-thriller": {
    id: "psychological-thriller",
    name: "Psychological Thriller",
    tagline: "Paranoia. Unreliable minds. Nothing is certain.",
    priorities: [
      "paranoia and unreliable narration",
      "audience uncertainty",
      "twist preparation and payoff",
      "psychological depth over action",
      "subtle misdirection",
    ],
    keyBeats: [
      {
        name: "False reality established",
        description: "Show the world as protagonist believes it to be",
        typicalPageRange: [1, 15],
      },
      {
        name: "First crack in reality",
        description: "Something doesn't add up, but could be coincidence",
        typicalPageRange: [20, 30],
      },
      {
        name: "Paranoia takes hold",
        description: "Protagonist begins to doubt themselves or others",
        typicalPageRange: [35, 50],
      },
      {
        name: "Protagonist doubts themselves",
        description: "The question shifts from 'what's happening' to 'am I reliable'",
        typicalPageRange: [45, 60],
      },
      {
        name: "False resolution",
        description: "An explanation that seems to fit but isn't quite right",
        typicalPageRange: [70, 80],
      },
      {
        name: "The reveal/twist",
        description: "True nature of reality is exposed",
        typicalPageRange: [85, 100],
      },
    ],
    redFlags: [
      "twist comes from nowhere without setup",
      "protagonist is too competent or trusting",
      "audience knows more than protagonist for too long",
      "psychological elements abandoned for action",
      "villain explains their plan unnecessarily",
    ],
    paceProfile: "building",
    toneGuidelines:
      "Dialogue should have multiple possible interpretations. Characters speak in half-truths. Internal monologue (if used) should be unreliable. Quiet moments are more tense than loud ones.",
    antagonistNotes:
      "Often internal or hidden. The best thrillers make us question if there even IS an antagonist until late. If human, the antagonist should be revealed to have been in plain sight.",
    emotionalJourney:
      "Curiosity → Suspicion → Paranoia → Self-doubt → Shock → Either catharsis or deeper unease. The audience should constantly question what they know.",
  },

  "screwball-comedy": {
    id: "screwball-comedy",
    name: "Screwball Comedy",
    tagline: "Rapid wit. Glorious chaos. Battle of equals.",
    priorities: [
      "dialogue velocity and wit",
      "escalating complications",
      "battle-of-equals dynamic",
      "physical comedy that serves character",
      "romantic tension through conflict",
    ],
    keyBeats: [
      {
        name: "Meet-cute with friction",
        description: "Protagonists meet in conflict, not attraction",
        typicalPageRange: [8, 15],
      },
      {
        name: "Forced proximity begins",
        description: "Circumstances force them together despite resistance",
        typicalPageRange: [20, 30],
      },
      {
        name: "First moment of connection",
        description: "Brief glimpse of compatibility beneath the sparring",
        typicalPageRange: [35, 45],
      },
      {
        name: "The big lie/deception peaks",
        description: "A misunderstanding or deception reaches maximum complication",
        typicalPageRange: [50, 65],
      },
      {
        name: "Public humiliation/revelation",
        description: "Everything comes out, usually in the worst possible way",
        typicalPageRange: [75, 90],
      },
      {
        name: "Grand gesture reconciliation",
        description: "One or both must prove they've changed",
        typicalPageRange: [95, 110],
      },
    ],
    redFlags: [
      "characters communicate honestly too early",
      "long dramatic pauses in dialogue",
      "mean-spirited humor at expense of characters",
      "one protagonist is clearly superior to the other",
      "jokes that don't advance character or plot",
    ],
    paceProfile: "relentless",
    toneGuidelines:
      "Dialogue should overlap and interrupt. Characters should be cleverer than real people. Physical comedy should reveal character. The humor should come from situation and character, not just jokes.",
    antagonistNotes:
      "Often there's no true antagonist—the protagonists are antagonists to each other. If present, the antagonist should be pompous, easily fooled, or a catalyst for bringing the leads together.",
    emotionalJourney:
      "Annoyance → Grudging respect → Attraction-in-denial → Jealousy → Despair → Joy. The audience should root for them to stop fighting and kiss.",
  },

  "romantic-comedy": {
    id: "romantic-comedy",
    name: "Romantic Comedy",
    tagline: "Meet-cute. Obstacles. The inevitable union.",
    priorities: [
      "likeable protagonists worth rooting for",
      "believable chemistry and attraction",
      "obstacles that test the relationship",
      "humor that emerges from character",
      "satisfying emotional payoff",
    ],
    keyBeats: [
      {
        name: "Protagonist's romantic status quo",
        description: "Show what's missing in their current romantic life",
        typicalPageRange: [1, 10],
      },
      {
        name: "The meet-cute",
        description: "Memorable first encounter that establishes chemistry",
        typicalPageRange: [10, 20],
      },
      {
        name: "Growing connection",
        description: "Dating or circumstances that reveal compatibility",
        typicalPageRange: [25, 45],
      },
      {
        name: "The complication",
        description: "An obstacle threatens the budding relationship",
        typicalPageRange: [45, 55],
      },
      {
        name: "The breakup/separation",
        description: "Leads are driven apart, often by misunderstanding",
        typicalPageRange: [65, 80],
      },
      {
        name: "The grand gesture",
        description: "One or both protagonists fight to reunite",
        typicalPageRange: [90, 105],
      },
    ],
    redFlags: [
      "leads have no chemistry in their scenes together",
      "obstacles feel manufactured rather than organic",
      "comedy and romance feel like separate movies",
      "one lead is significantly more developed than the other",
      "the 'flaw' they overcome is trivial",
    ],
    paceProfile: "rhythmic",
    toneGuidelines:
      "Balance wit and warmth. Dialogue should feel like the best version of real conversation. Vulnerability should be earned. The humor should make us like the characters more.",
    antagonistNotes:
      "Usually the obstacle is circumstantial or internal, not a villain. If there's a rival, they should be wrong for the protagonist rather than evil. The real antagonist is often the protagonist's own fear.",
    emotionalJourney:
      "Loneliness → Spark → Hope → Joy → Fear of loss → Despair → Relief and happiness. The audience should feel warm and hopeful.",
  },

  "action-adventure": {
    id: "action-adventure",
    name: "Action/Adventure",
    tagline: "Momentum. Set pieces. Clear stakes.",
    priorities: [
      "clear stakes and goals",
      "escalating action set pieces",
      "hero with admirable qualities",
      "momentum and forward motion",
      "spectacle that serves story",
    ],
    keyBeats: [
      {
        name: "Hero in their element",
        description: "Show competence and character through action",
        typicalPageRange: [1, 10],
      },
      {
        name: "The call to adventure",
        description: "A mission, quest, or threat that demands response",
        typicalPageRange: [12, 20],
      },
      {
        name: "First major action sequence",
        description: "Hero faces opposition, shows their skills",
        typicalPageRange: [25, 35],
      },
      {
        name: "Raising the stakes",
        description: "The threat becomes personal or the mission more urgent",
        typicalPageRange: [45, 55],
      },
      {
        name: "The darkest hour",
        description: "Hero fails, loses something important, all seems lost",
        typicalPageRange: [70, 80],
      },
      {
        name: "Final confrontation",
        description: "Biggest action sequence, hero must overcome",
        typicalPageRange: [90, 105],
      },
    ],
    redFlags: [
      "action scenes without stakes or consequences",
      "hero is never in real danger",
      "spectacle disconnected from story",
      "too much dialogue between action beats",
      "villain's plan is unclear",
    ],
    paceProfile: "relentless",
    toneGuidelines:
      "Dialogue should be punchy and efficient. Quips are welcome but shouldn't undercut genuine danger. Action should be readable on the page—visual and kinetic.",
    antagonistNotes:
      "The villain should be a genuine threat—competent, dangerous, and with a plan that makes sense to them. They should push the hero to their limits and have personal stakes in defeating them.",
    emotionalJourney:
      "Confidence → Determination → Struggle → Doubt → Resolve → Triumph. The audience should feel exhilarated and that good has prevailed.",
  },

  "film-noir": {
    id: "film-noir",
    name: "Film Noir",
    tagline: "Shadows. Moral ambiguity. Doomed from the start.",
    priorities: [
      "moral ambiguity and fatalism",
      "atmosphere and visual style",
      "flawed protagonist drawn into darkness",
      "femme fatale or homme fatal",
      "corruption and betrayal",
    ],
    keyBeats: [
      {
        name: "The setup",
        description: "Protagonist in their flawed but stable world",
        typicalPageRange: [1, 10],
      },
      {
        name: "The inciting temptation",
        description: "An offer, case, or encounter that promises something",
        typicalPageRange: [12, 20],
      },
      {
        name: "Descent begins",
        description: "Protagonist makes a choice that compromises them",
        typicalPageRange: [25, 35],
      },
      {
        name: "Deeper into the web",
        description: "Each attempt to escape makes things worse",
        typicalPageRange: [40, 60],
      },
      {
        name: "Betrayal revealed",
        description: "Someone the protagonist trusted is not what they seemed",
        typicalPageRange: [70, 80],
      },
      {
        name: "Tragic resolution",
        description: "Protagonist pays the price, justice may or may not be served",
        typicalPageRange: [90, 110],
      },
    ],
    redFlags: [
      "purely heroic protagonist",
      "happy ending without cost",
      "clear moral lines between good and evil",
      "action that feels modern rather than noir",
      "femme fatale without genuine menace",
    ],
    paceProfile: "slow-burn",
    toneGuidelines:
      "Dialogue should be hard-boiled—metaphor-heavy, world-weary, cynical. Narration (if used) should drip with irony. Everyone speaks in subtext.",
    antagonistNotes:
      "Often the antagonist is diffuse—corrupt systems, human nature, fate itself. The femme/homme fatal is traditionally antagonist-adjacent. The real enemy is the protagonist's own weakness.",
    emotionalJourney:
      "Cynical detachment → Desire → Hope → Suspicion → Despair → Resignation or doom. The audience should feel the inevitability of tragedy.",
  },

  "science-fiction": {
    id: "science-fiction",
    name: "Science Fiction",
    tagline: "Big ideas. Strange worlds. Human questions.",
    priorities: [
      "ideas that explore the human condition",
      "world-building that serves theme",
      "science as catalyst for drama",
      "speculation grounded in character",
      "asking 'what if' and following through",
    ],
    keyBeats: [
      {
        name: "The world introduced",
        description: "Establish what's different and what it means for people",
        typicalPageRange: [1, 15],
      },
      {
        name: "The premise in action",
        description: "Show how the sci-fi element affects daily life or creates conflict",
        typicalPageRange: [15, 25],
      },
      {
        name: "Stakes become clear",
        description: "The consequences of the technology/world become personal",
        typicalPageRange: [30, 45],
      },
      {
        name: "The idea challenged",
        description: "What seemed simple becomes morally complex",
        typicalPageRange: [50, 70],
      },
      {
        name: "Crisis point",
        description: "The implications of the sci-fi premise reach a head",
        typicalPageRange: [75, 90],
      },
      {
        name: "Resolution with resonance",
        description: "The ending reflects on what we learned about humanity",
        typicalPageRange: [95, 115],
      },
    ],
    redFlags: [
      "technology without thematic purpose",
      "world-building that overshadows character",
      "ideas never challenged or explored",
      "science that makes no internal sense",
      "forgetting the human story",
    ],
    paceProfile: "building",
    toneGuidelines:
      "Dialogue can be technical but should stay emotionally grounded. Exposition should be organic. The wonder of the concept should be palpable.",
    antagonistNotes:
      "The antagonist might be a person, but often it's a system, a technology, or the unintended consequences of progress. The best sci-fi antagonists embody the dark side of the premise.",
    emotionalJourney:
      "Wonder → Curiosity → Unease → Moral conflict → Resolution or ambiguity. The audience should be thinking about the ideas long after.",
  },

  drama: {
    id: "drama",
    name: "Drama",
    tagline: "Truth. Relationships. The weight of choices.",
    priorities: [
      "emotional truth and authenticity",
      "complex, believable relationships",
      "character transformation through conflict",
      "stakes that feel real and personal",
      "subtext and nuance",
    ],
    keyBeats: [
      {
        name: "Status quo with tension",
        description: "Establish the character's world and what's simmering beneath",
        typicalPageRange: [1, 15],
      },
      {
        name: "The catalyst",
        description: "An event that forces change or confrontation",
        typicalPageRange: [15, 25],
      },
      {
        name: "Resistance and denial",
        description: "Character tries to maintain old patterns",
        typicalPageRange: [30, 45],
      },
      {
        name: "Forced to change",
        description: "Circumstances make the old way impossible",
        typicalPageRange: [50, 70],
      },
      {
        name: "Dark night of the soul",
        description: "Character must confront their deepest fears or flaws",
        typicalPageRange: [75, 90],
      },
      {
        name: "Transformation or tragedy",
        description: "Character emerges changed, or fails to",
        typicalPageRange: [95, 115],
      },
    ],
    redFlags: [
      "conflict that feels manufactured for drama",
      "characters acting against their established nature",
      "melodrama without earned emotion",
      "resolution that doesn't arise from character",
      "too on-the-nose dialogue about feelings",
    ],
    paceProfile: "rhythmic",
    toneGuidelines:
      "Dialogue should sound like how these specific people would talk. Silences matter. Physical behavior reveals as much as words. Avoid stating themes directly.",
    antagonistNotes:
      "Often there is no villain—just characters with conflicting needs. If there is an antagonist, they should be understandable, even sympathetic. The real conflict is often internal.",
    emotionalJourney:
      "Tension → Recognition → Struggle → Catharsis or tragedy. The audience should feel they've witnessed something true about human experience.",
  },

  "slasher-horror": {
    id: "slasher-horror",
    name: "Slasher Horror",
    tagline: "Tension. Release. Who survives?",
    priorities: [
      "building and releasing tension",
      "creative and satisfying kills",
      "clear rules for survival",
      "final girl/survivor character arc",
      "killer with iconic presence",
    ],
    keyBeats: [
      {
        name: "The cold open kill",
        description: "Establish the killer and the threat",
        typicalPageRange: [1, 8],
      },
      {
        name: "Meet the victims",
        description: "Introduce the group with distinct personalities",
        typicalPageRange: [10, 25],
      },
      {
        name: "Isolation begins",
        description: "Characters are cut off from help",
        typicalPageRange: [25, 35],
      },
      {
        name: "First act kills",
        description: "Characters start dying, stakes become real",
        typicalPageRange: [35, 50],
      },
      {
        name: "The winnowing",
        description: "Group shrinks, final girl emerges",
        typicalPageRange: [55, 75],
      },
      {
        name: "Final confrontation",
        description: "Survivor vs. killer, climactic battle",
        typicalPageRange: [80, 100],
      },
      {
        name: "The twist/stinger",
        description: "Resolution with a final scare or sequel hook",
        typicalPageRange: [100, 110],
      },
    ],
    redFlags: [
      "victims are interchangeable",
      "kills are repetitive or boring",
      "killer's motivation is nonsensical",
      "final survivor hasn't earned it",
      "too much time between scares",
    ],
    paceProfile: "rhythmic",
    toneGuidelines:
      "Dialogue can be quippy but characters should feel real enough to mourn. Build tension before each kill. The killer should be felt even when not seen.",
    antagonistNotes:
      "The killer should be iconic—visually distinctive and with clear 'rules.' Their unstoppability should feel earned. Even masked killers need consistent behavior.",
    emotionalJourney:
      "Unease → Fear → Terror → Grief → Survival instinct → Relief or dread. The audience should feel wrung out.",
  },

  "mystery-whodunit": {
    id: "mystery-whodunit",
    name: "Mystery/Whodunit",
    tagline: "Clues. Misdirection. The satisfying reveal.",
    priorities: [
      "fair play with clues",
      "multiple viable suspects",
      "detective with distinctive method",
      "misdirection that plays fair",
      "satisfying revelation",
    ],
    keyBeats: [
      {
        name: "The crime",
        description: "Murder or mystery presented",
        typicalPageRange: [1, 10],
      },
      {
        name: "Detective takes the case",
        description: "Protagonist commits to solving the mystery",
        typicalPageRange: [10, 20],
      },
      {
        name: "Initial investigation",
        description: "Gathering clues, meeting suspects",
        typicalPageRange: [20, 40],
      },
      {
        name: "False lead pursued",
        description: "An explanation that seems to fit but isn't right",
        typicalPageRange: [45, 60],
      },
      {
        name: "The complication",
        description: "Another crime or revelation changes everything",
        typicalPageRange: [60, 75],
      },
      {
        name: "The penny drops",
        description: "Detective sees the truth",
        typicalPageRange: [80, 90],
      },
      {
        name: "The reveal",
        description: "Solution explained, culprit confronted",
        typicalPageRange: [95, 110],
      },
    ],
    redFlags: [
      "solution relies on information withheld from audience",
      "clues planted too obviously",
      "only one viable suspect",
      "detective leaps to conclusions without evidence",
      "killer's motive doesn't track",
    ],
    paceProfile: "building",
    toneGuidelines:
      "Dialogue should contain subtext—everyone has something to hide. The detective's reasoning should be followable. Wit is welcome but shouldn't undercut danger.",
    antagonistNotes:
      "The killer must be someone we've met, with a motive that makes sense. The best mysteries make you rethink every interaction once you know the truth. The killer should seem innocent.",
    emotionalJourney:
      "Curiosity → Engagement → Confusion → Suspicion → Revelation → Satisfaction. The audience should feel clever when they spot clues.",
  },
};

/**
 * Get the full configuration for a genre
 */
export function getGenreConfig(genreId: GenreId): GenreConfig {
  return GENRE_CONFIGS[genreId];
}

/**
 * Get the priorities for a genre
 */
export function getGenrePriorities(genreId: GenreId): string[] {
  return GENRE_CONFIGS[genreId].priorities;
}

/**
 * Build a system prompt with genre context for any agent
 */
export function buildGenreSystemPrompt(
  genreId: GenreId,
  agentType: "structure" | "character" | "dialogue" | "general"
): string {
  const config = GENRE_CONFIGS[genreId];

  let contextSection = "";

  switch (agentType) {
    case "structure":
      contextSection = `
Key beats to look for in ${config.name}:
${config.keyBeats.map((b) => `- ${b.name} (pages ${b.typicalPageRange[0]}-${b.typicalPageRange[1]}): ${b.description}`).join("\n")}

Pacing profile: ${config.paceProfile}
`;
      break;

    case "character":
      contextSection = `
Antagonist expectations: ${config.antagonistNotes}

Emotional journey for audience: ${config.emotionalJourney}
`;
      break;

    case "dialogue":
      contextSection = `
Tone and dialogue guidelines: ${config.toneGuidelines}
`;
      break;

    default:
      contextSection = "";
  }

  return `You are analyzing a ${config.name} screenplay.

This genre prioritizes:
${config.priorities.map((p) => `- ${p}`).join("\n")}

Red flags for this genre:
${config.redFlags.map((r) => `- ${r}`).join("\n")}
${contextSection}
Keep this genre context in mind for all analysis.`;
}
