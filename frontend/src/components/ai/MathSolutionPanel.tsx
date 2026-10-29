import { Calculator } from 'lucide-react';
import { MathExpression } from '../math/MathExpression';
import { DiagramPreview } from '../math/DiagramPreview';
import { FinalAnswerCard, TutorStepCard } from '../tutor/TutorStepCard';
import { TutorAction, TutorActionBar, TutorActionId } from '../tutor/TutorActionBar';
import { SolveResponse } from '../../types/math';
import { useAIStore } from '../../stores/aiStore';
import { splitStepContent } from '../../utils/mathPresentation';
import { GeometryRecognitionDebug } from '../geometry/GeometryRecognitionDebug';
import { ObjectArithmeticScene } from '../math/ObjectArithmeticScene';

interface MathSolutionPanelProps {
  solution: SolveResponse;
  actions?: TutorAction[];
  onAction?: (id: TutorActionId) => void;
  loading?: boolean;
  showProblem?: boolean;
  displayMode?: 'panel' | 'board';
}

function getStepWhy(title: string, explanation?: string): string | undefined {
  const normalized = title.toLowerCase();
  if (normalized.includes('subtract')) {
    return 'Subtraction is the opposite of addition, so it removes the added term. We do it to both sides to keep the equation balanced.';
  }
  if (normalized.includes('add')) {
    return 'Adding the opposite amount removes the negative term. The same change on both sides keeps both sides equal.';
  }
  if (normalized.includes('divide')) {
    return 'Division undoes multiplication and helps leave the variable by itself. Dividing both sides by the same non-zero number keeps the equation balanced.';
  }
  if (normalized.includes('multiply')) {
    return 'Multiplication can clear a denominator or undo division. Applying it equally to both sides preserves the equation.';
  }
  if (normalized.includes('discriminant')) {
    return 'The discriminant tells us how many real solutions a quadratic has and which form those solutions take.';
  }
  if (normalized.includes('quadratic formula')) {
    return 'The quadratic formula works for every quadratic equation written in standard form, so it gives a reliable path to the roots.';
  }
  if (normalized.includes('order of operations') || normalized.includes('bidmas')) {
    return 'BIDMAS tells us which operations to do first: brackets, then indices, then × and ÷, then + and −.';
  }
  if (normalized.includes('identify') || normalized.includes('standard form')) {
    return 'Recognizing the type and form of the problem helps us choose the correct solving method.';
  }
  if (normalized.includes('split into two cases') || normalized.includes('case 1') || normalized.includes('case 2')) {
    return 'Absolute value gives distance from zero, so |A| = k means A = k or A = −k.';
  }
  if (normalized.includes('elimination') || normalized.includes('subtract the equations') || normalized.includes('add the equations') || normalized === 'add' || normalized === 'subtract') {
    return 'Elimination combines the equations so one variable cancels, leaving a single equation in one unknown.';
  }
  if (normalized.includes('eliminate')) {
    return 'We pick the variable whose coefficients are easiest to cancel — equal in size and opposite in sign means we can add the equations.';
  }
  if (normalized.includes('coefficient') || normalized.includes('constant')) {
    return 'Each equation has the form ax + by = c. The numbers a, b, and c tell us how to combine the equations.';
  }
  if (normalized.includes('combine like terms') || normalized.includes('term by term') || normalized.endsWith(' terms')) {
    return 'We add or subtract matching terms separately so the cancelled variable disappears and the rest stays balanced.';
  }
  if (normalized.includes('make coefficients match')) {
    return 'Multiplying an entire equation by the same number keeps it true and lets us line up coefficients for elimination.';
  }
  if (normalized.includes('evaluate the known part') || normalized.includes('isolate the remaining')) {
    return 'Replace the known variable with its value first, then solve the simpler one-variable equation that remains.';
  }
  if (normalized.includes('check in equation')) {
    return 'Substituting both answers into an original equation confirms the pair satisfies the system.';
  }
  if (normalized.includes('substitute')) {
    return 'Once one variable is known, plug it into either original equation to find the other.';
  }
  if (normalized.includes('exponent') || normalized.includes('same base')) {
    return 'When both sides share the same base, we can equate the exponents directly.';
  }
  if (normalized.includes('pythagoras') || normalized.includes('hypotenuse')) {
    return 'In a right-angled triangle the hypotenuse is opposite the right angle, so a² + b² = c² finds that longest side.';
  }
  if (normalized.includes('area')) {
    return 'Area is the space inside the shape. The formula depends on whether you drew a triangle, rectangle, square, or circle.';
  }
  if (normalized.includes('perimeter') || normalized.includes('circumference')) {
    return 'Perimeter is the distance around the outside. Add the side lengths, or use 2πr for a circle.';
  }
  return explanation;
}

