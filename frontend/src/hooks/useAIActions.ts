import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  analyzeDiagram,
  explainText,
  fetchAIStatus,
  interpretBoard,
  recognizeStrokes,
  solveMath,
  visualizeMath,
} from '../services/api/aiApi';
import { useVoiceOutput } from './useVoiceOutput';
import { useAIStore } from '../stores/aiStore';
import { useBoardStore } from '../stores/boardStore';
import { VisualizeResponseExtended, type DiagramSpec } from '../types/geometry';
import type { TutorActionId } from '../components/tutor/TutorActionBar';
import { getRecognizableStrokes, extractTextFromStrokes, strokesToBase64 } from '../utils/strokeImageExport';
import {
  buildLessonStrokeGroups,
  formatMathSolutionGroups,
  formatTeachingGroups,
} from '../utils/boardExplanationWriter';
import { writeLessonOnBoard } from '../utils/boardLessonWriter';
import { formatMathForSpeech } from '../utils/speechText';
import { splitStepContent, tokenizeEquation } from '../utils/mathPresentation';
import { getDemoSampleById } from '../data/demoQuadraticSamples';
import { fetchAgentStatus, sendAgentMessage } from '../services/api/agentApi';
import { hasPenHandwriting, recognizeGeometryLabels, recognizeGeometryLabelsPerStroke, recognizeMathFromStrokes } from '../services/ocr/localMathOcr';
import {
  applySceneAnnotations,
  labelRecognitionsFromStrokes,
} from '../engine/geometry/sceneAnnotations';
import { blocksToSpeechText } from '../components/agent/AgentBlockRenderer';
import {
  agentResponseToSolveResponse,
  enrichSolutionWithAgentBlocks,
} from '../utils/agentToSolutionAdapter';
import { classifyEquationInput, isClearEquationInput, looksLikeProbability } from '../utils/equationClassifier';
import {
  mapEducationToAgentDifficulty,
  isAgentFeatureEnabled,
  shouldRouteToAgent,
  tutorActionToAgentMessage,
  looksLikeGeometry,
  looksLikeTrigonometry,
} from '../utils/agentRouting';
import { captureBoardGeometry, captureBoardGeometryAsync, buildGeometryProblemText, buildTrigonometryProblemText, isTrigonometryDiagram, isGeneratedBoardPrompt } from '../utils/boardGeometryCapture';
import { isGeometryDebugEnabled } from '../engine/geometry/geometryRecognitionService';
import { identifyBoardContent } from '../utils/boardContentIdentifier';
import { GEOMETRY_RECOGNITION_ENABLED } from '../config/geometryRecognition';
import { generateDiagramFromScene } from '../engine/diagram/sceneDiagram';
import { generateCanonicalGeometryDiagramFromText } from '../engine/diagram/canonicalGeometry';
import {
  isCompleteEquation,
  parseVoiceCommand,
  pickBestEquation,
  sanitizeEquationInput,
  isIncompleteArithmeticEquation,
  formatSolvedArithmeticDisplay,
} from '../utils/voiceMathParser';
import {
  appendVoiceDraftTokens,
  clearDumpedLessonFromBoard,
  clearVoiceEquation,
  commitVoiceEquationToBoard,
  getVoiceEquationText,
  replaceVoiceDraft,
  resetVoiceEquationSession,
  undoVoiceDraft,
} from '../utils/voiceEquationBoard';

