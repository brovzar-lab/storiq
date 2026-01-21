// Core screenplay data types

// Scene annotation for AI-powered sequence detection
export interface SceneAnnotation {
  protagonistGoal?: string;
  sceneQuestion?: string;
  valueCharge?: "positive" | "negative" | "neutral";
  irreversibleEvent?: { happened: boolean; description?: string };
  tensionLevel?: number; // 1-10
  sceneMode?: "ACTION" | "DIALOGUE" | "EXPOSITION" | "MONTAGE" | "TRANSITION";
  timeContinuity?: boolean; // true if flows directly from previous scene
  locationContinuity?: boolean; // true if same setting as previous scene
}

export interface Scene {
  sceneNumber: number;
  heading: string;
  pageStart: number;
  pageEnd: number;
  content: string;
  characters: string[];
  locationType: "INT" | "EXT" | "INT/EXT" | "UNKNOWN";
  timeOfDay?: string;
  annotation?: SceneAnnotation; // AI-generated annotation for sequence detection
}

export interface Character {
  name: string;
  sceneAppearances: number[];
  dialogueCount: number;
  firstAppearance: number;
}

// Five Commandments from Story Grid methodology
export interface FiveCommandments {
  incitingIncident?: string;
  progressiveComplications?: string;
  crisis?: string;
  climax?: string;
  resolution?: string;
}

export interface Sequence {
  id: string;
  name: string;
  sceneNumbers: number[];
  pageStart: number;
  pageEnd: number;
  characters: string[];
  // AI-enhanced fields
  dramaticQuestion?: string;
  confidenceScore?: number; // 0-14 based on boundary detection confidence
  suggestedName?: string; // AI-generated descriptive name
  boundaryJustification?: string[]; // Why this boundary was chosen
  fiveCommandments?: FiveCommandments;
}

export interface ParsedScreenplay {
  id: string;
  title: string;
  uploadedAt: Date;
  filename: string;
  totalPages: number;
  scenes: Scene[];
  characters: Character[];
  rawText: string;
}

export interface ScreenplayState {
  screenplay: ParsedScreenplay | null;
  sequences: Sequence[];
  sequencesConfirmed: boolean;
}

// Genre types
export type GenreId =
  | "cosmic-horror"
  | "psychological-thriller"
  | "screwball-comedy"
  | "romantic-comedy"
  | "action-adventure"
  | "film-noir"
  | "science-fiction"
  | "drama"
  | "slasher-horror"
  | "mystery-whodunit";

export interface GenreSelection {
  id: GenreId;
  name: string;
  confirmed: boolean;
}

// Soul/Theme types
export interface Soul {
  centralQuestion: string;
  thematicArgument: string;
  controllingIdea: string;
  protagonistLie: string;
  protagonistTruth: string;
  confirmed: boolean;
}

// App state
export interface AppState {
  // Step tracking
  currentStep:
    | "upload"
    | "sequences"
    | "genre"
    | "soul"
    | "analysis"
    | "writers-room";

  // Screenplay data
  screenplay: ParsedScreenplay | null;
  sequences: Sequence[];
  sequencesConfirmed: boolean;

  // Genre and theme
  genre: GenreSelection | null;
  soul: Soul | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}
