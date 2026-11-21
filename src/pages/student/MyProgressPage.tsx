import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { CircularMasteryRing } from '../../components/BrandMark';
import { DEMO_WEEKLY_ACTIVITY } from '../../data/demoData';
import { getChapterById } from '../../data/curriculumSeed';
import { fetchRoleAnalyticsSummary } from '../../services/aiClient';

export const MyProgressPage: React.FC = () => {
  const { learnerModel, assessments, revisions, isDemoMode, jumpToStudentPage } = useApp();

  const [aiBrief, setAiBrief] = useState<{
    headline: string;
    strengths: string[];
    priorityGaps: string[];
    actionablePlan: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const concepts = useMemo(() => Object.values(learnerModel), [learnerModel]);

  const overallMastery = useMemo(() => {
    if (concepts.length === 0) return 0;
    return Math.round(concepts.reduce((s, c) => s + c.masteryScore, 0) / concepts.length);
  }, [concepts]);

  const masteredCount = concepts.filter((c) => c.learningStatus === 'mastered' || c.masteryScore >= 85).length;
  const weakCount = concepts.filter((c) => c.masteryScore < 65).length;

  const subjectChartData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const c of concepts) {
      const curr = map.get(c.subject) ?? { sum: 0, count: 0 };
      curr.sum += c.masteryScore;
      curr.count += 1;
      map.set(c.subject, curr);
    }
    return Array.from(map.entries()).map(([subject, { sum, count }]) => ({
      subject,
      mastery: Math.round(sum / Math.max(1, count)),
    }));
  }, [concepts]);

  const handleGenerateBrief = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchRoleAnalyticsSummary({
        role: 'student',
        authorizedMetrics: {
          overallMastery,
          trackedConcepts: concepts.length,
          masteredCount,
          weakCount,
          assessmentsCompleted: assessments.length,
          pendingRevisions: revisions.filter((r) => r.status === 'pending').length,
          conceptBreakdown: concepts.map((c) => ({
            name: c.conceptName,
            subject: c.subject,
            mastery: c.masteryScore,
            status: c.learningStatus,
            misconception: c.potentialMisconception || null,
          })),
        },
      });
      setAiBrief(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini Analytics Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Mastery', value: `${overallMastery}%`, sub: `${concepts.length} tracked concepts` },
          { label: 'Mastered Concepts', value: `${masteredCount}`, sub: '≥ 85% validated score' },
          { label: 'Needs Revision', value: `${weakCount}`, sub: 'Below 65% threshold' },
          { label: 'Assessments Done', value: `${assessments.length}`, sub: 'Diagnostics, practice & exams' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[18px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5"
          >
            <p className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E]">{kpi.label}</p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#283618] dark:text-[#FEFAE0] mt-1">
              {kpi.value}
            </p>
            <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Gemini Analytics Agent Brief */}
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#BC6C25]" />
              Living Learner Model Progress Brief
            </h2>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
              Synthesize your deterministic concept scores and misconceptions into an actionable plan.
            </p>
          </div>
          <button
            type="button"
            disabled={aiLoading || concepts.length === 0}
            onClick={() => void handleGenerateBrief()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate AI Brief
          </button>
        </div>

        {aiError && (
          <div className="rounded-xl p-3 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-center gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
            <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiBrief && (
          <div className="rounded-2xl p-5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-4 text-xs">
            <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">{aiBrief.headline}</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E] mb-1.5">Strengths</p>
                <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                  {aiBrief.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E] mb-1.5">Priority Gaps</p>
                <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                  {aiBrief.priorityGaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E] mb-1.5">Next 7 Days Plan</p>
                <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                  {aiBrief.actionablePlan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
          <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-1">
            Subject-Wise Mastery
          </h3>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mb-4">
            Average deterministic mastery per subject
          </p>
          <div className="h-56">
            {subjectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                Complete a diagnostic to visualize subject mastery.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,108,56,0.22)" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#283618',
                      borderColor: '#BC6C25',
                      borderRadius: '12px',
                      color: '#FEFAE0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="mastery" fill="#DDA15E" radius={[10, 10, 4, 4]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
          <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-1">
            Weekly Learning Activity {isDemoMode ? '(Demo Sample)' : ''}
          </h3>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mb-4">
            Minutes studied & accuracy trend
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMO_WEEKLY_ACTIVITY} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,108,56,0.22)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#283618',
                    borderColor: '#BC6C25',
                    borderRadius: '12px',
                    color: '#FEFAE0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#DDA15E"
                  fill="#DDA15E"
                  fillOpacity={0.22}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Visual Concept Mastery Map */}
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
            Visual Concept Mastery Map
          </h3>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
            Complete concept-level Living Learner Model — click any concept ring to start targeted practice.
          </p>
        </div>

        {concepts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
            No concepts tracked yet. Complete your first diagnostic assessment to populate your map.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {concepts.map((c) => (
              <div
                key={c.conceptId}
                className="rounded-2xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] p-2"
              >
                <CircularMasteryRing
                  percent={c.masteryScore}
                  label={c.conceptName}
                  sublabel={`${c.correctAnswers}/${c.attempts} · ${c.difficultyLevel}`}
                  size={72}
                  onClick={() =>
                    jumpToStudentPage('practice', {
                      classLevel: c.classLevel,
                      subject: c.subject,
                      chapterId: c.chapterId,
                      conceptId: c.conceptId,
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assessment History Table */}
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
        <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-4">
          Assessment History
        </h3>
        {assessments.length === 0 ? (
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
            No completed assessments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E0C5] dark:border-[#606C38] text-[#606C38] dark:text-[#DDA15E]">
                  <th className="py-2.5 pr-4 font-semibold">Chapter</th>
                  <th className="py-2.5 pr-4 font-semibold">Type</th>
                  <th className="py-2.5 pr-4 font-semibold">Subject</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Correct</th>
                  <th className="py-2.5 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FEFAE0]/70 dark:divide-[#606C38]/70">
                {assessments.map((a) => {
                  const ch = getChapterById(a.chapterId);
                  return (
                    <tr key={a.assessmentId}>
                      <td className="py-3 pr-4 font-semibold text-[#283618] dark:text-[#FEFAE0]">
                        {a.chapterTitle || ch?.title || a.chapterId}
                      </td>
                      <td className="py-3 pr-4 capitalize text-[#4A543B] dark:text-[#FEFAE0]/85">
                        {a.type}
                      </td>
                      <td className="py-3 pr-4 text-[#4A543B] dark:text-[#FEFAE0]/85">{a.subject}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#4A543B] dark:text-[#FEFAE0]/85">
                        {a.correctCount}/{a.totalQuestions}
                      </td>
                      <td className="py-3 text-right font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                        {a.scorePercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
