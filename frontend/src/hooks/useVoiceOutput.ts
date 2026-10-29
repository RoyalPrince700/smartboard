import { useCallback, useEffect, useRef, useState } from 'react';
import { stripMarkdownForSpeech } from '../utils/speechText';
import { SpeechVoiceStyle, useAIStore } from '../stores/aiStore';

export interface SpeechSegment {
  text: string;
  onStart?: () => void;
}

export function useVoiceOutput() {
  const [supported, setSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechVoiceStyle = useAIStore((state) => state.speechVoiceStyle);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const selectVoice = useCallback(
    (style: SpeechVoiceStyle): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
      const candidates = englishVoices.length > 0 ? englishVoices : voices;
      const preferredQuality = /(natural|neural|online|premium|google|microsoft)/i;
      const femalePattern =
        /(female|zira|jenny|aria|samantha|victoria|karen|moira|tessa|susan|hazel|serena|ava|emma|libby|sonia|natasha|joanna|amy)/i;
      const malePattern =
        /(male|david|mark|daniel|alex|fred|george|guy|ryan|brian|arthur|aaron|matthew)/i;
      const stylePattern = style === 'female' ? femalePattern : malePattern;

      const ranked = [...candidates].sort((a, b) => {
        const aStyle = stylePattern.test(a.name) ? 1 : 0;
        const bStyle = stylePattern.test(b.name) ? 1 : 0;
        if (aStyle !== bStyle) return bStyle - aStyle;

        const aQuality = preferredQuality.test(a.name) ? 1 : 0;
        const bQuality = preferredQuality.test(b.name) ? 1 : 0;
        if (aQuality !== bQuality) return bQuality - aQuality;

        return Number(b.default) - Number(a.default);
      });

      return ranked[0] ?? null;
    },
    [voices]
  );

  const createUtterance = useCallback(
    (text: string, options?: { lang?: string; rate?: number }) => {
      const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
      utterance.lang = options?.lang ?? 'en-US';
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = speechVoiceStyle === 'female' ? 1.05 : 0.92;

      const voice = selectVoice(speechVoiceStyle);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      return utterance;
    },
    [selectVoice, speechVoiceStyle]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    utterancesRef.current = [];
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, options?: { lang?: string; rate?: number }) => {
      if (!supported || !text.trim()) return;

      stopSpeaking();

      const utterance = createUtterance(text, options);

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utterancesRef.current = [];
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utterancesRef.current = [];
      };

      utterancesRef.current = [utterance];
      window.speechSynthesis.speak(utterance);
    },
    [createUtterance, supported, stopSpeaking]
  );

  const speakSequence = useCallback(
    (
      segments: SpeechSegment[],
      options?: { lang?: string; rate?: number; onComplete?: () => void }
    ) => {
      const validSegments = segments.filter((segment) => segment.text.trim());
      if (!supported || validSegments.length === 0) return;

      stopSpeaking();

      const utterances = validSegments.map((segment, index) => {
        const utterance = createUtterance(segment.text, options);
        utterance.onstart = () => {
          setIsSpeaking(true);
          segment.onStart?.();
        };
        utterance.onend = () => {
          if (index === validSegments.length - 1) {
            setIsSpeaking(false);
            utterancesRef.current = [];
            options?.onComplete?.();
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          utterancesRef.current = [];
        };
        return utterance;
      });

      utterancesRef.current = utterances;
      for (const utterance of utterances) {
        window.speechSynthesis.speak(utterance);
      }
    },
    [createUtterance, supported, stopSpeaking]
  );

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  return {
    supported,
    isSpeaking,
    speak,
    speakSequence,
    stopSpeaking,
  };
}
