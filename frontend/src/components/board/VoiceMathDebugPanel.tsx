import { VoiceDebugEvent, formatVoiceDebugEvent } from '../../voice';

interface VoiceMathDebugPanelProps {
  events: VoiceDebugEvent[];
  sessionId?: number;
  equation: string;
}

export function VoiceMathDebugPanel({ events, sessionId, equation }: VoiceMathDebugPanelProps) {
  const recent = events.slice(-40);

  return (
    <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-amber-300 bg-amber-50/95 p-3 font-mono text-[11px] leading-snug text-amber-950 shadow-sm">
      <div className="mb-2 font-sans text-xs font-bold uppercase tracking-wide text-amber-800">
        Voice math debug {sessionId ? `(session ${sessionId})` : ''} — buffer: {equation || '(empty)'}
      </div>
      {recent.length === 0 ? (
        <div>Waiting for SpeechRecognition events…</div>
      ) : (
        <ol className="space-y-1">
          {recent.map((event, index) => (
            <li key={`${event.t}-${index}`}>{formatVoiceDebugEvent(event)}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
