import { SolveResponse } from '../types/math';

export interface DemoQuadraticSample {
  id: string;
  label: string;
  hint: string;
  equation: string;
  solution: SolveResponse;
}

export const DEMO_QUADRATIC_SAMPLES: DemoQuadraticSample[] = [
  {
    id: 'quad-two-roots',
    label: 'Two roots',
    hint: 'Factor into (x - 2)(x - 3)',
    equation: 'x² - 5x + 6 = 0',
    solution: {
      recognizedInput: 'x² - 5x + 6 = 0',
      normalizedInput: 'x² - 5x + 6 = 0',
      problemType: 'quadratic',
      equation: 'x² - 5x + 6 = 0',
      steps: [
        {
          step: 1,
          title: 'Identify the equation',
          content: 'Standard form: 1x² + (-5x) + 6 = 0',
          latex: '1x^2 + (-5x) + 6 = 0',
        },
        {
          step: 2,
          title: 'Calculate the discriminant',
          content: 'Δ = b² - 4ac = (-5)² - 4(1)(6) = 1',
          latex: '\\Delta = (-5)^2 - 4(1)(6) = 1',
        },
        {
          step: 3,
          title: 'Apply quadratic formula',
          content: 'x = [FRAC:-(-5) ± √1:2]',
          latex: 'x = \\frac{-(-5) \\pm \\sqrt{1}}{2(1)}',
        },
        {
          step: 4,
          title: 'Calculate roots',
          content: 'x₁ = 3, x₂ = 2',
          latex: 'x_1 = 3, \\quad x_2 = 2',
        },
      ],
      answer: 'x = 3, x = 2',
      answers: ['x = 3', 'x = 2'],
      graphable: true,
      provider: 'demo',
    },
  },
  {
    id: 'quad-double-root',
    label: 'Perfect square',
    hint: 'One repeated root at x = -2',
    equation: 'x² + 4x + 4 = 0',
    solution: {
      recognizedInput: 'x² + 4x + 4 = 0',
      normalizedInput: 'x² + 4x + 4 = 0',
      problemType: 'quadratic',
      equation: 'x² + 4x + 4 = 0',
      steps: [
        {
          step: 1,
          title: 'Identify the equation',
          content: 'Standard form: 1x² + 4x + 4 = 0',
          latex: '1x^2 + 4x + 4 = 0',
        },
        {
          step: 2,
          title: 'Calculate the discriminant',
          content: 'Δ = b² - 4ac = (4)² - 4(1)(4) = 0',
          latex: '\\Delta = 4^2 - 4(1)(4) = 0',
        },
        {
          step: 3,
          title: 'Apply quadratic formula',
          content: 'x = [FRAC:-4:2] = -2',
          latex: 'x = \\frac{-4}{2(1)} = -2',
        },
      ],
      answer: 'x = -2',
      answers: ['x = -2'],
      graphable: true,
      provider: 'demo',
    },
  },
  {
    id: 'quad-scaled',
    label: 'Factor out 2 first',
    hint: 'Divide by 2, then solve x² - 4x + 3 = 0',
    equation: '2x² - 8x + 6 = 0',
    solution: {
      recognizedInput: '2x² - 8x + 6 = 0',
      normalizedInput: '2x² - 8x + 6 = 0',
      problemType: 'quadratic',
      equation: '2x² - 8x + 6 = 0',
      steps: [
        {
          step: 1,
          title: 'Identify the equation',
          content: 'Standard form: 2x² + (-8x) + 6 = 0',
          latex: '2x^2 + (-8x) + 6 = 0',
        },
        {
          step: 2,
          title: 'Calculate the discriminant',
          content: 'Δ = b² - 4ac = (-8)² - 4(2)(6) = 16',
          latex: '\\Delta = (-8)^2 - 4(2)(6) = 16',
        },
        {
          step: 3,
          title: 'Apply quadratic formula',
          content: 'x = [FRAC:-(-8) ± √16:4]',
          latex: 'x = \\frac{-(-8) \\pm \\sqrt{16}}{2(2)}',
        },
        {
          step: 4,
          title: 'Calculate roots',
          content: 'x₁ = 3, x₂ = 1',
          latex: 'x_1 = 3, \\quad x_2 = 1',
        },
      ],
      answer: 'x = 3, x = 1',
      answers: ['x = 3', 'x = 1'],
      graphable: true,
      provider: 'demo',
    },
  },
];

export function getDemoSampleById(id: string): DemoQuadraticSample | undefined {
  return DEMO_QUADRATIC_SAMPLES.find((sample) => sample.id === id);
}