function looksLikeMath(input: string): boolean {
  const classification = classifyEquationInput(input);
  if (classification.topic) return true;
  const text = input.toLowerCase();
  return looksLikeProbability(input)
    || /[=^²]|(solve|graph|plot|equation|x\^|x²|quadratic|linear|exponential|simultaneous|absolute|arithmetic|probability|trigonometry|sine|cosine|tangent|\bsin\b|\bcos\b|\btan\b)|y\s*=/.test(text)
    || /\|[^|]+\|/.test(input)
    || /(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(input);
}

function looksLikeVisualize(input: string): boolean {
  const text = input.toLowerCase();
  return /(visuali[sz]e|diagram|draw|show me|water cycle|photosynthesis|food chain|atom|cell structure|coordinate plane|number line)/.test(
    text
  );
}

function shouldReadBoard(typed: string, hasBoard: boolean): boolean {
  if (!hasBoard) return false;
  if (!typed.trim()) return true;
  if (isGeneratedBoardPrompt(typed)) return true;
  if (looksLikeGeometry(typed) || looksLikeTrigonometry(typed)) return true;
  return looksLikeMath(typed);
}

export function useAIActions() {
  const boardId = useBoardStore((s) => s.boardId);
  const strokes = useBoardStore((s) => s.strokes);
  const canvasSettings = useBoardStore((s) => s.canvasSettings);

  const {
    inputText,
    setLoading,
    setError,
    setCurrentResponse,
    setCurrentSolution,
    setCurrentGraph,
    setShowGraph,
    setCurrentDiagram,
    setShowDiagram,
    setDiagramAnalysis,
    setRecognizedText,
    setVoiceDraftText,
    setInputText,
    setPanelOpen,
    addInteraction,
    getContext,
    clearError,
    beginTutorSession,
    setProvider,
    setBoardLessonOpen,
    setNarrationFocus,
    setActiveDemoSampleId,
    setAgentEnabled,
    setAgentSessionId,
    setAgentResponse,
    setAgentProblemEquation,
    setGeometryDebug,
    agentSessionId,
    agentEnabled,
  } = useAIStore();

  const autoSpeak = useAIStore((s) => s.autoSpeak);
  const speechRate = useAIStore((s) => s.speechRate);
  const {
    speak,
    speakSequence,
    stopSpeaking: stopVoiceOutput,
    isSpeaking,
    supported: voiceOutputSupported,
  } = useVoiceOutput();

  const maybeSpeak = useCallback(
    (text?: string | null) => {
      if (autoSpeak && text?.trim()) {
        speak(text, { rate: speechRate });
      }
    },
    [autoSpeak, speak, speechRate]
  );

  const stopSpeaking = useCallback(() => {
    stopVoiceOutput();
    setNarrationFocus(null);
  }, [setNarrationFocus, stopVoiceOutput]);

  const pendingBoardDiagramRef = useRef<DiagramSpec | null>(null);

  const speakMathSolution = useCallback(
    (solution: NonNullable<ReturnType<typeof useAIStore.getState>['currentSolution']>) => {
      const question = solution.recognizedInput || solution.equation || solution.normalizedInput;
      const stepSegments = solution.steps.flatMap((step) => {
        const { explanation, equations } = splitStepContent(step.content);
        return [
          {
            text: `Step ${step.step}. ${step.title}. ${explanation ?? ''}`,
            onStart: () => setNarrationFocus({ kind: 'step' as const, step: step.step }),
          },
          ...equations.flatMap((equation, equationIndex) =>
            tokenizeEquation(equation).map((token, tokenIndex) => ({
              text: formatMathForSpeech(token),
              onStart: () =>
                setNarrationFocus({
                  kind: 'step' as const,
                  step: step.step,
                  equation: equationIndex,
                  token: tokenIndex,
                }),
            }))
          ),
        ];
      });

      speakSequence(
        [
          {
            text: `Let us solve ${formatMathForSpeech(question)}.`,
            onStart: () => setNarrationFocus({ kind: 'question' }),
          },
          ...stepSegments,
          {
            text: `Final answer. ${formatMathForSpeech(solution.answer)}.`,
            onStart: () => setNarrationFocus({ kind: 'answer' }),
          },
        ],
        {
          rate: speechRate,
          onComplete: () => setNarrationFocus(null),
        }
      );
    },
    [setNarrationFocus, speakSequence, speechRate]
  );

  const speakCurrentResponse = useCallback(() => {
    const state = useAIStore.getState();
    if (state.currentSolution) {
      speakMathSolution(state.currentSolution);
      return;
    }
    if (state.agentResponse?.blocks.length) {
      const text = blocksToSpeechText(state.agentResponse.blocks);
      if (text.trim()) {
        speakSequence(
          [{ text, onStart: () => setNarrationFocus({ kind: 'response' }) }],
          { rate: speechRate, onComplete: () => setNarrationFocus(null) }
        );
      }
      return;
    }

    const text =
      state.currentResponse?.text ??
      state.diagramAnalysis?.explanation ??
      state.diagramAnalysis?.summary;
    if (text?.trim()) {
      speakSequence(
        [{ text, onStart: () => setNarrationFocus({ kind: 'response' }) }],
        { rate: speechRate, onComplete: () => setNarrationFocus(null) }
      );
    }
  }, [setNarrationFocus, speakMathSolution, speakSequence, speechRate]);

  const loadAIStatus = useCallback(async () => {
    try {
      const status = await fetchAIStatus();
      setProvider(status.provider);
    } catch {
      setProvider('unknown');
    }

    try {
      const agentStatus = await fetchAgentStatus();
      setAgentEnabled(agentStatus.enabled && isAgentFeatureEnabled());
    } catch {
      setAgentEnabled(false);
    }
  }, [setProvider, setAgentEnabled]);

  const applyVisualization = useCallback(
    (result: VisualizeResponseExtended, rawInput: string) => {
      setCurrentResponse(null);
      setCurrentSolution(null);
      setDiagramAnalysis(result.analysis ?? null);
      if (result.analysis) setBoardLessonOpen(true);

      if (result.diagram) {
        setCurrentDiagram(result.diagram);
        setShowDiagram(true);
      } else {
        setCurrentDiagram(null);
        setShowDiagram(false);
      }

      if (result.graph) {
        setCurrentGraph(result.graph);
        setShowGraph(true);
      } else if (!result.diagram) {
        setCurrentGraph(null);
        setShowGraph(false);
      }

      addInteraction({
        id: uuidv4(),
        inputType: 'text',
        rawInput,
        classification: { subject: 'general', confidence: 1, intent: 'visualize' },
        response: {
          text: result.analysis?.summary ?? result.diagram?.title ?? 'Visualization ready',
          classification: { subject: 'general', confidence: 1, intent: 'visualize' },
        },
        timestamp: Date.now(),
      });

      maybeSpeak(result.analysis?.explanation ?? result.analysis?.summary ?? result.diagram?.title);
    },
    [
      setCurrentResponse,
      setCurrentSolution,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      setCurrentGraph,
      setShowGraph,
      setBoardLessonOpen,
      addInteraction,
      maybeSpeak,
    ]
  );

  const applyDiagramAnalysis = useCallback(
    (analysis: Awaited<ReturnType<typeof analyzeDiagram>>, rawInput: string) => {
      setCurrentResponse(null);
      setCurrentSolution(null);
      setDiagramAnalysis(analysis);
      setBoardLessonOpen(true);

      if (analysis.diagram) {
        setCurrentDiagram(analysis.diagram);
        setShowDiagram(true);
      }

      if (analysis.graph) {
        setCurrentGraph(analysis.graph);
        setShowGraph(true);
      }

      addInteraction({
        id: uuidv4(),
        inputType: 'handwriting',
        rawInput,
        classification: { subject: 'mathematics', confidence: 1, intent: 'visualize' },
        response: {
          text: analysis.summary,
          classification: { subject: 'mathematics', confidence: 1, intent: 'visualize' },
        },
        timestamp: Date.now(),
      });

      maybeSpeak(analysis.explanation ?? analysis.summary);
    },
    [
      setCurrentResponse,
      setCurrentSolution,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      setCurrentGraph,
      setShowGraph,
      setBoardLessonOpen,
      addInteraction,
      maybeSpeak,
    ]
  );

  const writeLesson = useCallback(
    (groups: ReturnType<typeof formatMathSolutionGroups>) => {
      const strokeGroups = buildLessonStrokeGroups(groups, useBoardStore.getState().canvasSettings);
      writeLessonOnBoard(strokeGroups);
    },
    []
  );

  const applySolution = useCallback(
    (
      result: Awaited<ReturnType<typeof solveMath>>,
      rawInput: string,
      inputType: 'text' | 'handwriting',
      writeToBoard = false
    ) => {
      const diagram =
        (result.problemType === 'geometry' || result.problemType === 'trigonometry'
          ? pendingBoardDiagramRef.current
          : null) ??
        result.diagram ??
        null;
      pendingBoardDiagramRef.current = null;

      setCurrentResponse(null);
      const displayInput =
        result.problemType === 'arithmetic' && result.answer
          ? formatSolvedArithmeticDisplay(rawInput, result.answer)
          : rawInput;
      const enrichedResult =
        result.problemType === 'arithmetic' && result.answer
          ? {
              ...result,
              recognizedInput: displayInput,
              equation: displayInput,
            }
          : diagram
            ? { ...result, diagram }
            : result;

      setCurrentSolution(enrichedResult);
      setDiagramAnalysis(null);
      setCurrentDiagram(diagram ?? null);
      setShowDiagram(false);
      setCurrentGraph(result.graph ?? null);
      setShowGraph(false);

      if (displayInput) {
        setRecognizedText(displayInput);
        setInputText(displayInput);
        setAgentProblemEquation(displayInput);
      } else if (result.recognizedInput) {
        setRecognizedText(result.recognizedInput);
      }
      setBoardLessonOpen(true);

      addInteraction({
        id: uuidv4(),
        inputType,
        rawInput,
        classification: { subject: 'mathematics', confidence: 1, intent: 'solve' },
        response: {
          text: result.answer,
          classification: { subject: 'mathematics', confidence: 1, intent: 'solve' },
        },
        timestamp: Date.now(),
      });

      if (writeToBoard) {
        writeLesson(formatMathSolutionGroups(result, canvasSettings.width));
      }
      if (autoSpeak) {
        speakMathSolution(result);
      }
    },
    [
      setCurrentResponse,
      setCurrentSolution,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      setCurrentGraph,
      setShowGraph,
      setRecognizedText,
      setBoardLessonOpen,
      addInteraction,
      autoSpeak,
      speakMathSolution,
      writeLesson,
      canvasSettings.width,
      setInputText,
      setAgentProblemEquation,
    ]
  );

  const sendAgentTurn = useCallback(
    async (message: string, options?: { forceNewSession?: boolean }) => {
      const trimmedMessage = sanitizeEquationInput(message);
      if (
        !GEOMETRY_RECOGNITION_ENABLED &&
        !isClearEquationInput(trimmedMessage) &&
        (isGeneratedBoardPrompt(trimmedMessage) || looksLikeGeometry(trimmedMessage))
      ) {
        setError(
          'Shape and triangle recognition is paused. Write or type an arithmetic problem or equation.'
        );
        setPanelOpen(true);
        setLoading(false);
        return;
      }

      clearError();
      setLoading(true);
      setPanelOpen(true);
      setBoardLessonOpen(true);
      setCurrentResponse(null);
      setCurrentSolution(null);
      setDiagramAnalysis(null);
      setCurrentDiagram(null);
      setShowDiagram(false);
      setCurrentGraph(null);
      setShowGraph(false);

      const trimmed = sanitizeEquationInput(message);
      const isTrigonometryInput = looksLikeTrigonometry(trimmed);
      const isGeometryInput = looksLikeGeometry(trimmed) && !isTrigonometryInput;
      const isProbabilityInput = looksLikeProbability(trimmed);
      const isArithmeticInput = classifyEquationInput(trimmed).topic === 'arithmetic';
      const isEquationInput =
        looksLikeMath(trimmed) &&
        (/=/.test(trimmed) || isProbabilityInput || isArithmeticInput) &&
        !isGeometryInput &&
        !isTrigonometryInput;
      const priorState = useAIStore.getState();
      const startsNewProblem =
        Boolean(options?.forceNewSession) ||
        ((isEquationInput || isGeometryInput || isTrigonometryInput || isProbabilityInput) &&
          trimmed !== priorState.agentProblemEquation);
      const equation = isEquationInput || isGeometryInput || isTrigonometryInput || isProbabilityInput
        ? trimmed
        : priorState.agentProblemEquation || priorState.inputText.trim();
      const equationClassification = classifyEquationInput(equation || trimmed);
      const topic =
        isTrigonometryInput || equationClassification.topic === 'trigonometry'
          ? 'trigonometry'
          : isGeometryInput || equationClassification.topic === 'geometry'
            ? 'geometry'
            : isProbabilityInput || equationClassification.topic === 'probability'
              ? 'probability'
              : equationClassification.topic ?? priorState.agentResponse?.topic;

      if (isEquationInput || isGeometryInput || isTrigonometryInput || isProbabilityInput) {
        if (startsNewProblem) {
          setAgentSessionId(null);
          setAgentResponse(null);
        }
        setAgentProblemEquation(trimmed);
      }

      try {
        const response = await sendAgentMessage({
          message: trimmed,
          sessionId: startsNewProblem ? undefined : agentSessionId ?? undefined,
          boardId: boardId ?? undefined,
          subject: 'math',
          topic,
          difficulty: mapEducationToAgentDifficulty(useAIStore.getState().educationLevel),
          teachingMode: 'DIRECT',
        });

        setAgentSessionId(response.sessionId);
        setAgentResponse(response);

        if (isEquationInput || isGeometryInput || isTrigonometryInput || isProbabilityInput) {
          setInputText(trimmed);
        }

        let solutionApplied = false;

        if (
          !isGeometryInput &&
          !isTrigonometryInput &&
          equation &&
          (isProbabilityInput || (looksLikeMath(equation) && /=/.test(equation)))
        ) {
          try {
            const mathResult = await solveMath({
              input: equation,
              context: getContext(),
              boardId: boardId ?? undefined,
              includeGraph: true,
            });
            applySolution(
              enrichSolutionWithAgentBlocks(mathResult, response),
              equation,
              'text'
            );
            solutionApplied = true;
          } catch {
            // Fall back to agent-only formatting below
          }
        }

        if (!solutionApplied) {
          const fallback = agentResponseToSolveResponse(response, equation || trimmed);
          if (fallback) {
            applySolution(fallback, equation || trimmed, 'text');
            solutionApplied = true;
          } else {
            setCurrentSolution(null);
            setCurrentGraph(null);
            setShowGraph(false);
          }
        }

        addInteraction({
          id: uuidv4(),
          inputType: 'text',
          rawInput: isEquationInput ? trimmed : equation || trimmed,
          classification: {
            subject: 'mathematics',
            confidence: 1,
            intent: response.intent.toLowerCase(),
          },
          response: {
            text: solutionApplied
              ? useAIStore.getState().currentSolution?.answer ?? ''
              : blocksToSpeechText(response.blocks),
            classification: {
              subject: 'mathematics',
              confidence: 1,
              intent: response.intent.toLowerCase(),
            },
          },
          timestamp: Date.now(),
        });

        const solution = useAIStore.getState().currentSolution;
        if (autoSpeak && solution) {
          speakMathSolution(solution);
        } else if (autoSpeak) {
          maybeSpeak(blocksToSpeechText(response.blocks));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Agent request failed');
      } finally {
        setLoading(false);
      }
    },
    [
      agentSessionId,
      boardId,
      clearError,
      setLoading,
      setPanelOpen,
      setBoardLessonOpen,
      setCurrentResponse,
      setCurrentSolution,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      setCurrentGraph,
      setShowGraph,
      setAgentSessionId,
      setAgentResponse,
      setAgentProblemEquation,
      setInputText,
      addInteraction,
      maybeSpeak,
      speakMathSolution,
      autoSpeak,
      getContext,
      applySolution,
    ]
  );

  const solveBoard = useCallback(
    async (text?: string) => {
      const typed = (text ?? inputText).trim();
      const recognizable = getRecognizableStrokes(useBoardStore.getState().strokes);
      const hasBoard = recognizable.length > 0;
      const boardText = extractTextFromStrokes(recognizable);
      const preferBoardHandwriting = text === undefined && hasPenHandwriting(recognizable);
      let equation = preferBoardHandwriting ? boardText : typed || boardText;

      if (!equation && !hasBoard) {
        setError('Enter an equation or write one on the board.');
        setPanelOpen(true);
        setLoading(false);
        return;
      }

      beginTutorSession();

      // Local agent. Shape, triangle, and diagram recognition is suspended
      // (GEOMETRY_RECOGNITION_ENABLED). Handwriting is read as arithmetic or an equation.
      if (agentEnabled && isAgentFeatureEnabled()) {
        const hasPen = hasPenHandwriting(recognizable);
        const typedIsClearEquation = Boolean(typed && isClearEquationInput(typed));

        if (!GEOMETRY_RECOGNITION_ENABLED) {
          const typedIsGeometryPrompt =
            Boolean(typed) &&
            !typedIsClearEquation &&
            (isGeneratedBoardPrompt(typed) || looksLikeGeometry(typed));
          let resolved = typedIsGeometryPrompt ? '' : typed;
          const shouldReadHandwriting = hasPen && (preferBoardHandwriting || !resolved);

          if (shouldReadHandwriting) {
            try {
              const ocr = await recognizeMathFromStrokes(recognizable);
              if (ocr.text && ocr.status === 'ok') {
                resolved = ocr.text;
                setRecognizedText(ocr.text);
                setInputText(ocr.text);
              } else if (preferBoardHandwriting || !resolved) {
                if (ocr.text) {
                  setRecognizedText(ocr.text);
                  setInputText(ocr.text);
                  setError(
                    `I read "${ocr.text}", but I am not confident enough to solve it automatically. Please check the equation in the tutor bar and send it again.`
                  );
                } else {
                  setError(
                    ocr.message ??
                      'I could not recognize handwriting locally. Please write a single clear equation or type it in the tutor bar.'
                  );
                }
                setLoading(false);
                return;
              }
            } catch (err) {
              if (preferBoardHandwriting || !resolved) {
                setError(err instanceof Error ? err.message : 'Local handwriting recognition failed');
                setLoading(false);
                return;
              }
            }
          }

          if (!resolved && typedIsGeometryPrompt) {
            setError(
              'Shape and triangle recognition is paused. Write or type an arithmetic problem or equation.'
            );
            setPanelOpen(true);
            setLoading(false);
            return;
          }

          equation = resolved || (preferBoardHandwriting ? boardText : typed || boardText);
          if (equation && (shouldRouteToAgent(equation, true) || looksLikeMath(equation))) {
            return sendAgentTurn(equation);
          }
        } else {
        // Geometry / trigonometry diagram capture. Suspended while GEOMETRY_RECOGNITION_ENABLED is false.
        const needsDiagramCapture =
          looksLikeGeometry(typed) ||
          looksLikeTrigonometry(typed) ||
          (hasPen && !typedIsClearEquation);

        // Fast path: typed equation — skip heavy OpenCV (main-thread WASM) entirely.
        if (typedIsClearEquation) {
          let resolvedEquation = typed;
          if (hasPen && preferBoardHandwriting) {
            try {
              const ocr = await recognizeMathFromStrokes(recognizable);
              if (ocr.text && ocr.status === 'ok') {
                resolvedEquation = ocr.text;
                setRecognizedText(ocr.text);
                setInputText(ocr.text);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Local handwriting recognition failed');
              setLoading(false);
              return;
            }
          }
          if (shouldRouteToAgent(resolvedEquation, true) || looksLikeMath(resolvedEquation)) {
            return sendAgentTurn(resolvedEquation);
          }
        }

        let capture = null as Awaited<ReturnType<typeof captureBoardGeometryAsync>> | null;
        let ocr: Awaited<ReturnType<typeof recognizeMathFromStrokes>> | null = null;

        if (needsDiagramCapture) {
          if (looksLikeGeometry(typed) || looksLikeTrigonometry(typed)) {
            [capture, ocr] = await Promise.all([
              captureBoardGeometryAsync(recognizable, typed, {
                collectDebug: isGeometryDebugEnabled(),
              }),
              hasPen ? recognizeMathFromStrokes(recognizable) : Promise.resolve(null),
            ]);
          } else {
            // Lightweight sync geometry for equation vs diagram scoring — no OpenCV.
            capture = captureBoardGeometry(recognizable, typed);
            ocr = hasPen ? await recognizeMathFromStrokes(recognizable) : null;
          }
          setGeometryDebug(capture.debug ?? null);
        } else if (hasPen) {
          ocr = await recognizeMathFromStrokes(recognizable);
        }

        const identification = identifyBoardContent({
          typedText: typed,
          ocrResult: ocr,
          geometryCapture: capture,
        });

        if (identification.kind === 'geometry' || identification.kind === 'trigonometry') {
          try {
            const geometryCapture =
              capture ??
              (await captureBoardGeometryAsync(recognizable, typed, {
                collectDebug: isGeometryDebugEnabled(),
              }));

            let labels = [...geometryCapture.textLabels];
            let annotatedScene = geometryCapture.scene;

            if (geometryCapture.labelStrokes.length > 0 && hasPenHandwriting(geometryCapture.labelStrokes)) {
              const perStroke = await recognizeGeometryLabelsPerStroke(geometryCapture.labelStrokes);
              if (perStroke.length > 0) {
                labels = [...labels, ...perStroke.map((item) => item.text)];
                setRecognizedText(perStroke.map((item) => item.text).join(', '));
                annotatedScene = applySceneAnnotations(
                  geometryCapture.scene,
                  recognizable,
                  labelRecognitionsFromStrokes(geometryCapture.labelStrokes, perStroke)
                );
              } else {
                const labelOcr = await recognizeGeometryLabels(geometryCapture.labelStrokes);
                if (labelOcr.text) {
                  labels = [...labels, labelOcr.text];
                  setRecognizedText(labelOcr.text);
                  annotatedScene = applySceneAnnotations(
                    geometryCapture.scene,
                    recognizable,
                    labelRecognitionsFromStrokes(
                      geometryCapture.labelStrokes,
                      geometryCapture.labelStrokes.map((stroke, index) => ({
                        strokeId: stroke.id,
                        text: labelOcr.text.split(/[\s,]+/)[index] ?? labelOcr.text,
                        confidence: labelOcr.confidence,
                      }))
                    )
                  );
                }
              }
            }

            const useTrig =
              identification.kind === 'trigonometry' ||
              isTrigonometryDiagram(geometryCapture.shapes, labels, annotatedScene, typed);

            const leftoverPrompt = isGeneratedBoardPrompt(typed);
            const extraText = leftoverPrompt ? '' : typed;

            const problem = useTrig
              ? buildTrigonometryProblemText(
                  geometryCapture.shapes,
                  labels,
                  extraText,
                  annotatedScene
                )
              : buildGeometryProblemText(
                  geometryCapture.shapes,
                  labels,
                  extraText,
                  annotatedScene
                );

            setInputText(problem);
            setRecognizedText(problem);
            pendingBoardDiagramRef.current =
              generateDiagramFromScene(annotatedScene, 'Recognized geometry') ??
              generateCanonicalGeometryDiagramFromText(problem);
            return sendAgentTurn(problem, { forceNewSession: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not read the geometry on the board');
            setLoading(false);
            return;
          }
        }

        if (identification.kind === 'equation') {
          equation = identification.problemText ?? (typed || boardText);
          if (ocr?.text) {
            setRecognizedText(ocr.text);
            setInputText(ocr.text);
          }
        } else if (!equation) {
          if (hasPenHandwriting(recognizable)) {
            try {
              const ocrResult = ocr ?? (await recognizeMathFromStrokes(recognizable));

              if (ocrResult.text) {
                setRecognizedText(ocrResult.text);
                setInputText(ocrResult.text);

                if (ocrResult.status === 'ok') {
                  equation = ocrResult.text;
                } else {
                  setError(
                    `I read "${ocrResult.text}", but I am not confident enough to solve it automatically. Please check the equation in the tutor bar and send it again.`
                  );
                  setLoading(false);
                  return;
                }
              } else {
                setError(
                  ocrResult.message ??
                    'I could not recognize handwriting locally. Please write a single clear equation or type it in the tutor bar.'
                );
                setLoading(false);
                return;
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Local handwriting recognition failed');
              setLoading(false);
              return;
            }
          } else {
            setError(
              'Local agent mode: type the equation in the tutor bar, use the Text tool, or write a clear pen equation on the board.'
            );
            setPanelOpen(true);
            setLoading(false);
            return;
          }
        }
        if (shouldRouteToAgent(equation, true) || looksLikeMath(equation) || looksLikeGeometry(equation)) {
          return sendAgentTurn(equation);
        }
        }
      }

      const readBoard = shouldReadBoard(typed, hasBoard) && !typed;
      const question = readBoard ? '' : equation;

      setCurrentSolution(null);
      setCurrentGraph(null);
      setShowGraph(false);
      setDiagramAnalysis(null);
      setCurrentDiagram(null);
      setShowDiagram(false);

      try {
        const imageBase64 = hasBoard ? strokesToBase64(recognizable, canvasSettings) : undefined;

        const result = await solveMath({
          input: question || undefined,
          strokes: readBoard ? recognizable : undefined,
          imageBase64: readBoard ? imageBase64 : undefined,
          context: getContext(),
          boardId: boardId ?? undefined,
          includeGraph: true,
        });

        applySolution(
          result,
          question || result.recognizedInput,
          readBoard ? 'handwriting' : 'text'
        );

        if (result.recognizedInput) {
          setInputText(result.recognizedInput);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to solve equation');
      } finally {
        setLoading(false);
      }
    },
    [
      inputText,
      strokes,
      canvasSettings,
      boardId,
      getContext,
      clearError,
      setLoading,
      setPanelOpen,
      setCurrentSolution,
      setCurrentGraph,
      setShowGraph,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      applySolution,
      setRecognizedText,
      setInputText,
      setError,
      agentEnabled,
      setGeometryDebug,
      sendAgentTurn,
      beginTutorSession,
    ]
  );

  const visualizeBoard = useCallback(
    async (text?: string) => {
      const topic = (text ?? inputText).trim();
      const recognizable = getRecognizableStrokes(strokes);
      const hasBoard = recognizable.length > 0;

      if (!topic && !hasBoard) {
        setError('Enter a topic or draw shapes on the board to visualize.');
        setPanelOpen(true);
        return;
      }

      clearError();
      setCurrentSolution(null);
      setLoading(true);
      setPanelOpen(true);

      try {
        const imageBase64 = hasBoard ? strokesToBase64(recognizable, canvasSettings) : undefined;
        const result = await visualizeMath({
          text: topic || undefined,
          expression: topic || undefined,
          strokes: hasBoard ? recognizable : undefined,
          imageBase64,
          mode: hasBoard ? 'auto' : 'diagram',
          context: getContext(),
          boardId: boardId ?? undefined,
        });

        applyVisualization(result, topic || 'board visualization');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate visualization');
      } finally {
        setLoading(false);
      }
    },
    [
      inputText,
      strokes,
      canvasSettings,
      boardId,
      getContext,
      clearError,
      setLoading,
      setPanelOpen,
      setCurrentSolution,
      applyVisualization,
      setError,
    ]
  );

  const analyzeBoardDiagram = useCallback(async () => {
    const recognizable = getRecognizableStrokes(strokes);
    const text = inputText.trim();

    if (recognizable.length === 0 && !text) {
      setError('Draw shapes on the board or add labels to analyze geometry.');
      setPanelOpen(true);
      return;
    }

    clearError();
    setCurrentSolution(null);
    setLoading(true);
    setPanelOpen(true);

    try {
      const imageBase64 =
        recognizable.length > 0 ? strokesToBase64(recognizable, canvasSettings) : undefined;

      const analysis = await analyzeDiagram({
        strokes: recognizable.length > 0 ? recognizable : undefined,
        text: text || undefined,
        imageBase64,
        context: getContext(),
        boardId: boardId ?? undefined,
        generateDiagram: true,
      });

      applyDiagramAnalysis(analysis, text || analysis.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze diagram');
    } finally {
      setLoading(false);
    }
  }, [
    strokes,
    inputText,
    canvasSettings,
    boardId,
    getContext,
    clearError,
    setLoading,
    setPanelOpen,
    setCurrentSolution,
    applyDiagramAnalysis,
    setError,
  ]);

  const askAI = useCallback(
    async (text?: string) => {
      setActiveDemoSampleId(null);
      const typed = sanitizeEquationInput(text ?? inputText);
      const recognizable = getRecognizableStrokes(useBoardStore.getState().strokes);
      const hasBoard = recognizable.length > 0;

      if (shouldReadBoard(typed, hasBoard)) {
        return solveBoard();
      }

      const question = typed;
      if (!question) {
        setError('Please enter a question or topic.');
        setLoading(false);
        return;
      }

      if (shouldRouteToAgent(question, agentEnabled)) {
        return sendAgentTurn(question);
      }

      if (looksLikeMath(question)) {
        return solveBoard(question);
      }

      if (looksLikeVisualize(question)) {
        return visualizeBoard(question);
      }

      clearError();
      setCurrentSolution(null);
      setCurrentGraph(null);
      setShowGraph(false);
      setDiagramAnalysis(null);
      setCurrentDiagram(null);
      setShowDiagram(false);
      setLoading(true);
      setPanelOpen(true);

      try {
        const result = await explainText(question, {
          context: getContext(),
          boardId: boardId ?? undefined,
        });

        setCurrentResponse(result);
        setRecognizedText(null);
        setBoardLessonOpen(true);
        addInteraction({
          id: uuidv4(),
          inputType: 'text',
          rawInput: question,
          classification: result.classification,
          response: result,
          timestamp: Date.now(),
        });
        maybeSpeak(result.text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get AI response');
      } finally {
        setLoading(false);
      }
    },
    [
      inputText,
      boardId,
      getContext,
      clearError,
      setLoading,
      setPanelOpen,
      setCurrentResponse,
      setCurrentSolution,
      setCurrentGraph,
      setShowGraph,
      setDiagramAnalysis,
      setCurrentDiagram,
      setShowDiagram,
      setRecognizedText,
      setBoardLessonOpen,
      addInteraction,
      setError,
      solveBoard,
      visualizeBoard,
      maybeSpeak,
      setActiveDemoSampleId,
      agentEnabled,
      sendAgentTurn,
    ]
  );

  const recognizeBoard = useCallback(async () => {
    const recognizable = getRecognizableStrokes(strokes);
    if (recognizable.length === 0) {
      setError('Draw or write something on the board first.');
      setPanelOpen(true);
      return;
    }

    clearError();
    setLoading(true);
    setPanelOpen(true);

    try {
      const imageBase64 = strokesToBase64(recognizable, canvasSettings);
      const result = await recognizeStrokes(recognizable, {
        imageBase64,
        boardId: boardId ?? undefined,
      });

      setRecognizedText(result.text || null);
      if (result.text) {
        setInputText(result.text);
      }
      return result.text;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recognize handwriting');
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    strokes,
    canvasSettings,
    boardId,
    clearError,
    setLoading,
    setPanelOpen,
    setRecognizedText,
    setInputText,
    setError,
  ]);

  const interpretAndExplain = useCallback(async () => {
    const recognizable = getRecognizableStrokes(useBoardStore.getState().strokes);
    const typed = inputText.trim();
    const hasBoard = recognizable.length > 0;

    if (!typed && !hasBoard) {
      setError('Write on the board or type a question first.');
      setPanelOpen(true);
      return;
    }

    if (shouldReadBoard(typed, hasBoard) || looksLikeMath(typed)) {
      return solveBoard(shouldReadBoard(typed, hasBoard) ? undefined : typed);
    }

    clearError();
    setCurrentSolution(null);
    setCurrentGraph(null);
    setShowGraph(false);
    setLoading(true);
    setPanelOpen(true);

    try {
      const imageBase64 =
        recognizable.length > 0 ? strokesToBase64(recognizable, canvasSettings) : undefined;

      const result = await interpretBoard({
        text: typed || undefined,
        strokes: hasBoard ? recognizable : undefined,
        imageBase64,
        context: getContext(),
        boardId: boardId ?? undefined,
        explain: true,
      });

      setRecognizedText(result.recognizedText || null);

      if (
        result.classification.subject === 'mathematics' &&
        (result.classification.intent === 'solve' || result.classification.intent === 'visualize') &&
        result.recognizedText
      ) {
        return solveBoard(hasBoard ? undefined : result.recognizedText);
      }

      if (result.explanation) {
        setCurrentResponse(result.explanation);
        setBoardLessonOpen(true);
        addInteraction({
          id: uuidv4(),
          inputType: hasBoard ? 'handwriting' : 'text',
          rawInput: hasBoard ? result.recognizedText : typed,
          recognizedText: result.recognizedText,
          classification: result.classification,
          response: result.explanation,
          timestamp: Date.now(),
        });
        maybeSpeak(result.explanation.text);
      } else if (result.recognizedText) {
        setError('Text recognized but could not generate explanation.');
      } else {
        setError('Could not recognize any text on the board.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to interpret board');
    } finally {
      setLoading(false);
    }
  }, [
    strokes,
    inputText,
    canvasSettings,
    boardId,
    getContext,
    clearError,
    setLoading,
    setPanelOpen,
    setRecognizedText,
    setCurrentResponse,
    setBoardLessonOpen,
    setCurrentSolution,
    setCurrentGraph,
    setShowGraph,
    addInteraction,
    setError,
    solveBoard,
    maybeSpeak,
  ]);

  const toggleGraph = useCallback(() => {
    const { showGraph, currentGraph } = useAIStore.getState();
    if (currentGraph) setShowGraph(!showGraph);
  }, [setShowGraph]);

  const toggleDiagram = useCallback(() => {
    const { showDiagram, currentDiagram } = useAIStore.getState();
    if (currentDiagram) setShowDiagram(!showDiagram);
  }, [setShowDiagram]);

  const hideGraph = useCallback(() => {
    setShowGraph(false);
  }, [setShowGraph]);

  const hideDiagram = useCallback(() => {
    setShowDiagram(false);
  }, [setShowDiagram]);

  const solveAndWriteToBoard = useCallback(async () => {
    const typed = inputText.trim();
    const recognizable = getRecognizableStrokes(useBoardStore.getState().strokes);
    const hasBoard = recognizable.length > 0;
    const readBoard = shouldReadBoard(typed, hasBoard);
    const question = readBoard ? '' : typed;

    if (!question && !hasBoard) {
      setError('Write a question on the board first.');
      setPanelOpen(true);
      return;
    }

    clearError();
    setCurrentSolution(null);
    setCurrentGraph(null);
    setShowGraph(false);
    setDiagramAnalysis(null);
    setCurrentDiagram(null);
    setShowDiagram(false);
    setLoading(true);
    setPanelOpen(true);

    try {
      const imageBase64 = hasBoard ? strokesToBase64(recognizable, canvasSettings) : undefined;

      if (question && looksLikeMath(question) && !hasBoard) {
        const result = await solveMath({
          input: question,
          context: getContext(),
          boardId: boardId ?? undefined,
          includeGraph: true,
        });

        applySolution(result, question, 'text', true);
        return;
      }

      const result = await interpretBoard({
        text: readBoard ? undefined : question || undefined,
        strokes: hasBoard ? recognizable : undefined,
        imageBase64,
        context: getContext(),
        boardId: boardId ?? undefined,
        explain: true,
      });

      setRecognizedText(result.recognizedText || null);
      const recognizedQuestion = readBoard
        ? result.recognizedText || ''
        : question || result.recognizedText || '';

      if (result.recognizedText) {
        setInputText(result.recognizedText);
      }

      const isMathSolve =
        result.classification.subject === 'mathematics' &&
        (result.classification.intent === 'solve' ||
          result.classification.intent === 'visualize' ||
          looksLikeMath(recognizedQuestion));

      if (isMathSolve && recognizedQuestion) {
        const solution = await solveMath({
          input: recognizedQuestion,
          strokes: readBoard ? recognizable : undefined,
          imageBase64: readBoard ? imageBase64 : undefined,
          context: getContext(),
          boardId: boardId ?? undefined,
          includeGraph: true,
        });

        applySolution(
          solution,
          recognizedQuestion,
          readBoard ? 'handwriting' : 'text',
          true
        );
        return;
      }

      if (result.explanation) {
        setCurrentResponse(result.explanation);
        setBoardLessonOpen(true);
        addInteraction({
          id: uuidv4(),
          inputType: question ? 'text' : 'handwriting',
          rawInput: recognizedQuestion,
          recognizedText: result.recognizedText,
          classification: result.classification,
          response: result.explanation,
          timestamp: Date.now(),
        });
        maybeSpeak(result.explanation.text);
        writeLesson(formatTeachingGroups(recognizedQuestion, result.explanation, canvasSettings.width));
      } else if (result.recognizedText) {
        setError('Text recognized but could not generate an explanation.');
      } else {
        setError('Could not recognize any text on the board.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve and explain');
    } finally {
      setLoading(false);
    }
  }, [
    inputText,
    strokes,
    canvasSettings,
    boardId,
    getContext,
    clearError,
    setLoading,
    setPanelOpen,
    setCurrentSolution,
    setCurrentGraph,
    setShowGraph,
    setDiagramAnalysis,
    setCurrentDiagram,
    setShowDiagram,
    setRecognizedText,
    setCurrentResponse,
    setBoardLessonOpen,
    setInputText,
    addInteraction,
    setError,
    applySolution,
    writeLesson,
    maybeSpeak,
  ]);

  const requestTutorFollowUp = useCallback(
    async (instruction: string) => {
      const state = useAIStore.getState();
      const source =
        state.currentSolution?.recognizedInput ||
        state.history[0]?.rawInput ||
        state.inputText.trim();

      if (!source) {
        setError('Ask Tutor a question first.');
        return;
      }

      clearError();
      setLoading(true);
      setPanelOpen(true);

      const prompt = `${instruction}\n\nTopic or problem: ${source}`;

      try {
        const result = await explainText(prompt, {
          context: getContext(),
          boardId: boardId ?? undefined,
        });
        setCurrentResponse(result);
        setRecognizedText(null);
        setBoardLessonOpen(true);
        addInteraction({
          id: uuidv4(),
          inputType: 'text',
          rawInput: source,
          classification: result.classification,
          response: result,
          timestamp: Date.now(),
        });
        maybeSpeak(result.text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tutor could not expand the explanation.');
      } finally {
        setLoading(false);
      }
    },
    [
      addInteraction,
      boardId,
      clearError,
      getContext,
      maybeSpeak,
      setCurrentResponse,
      setBoardLessonOpen,
      setError,
      setLoading,
      setPanelOpen,
      setRecognizedText,
    ]
  );

  const runTutorAction = useCallback(
    async (action: TutorActionId) => {
      if (action === 'show-graph') {
        toggleGraph();
        return;
      }
      if (action === 'show-diagram') {
        toggleDiagram();
        return;
      }
      if (action === 'show-on-board') {
        setBoardLessonOpen(true);
        const solution = useAIStore.getState().currentSolution;
        if (solution) {
          writeLesson(formatMathSolutionGroups(solution, canvasSettings.width));
        }
        return;
      }
      if (action === 'try-one') return;

      const agentMessage = tutorActionToAgentMessage(action);
      if (agentEnabled && useAIStore.getState().agentSessionId && agentMessage) {
        await sendAgentTurn(agentMessage);
        return;
      }

      const instructions: Partial<Record<TutorActionId, string>> = {
        'explain-more':
          'Explain this in more detail as a patient tutor. Focus on why the important ideas or steps work.',
        simplify:
          'Explain this again in simpler language. Keep the important meaning and use short, clear steps.',
        'give-example':
          'Give one clear worked example, then briefly connect it to the main idea.',
        'quiz-me':
          'Create a short three-question learning check. Do not reveal each answer until after the question.',
      };

      const instruction = instructions[action];
      if (instruction) await requestTutorFollowUp(instruction);
    },
    [requestTutorFollowUp, sendAgentTurn, setBoardLessonOpen, toggleDiagram, toggleGraph, agentEnabled, writeLesson, canvasSettings.width]
  );

  const cancelVoiceEquation = useCallback(() => {
    // Remove dumped plain-text lesson strokes AND the dictated equation.
    clearDumpedLessonFromBoard();
    clearVoiceEquation(canvasSettings);
    clearError();
    setInputText('');
    setVoiceDraftText('');
    setRecognizedText(null);
    setCurrentResponse(null);
    setCurrentSolution(null);
    setAgentResponse(null);
    setBoardLessonOpen(false);
    setLoading(false);
  }, [
    canvasSettings,
    clearError,
    setInputText,
    setVoiceDraftText,
    setRecognizedText,
    setCurrentResponse,
    setCurrentSolution,
    setAgentResponse,
    setBoardLessonOpen,
    setLoading,
  ]);

  const handleVoiceTeaching = useCallback(
    async (text: string) => {
      clearError();
      const command = parseVoiceCommand(text);

      // Keep the lesson/demo panel closed while dictating math.
      if (
        command.type === 'append' ||
        command.type === 'write-equation' ||
        command.type === 'cancel' ||
        command.type === 'undo' ||
        command.type === 'ignore'
      ) {
        setBoardLessonOpen(false);
        setLoading(false);
        setCurrentResponse(null);
      }

      if (command.type === 'ignore') {
        return;
      }

      if (command.type === 'cancel') {
        cancelVoiceEquation();
        return;
      }

      if (command.type === 'undo') {
        const equation = undoVoiceDraft();
        setInputText(equation);
        setVoiceDraftText(equation);
        setRecognizedText(equation || null);
        return;
      }

      if (command.type === 'append') {
        const incoming = command.tokens.join('');
        const current =
          getVoiceEquationText() ||
          useAIStore.getState().voiceDraftText.trim() ||
          useAIStore.getState().inputText.trim() ||
          '';
        let shown: string;

        // Draft only — do not write canvas strokes until "solve" (keeps mic stable when slow).
        if (isCompleteEquation(current) && !isCompleteEquation(incoming) && !/^\^(?:\d+|[xyz])$/i.test(incoming)) {
          shown = current;
        } else if (isCompleteEquation(incoming)) {
          shown = replaceVoiceDraft(pickBestEquation(incoming, current));
        } else if (/^\^(?:\d+|[xyz])$/i.test(incoming) && /[0-9a-zA-Z)]$/.test(current) && !/\^[xyz\d]+$/i.test(current)) {
          shown = replaceVoiceDraft(current + incoming);
        } else if (current.endsWith('=') && incoming.trim() === '=') {
          shown = replaceVoiceDraft(current);
        } else if (isIncompleteArithmeticEquation(current) && /^[\d(.]/.test(incoming)) {
          shown = replaceVoiceDraft(current);
        } else if (current.endsWith('=') && /^[\d(a-zA-Z(]/.test(incoming)) {
          shown = replaceVoiceDraft(sanitizeEquationInput(current + incoming));
        } else if (incoming.startsWith(current) && incoming.length > current.length) {
          shown = replaceVoiceDraft(incoming);
        } else {
          shown = appendVoiceDraftTokens(command.tokens);
        }

        setInputText(shown);
        setVoiceDraftText(shown);
        setRecognizedText(shown);

        if (command.thenSolve) {
          if (isCompleteEquation(shown)) {
            return handleVoiceTeaching('solve');
          }
          setError(
            `Finish the equation after "=" (now: ${shown}). Say the missing number, then say "solve".`
          );
          setPanelOpen(true);
          setLoading(false);
        }
        return;
      }

      if (command.type === 'write-equation') {
        const current =
          getVoiceEquationText() ||
          useAIStore.getState().voiceDraftText.trim() ||
          useAIStore.getState().inputText.trim() ||
          '';
        const best = pickBestEquation(command.equation, current);
        const equation = replaceVoiceDraft(best);
        setInputText(equation);
        setVoiceDraftText(equation);
        setRecognizedText(equation);
        return;
      }

      if (command.type === 'solve' || command.type === 'solve-equation') {
        const draftEquation =
          getVoiceEquationText() ||
          useAIStore.getState().voiceDraftText.trim() ||
          useAIStore.getState().inputText.trim() ||
          useAIStore.getState().recognizedText?.trim() ||
          '';

        // Prefer the accumulated draft so a misheard solve phrase cannot wipe trailing digits.
        const equation =
          command.type === 'solve-equation'
            ? pickBestEquation(command.equation, draftEquation)
            : draftEquation;

        if (!equation) {
          setError('Say an equation first, then say "solve".');
          setPanelOpen(true);
          setBoardLessonOpen(true);
          setLoading(false);
          return;
        }

        if (!isCompleteEquation(equation)) {
          setError(
            `Finish the equation after "=" (now: ${equation}). Say the missing number, then say "solve".`
          );
          setInputText(equation);
          setVoiceDraftText(equation);
          setPanelOpen(true);
          setLoading(false);
          return;
        }

        // First time the equation hits the canvas — only when solving.
        replaceVoiceDraft(equation);
        commitVoiceEquationToBoard(canvasSettings);
        setInputText(equation);
        setRecognizedText(equation);
        setVoiceDraftText('');
        setLoading(true);
        setPanelOpen(true);
        // Structured lesson overlay only — never dump plain text strokes onto the board.
        setBoardLessonOpen(true);

        try {
          if (agentEnabled && shouldRouteToAgent(equation, true)) {
            await sendAgentTurn(equation);
            resetVoiceEquationSession();
            return;
          }

          const result = await solveMath({
            input: equation,
            context: getContext(),
            boardId: boardId ?? undefined,
            includeGraph: true,
          });

          applySolution(result, equation, 'text', false);
          resetVoiceEquationSession();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to solve equation');
          setBoardLessonOpen(true);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Only intentional questions reach the general explainer (never misheard "auto"/"3").
      setInputText(command.text);
      beginTutorSession();
      return askAI(command.text);
    },
    [
      clearError,
      setBoardLessonOpen,
      setLoading,
      setCurrentResponse,
      cancelVoiceEquation,
      canvasSettings,
      setInputText,
      setVoiceDraftText,
      setRecognizedText,
      setError,
      setPanelOpen,
      agentEnabled,
      sendAgentTurn,
      getContext,
      boardId,
      applySolution,
      writeLesson,
      beginTutorSession,
      askAI,
    ]
  );

  const loadDemoQuestion = useCallback(
    async (sampleId: string) => {
      const sample = getDemoSampleById(sampleId);
      if (!sample) return;

      stopSpeaking();
      clearError();
      setLoading(true);
      setInputText(sample.equation);
      setActiveDemoSampleId(sampleId);
      setShowGraph(false);
      setShowDiagram(false);

      if (useAIStore.getState().agentEnabled) {
        await sendAgentTurn(sample.equation);
        return;
      }

      try {
        let solution = { ...sample.solution };

        try {
          const live = await solveMath({
            input: sample.equation,
            context: getContext(),
            boardId: boardId ?? undefined,
            includeGraph: true,
          });
          solution = {
            ...solution,
            ...live,
            steps: live.steps.length > 0 ? live.steps : solution.steps,
          };
        } catch {
          // Use embedded demo steps when the solver API is unavailable.
        }

        applySolution(solution, sample.equation, 'text');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load practice question');
      } finally {
        setLoading(false);
      }
    },
    [
      applySolution,
      boardId,
      clearError,
      getContext,
      setActiveDemoSampleId,
      setError,
      setInputText,
      setLoading,
      setShowDiagram,
      setShowGraph,
      sendAgentTurn,
      stopSpeaking,
    ]
  );

  return {
    askAI,
    handleVoiceTeaching,
    cancelVoiceEquation,
    solveBoard,
    solveAndWriteToBoard,
    loadDemoQuestion,
    recognizeBoard,
    interpretAndExplain,
    analyzeBoardDiagram,
    visualizeBoard,
    loadAIStatus,
    toggleGraph,
    toggleDiagram,
    hideGraph,
    hideDiagram,
    runTutorAction,
    speakCurrentResponse,
    stopSpeaking,
    isSpeaking,
    voiceOutputSupported,
  };
}
