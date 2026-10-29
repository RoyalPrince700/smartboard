import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../services/ai/AIService';
import { mathEngine } from '../services/math/MathEngine';
import { teachingService } from '../services/ai/TeachingService';
import { diagramAnalyzer } from '../services/geometry/DiagramAnalyzer';
import { diagramEngine } from '../services/geometry/DiagramEngine';
import { extractGraphExpression } from '../services/math/EquationParser';
import { boardService } from '../services/boardService';
import { AIContext } from '../types/ai';
import { Stroke } from '../types/stroke';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

async function persistAIInteraction(
  boardId: string | undefined,
  data: {
    inputType: 'text' | 'handwriting';
    rawInput: string;
    classification?: { subject: string; intent: string; difficulty?: string };
    responseType: string;
    response: unknown;
  }
) {
  if (!boardId) return;

  try {
    await boardService.appendAIHistory(boardId, {
      id: uuidv4(),
      inputType: data.inputType,
      rawInput: data.rawInput,
      classification: data.classification
        ? {
            subject: data.classification.subject,
            intent: data.classification.intent,
            difficulty: data.classification.difficulty ?? 'unknown',
          }
        : undefined,
      responseType: data.responseType,
      response: data.response,
    });
  } catch (err) {
    console.warn('Failed to persist AI history:', err);
  }
}

export async function explainConcept(req: Request, res: Response) {
  const { input, context, boardId } = req.body as {
    input: string;
    context?: AIContext;
    boardId?: string;
  };

  if (!input?.trim()) {
    throw new ApiError('Input text is required', 400, 'VALIDATION_ERROR');
  }

  const result = await teachingService.teach(input, context);

  await persistAIInteraction(boardId, {
    inputType: 'text',
    rawInput: input,
    classification: result.classification,
    responseType: result.responseType,
    response: result,
  });

  res.json({
    success: true,
    data: {
      ...result,
      provider: result.provider ?? aiService.getProviderName(),
    },
  });
}

export async function recognizeHandwriting(req: Request, res: Response) {
  const { strokes, imageBase64, boardId } = req.body as {
    strokes?: Stroke[];
    imageBase64?: string;
    boardId?: string;
  };

  if ((!strokes || strokes.length === 0) && !imageBase64) {
    throw new ApiError('Strokes or imageBase64 is required', 400, 'VALIDATION_ERROR');
  }

  let text = strokes?.length ? extractTextStrokes(strokes) : '';

  if (!text && !env.agentEnabled) {
    const provider = aiService.getProvider();
    text = await provider.recognizeHandwriting(strokes ?? [], imageBase64);
  }

  if (boardId && text) {
    try {
      await boardService.update(boardId, { recognizedText: text });
    } catch {
      // Board may not exist yet
    }
  }

  res.json({
    success: true,
    data: {
      text,
      provider: env.agentEnabled ? 'local-agent' : aiService.getProviderName(),
    },
  });
}

export async function interpretBoard(req: Request, res: Response) {
  const { text, strokes, imageBase64, context, boardId, explain = true } = req.body as {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
    boardId?: string;
    explain?: boolean;
  };

  if (!text?.trim() && (!strokes || strokes.length === 0) && !imageBase64) {
    throw new ApiError('Text, strokes, or imageBase64 is required', 400, 'VALIDATION_ERROR');
  }

  const provider = aiService.getProvider();
  const result = await teachingService.interpret({
    text,
    strokes,
    imageBase64,
    context,
  });

  if (!explain) {
    res.json({ success: true, data: { ...result, provider: provider.name } });
    return;
  }

  const inputType = strokes?.length && !text ? 'handwriting' : 'text';

  await persistAIInteraction(boardId, {
    inputType,
    rawInput: result.recognizedText,
    classification: result.classification,
    responseType: result.explanation?.responseType ?? 'interpretation',
    response: result,
  });

  res.json({
    success: true,
    data: {
      ...result,
      provider: provider.name,
    },
  });
}

export async function classifyContent(req: Request, res: Response) {
  const { input, subject } = req.body as { input: string; subject?: string };

  if (!input?.trim()) {
    throw new ApiError('Input is required', 400, 'VALIDATION_ERROR');
  }

  const classification = teachingService.classify(input, subject);

  res.json({
    success: true,
    data: classification,
  });
}

export async function aiStatus(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      provider: aiService.getProviderName(),
      features: {
        explain: true,
        recognize: true,
        interpret: true,
        solve: true,
        visualize: true,
        multiSubject: true,
        geometry: true,
        diagramAnalysis: true,
        voice: true,
        subjects: [
          'mathematics', 'english', 'literature', 'biology', 'chemistry',
          'physics', 'geography', 'history', 'economics', 'government',
          'computer_science', 'general',
        ],
      },
    },
  });
}

function extractTextStrokes(strokes: Stroke[]): string {
  return strokes
    .filter((s) => s.tool === 'text' && s.textContent)
    .map((s) => s.textContent!)
    .join(' ')
    .trim();
}

async function resolveInputFromRequest(body: {
  input?: string;
  text?: string;
  strokes?: Stroke[];
  imageBase64?: string;
}): Promise<string> {
  if (body.input?.trim()) return body.input.trim();
  if (body.text?.trim()) return body.text.trim();

  if (body.strokes?.length) {
    const textFromStrokes = extractTextStrokes(body.strokes);
    if (textFromStrokes) return textFromStrokes;
  }

  // Local agent mode: skip Gemini handwriting recognition
  if (env.agentEnabled) {
    return '';
  }

  if (body.strokes?.length || body.imageBase64) {
    const provider = aiService.getProvider();
    const recognized = await provider.recognizeHandwriting(
      body.strokes ?? [],
      body.imageBase64
    );
    if (recognized && !recognized.startsWith('[')) return recognized;
  }

  return '';
}

