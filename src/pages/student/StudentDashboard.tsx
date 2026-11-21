import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { CircularMasteryRing, StudyHeroIllustration } from '../../components/BrandMark';
import { DEMO_WEEKLY_ACTIVITY } from '../../data/demoData';
import { getChapterById, SEED_CHAPTERS } from '../../data/curriculumSeed';
import { todayISO } from '../../services/learningEngine';
import { fetchAdaptiveRecommendation } from '../../services/aiClient';

export const StudentDashboard: React.FC = () => {
  const {
    userProfile,
    learnerModel,
    assessments,
    revisions,
    isDemoMode,
    jumpToStudentPage,
    completeRevisionTask,
  } = useApp();

  const [chartMode, setChartMode] = useState<'mastery' | 'activity'>('mastery');
  const [aiAdvice, setAiAdvice] = useState<{
    recommendedConceptId: string;
    recommendedAction: string;
    difficultyGuidance: string;
    prerequisiteCheck: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const conceptsList = useMemo(() => Object.values(learnerModel), [learnerModel]);

  const overallMastery = useMemo(() => {
    if (conceptsList.length === 0) return 0;
    const sum = conceptsList.reduce((acc, c) => acc + c.masteryScore, 0);
    return Math.round(sum / conceptsList.length);
  }, [conceptsList]);

  const weakConcepts = useMemo(
    () =>
      [...conceptsList]
        .filter((c) => c.masteryScore < 70)
        .sort((a, b) => a.masteryScore - b.masteryScore),
    [conceptsList]
  );

  const ringConcepts = useMemo(() => {
    if (conceptsList.length > 0) {
      return [...conceptsList]
        .sort((a, b) => b.evidenceCount - a.evidenceCount)
        .slice(0, 6);
    }
    // Fresh signed-in user: show first 6 concepts from their class at 0%
    const classLevel = userProfile?.classLevel ?? '10';
    return SEED_CHAPTERS.filter((ch) => ch.classLevel === classLevel)
      .flatMap((ch) =>
        ch.concepts.map((c) => ({
          conceptId: c.conceptId,
          conceptName: c.name,
          chapterId: ch.chapterId,
          subject: ch.subject,
          classLevel: ch.classLevel,
          masteryScore: 0,
        }))
      )
      .slice(0, 6);
  }, [conceptsList, userProfile?.classLevel]);

  const barData = useMemo(() => {
    if (chartMode === 'activity') {
      return DEMO_WEEKLY_ACTIVITY.map((d) => ({
        name: d.day,
        value: d.minutes,
        secondary: `${d.questions} Qs · ${d.accuracy}%`,
      }));
    }
    const source = conceptsList.length > 0 ? conceptsList.slice(0, 6) : ringConcepts;
    return source.map((c) => ({
      name: c.conceptName.split(' ').slice(0, 2).join(' '),
      fullName: c.conceptName,
      value: c.masteryScore,
      secondary: c.subject,
    }));
  }, [chartMode, conceptsList, ringConcepts]);

  const today = todayISO();
  const pendingRevisions = useMemo(
    () => revisions.filter((r) => r.status === 'pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [revisions]
  );
  const dueTodayCount = pendingRevisions.filter((r) => r.dueDate <= today).length;

  const recommendedConcept = weakConcepts[0] ?? conceptsList[0];
  const recommendedChapter =
    (recommendedConcept ? getChapterById(recommendedConcept.chapterId) : undefined) ??
    SEED_CHAPTERS.find((c) => c.classLevel === (userProfile?.classLevel ?? '10')) ??
    SEED_CHAPTERS[0];

  const handleRequestAdaptiveTip = async () => {
    if (conceptsList.length === 0) {
      jumpToStudentPage('diagnostic');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchAdaptiveRecommendation({
        classLevel: userProfile?.classLevel ?? '10',
        conceptsSummary: conceptsList.slice(0, 12).map((c) => ({
          conceptId: c.conceptId,
          conceptName: c.conceptName,
          subject: c.subject,
          masteryScore: c.masteryScore,
          difficultyLevel: c.difficultyLevel,
          potentialMisconception: c.potentialMisconception || '',
        })),
      });
      setAiAdvice(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini Adaptive Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  const firstName = (userProfile?.displayName ?? 'Student').split(' ')[0];

  return (
    <div className="grid xl:grid-cols-12 gap-6 items-start">
      {/* LEFT / PRIMARY COLUMN (8 cols — inspired by attached Student Dashboard layout) */}
      <div className="xl:col-span-8 space-y-6 min-w-0">
        {/* 1. Hero Welcome & Continue Learning Banner */}
        <section className="rounded-[20px] bg-gradient-to-r from-[#283618] via-[#606C38] to-[#BC6C25] p-6 sm:p-7 text-white shadow-lg shadow-[#283618]/15">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-lg">
              <div className="text-xs font-medium text-[#FEFAE0]/85 flex flex-wrap items-center gap-2">
                <span>Class {userProfile?.classLevel ?? '10'} CBSE</span>
                <span aria-hidden="true">·</span>
                <span>{(userProfile?.selectedSubjects ?? ['Mathematics', 'Science']).join(', ')}</span>
                {isDemoMode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Demo Data</span>
                  </>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Hello, {firstName}!
              </h2>

              <p className="text-sm text-[#FEFAE0]/95 leading-relaxed">
                {dueTodayCount > 0
                  ? `You have ${dueTodayCount} priority revision ${dueTodayCount === 1 ? 'task' : 'tasks'} due today and ${weakConcepts.length} concept${weakConcepts.length === 1 ? '' : 's'} below 70% mastery. Let’s close your top gap first.`
                  : 'Your revision queue is clear. Take a quick diagnostic or explore your next CBSE chapter to expand your Living Learner Model.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    jumpToStudentPage('practice', {
                      classLevel: recommendedChapter.classLevel,
                      subject: recommendedChapter.subject,
                      chapterId: recommendedChapter.chapterId,
                      conceptId: recommendedConcept?.conceptId ?? recommendedChapter.concepts[0]?.conceptId,
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#283618] hover:bg-[#FEFAE0] text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Continue Learning
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    jumpToStudentPage('diagnostic', {
                      classLevel: recommendedChapter.classLevel,
                      subject: recommendedChapter.subject,
                      chapterId: recommendedChapter.chapterId,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#283618]/45 hover:bg-[#283618]/70 border border-white/25 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Run Diagnostic
                </button>
              </div>
            </div>

            <div className="hidden sm:flex justify-end">
              <StudyHeroIllustration />
            </div>
          </div>
        </section>

        {/* 2. Middle Split Row: Performance Bar Chart + Circular Mastery Rings */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Performance / Weekly Activity Card (matches screenshot's Performance bar chart) */}
          <section className="lg:col-span-7 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Performance
                </h3>
                <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                  {chartMode === 'mastery'
                    ? 'Concept mastery from Living Learner Model'
                    : isDemoMode
                    ? 'Weekly study minutes (Demo sample)'
                    : 'Weekly study activity'}
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
                <button
                  type="button"
                  onClick={() => setChartMode('mastery')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'mastery'
                      ? 'bg-[#606C38] text-white'
                      : 'text-[#283618] dark:text-[#FEFAE0]/85'
                  }`}
                >
                  Mastery
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('activity')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'activity'
                      ? 'bg-[#606C38] text-white'
                      : 'text-[#283618] dark:text-[#FEFAE0]/85'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-[#606C38] dark:text-[#DDA15E] font-medium">
                  {chartMode === 'mastery' ? 'Overall Concept Mastery' : 'Weekly Learning Time'}
                </p>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-extrabold tabular-nums text-[#283618] dark:text-[#FEFAE0]">
                    {chartMode === 'mastery' ? `${overallMastery}%` : '307m'}
                  </span>
                  <span className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                    {chartMode === 'mastery'
                      ? `${conceptsList.length} concepts tracked`
                      : `Goal: ${(userProfile?.dailyGoalMinutes ?? 45) * 7}m/wk`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => jumpToStudentPage('curriculum')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] hover:bg-[#DDA15E]/20 dark:hover:bg-[#BC6C25] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer whitespace-nowrap"
              >
                All Lessons
              </button>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96, 108, 56, 0.22)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#606C38' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={chartMode === 'mastery' ? [0, 100] : [0, 75]}
                    tick={{ fontSize: 11, fill: '#606C38' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(221, 161, 94, 0.14)' }}
                    contentStyle={{
                      backgroundColor: '#283618',
                      borderColor: '#BC6C25',
                      borderRadius: '12px',
                      color: '#FEFAE0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={32}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`bar_${index}`}
                        fill={
                          chartMode === 'mastery' && entry.value < 55
                            ? '#BC6C25'
                            : index % 2 === 0
                            ? '#606C38'
                            : '#DDA15E'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Concept Mastery Rings Card (matches screenshot's "My visit" circular ring grid) */}
          <section className="lg:col-span-5 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Concept Mastery
                </h3>
                <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                  Click any ring to practice
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToStudentPage('progress')}
                className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer whitespace-nowrap"
              >
                Full Map
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1">
              {ringConcepts.map((c) => (
                <CircularMasteryRing
                  key={c.conceptId}
                  percent={c.masteryScore}
                  label={c.conceptName}
                  sublabel={c.subject}
                  size={68}
                  onClick={() =>
                    jumpToStudentPage('practice', {
                      classLevel: c.classLevel,
                      subject: c.subject,
                      chapterId: c.chapterId,
                      conceptId: c.conceptId,
                    })
                  }
                />
              ))}
            </div>
          </section>
        </div>

        {/* 3. Weak Concepts & Recent Assessments (matches screenshot's bottom list section) */}
        <div className="grid lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Weak Concepts & Misconceptions
                </h3>
                <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                  Prioritized from your Living Learner Model
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToStudentPage('practice')}
                className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer whitespace-nowrap"
              >
                See all
              </button>
            </div>

            {weakConcepts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#BC6C25] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0]">
                  {conceptsList.length === 0
                    ? 'No diagnostic evidence recorded yet'
                    : 'No weak concepts below 70% right now'}
                </p>
                <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mt-1 mb-4">
                  Take a short diagnostic to discover concepts that need targeted practice.
                </p>
                <button
                  type="button"
                  onClick={() => jumpToStudentPage('diagnostic')}
                  className="px-4 py-2 rounded-xl bg-[#606C38] text-white text-xs font-semibold cursor-pointer"
                >
                  Start Diagnostic
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#FEFAE0] dark:divide-[#606C38]">
                {weakConcepts.slice(0, 3).map((concept) => (
                  <div
                    key={concept.conceptId}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#606C38] dark:text-[#DDA15E]">
                        <span className="font-semibold">{concept.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold">
                          {concept.masteryScore}% mastery
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{concept.difficultyLevel}</span>
                      </div>
                      <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                        {concept.conceptName}
                      </p>
                      {concept.potentialMisconception && (
                        <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1 line-clamp-2">
                          {concept.potentialMisconception}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          jumpToStudentPage('tutor', {
                            classLevel: concept.classLevel,
                            subject: concept.subject,
                            chapterId: concept.chapterId,
                            conceptId: concept.conceptId,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] hover:bg-[#DDA15E]/20 dark:hover:bg-[#BC6C25] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer whitespace-nowrap"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Tutor
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          jumpToStudentPage('practice', {
                            classLevel: concept.classLevel,
                            subject: concept.subject,
                            chapterId: concept.chapterId,
                            conceptId: concept.conceptId,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                      >
                        <Target className="w-3.5 h-3.5" />
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Assessments */}
          <section className="lg:col-span-5 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                Recent Assessments
              </h3>
              <button
                type="button"
                onClick={() => jumpToStudentPage('diagnostic')}
                className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer"
              >
                New Check
              </button>
            </div>

            {assessments.length === 0 ? (
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 py-6">
                Completed diagnostics, adaptive sessions, and mock exams will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {assessments.slice(0, 4).map((a) => {
                  const ch = getChapterById(a.chapterId);
                  return (
                    <div
                      key={a.assessmentId}
                      className="flex items-center justify-between gap-3 py-2.5 border-b last:border-b-0 border-[#E5E0C5] dark:border-[#606C38]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0] truncate">
                          {a.chapterTitle || ch?.title || a.chapterId}
                        </p>
                        <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 capitalize">
                          {a.type} · {a.correctCount}/{a.totalQuestions} correct
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E] shrink-0">
                        {a.scorePercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* RIGHT COLUMN (4 cols — matches screenshot's Calendar / Revision Timeline + Upcoming panel) */}
      <div className="xl:col-span-4 space-y-6">
        {/* Revision Calendar Panel */}
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                Revision Schedule
              </h3>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                {pendingRevisions.length} pending spaced-repetition tasks
              </p>
            </div>
            <button
              type="button"
              onClick={() => jumpToStudentPage('revision')}
              className="px-3 py-1 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
            >
              Planner
            </button>
          </div>

          {pendingRevisions.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
              All scheduled revisions are complete. Complete a diagnostic to queue new concepts.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRevisions.slice(0, 4).map((rev, idx) => {
                const isTopPriority = idx === 0;
                const isDueNow = rev.dueDate <= today;
                return (
                  <div
                    key={rev.itemId}
                    className={`rounded-2xl p-4 transition-colors ${
                      isTopPriority
                        ? 'bg-gradient-to-r from-[#606C38] to-[#283618] text-white shadow-md'
                        : 'bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span
                        className={`font-semibold ${
                          isTopPriority ? 'text-[#FEFAE0]/85' : 'text-[#BC6C25] dark:text-[#DDA15E]'
                        }`}
                      >
                        {isDueNow ? 'Due Today' : `Due ${rev.dueDate}`} · {rev.subject}
                      </span>
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          isTopPriority ? 'text-white/90' : 'text-[#606C38] dark:text-[#FEFAE0]/85'
                        }`}
                      >
                        {rev.intervalDays}d cycle
                      </span>
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        isTopPriority ? 'text-white' : 'text-[#283618] dark:text-[#FEFAE0]'
                      }`}
                    >
                      {rev.conceptName}
                    </p>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isTopPriority ? 'text-[#FEFAE0]/90' : 'text-[#4A543B] dark:text-[#FEFAE0]/85'
                      }`}
                    >
                      {rev.reason}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          jumpToStudentPage('practice', {
                            subject: rev.subject,
                            chapterId: rev.chapterId,
                            conceptId: rev.conceptId,
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          isTopPriority
                            ? 'bg-white text-[#283618] hover:bg-[#FEFAE0]'
                            : 'bg-[#606C38] text-white hover:bg-[#283618]'
                        }`}
                      >
                        Start Review
                      </button>
                      <button
                        type="button"
                        onClick={() => void completeRevisionTask(rev.itemId, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          isTopPriority
                            ? 'bg-[#283618]/40 text-white hover:bg-[#283618]/60'
                            : 'text-[#283618] dark:text-[#FEFAE0]/85 hover:underline'
                        }`}
                      >
                        Mark Recalled
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Next Lesson + Live Gemini Adaptive Learning Agent */}
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Recommended Next Step
            </h3>
            <TrendingUp className="w-4 h-4 text-[#BC6C25]" />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[#BC6C25] dark:text-[#DDA15E]">
                Class {recommendedChapter.classLevel} · {recommendedChapter.subject}
              </p>
              <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                {recommendedConcept?.conceptName ?? recommendedChapter.title}
              </p>
              <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                {recommendedConcept
                  ? `Currently at ${recommendedConcept.masteryScore}% mastery (${recommendedConcept.difficultyLevel} tier). Complete 2–3 adaptive questions to strengthen retention.`
                  : 'Begin with a quick diagnostic check to initialize your Living Learner Model.'}
              </p>
            </div>

            {aiAdvice && (
              <div className="rounded-xl p-3.5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#DDA15E]/60 space-y-1.5 text-xs">
                <p className="font-bold text-[#283618] dark:text-[#DDA15E]">
                  Gemini 4 Hydrogen Adaptive Guidance
                </p>
                <p className="text-[#1C2412] dark:text-[#FEFAE0]">{aiAdvice.recommendedAction}</p>
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                  <strong>Difficulty:</strong> {aiAdvice.difficultyGuidance}
                </p>
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                  <strong>Prerequisite check:</strong> {aiAdvice.prerequisiteCheck}
                </p>
              </div>
            )}

            {aiError && (
              <p className="text-xs text-[#BC6C25] dark:text-[#DDA15E] font-medium">
                {aiError}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleRequestAdaptiveTip()}
                disabled={aiLoading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#283618] dark:bg-[#606C38] hover:bg-[#606C38] dark:hover:bg-[#BC6C25] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
                    Ask Adaptive Agent
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => jumpToStudentPage('exam')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D8D3B4] dark:border-[#DDA15E]/60 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] hover:bg-[#FEFAE0] dark:hover:bg-[#606C38] cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Mock Exam
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
