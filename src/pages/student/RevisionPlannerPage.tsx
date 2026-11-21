import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { todayISO } from '../../services/learningEngine';
import { fetchRevisionRecallPrompts } from '../../services/aiClient';

export const RevisionPlannerPage: React.FC = () => {
  const {
    userProfile,
    revisions,
    learnerModel,
    completeRevisionTask,
    addManualRevisionTask,
    jumpToStudentPage,
  } = useApp();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStrategy, setAiStrategy] = useState<{
    studyStrategy: string;
    recallPrompts: {
      conceptName: string;
      quickRecallQuestion: string;
      keyCheckpoints: string;
    }[];
  } | null>(null);

  const today = todayISO();

  const dueToday = useMemo(
    () => revisions.filter((r) => r.status === 'pending' && r.dueDate <= today),
    [revisions, today]
  );
  const upcoming = useMemo(
    () =>
      revisions
        .filter((r) => r.status === 'pending' && r.dueDate > today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [revisions, today]
  );
  const completed = useMemo(() => revisions.filter((r) => r.status === 'completed'), [revisions]);

  const unqueuedWeakConcepts = useMemo(() => {
    const queuedIds = new Set(revisions.filter((r) => r.status === 'pending').map((r) => r.conceptId));
    return Object.values(learnerModel).filter(
      (c) => c.masteryScore < 70 && !queuedIds.has(c.conceptId)
    );
  }, [learnerModel, revisions]);

  const handleFetchRecallPrompts = async () => {
    const targetList = dueToday.length > 0 ? dueToday : upcoming.slice(0, 3);
    if (targetList.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetchRevisionRecallPrompts({
        classLevel: userProfile?.classLevel ?? '10',
        dueItems: targetList.slice(0, 5).map((r) => ({
          conceptName: r.conceptName,
          subject: r.subject,
          dueDate: r.dueDate,
          priority: r.priority,
          reason: r.reason,
        })),
      });
      setAiStrategy(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach Gemini Revision Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Deterministic Spaced-Repetition Summary Strip */}
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
            Deterministic Spaced-Repetition Schedule · Cycles: 1d → 3d → 7d → 14d → 30d
          </p>
          <h2 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0]">
            {dueToday.length} due today · {upcoming.length} upcoming · {completed.length} completed
          </h2>
          <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">
            Dates are computed deterministically from recall evidence—never guessed by an LLM.
          </p>
        </div>

        <button
          type="button"
          disabled={aiLoading || (dueToday.length === 0 && upcoming.length === 0)}
          onClick={() => void handleFetchRecallPrompts()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing Recall Prompts...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get Active Recall Prompts
            </>
          )}
        </button>
      </section>

      {aiError && (
        <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-start gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
          <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Gemini Revision Agent Recall Deck */}
      {aiStrategy && (
        <section className="rounded-[20px] bg-[#283618] text-[#FEFAE0] border border-[#606C38] p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#DDA15E]">Gemini 4 Hydrogen Revision Agent</p>
            <h3 className="text-base font-bold mt-0.5">Active-Recall Strategy</h3>
            <p className="text-xs text-[#FEFAE0]/85 mt-1 leading-relaxed">{aiStrategy.studyStrategy}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {aiStrategy.recallPrompts.map((rp) => (
              <div
                key={rp.conceptName}
                className="rounded-xl p-4 bg-[#283618]/65 border border-[#606C38] space-y-1.5 text-xs"
              >
                <p className="font-bold text-[#DDA15E]">{rp.conceptName}</p>
                <p className="text-[#FEFAE0] font-medium">{rp.quickRecallQuestion}</p>
                <p className="text-[#FEFAE0]/85">
                  <strong>Checkpoints:</strong> {rp.keyCheckpoints}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main 2-Column Revision Queues */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Today's Priority Queue */}
        <section className="lg:col-span-7 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#BC6C25]" />
              Today’s Revision Queue
            </h3>
            <span className="font-mono text-xs font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
              {dueToday.length} due
            </span>
          </div>

          {dueToday.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#BC6C25] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0]">
                You’re caught up for today!
              </p>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mt-1">
                Review upcoming tasks on the right or run a new diagnostic.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dueToday.map((item) => (
                <div
                  key={item.itemId}
                  className="rounded-2xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#DDA15E]/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#BC6C25] dark:text-[#DDA15E] capitalize">
                      {item.priority} priority · {item.subject}
                    </span>
                    <span className="font-mono tabular-nums text-[#283618] dark:text-[#FEFAE0]/85">
                      Stage {item.repetitionStage + 1} · {item.intervalDays}d interval
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                      {item.conceptName}
                    </p>
                    <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                      {item.reason}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void completeRevisionTask(item.itemId, true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recalled Well (Extend Interval)
                    </button>
                    <button
                      type="button"
                      onClick={() => void completeRevisionTask(item.itemId, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Still Fuzzy (Reset 1d)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        jumpToStudentPage('practice', {
                          subject: item.subject,
                          chapterId: item.chapterId,
                          conceptId: item.conceptId,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline ml-auto cursor-pointer"
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

        {/* Right: Upcoming + Completed + Weak Concepts Quick-Add */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
              Upcoming Revisions ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                No future reviews queued yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((item) => (
                  <div
                    key={item.itemId}
                    className="rounded-xl p-3.5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0] truncate">
                        {item.conceptName}
                      </p>
                      <p className="text-[11px] text-[#606C38] dark:text-[#FEFAE0]/85">
                        {item.subject} · {item.intervalDays}d cycle
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E] shrink-0">
                      {item.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {unqueuedWeakConcepts.length > 0 && (
            <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                Weak Concepts Not Yet Queued
              </h3>
              <div className="space-y-2">
                {unqueuedWeakConcepts.map((c) => (
                  <div
                    key={c.conceptId}
                    className="flex items-center justify-between gap-2 text-xs py-1.5 border-b last:border-b-0 border-[#E5E0C5] dark:border-[#606C38]"
                  >
                    <span className="font-semibold text-[#283618] dark:text-[#FEFAE0] truncate">
                      {c.conceptName} ({c.masteryScore}%)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void addManualRevisionTask({
                          conceptId: c.conceptId,
                          conceptName: c.conceptName,
                          subject: c.subject,
                          chapterId: c.chapterId,
                          reason: `Weak concept (${c.masteryScore}% mastery) added to spaced revision.`,
                        })
                      }
                      className="text-[#606C38] dark:text-[#DDA15E] font-semibold hover:underline shrink-0 cursor-pointer"
                    >
                      + Queue
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
              Completed Revisions ({completed.length})
            </h3>
            {completed.length === 0 ? (
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
                Completed review items will appear here with their extended interval.
              </p>
            ) : (
              <div className="space-y-2">
                {completed.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between gap-2 text-xs py-1.5 border-b last:border-b-0 border-[#E5E0C5] dark:border-[#606C38]"
                  >
                    <span className="text-[#283618] dark:text-[#FEFAE0]/85 truncate">
                      {item.conceptName}
                    </span>
                    <span className="font-mono text-[11px] text-[#BC6C25] dark:text-[#DDA15E] shrink-0">
                      Next: {item.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
