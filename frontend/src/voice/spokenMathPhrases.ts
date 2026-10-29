/**
 * Multi-word spoken-math rewrites. Longest phrases first.
 * Equals and "square root" must run before "square" / "to".
 */

function rewriteEquals(text: string): string {
  return text
    .replace(/\b(?:is\s+)?equal(?:s)?\s+to(?:o)?\b/g, ' = ')
    .replace(/\bequal(?:s)?\s+too\b/g, ' = ')
    .replace(/\bis\s+equal(?:s)?\b/g, ' = ')
    .replace(/\bequals?\b/g, ' = ')
    .replace(/\bdivided\s+by\b/g, ' / ')
    .replace(/\bmultiplied\s+by\b/g, ' * ')
    .replace(/\bmultiply\s+by\b/g, ' * ');
}

function rewriteInequalities(text: string): string {
  return text
    .replace(/\b(?:is\s+)?greater\s+than\s+or\s+equal(?:s)?(?:\s+to)?\b/g, ' >= ')
    .replace(/\b(?:is\s+)?less\s+than\s+or\s+equal(?:s)?(?:\s+to)?\b/g, ' <= ')
    .replace(/\b(?:is\s+)?at\s+least\b/g, ' >= ')
    .replace(/\b(?:is\s+)?at\s+most\b/g, ' <= ')
    .replace(/\b(?:is\s+)?greater\s+than\b/g, ' > ')
    .replace(/\b(?:is\s+)?more\s+than\b/g, ' > ')
    .replace(/\b(?:is\s+)?less\s+than\b/g, ' < ');
}

function rewriteBrackets(text: string): string {
  return text
    .replace(/\b(?:open|left)\s+(?:bracket|brackets|parenthesis|parentheses)\b/g, ' ( ')
    .replace(/\b(?:close|right)\s+(?:bracket|brackets|parenthesis|parentheses)\b/g, ' ) ')
    .replace(/\bopen\s+bracket\b/g, ' ( ')
    .replace(/\bclose\s+bracket\b/g, ' ) ');
}

function rewriteFunctions(text: string): string {
  return text
    .replace(/\bsquare\s+root(?:\s+of)?\b/g, ' sqrt ')
    .replace(/\broot\s+of\b/g, ' sqrt ')
    .replace(/\bsqrt(?:\s+of)?\b/g, ' sqrt ')
    .replace(/\babsolute\s+value(?:\s+of)?\b/g, ' abs ')
    .replace(/\babsolute(?:\s+of)?\b/g, ' abs ')
    .replace(/\babs(?:\s+of)?\b/g, ' abs ')
    .replace(/\bmodulus(?:\s+of)?\b/g, ' abs ')
    .replace(/\bsine\b/g, ' sin ')
    .replace(/\bcosine\b/g, ' cos ')
    .replace(/\btangent\b/g, ' tan ')
    .replace(/\bnatural\s+log(?:arithm)?(?:\s+of)?\b/g, ' ln ')
    .replace(/\bln(?:\s+of)?\b/g, ' ln ')
    .replace(/\blogarithm(?:\s+of)?\b/g, ' log ')
    .replace(/\blog(?:\s+of)?\b/g, ' log ')
    .replace(/\bpie\b/g, ' pi ');
}

function rewriteFractions(text: string): string {
  return text
    .replace(/\bone\s+half\b/g, ' 1 / 2 ')
    .replace(/\ba\s+half\b/g, ' 1 / 2 ')
    .replace(/\btwo\s+thirds\b/g, ' 2 / 3 ')
    .replace(/\bone\s+third\b/g, ' 1 / 3 ')
    .replace(/\bone\s+(?:quarter|fourth)\b/g, ' 1 / 4 ')
    .replace(/\bthree\s+quarters\b/g, ' 3 / 4 ');
}

function rewriteEquationSeparators(text: string): string {
  return text
    .replace(/\bnext\s+equation\b/g, ' , ')
    .replace(/\bsecond\s+equation\b/g, ' , ')
    .replace(/\band\s+then\b/g, ' , ');
}

export function rewriteSpokenPowerPhrases(text: string): string {
  return text
    .replace(/\b(?:raised|raise)\s+to(?:\s+the)?(?:\s+power)?(?:\s+of)?\b/g, ' ^ ')
    .replace(/\bto\s+(?:the\s+)?power(?:\s+of)?\b/g, ' ^ ')
    .replace(/\bto\s+the\b/g, ' ^ ')
    .replace(/\bpower(?:\s+of)?\b/g, ' ^ ');
}

export function rewriteSpokenMathPhrases(text: string): string {
  const prepared = rewriteFractions(
    rewriteFunctions(
      rewriteBrackets(
        rewriteEquals(
          rewriteInequalities(rewriteEquationSeparators(text))
        )
      )
    )
  );

  return rewriteSpokenPowerPhrases(prepared)
    .replace(/(\d+[xyz]?)(?:squared|square)\b/g, '$1 ^2 ')
    .replace(/(\d+[xyz]?)(?:cubed|cube)\b/g, '$1 ^3 ')
    .replace(/\b(?:squared|square)\b/g, ' ^2 ')
    .replace(/\b(?:cubed|cube)\b/g, ' ^3 ');
}

export const PREFIX_FUNCTIONS = new Set(['sqrt', 'abs']);
export const ATOM_FUNCTIONS = new Set(['sin', 'cos', 'tan', 'log', 'ln']);
export const COMPARATOR_VALUES = new Set(['=', '>', '<', '>=', '<=', ',']);
