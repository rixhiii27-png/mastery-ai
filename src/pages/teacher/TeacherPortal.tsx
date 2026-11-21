import React, { useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { DEMO_TEACHER_DATA } from '../../data/demoData';
import { fetchRoleAnalyticsSummary } from '../../services/aiClient';

export const TeacherPortal: React.FC = () => {
  const { teacherPage } = useApp();
  const [aiSummary, setAiSummary] = useState<{
    headline: string;
    strengths: string[];
    priorityGaps: string[];
    actionablePlan: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateClassBrief = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchRoleAnalyticsSummary({
        role: 'teacher',
        authorizedMetrics: {
          classroom: DEMO_TEACHER_DATA.classroomName,
          classAverageMastery: DEMO_TEACHER_DATA.classAverageMastery,
          chapterPerformance: DEMO_TEACHER_DATA.chapterPerformance,
          commonMisconceptions: DEMO_TEACHER_DATA.commonMisconceptions.map((m) => ({
            concept: m.concept,
            affectedStudents: m.affectedStudents,
            pattern: m.pattern,
          })),
        },
      });
      setAiSummary(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini Analytics Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Classroom Header & Privacy Boundary */}
      <section className="rounded-[20px] bg-gradient-to-r from-[#283618] via-[#606C38] to-[#BC6C25] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#FEFAE0]/85">
            Sample Teacher Demo · Authorized Classroom Aggregates Only
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">{DEMO_TEACHER_DATA.classroomName}</h2>
          <p className="text-xs text-[#FEFAE0]/90 mt-1.5 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#DDA15E]" />
            Privacy enforced: Private student AI tutor conversations are never exposed to teachers.
          </p>
        </div>

        <button
          type="button"
          disabled={aiLoading}
          onClick={() => void handleGenerateClassBrief()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#283618] hover:bg-[#FEFAE0] text-xs font-bold cursor-pointer shrink-0 disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#606C38]" />}
          Generate Instructional Brief
        </button>
      </section>

      {aiError && (
        <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-center gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
          <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {aiSummary && (
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#DDA15E]/60 p-6 space-y-3 text-xs">
          <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E]">
            Gemini 4 Hydrogen Analytics Agent · Classroom Intervention Plan
          </p>
          <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">{aiSummary.headline}</p>
          <div className="grid md:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">Class Strengths</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiSummary.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">Common Learning Gaps</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiSummary.priorityGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">Recommended Teaching Actions</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiSummary.actionablePlan.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Students', value: `${DEMO_TEACHER_DATA.totalStudents}`, sub: `${DEMO_TEACHER_DATA.activeThisWeek} active this week` },
          { label: 'Class Avg Mastery', value: `${DEMO_TEACHER_DATA.classAverageMastery}%`, sub: 'Synthetic sample data' },
          { label: 'Assessments Done', value: `${DEMO_TEACHER_DATA.assessmentsCompletedThisWeek}`, sub: 'Last 7 days' },
          { label: 'Flagged Concept Gaps', value: `${DEMO_TEACHER_DATA.commonMisconceptions.length}`, sub: 'Require class warm-up' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-[18px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5"
          >
            <p className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E]">{k.label}</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-[#283618] dark:text-[#FEFAE0] mt-1">
              {k.value}
            </p>
            <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Subject-Wise Progress & Concept Mastery Distribution (CBSE 2026-27) */}
      {(teacherPage === 'overview' || teacherPage === 'performance') && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                Subject-Wise Progress — CBSE 2026–27 (Sample Demo)
              </h3>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                Tracks Main Academic, Language, and Skill Education subjects separately.
              </p>
            </div>
            <div className="space-y-3.5">
              {DEMO_TEACHER_DATA.subjectProgress.map((sp) => (
                <div key={sp.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#283618] dark:text-[#FEFAE0]">
                      {sp.subject}{' '}
                      <span className="font-medium text-[#BC6C25] dark:text-[#DDA15E]">· {sp.category}</span>
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {sp.avgMastery}% · {sp.lessonsCompleted}/{sp.totalLessons} lessons
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E0C5] dark:bg-[#283618] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#606C38] dark:bg-[#DDA15E]"
                      style={{ width: `${sp.avgMastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                Concept Mastery Distribution (Sample Demo)
              </h3>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                Distribution of students across validated concept mastery tiers.
              </p>
            </div>
            <div className="space-y-3">
              {DEMO_TEACHER_DATA.conceptMasteryDistribution.map((bucket) => (
                <div key={bucket.tier} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#283618] dark:text-[#FEFAE0]">{bucket.tier}</span>
                    <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {bucket.count} students ({bucket.percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#E5E0C5] dark:bg-[#283618] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#DDA15E]"
                      style={{ width: `${bucket.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Chapter Performance Chart & Lesson Completion */}
      {(teacherPage === 'overview' || teacherPage === 'performance' || teacherPage === 'assessments') && (
        <div className="grid lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-1">
              Chapter-Wise Class Mastery (Sample Demo Data)
            </h3>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mb-4">
              Identifies chapters where the highest number of students need guided review.
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEMO_TEACHER_DATA.chapterPerformance} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,108,56,0.22)" />
                  <XAxis dataKey="chapter" tick={{ fontSize: 11, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="avgMastery" name="Avg Mastery %" fill="#DDA15E" radius={[8, 8, 4, 4]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-5 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-3">
            <div>
              <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                Lesson Completion (CBSE 2026–27)
              </h3>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                Lesson-level completion vs average knowledge check mastery
              </p>
            </div>
            <div className="space-y-2.5">
              {DEMO_TEACHER_DATA.lessonCompletion.map((lc) => (
                <div
                  key={lc.lessonTitle}
                  className="p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-1 text-xs"
                >
                  <p className="font-bold text-[#283618] dark:text-[#FEFAE0]">{lc.lessonTitle}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/80">
                    <span>{lc.subject}</span>
                    <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {lc.completionPercent}% done · {lc.avgMastery}% mastery
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Common Learning Gaps & Misconceptions */}
      {(teacherPage === 'overview' || teacherPage === 'gaps') && (
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Common Learning Gaps & Misconception Reports
            </h3>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
              Aggregated hypotheses across the class — no individual private tutor logs are exposed.
            </p>
          </div>
          <div className="space-y-3">
            {DEMO_TEACHER_DATA.commonMisconceptions.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#283618] dark:text-[#FEFAE0]">
                    {m.concept} · {m.subject}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                    {m.affectedStudents} students affected · {Math.round(m.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-[#1C2412] dark:text-[#FEFAE0]">
                  <strong>Observed Pattern:</strong> {m.pattern}
                </p>
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                  <strong>Suggested Classroom Intervention:</strong> {m.suggestedIntervention}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Student Progress Table */}
      {(teacherPage === 'overview' || teacherPage === 'performance' || teacherPage === 'assessments') && (
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-[#BC6C25]" />
              Student Progress Summary (Synthetic Sample)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E0C5] dark:border-[#606C38] text-[#606C38] dark:text-[#DDA15E]">
                  <th className="py-2.5 pr-4 font-semibold">Student</th>
                  <th className="py-2.5 pr-4 font-semibold">Weakest Concept</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Assessments</th>
                  <th className="py-2.5 font-semibold text-right">Overall Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FEFAE0]/70 dark:divide-[#606C38]/70">
                {DEMO_TEACHER_DATA.studentProgressSummary.map((st) => (
                  <tr key={st.name}>
                    <td className="py-3 pr-4 font-semibold text-[#283618] dark:text-[#FEFAE0]">{st.name}</td>
                    <td className="py-3 pr-4 text-[#4A543B] dark:text-[#FEFAE0]/85">{st.weakestConcept}</td>
                    <td className="py-3 pr-4 text-[#BC6C25] dark:text-[#DDA15E] font-semibold">{st.status}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#4A543B] dark:text-[#FEFAE0]/85">
                      {st.assessmentsDone}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {st.overallMastery}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
