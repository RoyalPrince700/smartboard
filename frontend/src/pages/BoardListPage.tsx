import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CURRICULUM_SUBJECTS,
  EDUCATION_LEVELS,
  classShortLabel,
  findClass,
  formatSpanClasses,
  getTopicsForClass,
  groupTopicsByTheme,
  type ClassId,
  type CurriculumSubject,
  type CurriculumTopic,
} from '../data/curriculum';
import { createBoard, deleteBoard, fetchBoards } from '../services/api/boardApi';
import { BoardSummary } from '../types/board';
import { AuthHeaderActions } from '../components/auth/AuthHeaderActions';
import { useAuthStore } from '../stores/authStore';

type BrowseStep = 'subjects' | 'classes' | 'topics';

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-neutral-900 px-5 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function BoardListPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTopicId, setCreatingTopicId] = useState<string | null>(null);

  const [step, setStep] = useState<BrowseStep>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<ClassId | null>(null);

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const loadBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBoards();
      setBoards(result.boards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [user?.id]);

  const selectedClass = selectedClassId ? findClass(selectedClassId) : undefined;

  const topicGroups = useMemo(() => {
    if (!selectedSubject || !selectedClassId) return [];
    return groupTopicsByTheme(getTopicsForClass(selectedSubject, selectedClassId));
  }, [selectedSubject, selectedClassId]);

  const topicCount = topicGroups.reduce((sum, g) => sum + g.topics.length, 0);

  const handleCreate = async (title?: string) => {
    try {
      const board = await createBoard(title ? { title } : undefined);
      navigate(`/board/${board._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    }
  };

  const handleTeachTopic = async (topic: CurriculumTopic) => {
    if (!selectedClass) return;
    const title = `${selectedSubject?.name ?? 'Mathematics'} · ${selectedClass.shortLabel} · ${topic.title}`;
    setCreatingTopicId(topic.id);
    try {
      await handleCreate(title);
    } finally {
      setCreatingTopicId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this board?')) return;
    try {
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  };

  const openSubject = (subject: CurriculumSubject) => {
    if (!subject.available) return;
    setSelectedSubject(subject);
    setSelectedClassId(null);
    setStep('classes');
  };

  const openClass = (classId: ClassId) => {
    setSelectedClassId(classId);
    setStep('topics');
  };

  const goToSubjects = () => {
    setStep('subjects');
    setSelectedSubject(null);
    setSelectedClassId(null);
  };

  const goToClasses = () => {
    setStep('classes');
    setSelectedClassId(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f5f5f7] text-neutral-900 antialiased">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Top bar */}
        <header className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-900 text-[13px] font-semibold tracking-tight text-white">
              SB
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900 sm:text-[28px]">
                Smart Board
              </h1>
              <p className="text-[13px] text-neutral-500 sm:text-[15px]">
                Interactive classroom platform
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <AuthHeaderActions />
            <Link to="/whiteboard">
              <SecondaryButton>Whiteboard</SecondaryButton>
            </Link>
            <PrimaryButton onClick={() => handleCreate()}>New Board</PrimaryButton>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-12 rounded-3xl border border-neutral-200/80 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-500">
            NERDC curriculum · Nigeria
          </p>
          <h2 className="max-w-xl text-[28px] font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-[40px]">
            Teach from the curriculum.
            <br />
            On one board.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-500 sm:text-[17px]">
            Choose Mathematics, select a class, then open any topic on your Smart Board.
            Blank boards and the whiteboard remain available whenever you need them.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Primary 1–6', 'JSS 1–3', 'SS 1–3'].map((label) => (
              <span
                key={label}
                className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-[13px] font-medium text-neutral-600"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        {/* Breadcrumb */}
        {step !== 'subjects' && (
          <nav
            className="mb-6 flex flex-wrap items-center gap-2 text-[14px] text-neutral-400"
            aria-label="Curriculum path"
          >
            <button
              type="button"
              onClick={goToSubjects}
              className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
            >
              Subjects
            </button>
            {selectedSubject && (
              <>
                <span aria-hidden className="text-neutral-300">
                  /
                </span>
                <button
                  type="button"
                  onClick={goToClasses}
                  className={
                    step === 'classes'
                      ? 'font-medium text-neutral-900'
                      : 'text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline'
                  }
                >
                  {selectedSubject.name}
                </button>
              </>
            )}
            {selectedClass && step === 'topics' && (
              <>
                <span aria-hidden className="text-neutral-300">
                  /
                </span>
                <span className="font-medium text-neutral-900">{selectedClass.label}</span>
              </>
            )}
          </nav>
        )}

        {/* Subjects */}
        {step === 'subjects' && (
          <section className="mb-14">
            <div className="mb-5">
              <h3 className="text-[21px] font-semibold tracking-tight text-neutral-900">Subjects</h3>
              <p className="mt-1 text-[15px] text-neutral-500">
                Select a subject to browse classes and topics
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CURRICULUM_SUBJECTS.map((subject) => {
                const available = subject.available;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    disabled={!available}
                    onClick={() => openSubject(subject)}
                    className={`rounded-2xl border bg-white p-6 text-left transition-all ${
                      available
                        ? 'border-neutral-200 shadow-sm hover:border-neutral-300 hover:shadow-md'
                        : 'cursor-not-allowed border-neutral-100 opacity-55'
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-[15px] font-semibold text-neutral-700">
                        {subject.id === 'mathematics'
                          ? '∑'
                          : subject.id === 'english'
                            ? 'Aa'
                            : subject.id === 'physics'
                              ? 'Ph'
                              : 'Sc'}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-500">
                        {available ? 'Available' : 'Coming soon'}
                      </span>
                    </div>
                    <h4 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                      {subject.name}
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                      {subject.description}
                    </p>
                    <p className="mt-4 text-[12px] font-medium text-neutral-400">
                      {subject.curriculum}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Classes */}
        {step === 'classes' && selectedSubject && (
          <section className="mb-14">
            <div className="mb-6">
              <h3 className="text-[21px] font-semibold tracking-tight text-neutral-900">
                {selectedSubject.name}
              </h3>
              <p className="mt-1 text-[15px] text-neutral-500">
                Select a class to view curriculum topics
              </p>
            </div>

            <div className="space-y-4">
              {EDUCATION_LEVELS.map((level) => (
                <div
                  key={level.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4">
                    <h4 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                      {level.label}
                    </h4>
                    <p className="mt-0.5 text-[14px] text-neutral-500">{level.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
                    {level.classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => openClass(cls.id)}
                        className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-3 py-4 text-center transition-colors hover:border-neutral-300 hover:bg-neutral-100"
                      >
                        <span className="block text-[15px] font-semibold text-neutral-900">
                          {cls.shortLabel}
                        </span>
                        <span className="mt-1 block text-[12px] text-neutral-500">{cls.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Topics */}
        {step === 'topics' && selectedSubject && selectedClass && (
          <section className="mb-14">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-[21px] font-semibold tracking-tight text-neutral-900">
                  {selectedSubject.name} · {selectedClass.label}
                </h3>
                <p className="mt-1 text-[15px] text-neutral-500">
                  {topicCount} topics · Open a topic to start teaching
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <SecondaryButton onClick={goToClasses}>Change class</SecondaryButton>
                <PrimaryButton
                  onClick={() =>
                    handleCreate(`${selectedSubject.name} · ${selectedClass.shortLabel}`)
                  }
                >
                  Blank board
                </PrimaryButton>
              </div>
            </div>

            <div className="space-y-8">
              {topicGroups.map((group) => (
                <div key={group.theme}>
                  <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-wide text-neutral-500">
                    {group.theme}
                    <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                      {group.topics.length}
                    </span>
                  </h4>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {group.topics.map((topic) => {
                      const span = formatSpanClasses(topic.classes, selectedClass.id);
                      const busy = creatingTopicId === topic.id;
                      return (
                        <li key={topic.id}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleTeachTopic(topic)}
                            className="flex w-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:shadow-md disabled:opacity-50"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[14px] text-neutral-600">
                              →
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-medium text-neutral-900">
                                {topic.title}
                              </span>
                              {topic.description && (
                                <span className="mt-1 block text-[13px] leading-relaxed text-neutral-500">
                                  {topic.description}
                                </span>
                              )}
                              <span className="mt-2.5 flex flex-wrap gap-1.5">
                                {topic.classes.map((cid) => (
                                  <span
                                    key={cid}
                                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                                      cid === selectedClass.id
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 text-neutral-500'
                                    }`}
                                  >
                                    {classShortLabel(cid)}
                                  </span>
                                ))}
                                {span && (
                                  <span className="text-[11px] text-neutral-400">{span}</span>
                                )}
                              </span>
                              {busy && (
                                <span className="mt-2 block text-[13px] text-neutral-500">
                                  Opening board…
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved boards */}
        <section className="border-t border-neutral-200 pt-10 pb-16">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[21px] font-semibold tracking-tight text-neutral-900">
                Your boards
              </h3>
              <p className="mt-1 text-[15px] text-neutral-500">Saved classroom sessions</p>
              {!user && (
                <p className="mt-2 text-[14px] text-neutral-500">
                  <Link to="/login" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
                    Sign in
                  </Link>{' '}
                  to save boards to your account.
                </p>
              )}
            </div>
            <PrimaryButton onClick={() => handleCreate()}>New Board</PrimaryButton>
          </div>

          {loading ? (
            <p className="text-[15px] text-neutral-500">Loading boards…</p>
          ) : boards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
              <p className="text-[17px] font-medium text-neutral-900">No boards yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[14px] text-neutral-500">
                Create a blank board, or open a curriculum topic above to start teaching.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <Link to="/whiteboard">
                  <SecondaryButton>Whiteboard</SecondaryButton>
                </Link>
                <PrimaryButton onClick={() => handleCreate()}>Create Board</PrimaryButton>
              </div>
            </div>
          ) : (
            <ul className="grid gap-2.5">
              {boards.map((board) => (
                <li key={board._id}>
                  <Link
                    to={`/board/${board._id}`}
                    className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-semibold tracking-tight text-neutral-900">
                          {board.title}
                        </h2>
                        <p className="mt-1 text-[13px] text-neutral-500">
                          {board.strokeCount} strokes · Updated{' '}
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(board._id, e)}
                        className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
