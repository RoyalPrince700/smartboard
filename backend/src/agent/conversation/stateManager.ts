/**
 * Manages solution progress: steps, completion, method state.
 */

import { TutorSessionData } from '../schemas/conversation.schema';
import { ReasoningTrace } from '../schemas/reasoning.schema';
import { AgentIntent } from '../core/intentEngine';

/** Default guided steps for quadratic problems (Phase 5 will expand) */
export const QUADRATIC_STEP_PIPELINE = [
  { id: 'identify_coefficients', title: 'Identify a, b, and c' },
  { id: 'discriminant', title: 'Calculate the discriminant' },
  { id: 'select_method', title: 'Choose a solving method' },
  { id: 'solve', title: 'Solve the equation' },
  { id: 'verify', title: 'Verify the roots' },
] as const;

export const GEOMETRY_STEP_PIPELINE = [
  { id: 'identify_shape', title: 'Name the shape' },
  { id: 'list_givens', title: 'List the given lengths' },
  { id: 'choose_formula', title: 'Write the correct formula' },
  { id: 'calculate', title: 'Substitute and calculate' },
  { id: 'state_answer', title: 'State the answer with units' },
] as const;

export interface StepInfo {
  index: number;
  id: string;
  title: string;
  isComplete: boolean;
}

export class StateManager {
  initProblem(session: TutorSessionData, input: string, trace: ReasoningTrace): void {
    session.currentProblem = {
      rawInput: input,
      normalizedInput: input,
      problemType: trace.problemType,
      coefficients: this.extractCoefficients(trace),
      selectedMethod: trace.selectedMethod,
      intermediateResults: {},
    };
    session.currentStep = 0;
    session.completedSteps = [];
    session.unresolvedQuestion = undefined;
    session.currentConcept = undefined;
  }

  advanceStep(session: TutorSessionData, title?: string): void {
    const stepInfo = this.getCurrentStepInfo(session);
    const step = session.currentStep;

    session.completedSteps = [
      ...session.completedSteps,
      {
        step,
        title: title ?? stepInfo?.title ?? `Step ${step + 1}`,
        completedAt: new Date(),
      },
    ];
    session.currentStep = step + 1;
    session.unresolvedQuestion = undefined;
  }

  goBack(session: TutorSessionData): void {
    if (session.currentStep > 0) {
      session.currentStep -= 1;
      session.completedSteps = session.completedSteps.filter((s) => s.step < session.currentStep);
    }
  }

  resetProblem(session: TutorSessionData): void {
    session.currentProblem = undefined;
    session.currentStep = 0;
    session.completedSteps = [];
    session.currentConcept = undefined;
    session.unresolvedQuestion = undefined;
  }

  changeTopic(session: TutorSessionData, newTopic?: string): void {
    this.resetProblem(session);
    if (newTopic) session.topic = newTopic;
    session.subtopic = undefined;
  }

  setIntermediateResult(session: TutorSessionData, key: string, value: unknown): void {
    if (!session.currentProblem) return;
    session.currentProblem.intermediateResults = {
      ...session.currentProblem.intermediateResults,
      [key]: value,
    };
  }

  getCurrentStepInfo(session: TutorSessionData): StepInfo | null {
    const pipeline = this.getPipelineForProblem(session);
    if (!pipeline.length) return null;

    const index = Math.min(session.currentStep, pipeline.length - 1);
    const step = pipeline[index];

    return {
      index,
      id: step.id,
      title: step.title,
      isComplete: session.completedSteps.some((s) => s.step === index),
    };
  }

  getPipelineForProblem(session: TutorSessionData): Array<{ id: string; title: string }> {
    const problemType = session.currentProblem?.problemType ?? session.topic;
    if (problemType === 'quadratic' || session.topic === 'quadratic') {
      return [...QUADRATIC_STEP_PIPELINE];
    }
    if (problemType === 'geometry' || session.topic === 'geometry') {
      return [...GEOMETRY_STEP_PIPELINE];
    }
    return [];
  }

  applyIntentTransition(
    session: TutorSessionData,
    intent: AgentIntent,
    trace: ReasoningTrace,
    input?: string
  ): void {
    switch (intent) {
      case 'START_PROBLEM':
        this.initProblem(session, input ?? '', trace);
        break;
      case 'CONTINUE':
        this.advanceStep(session);
        break;
      case 'GO_BACK':
        this.goBack(session);
        break;
      case 'REQUEST_PRACTICE':
        this.resetProblem(session);
        break;
      case 'CHANGE_TOPIC':
        this.changeTopic(session);
        break;
      case 'ASK_WHY':
      case 'ASK_EXPLANATION':
      case 'ASK_DEFINITION':
      case 'ASK_HOW':
        session.unresolvedQuestion = intent;
        break;
      case 'REPEAT':
        // Stay on current step — no state change
        break;
      default:
        this.mergeTraceIntoProblem(session, trace);
        return;
    }

    if (
      intent !== 'REQUEST_PRACTICE' &&
      intent !== 'CHANGE_TOPIC' &&
      intent !== 'REPEAT'
    ) {
      this.mergeTraceIntoProblem(session, trace);
    }
  }

  private mergeTraceIntoProblem(session: TutorSessionData, trace: ReasoningTrace): void {
    if (!trace.recognizedData && !trace.problemType && !trace.selectedMethod) return;

    const coeffs = this.extractCoefficients(trace);
    session.currentProblem = {
      ...session.currentProblem,
      rawInput: session.currentProblem?.rawInput ?? '',
      normalizedInput: session.currentProblem?.normalizedInput,
      problemType: trace.problemType ?? session.currentProblem?.problemType,
      coefficients: coeffs ?? session.currentProblem?.coefficients,
      selectedMethod: trace.selectedMethod ?? session.currentProblem?.selectedMethod,
      intermediateResults: {
        ...session.currentProblem?.intermediateResults,
        ...(trace.recognizedData ?? {}),
      },
    };

    if (trace.recognizedData?.discriminant !== undefined) {
      this.setIntermediateResult(session, 'discriminant', trace.recognizedData.discriminant);
    }
  }

  private extractCoefficients(trace: ReasoningTrace): Record<string, number> | undefined {
    const data = trace.recognizedData;
    if (!data) return undefined;

    const { a, b, c, length, width, radius, base, height, hypotenuse } = data;
    if (
      a === undefined &&
      b === undefined &&
      c === undefined &&
      length === undefined &&
      width === undefined &&
      radius === undefined &&
      base === undefined &&
      height === undefined
    ) {
      return undefined;
    }

    const coeffs: Record<string, number> = {};
    if (a !== undefined) coeffs.a = Number(a);
    if (b !== undefined) coeffs.b = Number(b);
    if (c !== undefined) coeffs.c = Number(c);
    if (length !== undefined) coeffs.length = Number(length);
    if (width !== undefined) coeffs.width = Number(width);
    if (radius !== undefined) coeffs.radius = Number(radius);
    if (base !== undefined) coeffs.base = Number(base);
    if (height !== undefined) coeffs.height = Number(height);
    if (hypotenuse !== undefined) coeffs.hypotenuse = Number(hypotenuse);
    return coeffs;
  }
}

export const stateManager = new StateManager();
