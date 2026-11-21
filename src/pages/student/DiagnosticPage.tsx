import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getQuestionsForChapter, SEED_CHAPTERS } from '../../data/curriculumSeed';
import { analyzeDiagnosticMistakes, generateAdaptiveQuestions } from '../../services/aiClient';
import type { ModelUpdateSummary } from '../../services/learningEngine';
import type { MisconceptionHypothesis, QuestionItem } from '../../types/mastery';

interface RecordedAnswer {
  question: QuestionItem;
  selectedOptionIndex: number;
  isCorrect: boolean;
  studentNote: string;
  timeSpentSeconds: number;
}

export const DiagnosticPage: React.FC = () => {
  const { selectedContext, setSelectedContext, submitValidatedAssessment, jumpToStudentPage } =
    useApp();

  const activeChapter = useMemo(
    () => SEED_CHAPTERS.find((c) => c.chapterId === selectedContext.chapterId) ?? SEED_CHAPTERS[0],
    [selectedContext.chapterId]
  );

  const [stage, setStage] = useState<'setup' | 'active' | 'analyzing' | 'summary'>('setup');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [reasoningNote, setReasoningNote] = useState('');
  const [checkedCurrent, setCheckedCurrent] = useState(false);
  const [answers, setAnswers] = useState<RecordedAnswer[]>([]);
  const [questionStartMs, setQuestionStartMs] = useState<number>(Date.now());

  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hypotheses, setHypotheses] = useState<MisconceptionHypothesis[]>([]);
  const [diagnosticAdvice, setDiagnosticAdvice] = useState<{
    encouragement: string;
    nextStep: string;
  } | null>(null);
  const [modelSummary, setModelSummary] = useState<ModelUpdateSummary | null>(null);

  const startSeedDiagnostic = () => {
    const seedQs = getQuestionsForChapter(activeChapter.chapterId);
    const pool =
      seedQs.length >= 2
        ? seedQs
        : [
            ...seedQs,
            ...SEED_CHAPTERS.filter((c) => c.classLevel === activeChapter.classLevel)
              .flatMap((c) => getQuestionsForChapter(c.chapterId))
              .filter((q) => q.chapterId !== activeChapter.chapterId),
          ].slice(0, 4);

    setQuestions(pool);
    setAssessmentId(`diag_${activeChapter.chapterId}_${Date.now()}`);
    setCurrentIndex(0);
    setSelectedOption(null);
    setReasoningNote('');
    setCheckedCurrent(false);
    setAnswers([]);
    setHypotheses([]);
    setDiagnosticAdvice(null);
    setModelSummary(null);
    setAiError(null);
    setQuestionStartMs(Date.now());
    setStage('active');
  };

  const startAIGeneratedDiagnostic = async () => {
    setGeneratingAI(true);
    setAiError(null);
    try {
      const targetConcept = activeChapter.concepts[0];
      const res = await generateAdaptiveQuestions({
        classLevel: activeChapter.classLevel,
        subject: activeChapter.subject,
        chapterTitle: activeChapter.title,
        conceptName: targetConcept.name,
        conceptId: targetConcept.conceptId,
        chapterId: activeChapter.chapterId,
        difficultyLevel: 'standard',
        count: 3,
      });
      setQuestions(res.questions);
      setAssessmentId(`diag_ai_${activeChapter.chapterId}_${Date.now()}`);
      setCurrentIndex(0);
      setSelectedOption(null);
      setReasoningNote('');
      setCheckedCurrent(false);
      setAnswers([]);
      setHypotheses([]);
      setDiagnosticAdvice(null);
      setModelSummary(null);
      setQuestionStartMs(Date.now());
      setStage('active');
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to generate AI diagnostic questions.'
      );
    } finally {
      setGeneratingAI(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleCheckAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    const elapsed = Math.max(1, Math.round((Date.now() - questionStartMs) / 1000));

    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedOptionIndex: selectedOption,
        isCorrect,
        studentNote: reasoningNote.trim(),
        timeSpentSeconds: elapsed,
      },
    ]);
    setCheckedCurrent(true);
  };

  const handleNextOrFinish = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setReasoningNote('');
      setCheckedCurrent(false);
      setQuestionStartMs(Date.now());
      return;
    }

    // Complete Diagnostic -> Call Gemini Diagnostic Agent (for mistakes) -> Apply Deterministic Living Learner Model update
    setStage('analyzing');
    setAiError(null);

    const incorrectAnswers = answers.filter((a) => !a.isCorrect);
    let proposedHypotheses: MisconceptionHypothesis[] = [];

    if (incorrectAnswers.length > 0) {
      try {
        const conceptNames = new Map(activeChapter.concepts.map((c) => [c.conceptId, c.name]));
        const aiRes = await analyzeDiagnosticMistakes({
          classLevel: activeChapter.classLevel,
          subject: activeChapter.subject,
          chapterTitle: activeChapter.title,
          incorrectItems: incorrectAnswers.map((a) => ({
            conceptId: a.question.conceptId,
            conceptName: conceptNames.get(a.question.conceptId) ?? a.question.conceptId,
            questionPrompt: a.question.prompt,
            chosenOption: a.question.options[a.selectedOptionIndex] ?? 'Unknown',
            correctOption: a.question.options[a.question.correctOptionIndex] ?? 'Unknown',
            studentNote: a.studentNote || undefined,
          })),
        });
        proposedHypotheses = aiRes.data.hypotheses;
        setHypotheses(proposedHypotheses);
        setDiagnosticAdvice({
          encouragement: aiRes.data.overallEncouragement,
          nextStep: aiRes.data.recommendedNextStep,
        });
      } catch (err) {
        // Never fabricate fake AI output; proceed with deterministic mastery update & show honest AI note
        setAiError(
          err instanceof Error
            ? `Diagnostic Agent notice: ${err.message}. Deterministic mastery scores were still calculated accurately.`
            : 'Diagnostic Agent unavailable; deterministic mastery update completed.'
        );
      }
    }

    const updateRes = await submitValidatedAssessment({
      assessmentId,
      type: 'diagnostic',
      classLevel: activeChapter.classLevel,
      subject: activeChapter.subject,
      chapterId: activeChapter.chapterId,
      results: answers.map((a) => ({
        conceptId: a.question.conceptId,
        questionId: a.question.questionId,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect: a.isCorrect,
        difficultyLevel: a.question.difficultyLevel,
        timeSpentSeconds: a.timeSpentSeconds,
      })),
      misconceptionHypotheses: proposedHypotheses,
    });

    setModelSummary(updateRes);
    setStage('summary');
  };

  if (stage === 'setup') {
    const seedCount = getQuestionsForChapter(activeChapter.chapterId).length;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#606C38] to-[#283618] text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0]">
                Diagnostic Assessment
              </h2>
              <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1 leading-relaxed">
                Identify concept gaps and potential misconceptions one question at a time. When you finish, MASTERY AI updates your Living Learner Model deterministically and schedules spaced revisions automatically.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="diag-chapter" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-1.5">
                Select CBSE Chapter
              </label>
              <select
                id="diag-chapter"
                value={activeChapter.chapterId}
                onChange={(e) => {
                  const ch = SEED_CHAPTERS.find((c) => c.chapterId === e.target.value) ?? activeChapter;
                  setSelectedContext({
                    classLevel: ch.classLevel,
                    subject: ch.subject,
                    chapterId: ch.chapterId,
                    conceptId: ch.concepts[0]?.conceptId,
                  });
                }}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
              >
                {SEED_CHAPTERS.map((ch) => (
                  <option key={ch.chapterId} value={ch.chapterId}>
                    Class {ch.classLevel} · {ch.subject} · Ch {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl p-3.5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
              <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                Deterministic Mastery Formula
              </p>
              <p className="font-mono text-xs text-[#283618] dark:text-[#FEFAE0] mt-1">
                New = 0.7 × Previous + 0.3 × Score
              </p>
              <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                Protected by transactional deduplication so submissions never double-count.
              </p>
            </div>
          </div>

          {aiError && (
            <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] text-xs text-[#283618] dark:text-[#FEFAE0] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={startSeedDiagnostic}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Start Seed Diagnostic ({Math.max(2, seedCount)} Qs)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void startAIGeneratedDiagnostic()}
              disabled={generatingAI}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#283618] dark:bg-[#606C38] hover:bg-[#606C38] dark:hover:bg-[#BC6C25] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with Gemini 4 Hydrogen...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#DDA15E]" />
                  Generate Fresh AI Diagnostic (3 Qs)
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (stage === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#606C38] text-white flex items-center justify-center mx-auto">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0]">
          Updating your Living Learner Model...
        </h2>
        <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85">
          Computing deterministic mastery scores, checking for misconception hypotheses with Gemini 4 Hydrogen, and updating your spaced-repetition schedule.
        </p>
      </div>
    );
  }

  if (stage === 'summary') {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const scorePct = Math.round((correctCount / Math.max(1, answers.length)) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5E0C5] dark:border-[#606C38]">
            <div>
              <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                Diagnostic Completed · {activeChapter.title}
              </p>
              <h2 className="text-2xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
                Score: <span className="font-mono tabular-nums">{scorePct}%</span> ({correctCount}/{answers.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setStage('setup')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Diagnostic
            </button>
          </div>

          {/* Deterministic Mastery Deltas */}
          {modelSummary && modelSummary.masteryDeltas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#BC6C25]" />
                Living Learner Model Updates (Deterministic Formula Applied)
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {modelSummary.masteryDeltas.map((d) => (
                  <div
                    key={d.conceptId}
                    className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                  >
                    <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0]">
                      {d.conceptName}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1 font-mono tabular-nums">
                      <span className="text-sm text-[#606C38] dark:text-[#FEFAE0]/85">
                        {d.previousMastery}%
                      </span>
                      <span className="text-[#BC6C25]">→</span>
                      <span className="text-lg font-extrabold text-[#606C38] dark:text-[#DDA15E]">
                        {d.newMastery}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Misconception Hypotheses */}
          {hypotheses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                Proposed Misconception Hypotheses (Gemini 4 Hydrogen Diagnostic Agent)
              </h3>
              <div className="space-y-2.5">
                {hypotheses.map((h) => (
                  <div
                    key={h.conceptId}
                    className="rounded-xl p-4 bg-[#DDA15E]/20 dark:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#283618] dark:text-[#FEFAE0]">
                        {h.conceptName}
                      </span>
                      <span className="font-mono tabular-nums text-[#BC6C25] dark:text-[#DDA15E]">
                        Confidence: {Math.round(h.confidence * 100)}% (Hypothesis)
                      </span>
                    </div>
                    <p className="text-[#1C2412] dark:text-[#FEFAE0]">{h.hypothesis}</p>
                    <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                      <strong>Remediation:</strong> {h.remediationTip}
                    </p>
                    <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                      <strong>Prerequisite to review:</strong> {h.prerequisiteToReview}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticAdvice && (
            <div className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs space-y-1">
              <p className="font-semibold text-[#283618] dark:text-[#FEFAE0]">
                {diagnosticAdvice.encouragement}
              </p>
              <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                <strong>Recommended next step:</strong> {diagnosticAdvice.nextStep}
              </p>
            </div>
          )}

          {aiError && (
            <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] text-xs text-[#283618] dark:text-[#FEFAE0]/85">
              {aiError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                jumpToStudentPage('practice', {
                  classLevel: activeChapter.classLevel,
                  subject: activeChapter.subject,
                  chapterId: activeChapter.chapterId,
                })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-sm font-semibold cursor-pointer"
            >
              Launch Adaptive Practice
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpToStudentPage('revision')}
              className="px-4 py-2.5 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-sm font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
            >
              View Updated Revision Planner
            </button>
            <button
              type="button"
              onClick={() => jumpToStudentPage('progress')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline cursor-pointer"
            >
              See Progress Map
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Active Question Stage
  const lastRecorded = checkedCurrent ? answers[answers.length - 1] : null;
  return (
    <div className="max-w-3xl mx-auto">
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
            Question {currentIndex + 1} of {questions.length} · {activeChapter.title}
          </span>
          <span className="capitalize font-mono text-[#283618] dark:text-[#FEFAE0]/85">
            {currentQuestion.difficultyLevel} · {currentQuestion.sourceType === 'ai_generated' ? 'AI Practice' : 'Demo Seed'}
          </span>
        </div>

        <div className="h-2 rounded-full bg-[#DDA15E]/20 dark:bg-[#283618] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#606C38] to-[#283618] transition-all duration-300"
            style={{ width: `${((currentIndex + (checkedCurrent ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] leading-snug">
          {currentQuestion.prompt}
        </h2>

        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, idx) => {
            const isPicked = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correctOptionIndex;
            let style =
              'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0] hover:border-[#606C38]';
            if (checkedCurrent) {
              if (isCorrect) style = 'bg-[#606C38] text-white border-[#606C38]';
              else if (isPicked && !isCorrect) style = 'bg-[#283618] text-[#DDA15E] border-[#DDA15E]';
            } else if (isPicked) {
              style = 'bg-[#283618] dark:bg-[#606C38] text-white border-[#606C38]';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={checkedCurrent}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer disabled:cursor-default ${style}`}
              >
                <span className="font-mono text-xs font-bold opacity-80">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {!checkedCurrent && (
          <div>
            <label htmlFor="diag-reasoning" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-1">
              Optional: Briefly note your reasoning (helps Diagnostic Agent spot misconceptions)
            </label>
            <input
              id="diag-reasoning"
              type="text"
              value={reasoningNote}
              onChange={(e) => setReasoningNote(e.target.value)}
              placeholder="e.g., I set b² - 4ac = 0 and took the positive square root..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            />
          </div>
        )}

        {checkedCurrent && lastRecorded && (
          <div className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#DDA15E]/60 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#283618] dark:text-[#FEFAE0]">
              {lastRecorded.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#BC6C25]" />
                  Correct Answer
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
                  Incorrect — Let’s review the concept
                </>
              )}
            </div>
            <p className="text-[#1C2412] dark:text-[#FEFAE0] leading-relaxed">
              {currentQuestion.explanation}
            </p>
            {!lastRecorded.isCorrect && (
              <p className="text-[#606C38] dark:text-[#DDA15E]">
                <strong>Common trap:</strong> {currentQuestion.commonTrap}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {!checkedCurrent ? (
            <button
              type="button"
              disabled={selectedOption === null}
              onClick={handleCheckAnswer}
              className="px-6 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
            >
              Check Answer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleNextOrFinish()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-sm font-semibold cursor-pointer"
            >
              {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish & Update Learner Model'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
