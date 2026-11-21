import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookmarkPlus,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudUpload,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  fetchCurriculumChapters,
  fetchCurriculumCoverage,
  fetchCurriculumLessons,
  fetchCurriculumSubjects,
  fetchLessonDetail,
  generateLessonContentApi,
  importCurriculumApi,
  runLessonActionApi,
  type PaginationMeta,
} from '../../services/aiClient';
import { syncVerifiedCurriculumBatch } from '../../services/firestoreService';
import type {
  ClassLevel,
  CurriculumCoverageReport,
  CurriculumImportJob,
  CurriculumLesson,
  CurriculumSubject,
  CurriculumUnitChapter,
  CurriculumVerificationStatus,
  LessonAIAction,
  LessonGeneratedContent,
  SubjectCategory,
} from '../../types/mastery';

const CATEGORY_TABS: { id: SubjectCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Subjects' },
  { id: 'main_academic', label: 'Main Academic' },
  { id: 'academic_elective', label: 'Academic Electives' },
  { id: 'language', label: 'Languages' },
  { id: 'skill_education', label: 'Skill Education' },
];

const LESSON_ACTIONS: { id: LessonAIAction; label: string }[] = [
  { id: 'explain_lesson', label: 'Explain Lesson' },
  { id: 'explain_difficult_concept', label: 'Difficult Concept' },
  { id: 'simple_example', label: 'Simple Example' },
  { id: 'detailed_explanation', label: 'Detailed Walkthrough' },
  { id: 'generate_notes', label: 'Study Notes' },
  { id: 'generate_flashcards', label: 'Flashcards' },
  { id: 'practice_questions', label: 'Practice Qs' },
  { id: 'test_understanding', label: 'Test Understanding' },
  { id: 'explain_mistake', label: 'Common Mistakes' },
  { id: 'revision_summary', label: '2-Min Revision' },
];

const SAMPLE_JSON_IMPORT = JSON.stringify(
  [
    {
      classLevel: '10',
      subjectId: 'cbse27_c10_main_science',
      unitNumber: 1,
      unitName: 'Unit I: Chemical Substances - Nature and Behaviour',
      chapterNumber: 1,
      chapterName: 'Chemical Reactions and Equations',
      chapterDescription:
        'Balancing chemical equations, combination, decomposition, displacement, double displacement, and redox reactions.',
      lessonNumber: 1,
      lessonTitle: 'Balancing Equations & Types of Chemical Reactions',
      lessonType: 'theory',
      lessonDescription:
        'Apply law of conservation of mass to balance equations and classify five core chemical reaction types.',
      topics: ['Law of conservation of mass', 'Combination & decomposition', 'Displacement & redox'],
      concepts: ['Chemical Equation Balancing', 'Redox & Reaction Classification'],
      learningObjectives: [
        'Balance skeletal chemical equations systematically',
        'Identify oxidising and reducing agents in redox reactions',
      ],
      estimatedStudyTime: 35,
      difficultyLevel: 'foundational',
      prerequisites: ['Chemical Formulae & Valency'],
      verificationStatus: 'Verified',
    },
  ],
  null,
  2
);

const SAMPLE_CSV_IMPORT = `classLevel,subjectId,unitNumber,unitName,chapterNumber,chapterName,lessonNumber,lessonTitle,lessonType,lessonDescription,topics,concepts,learningObjectives,estimatedStudyTime,difficultyLevel,verificationStatus
11,cbse27_c11_elec_economics,2,Unit II: Consumer Equilibrium and Demand,2,Theory of Consumer Behaviour,1,Law of Diminishing Marginal Utility & Demand Curve,numerical,Explain marginal utility equilibrium conditions and movements vs shifts along the demand curve.,Marginal utility|Demand determinants|Price elasticity,Consumer Equilibrium|Law of Demand,Derive consumer equilibrium for single and two commodities|Distinguish movement along vs shift in demand,35,standard,Verified`;

function categoryBadgeLabel(cat: SubjectCategory): string {
  switch (cat) {
    case 'main_academic':
      return 'Main Academic';
    case 'language':
      return 'Language';
    case 'academic_elective':
      return 'Academic Elective';
    case 'skill_education':
      return 'Skill Education';
  }
}

