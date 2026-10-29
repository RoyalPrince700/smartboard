import { create } from 'zustand';
import {
  AIContext,
  AIInteraction,
  EducationLevel,
  ExplanationResponse,
  SubjectId,
} from '../types/ai';
import { GraphSpec, SolveResponse } from '../types/math';
import { DiagramAnalysis, DiagramSpec, OpenCVDebugSnapshot } from '../types/geometry';
import { TutorAgentResponse } from '../types/agent';

export type SpeechVoiceStyle = 'female' | 'male';

interface AIState {
  panelOpen: boolean;
  railCollapsed: boolean;
  inputText: string;
  educationLevel: EducationLevel;
  selectedSubject: SubjectId;
  loading: boolean;
  error: string | null;
  provider: string | null;
  currentResponse: ExplanationResponse | null;
  currentSolution: SolveResponse | null;
  currentGraph: GraphSpec | null;
  showGraph: boolean;
  currentDiagram: DiagramSpec | null;
  showDiagram: boolean;
  diagramAnalysis: DiagramAnalysis | null;
  recognizedText: string | null;
  /** Live voice-dictation draft (not yet committed to the canvas). */
  voiceDraftText: string;
  boardLessonOpen: boolean;
  boardLessonKey: number;
  boardTopCollapsed: boolean;
  focusMode: boolean;
  narrationFocus: {
    kind: 'question' | 'step' | 'answer' | 'response';
    step?: number;
    equation?: number;
    token?: number;
  } | null;
  autoSpeak: boolean;
  speechRate: number;
  speechVoiceStyle: SpeechVoiceStyle;
  activeDemoSampleId: string | null;
  agentEnabled: boolean;
  agentSessionId: string | null;
  agentResponse: TutorAgentResponse | null;
  agentProblemEquation: string | null;
  geometryDebug: OpenCVDebugSnapshot | null;
  history: AIInteraction[];

  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setRailCollapsed: (collapsed: boolean) => void;
  toggleRail: () => void;
  setInputText: (text: string) => void;
  setEducationLevel: (level: EducationLevel) => void;
  setSelectedSubject: (subject: SubjectId) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProvider: (provider: string) => void;
  setCurrentResponse: (response: ExplanationResponse | null) => void;
  setCurrentSolution: (solution: SolveResponse | null) => void;
  setCurrentGraph: (graph: GraphSpec | null) => void;
  setShowGraph: (show: boolean) => void;
  setCurrentDiagram: (diagram: DiagramSpec | null) => void;
  setShowDiagram: (show: boolean) => void;
  setDiagramAnalysis: (analysis: DiagramAnalysis | null) => void;
  setRecognizedText: (text: string | null) => void;
  setVoiceDraftText: (text: string) => void;
  setBoardLessonOpen: (open: boolean) => void;
  setBoardTopCollapsed: (collapsed: boolean) => void;
  toggleBoardTopCollapsed: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
  setNarrationFocus: (focus: AIState['narrationFocus']) => void;
  setAutoSpeak: (enabled: boolean) => void;
  toggleAutoSpeak: () => void;
  setSpeechRate: (rate: number) => void;
  setSpeechVoiceStyle: (style: SpeechVoiceStyle) => void;
  setActiveDemoSampleId: (id: string | null) => void;
  setAgentEnabled: (enabled: boolean) => void;
  setAgentSessionId: (sessionId: string | null) => void;
  setAgentResponse: (response: TutorAgentResponse | null) => void;
  setAgentProblemEquation: (equation: string | null) => void;
  setGeometryDebug: (debug: OpenCVDebugSnapshot | null) => void;
  clearAgentResults: () => void;
  addInteraction: (interaction: AIInteraction) => void;
  loadHistory: (entries: AIInteraction[]) => void;
  getContext: () => AIContext;
  clearError: () => void;
  beginTutorSession: () => void;
  clearMathResults: () => void;
  clearDiagramResults: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  panelOpen: true,
  railCollapsed: false,
  inputText: '',
  educationLevel: 'general',
  selectedSubject: 'general',
  loading: false,
  error: null,
  provider: null,
  currentResponse: null,
  currentSolution: null,
  currentGraph: null,
  showGraph: false,
  currentDiagram: null,
  showDiagram: false,
  diagramAnalysis: null,
  recognizedText: null,
  voiceDraftText: '',
  boardLessonOpen: false,
  boardLessonKey: 0,
  boardTopCollapsed: false,
  focusMode: false,
  narrationFocus: null,
  autoSpeak: false,
  speechRate: 1,
  speechVoiceStyle: 'female',
  activeDemoSampleId: null,
  agentEnabled: import.meta.env.VITE_USE_AGENT === 'true',
  agentSessionId: null,
  agentResponse: null,
  agentProblemEquation: null,
  geometryDebug: null,
  history: [],

  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setRailCollapsed: (collapsed) => set({ railCollapsed: collapsed }),
  toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
  setInputText: (text) => set({ inputText: text }),
  setEducationLevel: (level) => set({ educationLevel: level }),
  setSelectedSubject: (subject) => set({ selectedSubject: subject }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProvider: (provider) => set({ provider }),
  setCurrentResponse: (response) => set({ currentResponse: response, currentSolution: null }),
  setCurrentSolution: (solution) => set({ currentSolution: solution, currentResponse: null }),
  setCurrentGraph: (graph) => set({ currentGraph: graph }),
  setShowGraph: (show) => set({ showGraph: show }),
  setCurrentDiagram: (diagram) => set({ currentDiagram: diagram }),
  setShowDiagram: (show) => set({ showDiagram: show }),
  setDiagramAnalysis: (analysis) => set({ diagramAnalysis: analysis }),
  setRecognizedText: (text) => set({ recognizedText: text }),
  setVoiceDraftText: (voiceDraftText) => set({ voiceDraftText }),
  setBoardLessonOpen: (open) =>
    set((s) => ({
      boardLessonOpen: open,
      boardLessonKey: open ? s.boardLessonKey + 1 : s.boardLessonKey,
      railCollapsed: open ? true : s.railCollapsed,
      boardTopCollapsed: open && !s.focusMode ? false : s.boardTopCollapsed,
      narrationFocus: open ? s.narrationFocus : null,
    })),
  setBoardTopCollapsed: (boardTopCollapsed) => set({ boardTopCollapsed }),
  toggleBoardTopCollapsed: () => set((s) => ({ boardTopCollapsed: !s.boardTopCollapsed })),
  setFocusMode: (focusMode) =>
    set((s) => ({
      focusMode,
      boardTopCollapsed: focusMode ? true : s.boardTopCollapsed,
    })),
  toggleFocusMode: () =>
    set((s) => {
      const focusMode = !s.focusMode;
      return {
        focusMode,
        boardTopCollapsed: focusMode ? true : s.boardTopCollapsed,
      };
    }),
  setNarrationFocus: (narrationFocus) => set({ narrationFocus }),
  setAutoSpeak: (enabled) => set({ autoSpeak: enabled }),
  toggleAutoSpeak: () => set((s) => ({ autoSpeak: !s.autoSpeak })),
  setSpeechRate: (speechRate) => set({ speechRate }),
  setSpeechVoiceStyle: (speechVoiceStyle) => set({ speechVoiceStyle }),
  setActiveDemoSampleId: (activeDemoSampleId) => set({ activeDemoSampleId }),
  setAgentEnabled: (agentEnabled) => set({ agentEnabled }),
  setAgentSessionId: (agentSessionId) => set({ agentSessionId }),
  setAgentResponse: (agentResponse) =>
    set({
      agentResponse,
      currentResponse: null,
      diagramAnalysis: null,
    }),
  setAgentProblemEquation: (agentProblemEquation) => set({ agentProblemEquation }),
  setGeometryDebug: (geometryDebug) => set({ geometryDebug }),
  clearAgentResults: () =>
    set({ agentSessionId: null, agentResponse: null, agentProblemEquation: null, geometryDebug: null }),
  addInteraction: (interaction) =>
    set((s) => ({ history: [interaction, ...s.history].slice(0, 20) })),
  loadHistory: (entries) => set({ history: entries }),
  getContext: () => ({
    educationLevel: get().educationLevel,
    subject: get().selectedSubject !== 'general' ? get().selectedSubject : undefined,
  }),
  clearError: () => set({ error: null }),
  beginTutorSession: () =>
    set((s) => ({
      error: null,
      loading: true,
      panelOpen: true,
      boardLessonOpen: true,
      boardLessonKey: s.boardLessonOpen ? s.boardLessonKey : s.boardLessonKey + 1,
      railCollapsed: true,
      boardTopCollapsed: s.focusMode ? true : false,
      narrationFocus: s.boardLessonOpen ? s.narrationFocus : null,
    })),
  clearMathResults: () =>
    set({ currentSolution: null, currentGraph: null, showGraph: false, boardLessonOpen: false }),
  clearDiagramResults: () =>
    set({ currentDiagram: null, showDiagram: false, diagramAnalysis: null }),
}));
