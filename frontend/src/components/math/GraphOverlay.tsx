import { useAIStore } from '../../stores/aiStore';
import { BoardGraphChart } from './BoardGraphChart';

export function GraphOverlay() {
  const currentGraph = useAIStore((s) => s.currentGraph);
  const showGraph = useAIStore((s) => s.showGraph);
  const setShowGraph = useAIStore((s) => s.setShowGraph);
  const setBoardLessonOpen = useAIStore((s) => s.setBoardLessonOpen);
  const hasTutorAnswer = useAIStore(
    (s) => Boolean(s.currentSolution || s.currentResponse || s.diagramAnalysis)
  );

  const closeGraph = () => {
    setShowGraph(false);
    if (hasTutorAnswer) setBoardLessonOpen(true);
  };

  if (!showGraph || !currentGraph) return null;

  return (
    <div className="absolute left-4 right-4 bottom-4 z-10 h-[40%] pointer-events-auto landscape-board:left-3 landscape-board:right-16 landscape-board:bottom-2 landscape-board:h-[36%]">
      <div className="relative h-full bg-white/95 rounded-xl border border-black/10 shadow-lg p-3">
        <button
          type="button"
          onClick={closeGraph}
          className="absolute top-2 right-2 z-10 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100"
        >
          Close
        </button>
        <BoardGraphChart graph={currentGraph} />
      </div>
    </div>
  );
}
