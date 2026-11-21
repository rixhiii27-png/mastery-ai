import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Bot, CheckCircle2, SlidersHorizontal, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_CHAPTERS } from '../../data/curriculumSeed';
import type { ClassLevel } from '../../types/mastery';

const SUBJECTS_BY_CLASS: Record<ClassLevel, string[]> = {
  '10': ['Mathematics', 'Science'],
  '11': ['Physics', 'Chemistry', 'Mathematics'],
  '12': ['Physics', 'Chemistry', 'Mathematics'],
};

export const MyLearningPage: React.FC = () => {
  const { userProfile, learnerModel, updateStudentSettings, jumpToStudentPage } = useApp();

  const classLevel = userProfile?.classLevel ?? '10';
  const selectedSubjects = userProfile?.selectedSubjects ?? SUBJECTS_BY_CLASS[classLevel];
  const dailyGoal = userProfile?.dailyGoalMinutes ?? 45;

  const myChapters = useMemo(() => {
    return SEED_CHAPTERS.filter(
      (ch) => ch.classLevel === classLevel && selectedSubjects.includes(ch.subject)
    ).map((ch) => {
      const states = ch.concepts.map((c) => learnerModel[c.conceptId]).filter(Boolean);
      const avg =
        states.length > 0
          ? Math.round(states.reduce((s, st) => s + st.masteryScore, 0) / states.length)
          : 0;
      const weakest = [...states].sort((a, b) => a.masteryScore - b.masteryScore)[0];
      return { chapter: ch, avgMastery: avg, trackedCount: states.length, weakest };
    });
  }, [classLevel, selectedSubjects, learnerModel]);

  const toggleSubject = (subject: string) => {
    const exists = selectedSubjects.includes(subject);
    const next = exists
      ? selectedSubjects.filter((s) => s !== subject)
      : [...selectedSubjects, subject];
    if (next.length === 0) return;
    void updateStudentSettings({ selectedSubjects: next });
  };

  return (
    <div className="space-y-6">
      {/* Learning Profile & Class Setup */}
      <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0]">
              My CBSE Learning Path
            </h2>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mt-0.5">
              Customize your class, active subjects, and daily study target.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Active Preferences</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-2">
              Current CBSE Class
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
              {(['10', '11', '12'] as ClassLevel[]).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() =>
                    void updateStudentSettings({
                      classLevel: cls,
                      selectedSubjects: SUBJECTS_BY_CLASS[cls],
                    })
                  }
                  className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    classLevel === cls
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
              Selected Subjects
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS_BY_CLASS[classLevel].map((sub) => {
                const active = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#283618] dark:bg-[#DDA15E] text-white border-transparent'
                        : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0]/85 border-[#D8D3B4] dark:border-[#606C38]'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-2">
              <span>Daily Study Goal</span>
              <span className="font-mono tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                {dailyGoal} min / day
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={120}
              step={15}
              value={dailyGoal}
              onChange={(e) => void updateStudentSettings({ dailyGoalMinutes: Number(e.target.value) })}
              className="w-full accent-[#606C38] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#606C38] dark:text-[#FEFAE0]/85 mt-1">
              <span>15m</span>
              <span>60m</span>
              <span>120m</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Active Chapters Grid */}
      <section className="grid md:grid-cols-2 gap-5">
        {myChapters.map(({ chapter, avgMastery, trackedCount, weakest }) => (
          <div
            key={chapter.chapterId}
            className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                  Class {chapter.classLevel} · {chapter.subject} · Ch {chapter.chapterNumber}
                </span>
                <span className="font-mono font-bold tabular-nums text-[#283618] dark:text-[#FEFAE0]">
                  {trackedCount > 0 ? `${avgMastery}% mastery` : 'Not started'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
                {chapter.title}
              </h3>

              <div className="mt-3 h-2 rounded-full bg-[#DDA15E]/20 dark:bg-[#283618] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#606C38] to-[#283618]"
                  style={{ width: `${avgMastery}%` }}
                />
              </div>

              <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-3">
                {weakest
                  ? `Next focus: ${weakest.conceptName} (${weakest.masteryScore}% mastery · ${weakest.difficultyLevel} tier).`
                  : `${chapter.concepts.length} concepts ready to explore. Start with a quick diagnostic.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]">
              <button
                type="button"
                onClick={() =>
                  jumpToStudentPage('practice', {
                    classLevel: chapter.classLevel,
                    subject: chapter.subject,
                    chapterId: chapter.chapterId,
                    conceptId: weakest?.conceptId ?? chapter.concepts[0]?.conceptId,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-semibold cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  jumpToStudentPage('tutor', {
                    classLevel: chapter.classLevel,
                    subject: chapter.subject,
                    chapterId: chapter.chapterId,
                    conceptId: weakest?.conceptId ?? chapter.concepts[0]?.conceptId,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] text-[#283618] dark:text-[#FEFAE0] text-xs font-semibold cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask Tutor
              </button>
              <button
                type="button"
                onClick={() =>
                  jumpToStudentPage('curriculum', {
                    classLevel: chapter.classLevel,
                    subject: chapter.subject,
                    chapterId: chapter.chapterId,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Syllabus
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
