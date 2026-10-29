import { TutorAgentResponse, AgentResponseBlock } from '../types/agent';
import { MathStep, ProblemType, SolveResponse } from '../types/math';
import type { DiagramSpec } from '../types/geometry';
import { generateCanonicalGeometryDiagramFromText } from '../engine/diagram/canonicalGeometry';

function isInternalParseBlock(block: AgentResponseBlock): boolean {
  return (
    block.type === 'explanation' &&
    block.title?.toLowerCase() === 'parse' &&
    Boolean(block.content?.includes('Parsed equation:'))
  );
}

function isParseErrorBlock(block: AgentResponseBlock): boolean {
  return (
    block.type === 'explanation' &&
    block.title?.toLowerCase() === 'parse' &&
    Boolean(block.content?.toLowerCase().includes('could not parse'))
  );
}

function dedupeBlocks(blocks: AgentResponseBlock[]): AgentResponseBlock[] {
  const seen = new Set<string>();
  return blocks.filter((block) => {
    if (isInternalParseBlock(block)) return false;
    const key = `${block.type}:${block.title ?? ''}:${block.content ?? block.prompt ?? block.value ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function blockToStep(block: AgentResponseBlock, stepNumber: number): MathStep | null {
  switch (block.type) {
    case 'question':
      return {
        step: stepNumber,
        title: block.title ?? 'Think about this',
        content: block.prompt ?? '',
      };
    case 'calculation':
    case 'formula':
      return {
        step: stepNumber,
        title: block.title ?? block.label ?? 'Calculation',
        content: block.expression ?? '',
        latex: block.latex,
      };
    case 'hint':
      return {
        step: stepNumber,
        title: block.title ?? 'Hint',
        content: block.content ?? '',
      };
    case 'verification':
      return {
        step: stepNumber,
        title: block.title ?? 'Answer check',
        content: [block.feedback, block.expected && `Expected: ${block.expected}`, block.received && `Your answer: ${block.received}`]
          .filter(Boolean)
          .join('\n'),
      };
    case 'callout':
      return {
        step: stepNumber,
        title: block.title ?? 'Note',
        content: block.content ?? '',
      };
    case 'diagram':
      return null;
    case 'explanation':
      if (block.title === 'Coefficients') {
        return {
          step: stepNumber,
          title: 'Identify a, b, and c',
          content: block.content ?? '',
        };
      }
      if (isParseErrorBlock(block)) return null;
      return {
        step: stepNumber,
        title: block.title ?? 'Explanation',
        content: block.content ?? '',
      };
    default:
      if (block.content || block.prompt) {
        return {
          step: stepNumber,
          title: block.title ?? 'Explanation',
          content: block.content ?? block.prompt ?? '',
        };
      }
      return null;
  }
}

function blocksToSteps(blocks: AgentResponseBlock[]): MathStep[] {
  const cleaned = dedupeBlocks(blocks);
  const steps: MathStep[] = [];
  let stepNumber = 1;

  for (const block of cleaned) {
    const step = blockToStep(block, stepNumber);
    if (step) {
      steps.push(step);
      stepNumber += 1;
    }
  }

  return steps;
}

function extractAnswer(blocks: AgentResponseBlock[]): string {
  const answerBlock = blocks.find((b) => b.type === 'answer');
  return answerBlock?.value ?? '';
}

function isDiagramSpec(value: unknown): value is DiagramSpec {
  if (!value || typeof value !== 'object') return false;
  const spec = value as DiagramSpec;
  return typeof spec.width === 'number' && typeof spec.height === 'number' && Array.isArray(spec.elements);
}

function extractDiagram(blocks: AgentResponseBlock[], equation: string, problemType: string): DiagramSpec | undefined {
  const block = blocks.find((item) => item.type === 'diagram');
  if (isDiagramSpec(block?.spec)) return block.spec;
  if (problemType === 'geometry' || problemType === 'trigonometry') {
    return generateCanonicalGeometryDiagramFromText(equation) ?? undefined;
  }
  return undefined;
}

function extractTutorNotes(blocks: AgentResponseBlock[]): string | undefined {
  const notes = dedupeBlocks(blocks)
    .filter((b) => b.type === 'hint' || b.type === 'callout')
    .map((b) => b.content)
    .filter(Boolean);

  return notes.length > 0 ? notes.join('\n\n') : undefined;
}

export function agentResponseToSolveResponse(
  response: TutorAgentResponse,
  equation: string
): SolveResponse | null {
  const blocks = response.blocks ?? [];
  const steps = blocksToSteps(blocks);
  const answer = extractAnswer(blocks);
  const problemType = (response.meta?.problemType as ProblemType | undefined) ?? 'quadratic';

  if (response.status === 'error') {
    const parseError = blocks.find(isParseErrorBlock);
    const friendly =
      parseError?.content?.toLowerCase().includes('geometry')
        ? 'I could not read a geometry problem yet. Draw a triangle, rectangle, square, or circle and write the lengths beside it.'
        : parseError?.content?.includes('quadratic') && !equation.includes('^2') && !equation.includes('²')
        ? 'This does not look like a quadratic equation yet. A quadratic needs an x² term — for example: 2x^2 + 5x - 3 = 0.'
        : parseError?.content ?? 'We could not read that equation. Check the format and try again.';

    return {
      recognizedInput: equation,
      normalizedInput: equation,
      problemType,
      equation,
      steps: [
        {
          step: 1,
          title: 'Check the equation',
          content: friendly,
        },
      ],
      answer: answer || '—',
      graphable: false,
      explanation: extractTutorNotes(blocks),
      provider: 'local-agent',
    };
  }

  if (steps.length === 0 && !answer) return null;

  const diagram = extractDiagram(blocks, equation, problemType);

  return {
    recognizedInput: equation,
    normalizedInput: equation,
    problemType,
    equation,
    steps,
    answer: answer || 'Continue through the steps to reach the final answer.',
    graphable: false,
    explanation: extractTutorNotes(blocks),
    provider: 'local-agent',
    diagram,
  };
}

export function enrichSolutionWithAgentBlocks(
  solution: SolveResponse,
  response: TutorAgentResponse
): SolveResponse {
  const agentNotes = extractTutorNotes(response.blocks);
  const verification = response.blocks.find((b) => b.type === 'verification');

  let explanation = solution.explanation;
  if (agentNotes) {
    explanation = explanation ? `${explanation}\n\n${agentNotes}` : agentNotes;
  }
  if (verification?.feedback) {
    explanation = explanation
      ? `${explanation}\n\n${verification.feedback}`
      : verification.feedback;
  }

  return {
    ...solution,
    explanation,
    provider: 'local-agent',
  };
}
