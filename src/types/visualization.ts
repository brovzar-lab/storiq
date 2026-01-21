// Theme Constellation Types

export type ThemeNodeType = "core" | "sub-theme" | "scene" | "character";

export interface ThemeNode {
  id: string;
  type: ThemeNodeType;
  label: string;
  // For scenes: which sequence they belong to
  sequenceId?: string;
  // For scenes: human-readable sequence name
  sequenceName?: string;
  // For characters: how many scenes they appear in
  weight?: number;
  // Connection strength (0-1) for positioning
  thematicStrength?: number;
  // Is this node connected to the theme?
  isConnected: boolean;
}

export interface ThemeLink {
  source: string;
  target: string;
  // How strong is this thematic connection
  strength: number;
  // What type of connection
  type: "primary" | "secondary" | "weak";
}

export interface ThemeConstellation {
  // The core theme
  coreTheme: string;
  // Sub-themes
  subThemes: string[];
  // All nodes in the constellation
  nodes: ThemeNode[];
  // All connections
  links: ThemeLink[];
}

// Character Journey Map Types

export type ArcPosition = "want" | "crisis" | "need" | "resolved";
export type LieStatus = "believing" | "cracking" | "crisis" | "truth";

export interface ArcPoint {
  sequenceId: string;
  sequenceName: string;
  pageRange: string;
  position: ArcPosition;
  lieStatus: LieStatus;
  description: string;
}

export interface CharacterArc {
  characterName: string;
  want: string;
  need: string;
  lie: string;
  truth: string;
  crisisPoint?: {
    page: number;
    description: string;
  };
  arcPoints: ArcPoint[];
}

// Emotional Journey Types

export type EmotionType =
  | "tension"
  | "fear"
  | "joy"
  | "triumph"
  | "sadness"
  | "anger"
  | "hope"
  | "dread"
  | "relief"
  | "surprise";

export interface EmotionalBeat {
  sceneNumber: number;
  page: number;
  emotion: EmotionType;
  intensity: number; // 0-100
  description: string;
}

export interface PlotPoint {
  type: "inciting-incident" | "midpoint" | "climax" | "resolution" | "plot-point-1" | "plot-point-2";
  page: number;
  label: string;
  emotion?: EmotionType;
}

export interface EmotionalJourney {
  beats: EmotionalBeat[];
  plotPoints: PlotPoint[];
  overallArc: "ascending" | "descending" | "wave" | "flat";
}

// Draft Comparison Types

export interface DraftVersion {
  id: string;
  uploadedAt: string;
  title: string;
  score: number;
  issueCount: number;
}

export interface IssueChange {
  id: string;
  description: string;
  category: "structure" | "character" | "craft" | "logic" | "genre";
  status: "resolved" | "new" | "unchanged";
}

export interface DraftComparison {
  fromVersion: DraftVersion;
  toVersion: DraftVersion;
  resolvedIssues: IssueChange[];
  newIssues: IssueChange[];
  netChange: number;
}
