import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getQuestionsForChapter, getQuestionsForConcept, SEED_CHAPTERS } from '../../data/curriculumSeed';
import { generateAdaptiveQuestions } from '../../services/aiClient';
import type { DifficultyLevel, QuestionItem } from '../../types/mastery';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['foundational', 'standard', 'application', 'challenge'];

interface SessionItemResult {
  question: QuestionItem;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export const PracticeQuestionsPage: React.FC = () => {
  const {
    selectedContext,
    setSelectedContext,
    learnerModel,
    submitValidatedAssessment,
    jumpToStudentPage,
  } = useApp();

  const activeChapter = useMemo(
    () => SEED_CHAPTERS.find((c) => c.chapterId === selectedContext.chapterId) ?? SEED_CHAPTERS[0],
    [selectedContext.chapterId]
  );

  const activeConcept = useMemo(
    () =>
      activeChapter.concepts.find((c) => c.conceptId === selectedContext.conceptId) ??
      activeChapter.concepts[0],
    [activeChapter, selectedContext.conceptId]
  );

  const conceptState = learnerModel[activeConcept.conceptId];

  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(
    conceptState?.difficultyLevel ?? activeConcept.difficultyLevel
  );
  const [questionPool, setQuestionPool] = useState<QuestionItem[]>(() => {
    const forConcept = getQuestionsForConcept(activeConcept.conceptId);
    if (forConcept.length > 0) return forConcept;
    return getQuestionsForChapter(activeChapter.chapterId);
  });
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionItemResult[]>([]);
  const [startMs, setStartMs] = useState<number>(Date.now());
  const [adaptationBanner, setAdaptationBanner] = useState<{
    direction: 'up' | 'down' | 'hold';
    message: string;
  } | null>(null);

  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState(false);
  const [sessionSavedId, setSessionSavedId] = useState<string | null>(null);

  const currentQ = questionPool[qIndex];

  const switchConcept = (chapterId: string, conceptId: string) => {
    const ch = SEED_CHAPTERS.find((c) => c.chapterId === chapterId) ?? SEED_CHAPTERS[0];
    const con = ch.concepts.find((c) => c.conceptId === conceptId) ?? ch.concepts[0];
    setSelectedContext({
      classLevel: ch.classLevel,
      subject: ch.subject,
      chapterId: ch.chapterId,
      conceptId: con.conceptId,
    });
    const nextPool = getQuestionsForConcept(con.conceptId);
    setQuestionPool(nextPool.length > 0 ? nextPool : getQuestionsForChapter(ch.chapterId));
    setCurrentDifficulty(learnerModel[con.conceptId]?.difficultyLevel ?? con.difficultyLevel);
    setQIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setShowHint(false);
    setAdaptationBanner(null);
    setSessionResults([]);
    setSessionSavedId(null);
    setAiError(null);
    setStartMs(Date.now());
  };

  const handleCheck = () => {
    if (selectedOption === null || !currentQ) return;
    const isCorrect = selectedOption === currentQ.correctOptionIndex;
    const elapsed = Math.max(1, Math.round((Date.now() - startMs) / 1000));
    const idx = DIFFICULTY_ORDER.indexOf(currentDifficulty);

    let nextDiff = currentDifficulty;
    if (!isCorrect) {
      nextDiff = DIFFICULTY_ORDER[Math.max(0, idx - 1)];
      setAdaptationBanner({
        direction: 'down',
        message: `Struggled on this item — stepping difficulty to "${nextDiff}", reviewing prerequisite (${activeConcept.prerequisites[0] ?? 'core foundation'}), and offering an easier step next.`,
      });
    } else {
      nextDiff = DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, idx + 1)];
      setAdaptationBanner({
        direction: 'up',
        message: `Strong accuracy — stepping up to "${nextDiff}" tier to build transfer & application mastery.`,
      });
    }