export const CurriculumExplorerPage: React.FC = () => {
  const {
    selectedContext,
    setSelectedContext,
    jumpToStudentPage,
    learnerModel,
    submitValidatedAssessment,
    saveStudyNote,
    firebaseUser,
    isDemoMode,
    showToast,
  } = useApp();

  // Top-level mode: Student Curriculum Explorer vs Coverage & Ingestion Console
  const [viewMode, setViewMode] = useState<'explorer' | 'coverage'>('explorer');

  // Explorer drill-down state: subjects -> chapters -> lesson
  const [classFilter, setClassFilter] = useState<ClassLevel>(selectedContext.classLevel || '10');
  const [categoryFilter, setCategoryFilter] = useState<SubjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CurriculumVerificationStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [subjectsPagination, setSubjectsPagination] = useState<PaginationMeta | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [chapters, setChapters] = useState<CurriculumUnitChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [selectedChapter, setSelectedChapter] = useState<CurriculumUnitChapter | null>(null);
  const [lessons, setLessons] = useState<CurriculumLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonGeneratedContent | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Lesson AI Actions state
  const [activeActionLoading, setActiveActionLoading] = useState<LessonAIAction | null>(null);
  const [actionResult, setActionResult] = useState<{
    action: LessonAIAction;
    title: string;
    summary: string;
    blocks: { heading: string; points: string[] }[];
    quickTip: string;
  } | null>(null);

  // Interactive Knowledge Check state inside Lesson Page
  const [kcAnswers, setKcAnswers] = useState<Record<string, number>>({});
  const [kcSubmitted, setKcSubmitted] = useState(false);
  const [kcSubmitting, setKcSubmitting] = useState(false);
  const [kcScoreSummary, setKcScoreSummary] = useState<string | null>(null);
  const [revealedPracticeIdx, setRevealedPracticeIdx] = useState<Record<number, boolean>>({});

  // Recently studied & completed lessons (persisted locally for instant 1-click resume)
  const recentStorageKey = `masteryai_recent_lessons_${firebaseUser?.uid || 'demo'}`;
  const completedStorageKey = `masteryai_completed_lessons_${firebaseUser?.uid || 'demo'}`;

  type RecentLessonRef = {
    lessonId: string;
    lessonTitle: string;
    subject: string;
    classLevel: ClassLevel;
    chapterName: string;
    openedAt: string;
  };

  const [recentLessons, setRecentLessons] = useState<RecentLessonRef[]>(() => {
    try {
      const raw = localStorage.getItem(recentStorageKey);
      return raw ? (JSON.parse(raw) as RecentLessonRef[]) : [];
    } catch {
      return [];
    }
  });

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(completedStorageKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const recordRecentLesson = useCallback(
    (les: CurriculumLesson) => {
      setRecentLessons((prev) => {
        const next: RecentLessonRef[] = [
          {
            lessonId: les.lessonId,
            lessonTitle: les.lessonTitle,
            subject: les.subject,
            classLevel: les.classLevel,
            chapterName: les.chapterName,
            openedAt: new Date().toISOString(),
          },
          ...prev.filter((item) => item.lessonId !== les.lessonId),
        ].slice(0, 6);
        try {
          localStorage.setItem(recentStorageKey, JSON.stringify(next));
        } catch {
          // ignore storage quota
        }
        return next;
      });
    },
    [recentStorageKey]
  );

  const markLessonCompleted = useCallback(
    (lessonId: string) => {
      setCompletedLessonIds((prev) => {
        if (prev.includes(lessonId)) return prev;
        const next = [...prev, lessonId];
        try {
          localStorage.setItem(completedStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [completedStorageKey]
  );

  // Coverage & Ingestion Console state
  const [coverage, setCoverage] = useState<CurriculumCoverageReport | null>(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [importLabel, setImportLabel] = useState('CBSE 2026-27 Verified Chapter Import');
  const [importPayload, setImportPayload] = useState(SAMPLE_JSON_IMPORT);
  const [importing, setImporting] = useState(false);
  const [lastImportJob, setLastImportJob] = useState<CurriculumImportJob | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState(false);

  // Fetch paginated subjects
  const loadSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetchCurriculumSubjects({
        classLevel: classFilter,
        category: categoryFilter,
        verificationStatus: statusFilter,
        search: searchInput.trim() || undefined,
        page,
        pageSize: 18,
      });
      setSubjects(res.items);
      setSubjectsPagination(res.pagination);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load CBSE 2026–27 subjects', 'error');
    } finally {
      setLoadingSubjects(false);
    }
  }, [classFilter, categoryFilter, statusFilter, searchInput, page, showToast]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  // Load coverage metrics on mount & when switching to coverage view
  const loadCoverage = useCallback(async () => {
    setLoadingCoverage(true);
    try {
      const rep = await fetchCurriculumCoverage();
      setCoverage(rep);
    } catch {
      // non-fatal
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  useEffect(() => {
    void loadCoverage();
  }, [loadCoverage]);

  // Deep-link handling from Global Search (AppShell)
  useEffect(() => {
    if (selectedContext.lessonId) {
      void (async () => {
        try {
          const detail = await fetchLessonDetail(selectedContext.lessonId!);
          setClassFilter(detail.lesson.classLevel);
          setActiveLesson(detail.lesson);
          setLessonContent(detail.cachedContent);
          setActionResult(null);
          setKcAnswers({});
          setKcSubmitted(false);
          setKcScoreSummary(null);
          setViewMode('explorer');
        } catch {
          // ignore if stale id
        }
      })();
    }
  }, [selectedContext.lessonId]);

  const openSubject = async (sub: CurriculumSubject) => {
    setSelectedSubject(sub);
    setSelectedChapter(null);
    setActiveLesson(null);
    setLessonContent(null);
    setActionResult(null);
    setLoadingChapters(true);
    try {
      const res = await fetchCurriculumChapters({ subjectId: sub.subjectId, pageSize: 50 });
      setChapters(res.items);
    } catch {
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const openChapter = async (ch: CurriculumUnitChapter) => {
    setSelectedChapter(ch);
    setActiveLesson(null);
    setLessonContent(null);
    setActionResult(null);
    setLoadingLessons(true);
    try {
      const res = await fetchCurriculumLessons({ chapterId: ch.chapterId, pageSize: 50 });
      setLessons(res.items);
    } catch {
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const openLesson = async (les: CurriculumLesson) => {
    setActiveLesson(les);
    setActionResult(null);
    setContentError(null);
    setKcAnswers({});
    setKcSubmitted(false);
    setKcScoreSummary(null);
    setRevealedPracticeIdx({});
    recordRecentLesson(les);
    setSelectedContext({
      classLevel: les.classLevel,
      subject: les.subject,
      subjectId: les.subjectId,
      chapterId: les.chapterId,
      lessonId: les.lessonId,
      lessonTitle: les.lessonTitle,
    });
    try {
      const detail = await fetchLessonDetail(les.lessonId);
      setLessonContent(detail.cachedContent);
    } catch {
      setLessonContent(null);
    }
  };

  const handleGenerateLessonContent = async (forceRegenerate = false) => {
    if (!activeLesson || generatingContent) return;
    setGeneratingContent(true);
    setContentError(null);
    try {
      const res = await generateLessonContentApi(activeLesson.lessonId, forceRegenerate);
      setLessonContent(res.content);
      setKcAnswers({});
      setKcSubmitted(false);
      setKcScoreSummary(null);
      showToast(
        res.cached
          ? 'Loaded cached original AI lesson content'
          : 'Generated original AI lesson walkthrough via Gemini 4 Hydrogen',
        'success'
      );
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Unable to generate lesson content.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleRunLessonAction = async (action: LessonAIAction) => {
    if (!activeLesson || activeActionLoading) return;
    setActiveActionLoading(action);
    try {
      const res = await runLessonActionApi(activeLesson.lessonId, action);
      setActionResult({ action, ...res.data });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lesson AI action failed.', 'error');
    } finally {
      setActiveActionLoading(null);
    }
  };

  const handleSubmitKnowledgeCheck = async () => {
    if (!activeLesson || !lessonContent || kcSubmitting || kcSubmitted) return;
    const questions = lessonContent.knowledgeCheck;
    if (Object.keys(kcAnswers).length < questions.length) {
      showToast('Please answer all knowledge check questions before submitting.', 'info');
      return;
    }
    setKcSubmitting(true);
    try {
      const assessmentId = `kc_${activeLesson.lessonId}_${Date.now()}`;
      const results = questions.map((q) => {
        const picked = kcAnswers[q.questionId] ?? -1;
        const conceptSlug = q.conceptName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 48);
        return {
          conceptId: `${activeLesson.chapterId}_${conceptSlug}`,
          conceptName: q.conceptName,
          chapterId: activeLesson.chapterId,
          subject: activeLesson.subject,
          classLevel: activeLesson.classLevel,
          questionId: q.questionId,
          selectedOptionIndex: picked,
          isCorrect: picked === q.correctOptionIndex,
          difficultyLevel: activeLesson.difficultyLevel,
          timeSpentSeconds: 30,
        };
      });

      const summary = await submitValidatedAssessment({
        assessmentId,
        type: 'practice',
        classLevel: activeLesson.classLevel,
        subject: activeLesson.subject,
        chapterId: activeLesson.chapterId,
        results,
      });

      const correct = results.filter((r) => r.isCorrect).length;
      setKcSubmitted(true);
      markLessonCompleted(activeLesson.lessonId);
      setKcScoreSummary(
        `Scored ${correct}/${results.length} (${Math.round((correct / results.length) * 100)}%). Updated ${summary.updatedConcepts.length} concept(s) in your Living Learner Model & spaced revision queue.`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save knowledge check.', 'error');
    } finally {
      setKcSubmitting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importPayload.trim() || importing) return;
    setImporting(true);
    try {
      const res = await importCurriculumApi({
        format: importFormat,
        sourceLabel: importLabel.trim() || 'Manual Syllabus Import',
        importedBy: firebaseUser?.email || (isDemoMode ? 'demo_evaluator' : 'curriculum_admin'),
        payload: importPayload,
      });
      setLastImportJob(res.job);
      setCoverage(res.coverage);
      await loadSubjects();
      showToast(
        `Import ${res.job.status}: ${res.job.insertedCount} inserted, ${res.job.skippedDuplicateCount} duplicates skipped, ${res.job.failedCount} failed.`,
        res.job.failedCount > 0 ? 'info' : 'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Import request failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSyncToFirestore = async () => {
    if (!firebaseUser) {
      showToast('Sign in with your verified admin account to sync curriculum batches to Firestore.', 'info');
      return;
    }
    setSyncingFirestore(true);
    try {
      const [subRes, chRes, lesRes] = await Promise.all([
        fetchCurriculumSubjects({ verificationStatus: 'Verified', pageSize: 100 }),
        fetchCurriculumChapters({ pageSize: 50 }),
        fetchCurriculumLessons({ pageSize: 50 }),
      ]);
      const synced = await syncVerifiedCurriculumBatch({
        subjects: subRes.items,
        chapters: chRes.items,
        lessons: lesRes.items,
      });
      showToast(
        `Synced to Firestore: ${synced.syncedSubjects} subjects, ${synced.syncedChapters} chapters, ${synced.syncedLessons} lessons.`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Firestore sync requires verified admin privileges (enforced by firestore.rules).',
        'error'
      );
    } finally {
      setSyncingFirestore(false);
    }
  };

  const chapterMasteryPercent = (chapterId: string): number | null => {
    const entries = Object.values(learnerModel).filter((c) => c.chapterId === chapterId);
    if (entries.length === 0) return null;
    return Math.round(entries.reduce((sum, c) => sum + c.masteryScore, 0) / entries.length);
  };

  const lessonProgressSummary = (les: CurriculumLesson) => {
    const related = Object.values(learnerModel).filter(
      (c) =>
        c.chapterId === les.chapterId &&
        les.concepts.some((name) => name.toLowerCase() === c.conceptName.toLowerCase())
    );
    const isCompleted = completedLessonIds.includes(les.lessonId);
    const avgMastery =
      related.length > 0
        ? Math.round(related.reduce((sum, c) => sum + c.masteryScore, 0) / related.length)
        : isCompleted
        ? 100
        : 0;
    const statusLabel = isCompleted
      ? 'Knowledge Check Completed'
      : related.length > 0
      ? 'In Progress'
      : 'Not Started';
    return { isCompleted, avgMastery, statusLabel, trackedConcepts: related.length };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner + Mode Toggle */}
      <div className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
            <span>CBSE Academic Session 2026–27</span>
            <span>·</span>
            <span>
              {coverage
                ? `${coverage.totals.officialSubjectsCatalogued} Official Subjects · ${coverage.totals.verifiedLessons} Verified Lessons`
                : 'Classes 10, 11 & 12'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
            CBSE Curriculum Explorer & Lesson Studio
          </h2>
          <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 mt-0.5 max-w-2xl">
            Browse every official 2026–27 Academic, Language, Elective, and Skill Education subject directly from cbseacademic.nic.in. Verification status is reported honestly—no invented syllabus entries.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setViewMode('explorer')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'explorer'
                ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                : 'text-[#283618] dark:text-[#FEFAE0]/80'
            }`}
          >
            Curriculum Explorer
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('coverage');
              void loadCoverage();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
              viewMode === 'coverage'
                ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                : 'text-[#283618] dark:text-[#FEFAE0]/80'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Coverage & Ingestion
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: COVERAGE & INGESTION CONSOLE                                */}
      {/* =================================================================== */}
      {viewMode === 'coverage' && (
        <div className="space-y-6">
          {loadingCoverage && !coverage ? (
            <div className="p-10 text-center text-sm text-[#606C38] dark:text-[#FEFAE0]">
              Loading CBSE 2026–27 coverage metrics...
            </div>
          ) : (
            coverage && (
              <>
                {/* Honest Coverage KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Official 2026–27 Subjects',
                      value: String(coverage.totals.officialSubjectsCatalogued),
                      sub: 'Parsed from cbseacademic.nic.in',
                    },
                    {
                      label: 'Subjects With Verified Lessons',
                      value: `${coverage.totals.subjectsWithVerifiedChapters} (${coverage.totals.lessonCoveragePercent}%)`,
                      sub: `${coverage.totals.subjectsPendingSyllabusParsing} pending PDF parsing`,
                    },
                    {
                      label: 'Verified Chapters & Lessons',
                      value: `${coverage.totals.totalChapters} / ${coverage.totals.verifiedLessons}`,
                      sub: `${coverage.totals.totalConcepts} mapped concepts`,
                    },
                    {
                      label: 'Ingestion Audit Logs',
                      value: String(coverage.recentImports.length),
                      sub: 'Validated JSON & CSV batches',
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-[18px] p-4 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38]"
                    >
                      <p className="text-xs font-medium text-[#606C38] dark:text-[#DDA15E]">{kpi.label}</p>
                      <p className="text-2xl font-extrabold text-[#283618] dark:text-[#FEFAE0] tabular-nums mt-1">
                        {kpi.value}
                      </p>
                      <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/75 mt-1">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Class-wise & Category Breakdown */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                        Coverage by Class (Session {coverage.academicSession})
                      </h3>
                      <button
                        type="button"
                        onClick={() => void handleSyncToFirestore()}
                        disabled={syncingFirestore}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-xs font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {syncingFirestore ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CloudUpload className="w-3.5 h-3.5" />
                        )}
                        Sync to Firestore
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(['10', '11', '12'] as ClassLevel[]).map((cls) => {
                        const row = coverage.byClass[cls];
                        const pct = Math.round((row.subjectsWithChapters / Math.max(1, row.officialSubjects)) * 100);
                        return (
                          <div
                            key={cls}
                            className="p-3.5 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#283618] dark:text-[#FEFAE0]">
                              <span>CBSE Class {cls}</span>
                              <span className="tabular-nums">
                                {row.subjectsWithChapters}/{row.officialSubjects} subjects parsed · {row.verifiedLessons} lessons
                              </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-[#E5E0C5] dark:bg-[#334220] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#606C38] dark:bg-[#DDA15E]"
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                            <p className="mt-1.5 text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/75">
                              {row.pendingSubjects} official subjects catalogued with PDF links, awaiting structured chapter ingestion.
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-4">
                    <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                      Strict Category Separation (Academic vs Skill)
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(Object.keys(coverage.byCategory) as SubjectCategory[]).map((catKey) => {
                        const bucket = coverage.byCategory[catKey];
                        return (
                          <div
                            key={catKey}
                            className="p-3.5 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                          >
                            <p className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                              {bucket.label}
                            </p>
                            <p className="text-xl font-extrabold text-[#283618] dark:text-[#FEFAE0] tabular-nums mt-1">
                              {bucket.officialSubjects} subjects
                            </p>
                            <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/75 mt-1">
                              {bucket.subjectsWithChapters} verified · {bucket.lessons} structured lessons
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/75">
                      Official sources:{' '}
                      <a
                        href="https://cbseacademic.nic.in/curriculum_2027.html"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-[#606C38] dark:text-[#DDA15E]"
                      >
                        cbseacademic.nic.in/curriculum_2027.html
                      </a>{' '}
                      &amp;{' '}
                      <a
                        href="https://cbseacademic.nic.in/skill-education-curriculum.html"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-[#606C38] dark:text-[#DDA15E]"
                      >
                        skill-education-curriculum.html
                      </a>
                    </p>
                  </div>
                </div>

                {/* Live JSON / CSV Syllabus Ingestion Tool */}
                <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] flex items-center gap-2">
                        <Upload className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
                        Structured Syllabus Ingestion Pipeline (JSON &amp; CSV)
                      </h3>
                      <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 mt-0.5">
                        Validates every row against official 2026–27 subject IDs, prevents duplicates automatically, logs every batch, and reports row-level errors cleanly.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImportFormat('json');
                          setImportPayload(SAMPLE_JSON_IMPORT);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          importFormat === 'json'
                            ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                            : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0] border border-[#D8D3B4] dark:border-[#606C38]'
                        }`}
                      >
                        JSON Format
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImportFormat('csv');
                          setImportPayload(SAMPLE_CSV_IMPORT);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 ${
                          importFormat === 'csv'
                            ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                            : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0] border border-[#D8D3B4] dark:border-[#606C38]'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        CSV Format
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 space-y-2.5">
                      <input
                        type="text"
                        value={importLabel}
                        onChange={(e) => setImportLabel(e.target.value)}
                        placeholder="Batch label (e.g., Class 10 Science Unit I)"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
                      />
                      <textarea
                        rows={10}
                        value={importPayload}
                        onChange={(e) => setImportPayload(e.target.value)}
                        className="w-full p-3.5 rounded-xl font-mono text-xs bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
                      />
                      <button
                        type="button"
                        onClick={() => void handleImportSubmit()}
                        disabled={importing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-xs font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Validate &amp; Ingest Syllabus Batch
                      </button>
                    </div>

                    <div className="lg:col-span-4 space-y-3">
                      <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0]">
                        Recent Import Audit Logs
                      </p>
                      {lastImportJob && lastImportJob.errors.length > 0 && (
                        <div className="p-3 rounded-xl bg-[#BC6C25]/15 border border-[#BC6C25] text-xs space-y-1">
                          <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                            Row Validation Errors ({lastImportJob.errors.length})
                          </p>
                          {lastImportJob.errors.slice(0, 4).map((e, i) => (
                            <p key={i} className="text-[11px] text-[#283618] dark:text-[#FEFAE0]">
                              Row {e.row}: {e.message}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {coverage.recentImports.map((job) => (
                          <div
                            key={job.importId}
                            className="p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#283618] dark:text-[#FEFAE0] truncate">
                                {job.sourceLabel}
                              </span>
                              <span className="uppercase text-[10px] font-bold text-[#606C38] dark:text-[#DDA15E] shrink-0">
                                {job.format}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/80 mt-1 tabular-nums">
                              Inserted: {job.insertedCount} · Skipped dupes: {job.skippedDuplicateCount} · Failed: {job.failedCount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: DEDICATED LESSON PAGE                                       */}
      {/* =================================================================== */}
      {viewMode === 'explorer' && activeLesson && (
        <div className="space-y-6">
          {/* Breadcrumb + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveLesson(null);
                setLessonContent(null);
                setActionResult(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {selectedChapter ? selectedChapter.title : 'Curriculum Explorer'}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={activeLesson.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] hover:border-[#606C38]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#BC6C25] dark:text-[#DDA15E]" />
                Official CBSE PDF
              </a>
              <button
                type="button"
                onClick={() =>
                  jumpToStudentPage('tutor', {
                    classLevel: activeLesson.classLevel,
                    subject: activeLesson.subject,
                    subjectId: activeLesson.subjectId,
                    chapterId: activeLesson.chapterId,
                    lessonId: activeLesson.lessonId,
                    lessonTitle: activeLesson.lessonTitle,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BC6C25] hover:bg-[#283618] text-[#FEFAE0] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask AI Tutor About This Lesson
              </button>
            </div>
          </div>

          {/* Official Syllabus Metadata Header Card */}
          <div className="rounded-[20px] p-6 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-[#606C38] text-[#FEFAE0]">
                  Class {activeLesson.classLevel} · {activeLesson.subject}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] capitalize">
                  {activeLesson.lessonType.replace('_', ' ')} lesson
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#DDA15E]/25 text-[#BC6C25] dark:text-[#DDA15E]">
                  {activeLesson.verificationStatus} · Session {activeLesson.academicSession}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#606C38] dark:text-[#FEFAE0]/80 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {activeLesson.estimatedStudyTime} min · {activeLesson.difficultyLevel}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-[#606C38] dark:text-[#DDA15E]">
                {activeLesson.unitName} · {activeLesson.chapterName} · Lesson {activeLesson.lessonNumber}
              </p>
              <h3 className="text-2xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
                {activeLesson.lessonTitle}
              </h3>
              <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mt-2 leading-relaxed">
                {activeLesson.lessonDescription}
              </p>
            </div>

            {/* Lesson Progress Indicator */}
            {(() => {
              const prog = lessonProgressSummary(activeLesson);
              return (
                <div className="p-3.5 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#283618] dark:text-[#FEFAE0]">
                      Lesson Progress: {prog.statusLabel}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#606C38] dark:text-[#DDA15E]">
                      {prog.avgMastery}% concept readiness
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E0C5] dark:bg-[#334220] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#606C38] dark:bg-[#DDA15E] transition-all"
                      style={{ width: `${Math.max(prog.isCompleted ? 100 : 6, prog.avgMastery)}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/60 text-xs">
              <div>
                <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1.5">Learning Objectives</p>
                <ul className="space-y-1 text-[#4A543B] dark:text-[#FEFAE0]/85">
                  {activeLesson.learningObjectives.map((obj) => (
                    <li key={obj} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1.5">Syllabus Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeLesson.topics.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-bold text-[#283618] dark:text-[#DDA15E] mb-1.5">Core Concepts &amp; Prerequisites</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {activeLesson.concepts.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-lg bg-[#606C38]/15 dark:bg-[#606C38] text-[#283618] dark:text-[#FEFAE0] font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                {activeLesson.prerequisites.length > 0 && (
                  <p className="text-[11px] text-[#606C38] dark:text-[#FEFAE0]/75">
                    Prereq: {activeLesson.prerequisites.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 10 Lesson-Based AI Quick Actions */}
          <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#BC6C25] dark:text-[#DDA15E]" />
                Lesson-Scoped AI Actions (Gemini 4 Hydrogen)
              </p>
              <button
                type="button"
                onClick={() => void handleGenerateLessonContent(Boolean(lessonContent))}
                disabled={generatingContent}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {generatingContent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5" />
                )}
                {lessonContent ? 'Regenerate Full Lesson Study Guide' : 'Generate Complete Original Lesson Guide'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {LESSON_ACTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => void handleRunLessonAction(act.id)}
                  disabled={Boolean(activeActionLoading)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FEFAE0] dark:bg-[#283618] hover:bg-[#DDA15E]/25 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {activeActionLoading === act.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  {act.label}
                </button>
              ))}
            </div>

            {actionResult && (
              <div className="mt-3 rounded-2xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#DDA15E]/70 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                      Original AI Lesson Action Output · Not Verbatim Textbook Text
                    </p>
                    <h4 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                      {actionResult.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void saveStudyNote({
                        title: `${activeLesson.lessonTitle} — ${actionResult.title}`,
                        materialType: 'revision_notes',
                        classLevel: activeLesson.classLevel,
                        subject: activeLesson.subject,
                        chapterId: activeLesson.chapterId,
                        content: `${actionResult.summary}\n\n${actionResult.blocks
                          .map((b) => `### ${b.heading}\n${b.points.map((p) => `- ${p}`).join('\n')}`)
                          .join('\n\n')}\n\n**Tip:** ${actionResult.quickTip}`,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer shrink-0"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save Note
                  </button>
                </div>
                <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">{actionResult.summary}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {actionResult.blocks.map((blk) => (
                    <div
                      key={blk.heading}
                      className="p-3 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38]"
                    >
                      <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0] mb-1.5">{blk.heading}</p>
                      <ul className="space-y-1 text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 list-disc pl-4">
                        {blk.points.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-[#606C38] dark:text-[#DDA15E] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  {actionResult.quickTip}
                </p>
              </div>
            )}
          </div>

          {contentError && (
            <div className="rounded-xl p-4 bg-[#BC6C25]/15 border border-[#BC6C25] text-xs text-[#283618] dark:text-[#FEFAE0] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#BC6C25] shrink-0" />
              {contentError}
            </div>
          )}

          {/* Full Original AI-Generated Lesson Content Workspace */}
          {lessonContent && (
            <div className="space-y-5">
              <div className="rounded-xl px-4 py-2.5 bg-[#DDA15E]/20 dark:bg-[#334220] border border-[#DDA15E]/60 text-xs text-[#283618] dark:text-[#FEFAE0] flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{lessonContent.contentDisclaimer}</span>
                <span className="text-[11px] font-mono text-[#606C38] dark:text-[#DDA15E]">
                  Model: {lessonContent.modelUsed}
                </span>
              </div>

              {/* Introduction & Detailed Explanation */}
              <div className="rounded-[20px] p-6 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-4">
                <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Lesson Introduction &amp; Concept Walkthrough
                </h4>
                <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/90 leading-relaxed">
                  {lessonContent.introduction}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {lessonContent.detailedExplanation.map((sec) => (
                    <div
                      key={sec.heading}
                      className="p-4 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                    >
                      <h5 className="text-sm font-bold text-[#283618] dark:text-[#DDA15E] mb-1.5">
                        {sec.heading}
                      </h5>
                      <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worked Examples + Formulas / Key Frameworks */}
              <div className="grid lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-3">
                  <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                    Worked Examples
                  </h4>
                  {lessonContent.workedExamples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2"
                    >
                      <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0]">
                        Example {i + 1}: {ex.problem}
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">
                        {ex.steps.map((st, idx) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ol>
                      <p className="text-xs font-bold text-[#606C38] dark:text-[#DDA15E] pt-1">
                        Answer: {ex.finalAnswer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-5 space-y-5">
                  {lessonContent.formulas.length > 0 && (
                    <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-2.5">
                      <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                        Key Formulas &amp; Rules
                      </h4>
                      {lessonContent.formulas.map((f, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                        >
                          <p className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E]">{f.name}</p>
                          <p className="font-mono text-xs text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                            {f.expression}
                          </p>
                          <p className="text-[11px] text-[#4A543B] dark:text-[#FEFAE0]/75 mt-1">{f.whenToUse}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-2.5">
                    <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                      Common Misconceptions to Avoid
                    </h4>
                    {lessonContent.misconceptions.map((m, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs space-y-1"
                      >
                        <p className="font-bold text-[#BC6C25] dark:text-[#DDA15E]">Trap: {m.myth}</p>
                        <p className="text-[#4A543B] dark:text-[#FEFAE0]/85">Fix: {m.correction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Knowledge Check -> Connected to Deterministic Living Learner Model! */}
              <div className="rounded-[20px] p-6 bg-white dark:bg-[#334220] border-2 border-[#606C38] dark:border-[#DDA15E] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                      Connected to Living Learner Model &amp; Spaced Repetition
                    </p>
                    <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                      Lesson Knowledge Check ({lessonContent.knowledgeCheck.length} Questions)
                    </h4>
                  </div>
                  {kcScoreSummary && (
                    <span className="text-xs font-bold text-[#606C38] dark:text-[#DDA15E]">
                      {kcScoreSummary}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {lessonContent.knowledgeCheck.map((q, qIdx) => {
                    const picked = kcAnswers[q.questionId];
                    return (
                      <div
                        key={q.questionId}
                        className="p-4 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] space-y-2.5"
                      >
                        <p className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E]">
                          Q{qIdx + 1} · Concept: {q.conceptName}
                        </p>
                        <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0]">
                          {q.prompt}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const selected = picked === optIdx;
                            const isCorrect = optIdx === q.correctOptionIndex;
                            let cls =
                              'bg-white dark:bg-[#334220] border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]';
                            if (kcSubmitted) {
                              if (isCorrect) cls = 'bg-[#606C38] border-[#606C38] text-[#FEFAE0]';
                              else if (selected && !isCorrect) cls = 'bg-[#BC6C25] border-[#BC6C25] text-[#FEFAE0]';
                            } else if (selected) {
                              cls = 'bg-[#606C38] dark:bg-[#DDA15E] border-[#606C38] dark:border-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]';
                            }
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={kcSubmitted}
                                onClick={() => setKcAnswers((prev) => ({ ...prev, [q.questionId]: optIdx }))}
                                className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${cls}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {kcSubmitted && (
                          <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 pt-1">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!kcSubmitted && (
                  <button
                    type="button"
                    onClick={() => void handleSubmitKnowledgeCheck()}
                    disabled={kcSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {kcSubmitting ? 'Updating Living Learner Model...' : 'Submit Knowledge Check & Update Mastery'}
                  </button>
                )}
              </div>

              {/* Graduated Practice Questions (Easy / Medium / Hard) */}
              <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-3">
                <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Graduated Practice Questions &amp; Revision Summary
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {lessonContent.practiceQuestions.map((pq, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase text-[#BC6C25] dark:text-[#DDA15E]">
                          {pq.difficulty}
                        </span>
                        <p className="text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]">{pq.prompt}</p>
                        <p className="text-[11px] text-[#606C38] dark:text-[#FEFAE0]/75">Hint: {pq.hint}</p>
                      </div>
                      {revealedPracticeIdx[i] ? (
                        <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/90 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/50">
                          {pq.modelAnswer}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevealedPracticeIdx((prev) => ({ ...prev, [i]: true }))}
                          className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline text-left cursor-pointer"
                        >
                          Reveal Model Answer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/50">
                  <p className="text-xs font-bold text-[#283618] dark:text-[#DDA15E] mb-1.5">Quick Revision Bullet Points</p>
                  <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 list-disc pl-4">
                    {lessonContent.revisionSummary.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 3: SUBJECT -> CHAPTERS -> LESSONS DRILL-DOWN                   */}
      {/* =================================================================== */}
      {viewMode === 'explorer' && !activeLesson && selectedSubject && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (selectedChapter) {
                  setSelectedChapter(null);
                  setLessons([]);
                } else {
                  setSelectedSubject(null);
                  setChapters([]);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedChapter ? `Back to ${selectedSubject.name} Chapters` : `Back to Class ${classFilter} Subjects`}
            </button>

            <a
              href={selectedSubject.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#BC6C25] dark:text-[#DDA15E]" />
              Official CBSE 2026–27 Syllabus PDF
            </a>
          </div>

          {/* Subject Header */}
          <div className="rounded-[20px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                Class {selectedSubject.classLevel} · {categoryBadgeLabel(selectedSubject.category)}
                {selectedSubject.subjectCode ? ` · Code ${selectedSubject.subjectCode}` : ''}
              </p>
              <h3 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-0.5">
                {selectedSubject.name}
                {selectedChapter ? ` / ${selectedChapter.title}` : ''}
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                selectedSubject.verificationStatus === 'Verified'
                  ? 'bg-[#606C38] text-[#FEFAE0]'
                  : 'bg-[#BC6C25]/20 text-[#BC6C25] dark:text-[#DDA15E]'
              }`}
            >
              {selectedSubject.verificationStatus}
            </span>
          </div>

          {/* Chapters List */}
          {!selectedChapter ? (
            loadingChapters ? (
              <div className="p-10 text-center text-sm text-[#606C38] dark:text-[#FEFAE0]">
                Loading chapters...
              </div>
            ) : chapters.length === 0 ? (
              <div className="rounded-[20px] p-7 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-center space-y-3">
                <p className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0]">
                  Syllabus PDF Catalogued — Detailed Chapters Pending Ingestion
                </p>
                <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 max-w-xl mx-auto leading-relaxed">
                  <strong>{selectedSubject.name}</strong> (Class {selectedSubject.classLevel}) is verified in the official CBSE 2026–27 curriculum catalogue, but its PDF has not yet been parsed into structured chapters and lessons. MASTERY AI never invents syllabus entries.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={selectedSubject.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#606C38] text-[#FEFAE0] text-xs font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Inspect Official CBSE PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFormat('json');
                      setImportLabel(`${selectedSubject.name} (Class ${selectedSubject.classLevel}) Import`);
                      setImportPayload(
                        JSON.stringify(
                          [
                            {
                              classLevel: selectedSubject.classLevel,
                              subjectId: selectedSubject.subjectId,
                              unitNumber: 1,
                              unitName: 'Unit I',
                              chapterNumber: 1,
                              chapterName: 'Chapter 1 Title (from official PDF)',
                              lessonNumber: 1,
                              lessonTitle: 'Lesson 1 Title',
                              lessonType: selectedSubject.category === 'skill_education' ? 'skill_based' : 'theory',
                              lessonDescription: 'Paste verified syllabus description from the official CBSE 2026-27 PDF.',
                              topics: ['Topic 1', 'Topic 2'],
                              concepts: ['Core Concept 1'],
                              learningObjectives: ['Learning Objective 1'],
                              estimatedStudyTime: 35,
                              difficultyLevel: 'standard',
                              verificationStatus: 'Pending Verification',
                            },
                          ],
                          null,
                          2
                        )
                      );
                      setViewMode('coverage');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#DDA15E] text-[#283618] text-xs font-semibold cursor-pointer"
                  >
                    Import Syllabus Chapters for This Subject
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {chapters.map((ch) => {
                  const mastery = chapterMasteryPercent(ch.chapterId);
                  return (
                    <button
                      key={ch.chapterId}
                      type="button"
                      onClick={() => void openChapter(ch)}
                      className="text-left rounded-[18px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] hover:border-[#606C38] dark:hover:border-[#DDA15E] transition-colors space-y-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#BC6C25] dark:text-[#DDA15E]">
                          {ch.unitName} · Ch {ch.chapterNumber}
                        </span>
                        <span className="font-semibold text-[#606C38] dark:text-[#FEFAE0]/80 tabular-nums">
                          {ch.lessonCount} lessons · {ch.estimatedMinutes} min
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">{ch.title}</h4>
                      <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 line-clamp-2 leading-relaxed">
                        {ch.description}
                      </p>
                      <div className="space-y-2 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/50">
                        <div className="h-1.5 rounded-full bg-[#E5E0C5] dark:bg-[#283618] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#606C38] dark:bg-[#DDA15E]"
                            style={{ width: `${mastery !== null ? mastery : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#606C38] dark:text-[#DDA15E]">
                            {mastery !== null
                              ? `Mastery: ${mastery}% (${mastery >= 80 ? 'Strong' : mastery >= 55 ? 'Developing' : 'Needs Review'})`
                              : 'Not started · Open Chapter Lessons'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* Lessons inside Selected Chapter */
            <div className="space-y-3">
              {loadingLessons ? (
                <div className="p-8 text-center text-sm text-[#606C38] dark:text-[#FEFAE0]">
                  Loading lessons...
                </div>
              ) : (
                lessons.map((les) => (
                  <div
                    key={les.lessonId}
                    className="rounded-[18px] p-5 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="text-[#BC6C25] dark:text-[#DDA15E]">
                          Lesson {les.lessonNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] capitalize">
                          {les.lessonType.replace('_', ' ')}
                        </span>
                        <span className="text-[#606C38] dark:text-[#FEFAE0]/75 tabular-nums">
                          {les.estimatedStudyTime} min · {les.difficultyLevel}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
                        {les.lessonTitle}
                      </h4>
                      <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/85">{les.lessonDescription}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {les.concepts.map((c) => (
                          <span
                            key={c}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#606C38]/15 dark:bg-[#283618] text-[#283618] dark:text-[#DDA15E] font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void openLesson(les)}
                        className="px-4 py-2.5 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Open Lesson Studio
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 4: CLASS -> SUBJECTS BROWSER (PAGINATED & CATEGORISED)         */}
      {/* =================================================================== */}
      {viewMode === 'explorer' && !activeLesson && !selectedSubject && (
        <div className="space-y-5">
          {/* Recently Studied Lessons Quick-Resume Shelf */}
          {recentLessons.length > 0 && (
            <div className="rounded-[20px] p-4 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#BC6C25] dark:text-[#DDA15E]" />
                  Continue Recently Studied Lessons
                </p>
                <span className="text-[11px] text-[#606C38] dark:text-[#FEFAE0]/75">
                  {completedLessonIds.length} completed
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLessons.map((ref) => (
                  <button
                    key={ref.lessonId}
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          const detail = await fetchLessonDetail(ref.lessonId);
                          await openLesson(detail.lesson);
                        } catch {
                          showToast('Unable to reopen lesson.', 'error');
                        }
                      })();
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] hover:border-[#606C38] border border-[#D8D3B4] dark:border-[#606C38] text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#283618] dark:text-[#FEFAE0] flex items-center gap-1.5">
                      {completedLessonIds.includes(ref.lessonId) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#606C38] dark:text-[#DDA15E] shrink-0" />
                      )}
                      {ref.lessonTitle}
                    </p>
                    <p className="text-[11px] text-[#606C38] dark:text-[#DDA15E]">
                      Class {ref.classLevel} · {ref.subject}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="rounded-[20px] p-4 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Class Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]">
                {(['10', '11', '12'] as ClassLevel[]).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setClassFilter(cls);
                      setPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      classFilter === cls
                        ? 'bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                        : 'text-[#283618] dark:text-[#FEFAE0]/80'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>

              {/* Search + Status Filter */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1);
                    }}
                    placeholder={`Filter Class ${classFilter} subjects or codes...`}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
                  />
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#606C38] dark:text-[#DDA15E]" />
                  <select
                    aria-label="Verification status filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as CurriculumVerificationStatus | 'all');
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Verified">Verified (With Lessons)</option>
                    <option value="Pending Verification">Pending Syllabus Parsing</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Tabs (Strictly Separating Academic Electives vs Skill Education) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E0C5] dark:border-[#606C38]/50">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-[#283618] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618]'
                      : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#4A543B] dark:text-[#FEFAE0]/80 border border-[#D8D3B4] dark:border-[#606C38]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {subjectsPagination && (
                <span className="ml-auto text-xs font-semibold text-[#606C38] dark:text-[#FEFAE0]/80 tabular-nums">
                  Showing {subjects.length} of {subjectsPagination.total} official subjects
                </span>
              )}
            </div>
          </div>

          {/* Paginated Subject Cards Grid */}
          {loadingSubjects ? (
            <div className="p-12 text-center text-sm text-[#606C38] dark:text-[#FEFAE0]">
              Loading CBSE 2026–27 Class {classFilter} subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-[20px] p-10 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-center text-sm text-[#4A543B] dark:text-[#FEFAE0]/80">
              No subjects match your active filter. Try resetting the category or status filter.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => {
                const isVerified = sub.verificationStatus === 'Verified';
                return (
                  <div
                    key={sub.subjectId}
                    className={`rounded-[18px] p-5 bg-white dark:bg-[#334220] border transition-colors flex flex-col justify-between gap-4 ${
                      isVerified
                        ? 'border-[#606C38] dark:border-[#DDA15E]/80'
                        : 'border-[#D8D3B4] dark:border-[#606C38]/60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                        <span className="text-[#606C38] dark:text-[#DDA15E]">
                          {categoryBadgeLabel(sub.category)}
                          {sub.subjectCode ? ` · ${sub.subjectCode}` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            isVerified
                              ? 'bg-[#606C38] text-[#FEFAE0]'
                              : 'bg-[#BC6C25]/15 text-[#BC6C25] dark:text-[#DDA15E]'
                          }`}
                        >
                          {sub.verificationStatus}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] leading-snug">
                        {sub.name}
                      </h3>

                      <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 leading-relaxed">
                        {isVerified
                          ? `${sub.chapterCount} verified chapter(s) · ${sub.verifiedLessonCount} structured lesson(s) ready with AI Tutor & Knowledge Checks.`
                          : 'Official CBSE 2026–27 syllabus PDF catalogued. Chapter & lesson ingestion pending.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E5E0C5] dark:border-[#606C38]/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void openSubject(sub)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                          isVerified
                            ? 'bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618]'
                            : 'bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0] hover:border-[#606C38]'
                        }`}
                      >
                        {isVerified ? <Layers className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                        {isVerified ? 'Explore Chapters' : 'View Syllabus Status'}
                      </button>

                      <a
                        href={sub.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline"
                      >
                        CBSE PDF
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {subjectsPagination && subjectsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[#4A543B] dark:text-[#FEFAE0]/80 tabular-nums">
                Page {subjectsPagination.page} of {subjectsPagination.totalPages} ({subjectsPagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!subjectsPagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] disabled:opacity-45 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!subjectsPagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] disabled:opacity-45 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
