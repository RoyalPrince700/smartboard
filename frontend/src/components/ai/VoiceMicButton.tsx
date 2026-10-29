import clsx from 'clsx';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useAIStore } from '../../stores/aiStore';
import { Button } from '../common/Button';

interface VoiceMicButtonProps {
  onVoiceAsk: (text: string) => void;
  disabled?: boolean;
}

export function VoiceMicButton({ onVoiceAsk, disabled }: VoiceMicButtonProps) {
  const setInputText = useAIStore((s) => s.setInputText);
  const setPanelOpen = useAIStore((s) => s.setPanelOpen);

  const { supported, isListening, interimTranscript, toggleListening } = useVoiceInput({
    onFinalTranscript: (text) => {
      setInputText(text);
      setPanelOpen(true);
      onVoiceAsk(text);
    },
  });

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        variant={isListening ? 'accent' : 'default'}
        title={isListening ? 'Stop listening' : 'Ask with your voice'}
        className={clsx(isListening && 'animate-pulse')}
      >
        {isListening ? 'LISTENING…' : 'MIC'}
      </Button>
      {isListening && interimTranscript && (
        <span className="text-white/50 text-xs truncate max-w-[140px]">{interimTranscript}</span>
      )}
    </div>
  );
}
