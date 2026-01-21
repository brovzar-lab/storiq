import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  ParsedScreenplay,
  Sequence,
  GenreSelection,
  Soul,
} from "@/types/screenplay";

interface AppActions {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Screenplay actions
  setScreenplay: (screenplay: ParsedScreenplay) => void;
  clearScreenplay: () => void;

  // Sequence actions
  setSequences: (sequences: Sequence[]) => void;
  updateSequence: (id: string, updates: Partial<Sequence>) => void;
  confirmSequences: () => void;

  // Genre actions
  setGenre: (genre: GenreSelection) => void;
  confirmGenre: () => void;

  // Soul actions
  setSoul: (soul: Soul) => void;
  updateSoul: (updates: Partial<Soul>) => void;
  confirmSoul: () => void;

  // Navigation
  setCurrentStep: (step: AppState["currentStep"]) => void;

  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState: AppState = {
  currentStep: "upload",
  screenplay: null,
  sequences: [],
  sequencesConfirmed: false,
  genre: null,
  soul: null,
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Screenplay actions
      setScreenplay: (screenplay) =>
        set({
          screenplay,
          // CRITICAL: Clear all dependent data when a new screenplay is uploaded
          // This prevents stale data from a previous screenplay from being reused
          sequences: [],
          sequencesConfirmed: false,
          genre: null,
          soul: null,
          currentStep: "sequences",
          error: null,
        }),

      clearScreenplay: () =>
        set({
          screenplay: null,
          sequences: [],
          sequencesConfirmed: false,
          genre: null,
          soul: null,
          currentStep: "upload",
        }),

      // Sequence actions
      setSequences: (sequences) => set({ sequences }),

      updateSequence: (id, updates) =>
        set((state) => ({
          sequences: state.sequences.map((seq) =>
            seq.id === id ? { ...seq, ...updates } : seq
          ),
        })),

      confirmSequences: () =>
        set({
          sequencesConfirmed: true,
          currentStep: "genre",
        }),

      // Genre actions
      setGenre: (genre) => set({ genre }),

      confirmGenre: () =>
        set((state) => ({
          genre: state.genre ? { ...state.genre, confirmed: true } : null,
          currentStep: "soul",
        })),

      // Soul actions
      setSoul: (soul) => set({ soul }),

      updateSoul: (updates) =>
        set((state) => ({
          soul: state.soul ? { ...state.soul, ...updates } : null,
        })),

      confirmSoul: () =>
        set((state) => ({
          soul: state.soul ? { ...state.soul, confirmed: true } : null,
          currentStep: "analysis",
        })),

      // Navigation
      setCurrentStep: (currentStep) => set({ currentStep }),

      // UI state
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "storiq-storage",
      partialize: (state) => ({
        screenplay: state.screenplay,
        sequences: state.sequences,
        sequencesConfirmed: state.sequencesConfirmed,
        genre: state.genre,
        soul: state.soul,
        currentStep: state.currentStep,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
