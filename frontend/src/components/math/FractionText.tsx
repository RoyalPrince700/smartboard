import { parseFractionSegments } from '../../utils/mathFraction';

interface FractionTextProps {
  text: string;
  className?: string;
}

export function FractionText({ text, className }: FractionTextProps) {
  const segments = parseFractionSegments(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'fraction') {
          return (
            <span key={index} className="inline-flex flex-col items-center align-middle mx-0.5 leading-none">
              <span className="px-1 pb-0.5 border-b border-current">{segment.numerator}</span>
              <span className="px-1 pt-0.5">{segment.denominator}</span>
            </span>
          );
        }

        return (
          <span key={index} className="whitespace-pre-wrap">
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}
