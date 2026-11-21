import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  Bot,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_CHAPTERS } from '../../data/curriculumSeed';
import { askTutorAgent } from '../../services/aiClient';
import type { ClassLevel, ExplanationMode, TutorMessage } from '../../types/mastery';

const MODES: { id: ExplanationMode; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'From scratch, zero jargon' },
  { id: 'simple', label: 'Simple', desc: 'Clear everyday steps' },
  { id: 'detailed', label: 'Detailed', desc: 'Full derivations & rigor' },
  { id: 'exam_prep', label: 'Exam Prep', desc: 'CBSE step-marking focus' },
];

export const AITutorPage: React.FC = () => {
  const { selectedContext, setSelectedContext, learnerModel, saveStudyNote } = useApp();

  const [mode, setMode] = useState<ExplanationMode>('simple');
  const [hintFirst, setHintFirst] = useState(false);
  const [includePractice, setIncludePractice] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [answeredQuickChecks, setAnsweredQuickChecks] = useState<Record<string, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  const chaptersForClass = useMemo(
    () => SEED_CHAPTERS.filter((c) => c.classLevel === selectedContext.classLevel),
    [selectedContext.classLevel]
  );

  const subjectsForClass = useMemo(
    () => Array.from(new Set(chaptersForClass.map((c) => c.subject))),
    [chaptersForClass]
  );

  const chaptersForSubject = useMemo(
    () => chaptersForClass.filter((c) => c.subject === selectedContext.subject),
    [chaptersForClass, selectedContext.subject]
  );

  const activeChapter = useMemo(
    () =>
      chaptersForSubject.find((c) => c.chapterId === selectedContext.chapterId) ??
      chaptersForSubject[0] ??
      chaptersForClass[0] ??
      SEED_CHAPTERS[0],
    [chaptersForSubject, chaptersForClass, selectedContext.chapterId]
  );

  const activeConcept = useMemo(
    () =>
      activeChapter.concepts.find((c) => c.conceptId === selectedContext.conceptId) ??
      activeChapter.concepts[0],
    [activeChapter, selectedContext.conceptId]
  );

  const activeSubjectLabel = selectedContext.lessonId ? selectedContext.subject : activeChapter.subject;
  const activeChapterLabel = selectedContext.lessonTitle ? selectedContext.lessonTitle : activeChapter.title;

  const learnerState = activeConcept ? learnerModel[activeConcept.conceptId] : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const starterQuestions = useMemo(() => {
    if (selectedContext.lessonTitle) {
      return [
        `Walk me through "${selectedContext.lessonTitle}" step by step with a simple example.`,
        `What common mistakes should I avoid in "${selectedContext.lessonTitle}"?`,
        `Give me one CBSE 2026–27 board-style practice problem for "${selectedContext.lessonTitle}".`,
      ];
    }
    if (!activeConcept) return [];
    return [
      `Explain "${activeConcept.name}" step by step with a simple example.`,
      `What are the most common mistakes students make in "${activeConcept.name}"?`,
      `Walk me through one CBSE board-style problem on ${activeChapter.title}.`,
    ];
  }, [activeChapter.title, activeConcept, selectedContext.lessonTitle]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setErrorMsg(null);
    const studentMsg: TutorMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'student',
      text: trimmed,
      contextLabel: `Class ${selectedContext.classLevel} · ${activeSubjectLabel} · ${activeChapterLabel}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, studentMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await askTutorAgent({
        question: trimmed,
        classLevel: selectedContext.classLevel,
        subject: activeSubjectLabel,
        chapterTitle: activeChapterLabel,
        conceptName: selectedContext.lessonTitle ? undefined : activeConcept?.name,
        lessonId: selectedContext.lessonId,
        mode,
        hintFirst,
        includePractice,
        learnerContext: learnerState
          ? {
              masteryScore: learnerState.masteryScore,
              potentialMisconception: learnerState.potentialMisconception,
              difficultyLevel: learnerState.difficultyLevel,
            }
          : undefined,
        history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
      });

      const tutorMsg: TutorMessage = {
        id: `msg_t_${Date.now()}`,
        role: 'tutor',
        text: response.data.directAnswer,
        structured: response.data,
        mode,
        contextLabel: `${activeSubjectLabel} · ${selectedContext.lessonTitle ?? activeConcept?.name ?? activeChapter.title}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the Gemini 4 Hydrogen Tutor Agent.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExplanation = async (msg: TutorMessage) => {
    if (!msg.structured) return;
    const stepsMd = msg.structured.steps
      .map((s, i) => `${i + 1}. **${s.title}**: ${s.detail}`)
      .join('\n');
    const content = `### ${msg.contextLabel || activeChapterLabel}\n\n${msg.structured.directAnswer}\n\n#### Step-by-Step Breakdown\n${stepsMd}\n\n#### Real-World Example\n${msg.structured.realWorldExample}\n\n*Note: ${msg.structured.curriculumNote}*`;

    await saveStudyNote({
      title: `Tutor Note: ${selectedContext.lessonTitle ?? activeConcept?.name ?? activeChapter.title}`,
      materialType: 'tutor_note',
      classLevel: selectedContext.classLevel,
      subject: activeSubjectLabel,
      chapterId: selectedContext.chapterId || activeChapter.chapterId,
      content,
    });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left Context & Pedagogy Controls */}
      <aside className="lg:col-span-4 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
            Lesson Context
          </h2>
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/80 mt-0.5">
            Bounded CBSE 2026–27 retrieval tailored to your Living Learner Model. You can also ask off-chapter questions freely.
          </p>
        </div>

        {/* Active Lesson Banner if launched from Curriculum Explorer */}
        {selectedContext.lessonId && selectedContext.lessonTitle && (
          <div className="rounded-xl p-3 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#DDA15E]/60 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                Active 2026–27 Lesson Bound
              </p>
              <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                Class {selectedContext.classLevel} · {selectedContext.subject} · {selectedContext.lessonTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSelectedContext({
                  ...selectedContext,
                  lessonId: undefined,
                  lessonTitle: undefined,
                })
              }
              className="text-[11px] font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline shrink-0 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Class Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]">
            CBSE Class
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
            {(['10', '11', '12'] as ClassLevel[]).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  const firstCh = SEED_CHAPTERS.find((c) => c.classLevel === cls) ?? SEED_CHAPTERS[0];
                  setSelectedContext({
                    classLevel: cls,
                    subject: firstCh.subject,
                    chapterId: firstCh.chapterId,
                    conceptId: firstCh.concepts[0]?.conceptId,
                  });
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedContext.classLevel === cls
                    ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                    : 'text-[#283618] dark:text-[#FEFAE0]/80'
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Subject & Chapter */}
        <div className="space-y-3">
          <div>
            <label htmlFor="tutor-subject" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] mb-1">
              Subject
            </label>
            <select
              id="tutor-subject"
              value={activeChapter.subject}
              onChange={(e) => {
                const sub = e.target.value;
                const firstCh = chaptersForClass.find((c) => c.subject === sub) ?? chaptersForClass[0];
                setSelectedContext({
                  classLevel: selectedContext.classLevel,
                  subject: sub,
                  chapterId: firstCh.chapterId,
                  conceptId: firstCh.concepts[0]?.conceptId,
                });
              }}
              className="w-full rounded-xl px-3 py-2 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            >
              {subjectsForClass.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tutor-chapter" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] mb-1">
              Chapter
            </label>
            <select
              id="tutor-chapter"
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
              className="w-full rounded-xl px-3 py-2 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
            >
              {chaptersForSubject.map((ch) => (
                <option key={ch.chapterId} value={ch.chapterId}>
                  Ch {ch.chapterNumber}: {ch.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tutor-concept" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] mb-1">
              Focus Concept
            </label>
            <select
              id="tutor-concept"
              value={activeConcept?.conceptId ?? ''}
              onChange={(e) =>
                setSelectedContext({
                  ...selectedContext,
                  chapterId: activeChapter.chapterId,
                  subject: activeChapter.subject,
                  conceptId: e.target.value,
                  lessonId: undefined,
                  lessonTitle: undefined,
                })
              }
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

        {/* Explanation Mode */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]">
            Explanation Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  mode === m.id
                    ? 'bg-[#606C38] dark:bg-[#DDA15E] border-[#606C38] dark:border-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]'
                }`}
              >
                <p className="text-xs font-bold">{m.label}</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    mode === m.id
                      ? 'text-[#FEFAE0]/90 dark:text-[#283618]/80'
                      : 'text-[#606C38] dark:text-[#FEFAE0]/75'
                  }`}
                >
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Teaching Toggles */}
        <div className="space-y-2.5 pt-1 border-t border-[#E5E0C5] dark:border-[#606C38]/60">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-xs font-medium text-[#283618] dark:text-[#FEFAE0]">
              Hint-First Socratic Mode
            </span>
            <input
              type="checkbox"
              checked={hintFirst}
              onChange={(e) => setHintFirst(e.target.checked)}
              className="accent-[#606C38] dark:accent-[#DDA15E] w-4 h-4 cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-xs font-medium text-[#283618] dark:text-[#FEFAE0]">
              Include Quick Practice Check
            </span>
            <input
              type="checkbox"
              checked={includePractice}
              onChange={(e) => setIncludePractice(e.target.checked)}
              className="accent-[#606C38] dark:accent-[#DDA15E] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Active Learner Model Context */}
        <div className="rounded-xl p-3.5 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
          <p className="text-[11px] font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
            Living Learner Model Context
          </p>
          {learnerState ? (
            <div className="mt-1.5 space-y-1 text-xs">
              <p className="font-semibold text-[#283618] dark:text-[#FEFAE0] tabular-nums">
                Mastery: {learnerState.masteryScore}% · Tier: {learnerState.difficultyLevel}
              </p>
              {learnerState.potentialMisconception ? (
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">
                  {learnerState.potentialMisconception}
                </p>
              ) : (
                <p className="text-[#4A543B] dark:text-[#FEFAE0]/80">
                  No active misconception hypothesis on this concept.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 mt-1">
              Not assessed yet. Ask a doubt or run a diagnostic to personalize explanations further.
            </p>
          )}
        </div>
      </aside>

      {/* Right Conversation Workspace */}
      <section className="lg:col-span-8 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] flex flex-col min-h-[640px] max-h-[78vh]">
        {/* Conversation Header */}
        <div className="px-5 py-4 border-b border-[#E5E0C5] dark:border-[#606C38]/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                MASTERY AI Tutor · Gemini 4 Hydrogen
              </h2>
              <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/80">
                Class {selectedContext.classLevel} · {activeSubjectLabel} · {selectedContext.lessonTitle ?? activeConcept?.name ?? activeChapter.title}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] capitalize">
            {mode.replace('_', ' ')} mode {hintFirst ? '· Hint-first' : ''}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="py-8 max-w-xl mx-auto text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#DDA15E]/25 dark:bg-[#283618] text-[#BC6C25] dark:text-[#DDA15E] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Ask any doubt about {activeChapterLabel}
                </h3>
                <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                  I explain patiently step by step, connect ideas to real life, and adapt to your current mastery level.
                </p>
              </div>
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E]">
                  Suggested starter questions
                </p>
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendQuestion(q)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] hover:bg-[#DDA15E]/25 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#606C38] text-sm text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'tutor' && (
                <div className="w-8 h-8 rounded-xl bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-4 space-y-4 ${
                  msg.role === 'student'
                    ? 'bg-[#606C38] text-[#FEFAE0]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]'
                }`}
              >
                {msg.role === 'student' ? (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                ) : (
                  <>
                    {msg.structured?.hintFirstPrompt && (
                      <div className="rounded-xl p-3 bg-[#DDA15E]/25 dark:bg-[#334220] text-xs text-[#283618] dark:text-[#FEFAE0]">
                        <span className="font-bold inline-flex items-center gap-1.5 mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-[#BC6C25] dark:text-[#DDA15E]" />
                          Think First (Hint)
                        </span>
                        <p>{msg.structured.hintFirstPrompt}</p>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed font-medium text-[#1C2412] dark:text-[#FEFAE0]">
                      {msg.structured?.directAnswer ?? msg.text}
                    </p>

                    {msg.structured?.steps && msg.structured.steps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#606C38] dark:text-[#DDA15E]">
                          Step-by-Step Breakdown
                        </p>
                        <div className="space-y-2">
                          {msg.structured.steps.map((step, i) => (
                            <div
                              key={`${msg.id}_s_${i}`}
                              className="rounded-xl p-3 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38]"
                            >
                              <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0]">
                                {i + 1}. {step.title}
                              </p>
                              <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1 leading-relaxed">
                                {step.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.structured?.realWorldExample && (
                      <div className="rounded-xl p-3 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38]">
                        <p className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E] mb-1">
                          Real-World Connection
                        </p>
                        <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
                          {msg.structured.realWorldExample}
                        </p>
                      </div>
                    )}

                    {msg.structured?.quickPracticeQuestion && (
                      <div className="rounded-xl p-3.5 bg-white dark:bg-[#334220] border border-[#DDA15E]/70 space-y-2.5">
                        <p className="text-xs font-bold text-[#283618] dark:text-[#DDA15E]">
                          Quick Understanding Check
                        </p>
                        <p className="text-xs font-medium text-[#1C2412] dark:text-[#FEFAE0]">
                          {msg.structured.quickPracticeQuestion.prompt}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {msg.structured.quickPracticeQuestion.options.map((opt, idx) => {
                            const picked = answeredQuickChecks[msg.id];
                            const isPicked = picked === idx;
                            const isCorrect =
                              idx === msg.structured?.quickPracticeQuestion?.correctIndex;
                            const revealed = picked !== undefined;
                            return (
                              <button
                                key={`${msg.id}_opt_${idx}`}
                                type="button"
                                onClick={() =>
                                  setAnsweredQuickChecks((prev) => ({ ...prev, [msg.id]: idx }))
                                }
                                className={`text-left px-3 py-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                                  revealed && isCorrect
                                    ? 'bg-[#606C38] text-[#FEFAE0] border-[#606C38]'
                                    : revealed && isPicked && !isCorrect
                                    ? 'bg-[#BC6C25] text-[#FEFAE0] border-[#BC6C25]'
                                    : 'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] hover:border-[#606C38]'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {answeredQuickChecks[msg.id] !== undefined && (
                          <div className="text-xs pt-1 text-[#4A543B] dark:text-[#FEFAE0]/85 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
                            <span>
                              {answeredQuickChecks[msg.id] ===
                              msg.structured.quickPracticeQuestion.correctIndex
                                ? 'Correct! '
                                : 'Not quite — '}
                              {msg.structured.quickPracticeQuestion.explanation}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/60 space-y-2.5">
                      {msg.structured?.followUpQuestions && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.structured.followUpQuestions.map((fq) => (
                            <button
                              key={fq}
                              type="button"
                              onClick={() => void sendQuestion(fq)}
                              className="text-left text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-[#334220] hover:bg-[#DDA15E]/25 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer"
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#606C38] dark:text-[#FEFAE0]/75">
                        <span>{msg.structured?.curriculumNote}</span>
                        <button
                          type="button"
                          onClick={() => void handleSaveExplanation(msg)}
                          className="inline-flex items-center gap-1.5 font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Save to Study Materials
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {msg.role === 'student' && (
                <div className="w-8 h-8 rounded-xl bg-[#283618] dark:bg-[#606C38] text-[#FEFAE0] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs font-medium text-[#606C38] dark:text-[#FEFAE0]">
              <div className="w-8 h-8 rounded-xl bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Gemini 4 Hydrogen is preparing a {mode.replace('_', ' ')} explanation...</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl p-4 bg-[#BC6C25]/15 dark:bg-[#283618] border border-[#BC6C25] flex items-start gap-3 text-xs text-[#283618] dark:text-[#FEFAE0]">
              <AlertCircle className="w-4 h-4 text-[#BC6C25] dark:text-[#DDA15E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">AI Tutor Unavailable</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendQuestion(input);
          }}
          className="p-4 border-t border-[#E5E0C5] dark:border-[#606C38]/60 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about ${activeChapterLabel} (or any CBSE topic)...`}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0] placeholder:text-[#606C38]/70 dark:placeholder:text-[#FEFAE0]/60 focus:outline-none focus:ring-2 focus:ring-[#606C38] dark:focus:ring-[#DDA15E]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] disabled:opacity-50 text-[#FEFAE0] dark:text-[#283618] text-sm font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Tutor</span>
          </button>
        </form>
      </section>
    </div>
  );
};
