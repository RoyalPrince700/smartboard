import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BoardToolbar } from '../components/board/BoardToolbar';
import { WhiteboardCanvas } from '../components/board/WhiteboardCanvas';
import { BoardLayout } from '../components/layout/BoardLayout';
import { useAIActions } from '../hooks/useAIActions';
import { useBoardPersistence } from '../hooks/useBoardPersistence';
import { useAIStore } from '../stores/aiStore';
import { useBoardStore } from '../stores/boardStore';
import { loadOpenCV } from '../engine/geometry/opencv/opencvLoader';

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const title = useBoardStore((s) => s.title);
  const setTitle = useBoardStore((s) => s.setTitle);
  const clearBoard = useBoardStore((s) => s.clearBoard);
  const boardId = useBoardStore((s) => s.boardId);
  const { createAndNavigate } = useBoardPersistence(id);
  const {
    askAI,
    handleVoiceTeaching,
    cancelVoiceEquation,
    loadAIStatus,
    speakCurrentResponse,
    stopSpeaking,
    isSpeaking,
    voiceOutputSupported,
    runTutorAction,
  } = useAIActions();

  useEffect(() => {
    if (id === 'new') {
      createAndNavigate().then((newId) => {
        navigate(`/board/${newId}`, { replace: true });
      });
    }
  }, [id, createAndNavigate, navigate]);

  useEffect(() => {
    loadAIStatus();
  }, [loadAIStatus]);

  useEffect(() => {
    void loadOpenCV();
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear the entire board? This can be undone once.')) {
      cancelVoiceEquation();
      clearBoard();
      const ai = useAIStore.getState();
      ai.setInputText('');
      ai.setRecognizedText(null);
      ai.setError(null);
      ai.setCurrentResponse(null);
      ai.setCurrentSolution(null);
      ai.setShowGraph(false);
      ai.setCurrentGraph(null);
      ai.setShowDiagram(false);
      ai.setCurrentDiagram(null);
      ai.setDiagramAnalysis(null);
      ai.setBoardLessonOpen(false);
      ai.clearAgentResults();
    }
  };

  if (id === 'new' || !boardId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f5f5f7] text-neutral-500">
        Loading board...
      </div>
    );
  }

  return (
    <BoardLayout
      title={title}
      onTitleChange={setTitle}
      toolbar={<BoardToolbar onClear={handleClear} />}
    >
      <WhiteboardCanvas
        onTutorAction={runTutorAction}
        onAsk={() => askAI()}
        onVoiceAsk={(text) => handleVoiceTeaching(text)}
        onCancelVoice={cancelVoiceEquation}
        onSpeak={speakCurrentResponse}
        onStopSpeaking={stopSpeaking}
        isSpeaking={isSpeaking}
        voiceOutputSupported={voiceOutputSupported}
      />
    </BoardLayout>
  );
}