    setCurrentDifficulty(nextDiff);
    setSessionResults((prev) => [
      ...prev,
      {
        question: currentQ,
        selectedOptionIndex: selectedOption,
        isCorrect,
        timeSpentSeconds: elapsed,
      },
    ]);
    setChecked(true);
    setSessionSavedId(null);
  };

  const handleGenerateNextAdapted = async (targetDiff: DifficultyLevel) => {
    setGenerating(true);
    setAiError(null);
    try {
      const res = await generateAdaptiveQuestions({
        classLevel: activeChapter.classLevel,
        subject: activeChapter.subject,
        chapterTitle: activeChapter.title,
        conceptName: activeConcept.name,
        conceptId: activeConcept.conceptId,
        chapterId: activeChapter.chapterId,
        difficultyLevel: targetDiff,
        count: 2,
        focusMisconception: conceptState?.potentialMisconception || undefined,
      });
      setQuestionPool((prev) => [...prev, ...res.questions]);
      setQIndex(questionPool.length);
      setSelectedOption(null);
      setChecked(false);
      setShowHint(false);
      setStartMs(Date.now());
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to generate adaptive question via Gemini 4 Hydrogen.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCommitSession = async () => {
    if (sessionResults.length < 2 || savingModel) return;
    setSavingModel(true);
    try {
      const id = `prac_${activeConcept.conceptId}_${Date.now()}`;
      await submitValidatedAssessment({
        assessmentId: id,
        type: 'practice',
        classLevel: activeChapter.classLevel,
        subject: activeChapter.subject,
        chapterId: activeChapter.chapterId,
        results: sessionResults.map((r) => ({
          conceptId: r.question.conceptId,
          questionId: r.question.questionId,
          selectedOptionIndex: r.selectedOptionIndex,
          isCorrect: r.isCorrect,
          difficultyLevel: r.question.difficultyLevel,
          timeSpentSeconds: r.timeSpentSeconds,
        })),
      });
      setSessionSavedId(id);
    } finally {
      setSavingModel(false);
    }
  };

  const correctCount = sessionResults.filter((r) => r.isCorrect).length;

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left Adaptive Control Panel */}
      <aside className="lg:col-span-4 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
            Adaptive Practice Control
          </h2>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mt-0.5">
            Difficulty adapts live to your accuracy and Living Learner Model evidence.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="prac-chapter" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-1">
              Chapter
            </label>
            <select
              id="prac-chapter"
              value={activeChapter.chapterId}
              onChange={(e) => {
                const ch = SEED_CHAPTERS.find((c) => c.chapterId === e.target.value) ?? activeChapter;
                switchConcept(ch.chapterId, ch.concepts[0].conceptId);
              }}
              className="w-full rounded-xl px-3 py-2 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            >
              {SEED_CHAPTERS.map((ch) => (
                <option key={ch.chapterId} value={ch.chapterId}>
                  Class {ch.classLevel} · {ch.subject} · {ch.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prac-concept" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-1">
              Target Concept
            </label>
            <select
              id="prac-concept"
              value={activeConcept.conceptId}
              onChange={(e) => switchConcept(activeChapter.chapterId, e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            >
              {activeChapter.concepts.map((c) => (
                <option key={c.conceptId} value={c.conceptId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Concept Metrics */}
        <div className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#606C38] dark:text-[#DDA15E] font-semibold">Current Mastery</span>
            <span className="font-mono font-bold tabular-nums text-[#283618] dark:text-[#FEFAE0]">
              {conceptState ? `${conceptState.masteryScore}%` : 'Unassessed'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#606C38] dark:text-[#DDA15E] font-semibold">Adapted Tier</span>
            <span className="capitalize font-mono font-bold text-[#606C38] dark:text-[#DDA15E]">
              {currentDifficulty}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#606C38] dark:text-[#DDA15E] font-semibold">Session Progress</span>
            <span className="font-mono font-bold tabular-nums text-[#283618] dark:text-[#FEFAE0]">
              {correctCount}/{sessionResults.length} correct
            </span>
          </div>
          <div className="pt-2 border-t border-[#D8D3B4] dark:border-[#606C38]">
            <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/85">
              <strong>Prerequisites:</strong> {activeConcept.prerequisites.join(', ')}
            </p>
          </div>
        </div>

        {/* Commit Validated Session Button */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={sessionResults.length < 2 || savingModel || Boolean(sessionSavedId)}
            onClick={() => void handleCommitSession()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {savingModel
              ? 'Updating Learner Model...'
              : sessionSavedId
              ? 'Session Recorded in Learner Model'
              : sessionResults.length < 2
              ? `Answer ${2 - sessionResults.length} more Q to update mastery`
              : `Record ${sessionResults.length} Answers to Learner Model`}
          </button>
          <p className="text-[11px] text-[#606C38] dark:text-[#FEFAE0]/85 leading-snug">
            Minimum 2 validated questions required per update so a single guess never distorts your mastery score.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            jumpToStudentPage('tutor', {
              classLevel: activeChapter.classLevel,
              subject: activeChapter.subject,
              chapterId: activeChapter.chapterId,
              conceptId: activeConcept.conceptId,
            })
          }
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          Need Concept Explanation? Open AI Tutor
        </button>
      </aside>

      {/* Right Practice Question Workspace */}
      <section className="lg:col-span-8 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-7 space-y-5">
        {adaptationBanner && (
          <div className="rounded-xl p-3.5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#DDA15E] flex items-start gap-2.5 text-xs">
            {adaptationBanner.direction === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-[#BC6C25] shrink-0 mt-0.5" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
            )}
            <p className="text-[#283618] dark:text-[#FEFAE0] font-medium">{adaptationBanner.message}</p>
          </div>
        )}

        {aiError && (
          <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-start gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
            <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {currentQ ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#BC6C25] dark:text-[#DDA15E] inline-flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {activeConcept.name}
              </span>
              <span className="font-mono capitalize text-[#283618] dark:text-[#FEFAE0]/85">
                Difficulty: {currentQ.difficultyLevel} · {currentQ.sourceType === 'ai_generated' ? 'AI Generated' : 'Demo Seed'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] leading-snug">
              {currentQ.prompt}
            </h3>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isPicked = selectedOption === idx;
                const isCorrect = idx === currentQ.correctOptionIndex;
                let cls =
                  'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0] hover:border-[#606C38]';
                if (checked) {
                  if (isCorrect) cls = 'bg-[#606C38] text-white border-[#606C38]';
                  else if (isPicked) cls = 'bg-[#283618] text-[#DDA15E] border-[#DDA15E]';
                } else if (isPicked) {
                  cls = 'bg-[#283618] dark:bg-[#606C38] text-white border-[#606C38]';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={checked}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer disabled:cursor-default ${cls}`}
                  >
                    <span className="font-mono text-xs font-bold opacity-80">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {showHint && !checked && (
              <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#606C38] text-xs text-[#283618] dark:text-[#FEFAE0] flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
                <span>
                  <strong>Hint:</strong> {currentQ.hint}
                </span>
              </div>
            )}

            {checked && (
              <div className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#DDA15E]/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-[#283618] dark:text-[#FEFAE0]">
                  {selectedOption === currentQ.correctOptionIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#BC6C25]" />
                      Spot on!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
                      Not quite — here is the underlying concept
                    </>
                  )}
                </div>
                <p className="text-[#1C2412] dark:text-[#FEFAE0] leading-relaxed">
                  {currentQ.explanation}
                </p>
                <p className="text-[#606C38] dark:text-[#DDA15E]">
                  <strong>Watch-out:</strong> {currentQ.commonTrap}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]">
              {!checked ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleCheck}
                    className="px-6 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
                  >
                    Submit Answer
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-wrap items-center justify-between gap-3">
                  {qIndex + 1 < questionPool.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQIndex((i) => i + 1);
                        setSelectedOption(null);
                        setChecked(false);
                        setShowHint(false);
                        setStartMs(Date.now());
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-sm font-semibold cursor-pointer"
                    >
                      Next Queued Question
                    </button>
                  ) : (
                    <span className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                      End of seed pool for this concept — generate fresh calibrated questions below.
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void handleGenerateNextAdapted(currentDifficulty)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#283618] dark:bg-[#606C38] hover:bg-[#606C38] dark:hover:bg-[#BC6C25] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating {currentDifficulty} Qs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
                        Generate {currentDifficulty} AI Questions
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-10 text-center space-y-4">
            <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0]">
              No seed questions loaded for this concept yet.
            </p>
            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerateNextAdapted(currentDifficulty)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#606C38] text-white text-sm font-semibold cursor-pointer"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Practice Questions with Gemini 4 Hydrogen
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
