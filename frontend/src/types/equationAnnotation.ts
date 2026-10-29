/** Visual-only cancellation overlay — never part of the math text. */
export interface TermCancellation {
  side: 'left' | 'right';
  /** Term to locate on that side, e.g. "- x", "+ 3", "- 5" */
  term: string;
  /** Which matching token on the side (default: first) */
  match?: 'first' | 'last' | number;
}

export interface AnnotatedEquation {
  text: string;
  cancellations?: TermCancellation[];
}
