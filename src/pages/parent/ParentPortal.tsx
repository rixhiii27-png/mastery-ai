import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
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
import { DEMO_PARENT_DATA, DEMO_WEEKLY_ACTIVITY } from '../../data/demoData';
import { fetchRoleAnalyticsSummary } from '../../services/aiClient';

export const ParentPortal: React.FC = () => {
  const { parentPage, showToast } = useApp();
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [aiReport, setAiReport] = useState<{
    headline: string;
    strengths: string[];
    priorityGaps: string[];
    actionablePlan: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateParentBrief = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchRoleAnalyticsSummary({
        role: 'parent',
        authorizedMetrics: {
          student: DEMO_PARENT_DATA.linkedStudentName,
          classLevel: DEMO_PARENT_DATA.classLevel,
          overallMastery: DEMO_PARENT_DATA.overallMastery,
          weeklyMinutes: DEMO_PARENT_DATA.weeklyMinutes,
          weeklyGoalMinutes: DEMO_PARENT_DATA.weeklyGoalMinutes,
          revisionsCompleted: DEMO_PARENT_DATA.revisionsCompleted,
          revisionsPending: DEMO_PARENT_DATA.revisionsPending,
          subjectProgress: DEMO_PARENT_DATA.subjectProgress,
          conceptsNeedingAttention: DEMO_PARENT_DATA.conceptsNeedingAttention,
        },
      });
      setAiReport(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini Analytics Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Linked Student Banner */}
      <section className="rounded-[20px] bg-gradient-to-r from-[#283618] via-[#3A4A24] to-[#606C38] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#FEFAE0]/85">
            Sample Parent Demo · Verified Link Summary ({DEMO_PARENT_DATA.classLevel})
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {DEMO_PARENT_DATA.linkedStudentName}
          </h2>
          <p className="text-xs text-[#FEFAE0]/90 mt-1.5 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DDA15E]" />
            Verified summary view only · Private AI tutor chats remain strictly student-private.
          </p>
        </div>

        <button
          type="button"
          disabled={aiLoading}
          onClick={() => void handleGenerateParentBrief()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#283618] hover:bg-[#FEFAE0] text-xs font-bold cursor-pointer shrink-0 disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#606C38]" />}
          Generate Parent Weekly Brief
        </button>
      </section>

      {aiError && (
        <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-center gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
          <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {aiReport && (
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#DDA15E]/60 p-6 space-y-3 text-xs">
          <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E]">
            Gemini 4 Hydrogen Weekly Parent Summary
          </p>
          <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">{aiReport.headline}</p>
          <div className="grid md:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">Highlights</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiReport.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">Focus Areas</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiReport.priorityGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1">How to Support at Home</p>
              <ul className="list-disc pl-4 space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                {aiReport.actionablePlan.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Key Parent Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Mastery', value: `${DEMO_PARENT_DATA.overallMastery}%`, sub: 'Synthetic sample data' },
          { label: 'Weekly Study Time', value: `${DEMO_PARENT_DATA.weeklyMinutes}m`, sub: `Goal: ${DEMO_PARENT_DATA.weeklyGoalMinutes}m` },
          { label: 'Revisions Completed', value: `${DEMO_PARENT_DATA.revisionsCompleted}`, sub: `${DEMO_PARENT_DATA.revisionsPending} pending today` },
          { label: 'Link Status', value: 'Verified', sub: 'Student-approved access' },
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

      {/* Subject Progress & Weekly Study Chart */}
      {(parentPage === 'overview' || parentPage === 'progress' || parentPage === 'reports') && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Subject-Wise Progress (Demo Data)
            </h3>
            <div className="space-y-4">
              {DEMO_PARENT_DATA.subjectProgress.map((sp) => (
                <div key={sp.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#283618] dark:text-[#FEFAE0]">{sp.subject}</span>
                    <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {sp.mastery}% · {sp.trend}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#DDA15E]/20 dark:bg-[#283618] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#606C38] to-[#283618]"
                      style={{ width: `${sp.mastery}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/85">
                    {sp.lessonsCompleted}/{sp.totalLessons} lessons completed · Focus: {sp.focusTopic}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-1">
              Weekly Learning Activity (Minutes)
            </h3>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mb-4">
              Consistent daily engagement across the week
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEMO_WEEKLY_ACTIVITY} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,108,56,0.22)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#BC6C25' }} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="minutes" name="Minutes" fill="#DDA15E" radius={[8, 8, 4, 4]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {/* Concepts Requiring Attention & Recent Assessments */}
      {(parentPage === 'overview' || parentPage === 'reports') && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-3">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Weak Lessons &amp; Concepts Requiring Attention
            </h3>
            {DEMO_PARENT_DATA.weakLessons.map((wl) => (
              <div
                key={wl.lessonTitle}
                className="rounded-xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#283618] dark:text-[#FEFAE0]">{wl.lessonTitle}</span>
                  <span className="font-mono font-bold tabular-nums text-[#BC6C25] dark:text-[#DDA15E] shrink-0">
                    {wl.mastery}%
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#606C38] dark:text-[#DDA15E]">{wl.subject}</p>
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">{wl.recommendation}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-3">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Recent Assessment Summary
            </h3>
            {DEMO_PARENT_DATA.recentAssessments.map((a) => (
              <div
                key={a.title}
                className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0 border-[#E5E0C5] dark:border-[#606C38] text-xs"
              >
                <div>
                  <p className="font-bold text-[#283618] dark:text-[#FEFAE0]">{a.title}</p>
                  <p className="text-[#606C38] dark:text-[#FEFAE0]/85">
                    {a.date} · {a.note}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums text-sm text-[#606C38] dark:text-[#DDA15E] shrink-0">
                  {a.score}%
                </span>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* Verified Linking & Permissions Model */}
      {(parentPage === 'linking' || parentPage === 'overview') && (
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#BC6C25]" />
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Verified Student Linking & Privacy Controls
            </h3>
          </div>
          <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed max-w-3xl">
            In production Firestore security rules (`parentLinks/{'{linkId}'}`), a parent account may submit a <strong>pending</strong> link request, and only the target student (or a verified administrator) can approve it to <strong>verified</strong>. Parents never gain unrestricted access to private AI tutor transcripts.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!linkCodeInput.trim()) return;
              showToast(
                'Demo Mode: Real parent link requests require signing in and student approval in Firestore.',
                'info'
              );
              setLinkCodeInput('');
            }}
            className="flex flex-wrap items-center gap-2.5 max-w-lg"
          >
            <input
              type="text"
              value={linkCodeInput}
              onChange={(e) => setLinkCodeInput(e.target.value)}
              placeholder="Enter student invite code (e.g., STU-2025-8821)"
              className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl text-xs bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Request Verified Link
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
