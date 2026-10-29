export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\[FRAC:([^:\]]+):([^:\]]+)\]/g, '$1 over $2')
    .replace(/([A-Za-z0-9)\]])\s*\^\s*2/g, '$1 squared')
    .replace(/([A-Za-z0-9)\]])\s*\^\s*3/g, '$1 cubed')
    .replace(/([A-Za-z0-9)\]])²/g, '$1 squared')
    .replace(/([A-Za-z0-9)\]])³/g, '$1 cubed')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function formatMathForSpeech(text: string): string {
  return stripMarkdownForSpeech(text)
    .replace(/\((-[^)]+)\)/g, '$1')
    .replace(/([A-Za-z0-9)\]])\s*\^\s*2/g, '$1 squared')
    .replace(/([A-Za-z0-9)\]])\s*\^\s*3/g, '$1 cubed')
    .replace(/²/g, ' squared ')
    .replace(/³/g, ' cubed ')
    .replace(/→/g, '. This gives ')
    .replace(/÷/g, ' divided by ')
    .replace(/×/g, ' times ')
    .replace(/=/g, ' equals ')
    .replace(/\+/g, ' plus ')
    .replace(/-/g, ' minus ')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