export function MathSolutionPanel({
  solution,
  actions = [],
  onAction,
  loading = false,
  showProblem = true,
  displayMode = 'panel',
}: MathSolutionPanelProps) {
  const narrationFocus = useAIStore((state) => state.narrationFocus);
  const focusMode = useAIStore((state) => state.focusMode);
  const isBoard = displayMode === 'board';
  const isFocusBoard = isBoard && focusMode;

  return (
    <article className={isFocusBoard ? 'space-y-8' : isBoard ? 'space-y-6' : 'space-y-4'}>
      {!isFocusBoard && (
      <header className={`rounded-2xl border border-indigo-100 bg-indigo-50/70 ${isBoard ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
          <Calculator size={15} aria-hidden="true" />
          Mathematics
          <span className="font-medium normal-case tracking-normal text-slate-400">
            {solution.problemType}
          </span>
        </div>
        <h2 className={`mt-2 font-bold text-slate-900 ${isBoard ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
          Let&apos;s solve this together
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          We&apos;ll take it one clear step at a time.
        </p>
      </header>
      )}

      {solution.problemType === 'arithmetic' && (
        <ObjectArithmeticScene
          expression={solution.recognizedInput || solution.equation || ''}
        />
      )}

      {showProblem && (solution.equation || solution.recognizedInput) && (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            The problem
          </p>
          <div className="text-xl font-bold text-slate-900">
            <MathExpression
              text={solution.equation || solution.recognizedInput}
              block
            />
          </div>
        </section>
      )}

      {solution.diagram && (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Figure
          </p>
          <DiagramPreview key={JSON.stringify(solution.diagram.elements)} diagram={solution.diagram} />
          <GeometryRecognitionDebug />
        </section>
      )}

      <section>
        {!isFocusBoard && (
        <h3 className={`mb-3 font-bold text-slate-700 ${
          isBoard ? 'text-lg sm:text-xl' : 'text-sm'
        }`}>Step-by-step</h3>
        )}
        <ol className={isFocusBoard ? 'space-y-8' : isBoard ? 'space-y-5' : 'space-y-3'}>
          {solution.steps.map((step, index) => {
            const parsed = splitStepContent(step.content);
            const annotatedTexts = new Set(
              (step.annotatedEquations ?? []).map((equation) => equation.text)
            );
            const explanation = step.annotatedEquations?.length
              ? step.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter((line) => line && !annotatedTexts.has(line))
                  .join('\n')
              : parsed.explanation;
            const equations = step.annotatedEquations?.length ? [] : parsed.equations;

            return (
              <TutorStepCard
                key={step.step}
                number={step.step}
                title={step.title}
                explanation={explanation}
                equations={equations}
                annotatedEquations={step.annotatedEquations}
                latex={step.latex}
                why={step.why || getStepWhy(step.title, explanation)}
                index={index}
                displayMode={displayMode}
                isNarrating={
                  narrationFocus?.kind === 'step' && narrationFocus.step === step.step
                }
                activeEquationIndex={
                  narrationFocus?.kind === 'step' && narrationFocus.step === step.step
                    ? narrationFocus.equation
                    : undefined
                }
                activeTokenIndex={
                  narrationFocus?.kind === 'step' && narrationFocus.step === step.step
                    ? narrationFocus.token
                    : undefined
                }
              />
            );
          })}
        </ol>
      </section>

      <FinalAnswerCard
        answer={solution.answer}
        delay={solution.steps.length * 0.12 + 0.12}
        displayMode={displayMode}
        isNarrating={narrationFocus?.kind === 'answer'}
      />

      {solution.explanation && !isFocusBoard && (
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900">Tutor note</h3>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">{solution.explanation}</p>
        </aside>
      )}

      {onAction && (
        <TutorActionBar actions={actions} onAction={onAction} loading={loading} floating={isFocusBoard} />
      )}
    </article>
  );
}