export async function solveMath(req: Request, res: Response) {
  const { context, boardId, includeGraph, strokes, imageBase64 } = req.body as {
    input?: string;
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
    boardId?: string;
    includeGraph?: boolean;
  };

  const resolvedInput = await resolveInputFromRequest(req.body);

  if (!resolvedInput) {
    throw new ApiError(
      'Input, text, or recognizable board content is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const result = await mathEngine.solve(resolvedInput, { includeGraph, context });

  const inputType = strokes?.length ? 'handwriting' : 'text';

  await persistAIInteraction(boardId, {
    inputType,
    rawInput: resolvedInput,
    classification: { subject: 'mathematics', intent: 'solve', difficulty: 'unknown' },
    responseType: 'solution',
    response: result,
  });

  if (boardId) {
    try {
      await boardService.update(boardId, { recognizedText: resolvedInput });
    } catch {
      // ignore
    }
  }

  res.json({
    success: true,
    data: {
      ...result,
      provider: 'math-engine',
    },
  });
}

export async function visualizeMath(req: Request, res: Response) {
  const {
    expression,
    text,
    strokes,
    imageBase64,
    mode,
    xMin,
    xMax,
    boardId,
    context,
  } = req.body as {
    expression?: string;
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    mode?: 'function' | 'geometry' | 'diagram' | 'auto';
    xMin?: number;
    xMax?: number;
    boardId?: string;
    context?: AIContext;
  };

  const resolvedText = text ?? expression ?? (await resolveInputFromRequest(req.body));
  const effectiveMode = mode ?? 'auto';

  if (strokes?.length && (effectiveMode === 'geometry' || effectiveMode === 'auto' || effectiveMode === 'diagram')) {
    const analysis = diagramAnalyzer.analyze(strokes, {
      text: resolvedText || undefined,
      generateDiagram: true,
      context,
    });
    const enriched = await diagramAnalyzer.enrichWithAI(analysis, context);

    await persistAIInteraction(boardId, {
      inputType: strokes.length ? 'handwriting' : 'text',
      rawInput: resolvedText || 'board geometry',
      classification: { subject: 'mathematics', intent: 'visualize', difficulty: 'unknown' },
      responseType: 'visualization',
      response: enriched,
    });

    res.json({
      success: true,
      data: {
        diagram: enriched.diagram,
        graph: enriched.graph,
        analysis: enriched,
        provider: 'diagram-engine',
      },
    });
    return;
  }

  const graphExpr = resolvedText ? extractGraphExpression(resolvedText) : expression;
  if (graphExpr) {
    const graph = mathEngine.visualize(graphExpr, xMin, xMax);
    await persistAIInteraction(boardId, {
      inputType: 'text',
      rawInput: resolvedText || expression || '',
      classification: { subject: 'mathematics', intent: 'visualize', difficulty: 'unknown' },
      responseType: 'visualization',
      response: { graph },
    });
    res.json({ success: true, data: { graph, provider: 'math-engine' } });
    return;
  }

  if (resolvedText) {
    const diagram = diagramEngine.generateFromTopic(resolvedText);
    if (diagram) {
      await persistAIInteraction(boardId, {
        inputType: 'text',
        rawInput: resolvedText,
        classification: { subject: 'general', intent: 'visualize', difficulty: 'unknown' },
        responseType: 'visualization',
        response: { diagram },
      });
      res.json({ success: true, data: { diagram, provider: 'diagram-engine' } });
      return;
    }
  }

  if (!expression?.trim() && !resolvedText) {
    throw new ApiError('Expression, text, or strokes required', 400, 'VALIDATION_ERROR');
  }

  const graph = mathEngine.visualize(expression ?? resolvedText ?? '', xMin, xMax);
  res.json({ success: true, data: { graph, provider: 'math-engine' } });
}

export async function analyzeDiagram(req: Request, res: Response) {
  const { strokes, text, imageBase64, boardId, context, generateDiagram } = req.body as {
    strokes?: Stroke[];
    text?: string;
    imageBase64?: string;
    boardId?: string;
    context?: AIContext;
    generateDiagram?: boolean;
  };

  let boardStrokes = strokes ?? [];

  if (boardStrokes.length === 0 && !text) {
    const resolved = await resolveInputFromRequest({ strokes, imageBase64, text });
    if (!resolved && !imageBase64) {
      throw new ApiError('Strokes or text required for diagram analysis', 400, 'VALIDATION_ERROR');
    }
  }

  if (boardStrokes.length === 0 && imageBase64) {
    throw new ApiError(
      'Stroke data required for geometry analysis. Save board strokes or draw shapes on the board.',
      400,
      'VALIDATION_ERROR'
    );
  }

  let analysis = diagramAnalyzer.analyze(boardStrokes, {
    text,
    generateDiagram: generateDiagram !== false,
    context,
  });

  analysis = await diagramAnalyzer.enrichWithAI(analysis, context);

  await persistAIInteraction(boardId, {
    inputType: boardStrokes.length ? 'handwriting' : 'text',
    rawInput: text ?? analysis.summary,
    classification: { subject: 'mathematics', intent: 'visualize', difficulty: 'unknown' },
    responseType: 'diagram_analysis',
    response: analysis,
  });

  res.json({
    success: true,
    data: { ...analysis, provider: 'geometry-engine' },
  });
}
