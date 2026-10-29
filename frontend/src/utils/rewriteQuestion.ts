export function rewriteMathQuestion(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  let text = trimmed
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/–|−/g, '-')
    .replace(/\s+/g, '')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\*/g, '');

  text = text.replace(/([+\-/=])/g, ' $1 ');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/^-\s+/, '-');

  return text;
}

export function splitExplanationBlocks(text: string): string[] {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .trim();

  const parts = cleaned
    .split(/\n{2,}|(?=\n\d+\.\s)/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : cleaned ? [cleaned] : [];
}
