import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  RotateCcw,
  Timer,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_QUESTIONS } from '../../data/curriculumSeed';
import type { ClassLevel, QuestionItem } from '../../types/mastery';

export const ExamSimulatorPage: React.FC = () => {
  const { userProfile, submitValidatedAssessment, jumpToStudentPage } = useApp();

  const [classChoice, setClassChoice] = useState<ClassLevel>(userProfile?.classLevel ?? '10');
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [stage, setStage] = useState<'instructions' | 'running' | 'review'>('instructions');

  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [submitting, setSubmitting] = useState(false);

  const availablePool = useMemo(
    () => SEED_QUESTIONS.filter((q) => q.classLevel === classChoice),
    [classChoice]
  );

  const startExam = () => {
    const pool = availablePool.length >= 3 ? availablePool : SEED_QUESTIONS.slice(0, 6);
    setExamQuestions(pool);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setFlagged({});
    setRemainingSeconds(durationMinutes * 60);
    setStage('running');
  };

  const finishExam = async () => {
    if (submitting || stage !== 'running') return;
    setSubmitting(true);
    try {
      const results = examQuestions.map((q, idx) => {
        const chosen = selectedAnswers[idx] ?? -1;
        return {
          conceptId: q.conceptId,
          questionId: q.questionId,
          selectedOptionIndex: Math.max(0, chosen),
          isCorrect: chosen === q.correctOptionIndex,
          difficultyLevel: q.difficultyLevel,
          timeSpentSeconds: Math.max(5, Math.round((durationMinutes * 60 - remainingSeconds) / Math.max(1, examQuestions.length))),
        };
      });

      const first = examQuestions[0];
      await submitValidatedAssessment({
        assessmentId: `exam_c${classChoice}_${Date.now()}`,
        type: 'exam',
        classLevel: classChoice,
        subject: first?.subject ?? 'Mixed',
        chapterId: first?.chapterId ?? 'cbse_10_math_ch4',
        results,
      });
      setStage('review');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (stage !== 'running') return;
    if (remainingSeconds <= 0) {
      void finishExam();
      return;
    }
    const timer = setInterval(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, remainingSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (stage === 'instructions') {
    return (
      <div className="max-w-3xl mx-auto">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#606C38] to-[#283618] text-white flex items-center justify-center shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0]">
                CBSE Practice Exam Simulator
              </h2>
              <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                Timed practice test drawn from seeded CBSE concepts. Results automatically update your Living Learner Model and flag weak concepts for spaced revision.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-2">
                Select CBSE Class
              </p>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
                {(['10', '11', '12'] as ClassLevel[]).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setClassChoice(cls)}
                    className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                      classChoice === cls
                        ? 'bg-[#606C38] text-white'
                        : 'text-[#283618] dark:text-[#FEFAE0]/85'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-2">
                Exam Timer
              </p>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
                {[5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-[#606C38] text-white'
                        : 'text-[#283618] dark:text-[#FEFAE0]/85'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2 text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">
            <p className="font-bold text-[#283618] dark:text-[#FEFAE0]">Exam Instructions</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Questions included: <strong>{Math.max(3, availablePool.length)}</strong> representative MCQs (+1 mark each, no negative marking).
              </li>
              <li>Use the side navigator to jump between questions or flag items for review before submitting.</li>
              <li>
                <strong>Transparency Notice:</strong> These are representative demo practice questions for CBSE Classes 10–12, not verified official previous-year CBSE board papers.
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startExam}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-sm font-semibold cursor-pointer"
          >
            Start Timed Exam
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    );
  }

  if (stage === 'review') {
    const correctCount = examQuestions.filter(
      (q, i) => selectedAnswers[i] === q.correctOptionIndex
    ).length;
    const scorePct = Math.round((correctCount / Math.max(1, examQuestions.length)) * 100);
    const missedQuestions = examQuestions.filter(
      (q, i) => selectedAnswers[i] !== q.correctOptionIndex
    );

    return (
      <div className="space-y-6">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
              CBSE Class {classChoice} Practice Exam · Completed
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#283618] dark:text-[#FEFAE0] mt-1 font-mono tabular-nums">
              {scorePct}% ({correctCount}/{examQuestions.length} Correct)
            </h2>
            <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
              Living Learner Model & Revision Planner have been updated with your verified exam results.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStage('instructions')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Simulator
            </button>
            <button
              type="button"
              onClick={() => jumpToStudentPage('revision')}
              className="px-4 py-2.5 rounded-xl bg-[#606C38] text-white text-xs font-semibold cursor-pointer"
            >
              Review Weak Topics
            </button>
          </div>
        </section>

        {missedQuestions.length > 0 && (
          <section className="rounded-[20px] bg-[#283618] text-[#FEFAE0] p-5 border border-[#606C38]">
            <h3 className="text-sm font-bold mb-2">Recommended Weak-Topic Follow-Up</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(missedQuestions.map((q) => q.chapterId))).map((chId) => {
                const sample = missedQuestions.find((q) => q.chapterId === chId)!;
                return (
                  <button
                    key={chId}
                    type="button"
                    onClick={() =>
                      jumpToStudentPage('practice', {
                        classLevel: sample.classLevel,
                        subject: sample.subject,
                        chapterId: sample.chapterId,
                        conceptId: sample.conceptId,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#606C38] hover:bg-[#DDA15E] text-white text-xs font-semibold cursor-pointer"
                  >
                    Practice {sample.subject} Gap →
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Answer Review List */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
            Detailed Answer Review
          </h3>
          {examQuestions.map((q, idx) => {
            const chosen = selectedAnswers[idx];
            const isCorrect = chosen === q.correctOptionIndex;
            return (
              <div
                key={q.questionId}
                className="rounded-2xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                    Q{idx + 1}. {q.prompt}
                  </p>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#606C38] dark:text-[#DDA15E] shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#606C38] dark:text-[#FEFAE0]/85 shrink-0">
                      <XCircle className="w-4 h-4" /> {chosen === undefined ? 'Skipped' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">
                  <strong>Your Answer:</strong>{' '}
                  {chosen !== undefined ? q.options[chosen] : 'Not answered'} ·{' '}
                  <strong>Correct Answer:</strong> {q.options[q.correctOptionIndex]}
                </p>
                <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  // Running Exam Interface
  const q = examQuestions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Main Question Area */}
      <section className="lg:col-span-8 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E0C5] dark:border-[#606C38]">
          <span className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E]">
            Question {currentIdx + 1} of {examQuestions.length} · {q.subject}
          </span>
          <div className="inline-flex items-center gap-2 font-mono text-sm font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
            <Clock className="w-4 h-4" />
            {formatTimer(remainingSeconds)}
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] leading-snug">
          {q.prompt}
        </h3>

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isPicked = selectedAnswers[currentIdx] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: idx }))}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer ${
                  isPicked
                    ? 'bg-[#606C38] text-white border-[#606C38]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0] hover:border-[#606C38]'
                }`}
              >
                <span className="font-mono text-xs font-bold opacity-80">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E5E0C5] dark:border-[#606C38]">
          <button
            type="button"
            onClick={() => setFlagged((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
              flagged[currentIdx]
                ? 'bg-[#DDA15E] text-white border-transparent'
                : 'border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]/85'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            {flagged[currentIdx] ? 'Marked for Review' : 'Mark for Review'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] disabled:opacity-40 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
            >
              Previous
            </button>
            {currentIdx + 1 < examQuestions.length ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="px-5 py-2 rounded-xl bg-[#606C38] text-white text-xs font-semibold cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void finishExam()}
                className="px-5 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-bold cursor-pointer"
              >
                {submitting ? 'Scoring...' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Right Question Navigator Palette */}
      <aside className="lg:col-span-4 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
            Question Navigator
          </h3>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 tabular-nums mt-0.5">
            {answeredCount} of {examQuestions.length} answered
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {examQuestions.map((_, i) => {
            const isAnswered = selectedAnswers[i] !== undefined;
            const isFlagged = Boolean(flagged[i]);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIdx(i)}
                className={`h-10 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-[#DDA15E] bg-[#606C38] text-white border-[#606C38]'
                    : isFlagged
                    ? 'bg-[#BC6C25] text-[#283618] border-transparent'
                    : isAnswered
                    ? 'bg-[#606C38] text-white border-[#606C38]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0]/85 border-[#D8D3B4] dark:border-[#606C38]'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void finishExam()}
          className="w-full py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-bold cursor-pointer"
        >
          {submitting ? 'Submitting Exam...' : 'Finish & Submit Exam'}
        </button>
      </aside>
    </div>
  );
};
