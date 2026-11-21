import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  commitAssessmentTransaction,
  deleteMaterialDoc,
  ensureUserProfile,
  saveMaterialDoc,
  subscribeAssessments,
  subscribeLearnerModel,
  subscribeRevisionItems,
  subscribeSavedMaterials,
  updateUserProfileSettings,
  upsertRevisionItemDoc,
} from '../services/firestoreService';
import {
  applyValidatedAssessmentToModel,
  computeNextRevisionSchedule,
  todayISO,
  type EvaluatedQuestionResult,
  type ModelUpdateSummary,
} from '../services/learningEngine';
import { CURRICULUM_VERSION, getChapterById } from '../data/curriculumSeed';
import {
  buildDemoAssessments,
  buildDemoLearnerModel,
  buildDemoRevisions,
  buildDemoSavedMaterials,
  DEMO_STUDENT_PROFILE,
} from '../data/demoData';
import type {
  AssessmentRecord,
  AttemptRecord,
  ClassLevel,
  LearnerConceptState,
  MisconceptionHypothesis,
  ParentPage,
  PortalView,
  RevisionItem,
  SavedMaterial,
  StudentPage,
  StudyContextSelection,
  TeacherPage,
  UserProfile,
} from '../types/mastery';

const DEMO_STORAGE_KEY = 'mastery_ai_demo_state_v1';
const THEME_STORAGE_KEY = 'mastery_ai_theme_v1';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
}

interface AppContextValue {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & Portal Routing
  authReady: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isDemoMode: boolean;
  portalView: PortalView;
  setPortalView: (view: PortalView) => void;
  studentPage: StudentPage;
  setStudentPage: (page: StudentPage) => void;
  teacherPage: TeacherPage;
  setTeacherPage: (page: TeacherPage) => void;
  parentPage: ParentPage;
  setParentPage: (page: ParentPage) => void;

  // Auth actions
  authError: string | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enterDemo: (portal: 'student' | 'teacher' | 'parent') => void;
  exitDemo: () => void;
  resetDemoState: () => void;

  // Context linking across pages
  selectedContext: StudyContextSelection;
  setSelectedContext: (ctx: StudyContextSelection) => void;
  jumpToStudentPage: (page: StudentPage, ctx?: Partial<StudyContextSelection>) => void;

  // Living Learner Model & Persistent Student Data
  learnerModel: Record<string, LearnerConceptState>;
  assessments: AssessmentRecord[];
  revisions: RevisionItem[];
  savedMaterials: SavedMaterial[];

  // Actions
  submitValidatedAssessment: (params: {
    assessmentId: string;
    type: 'diagnostic' | 'practice' | 'exam';
    classLevel: ClassLevel;
    subject: string;
    chapterId: string;
    results: (EvaluatedQuestionResult & {
      questionId: string;
      selectedOptionIndex: number;
      timeSpentSeconds: number;
    })[];
    misconceptionHypotheses?: MisconceptionHypothesis[];
  }) => Promise<ModelUpdateSummary>;
  completeRevisionTask: (itemId: string, recallSuccessful: boolean) => Promise<void>;
  addManualRevisionTask: (concept: {
    conceptId: string;
    conceptName: string;
    subject: string;
    chapterId: string;
    reason: string;
  }) => Promise<void>;
  saveStudyNote: (material: Omit<SavedMaterial, 'itemId' | 'uid' | 'createdAt'>) => Promise<void>;
  removeStudyNote: (itemId: string) => Promise<void>;
  updateStudentSettings: (updates: {
    classLevel?: ClassLevel;
    selectedSubjects?: string[];
    dailyGoalMinutes?: number;
  }) => Promise<void>;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, tone?: 'success' | 'info' | 'error') => void;
  clearToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface StoredDemoPayload {
  profile: UserProfile;
  learnerModel: Record<string, LearnerConceptState>;
  assessments: AssessmentRecord[];
  revisions: RevisionItem[];
  savedMaterials: SavedMaterial[];
}

function loadDemoPayload(): StoredDemoPayload {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDemoPayload;
      if (parsed?.learnerModel && parsed?.revisions && parsed?.assessments) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return {
    profile: DEMO_STUDENT_PROFILE,
    learnerModel: buildDemoLearnerModel(),
    assessments: buildDemoAssessments(),
    revisions: buildDemoRevisions(),
    savedMaterials: buildDemoSavedMaterials(),
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [portalView, setPortalView] = useState<PortalView>('landing');
  const [studentPage, setStudentPage] = useState<StudentPage>('dashboard');
  const [teacherPage, setTeacherPage] = useState<TeacherPage>('overview');
  const [parentPage, setParentPage] = useState<ParentPage>('overview');

  const [selectedContext, setSelectedContext] = useState<StudyContextSelection>({
    classLevel: '10',
    subject: 'Mathematics',
    chapterId: 'cbse_10_math_ch4',
    conceptId: 'c10_math_quad_discriminant',
  });

  // Demo state
  const [demoState, setDemoState] = useState<StoredDemoPayload>(() => loadDemoPayload());

  // Authenticated Firestore state
  const [fsLearnerModel, setFsLearnerModel] = useState<Record<string, LearnerConceptState>>({});
  const [fsAssessments, setFsAssessments] = useState<AssessmentRecord[]>([]);
  const [fsRevisions, setFsRevisions] = useState<RevisionItem[]>([]);
  const [fsMaterials, setFsMaterials] = useState<SavedMaterial[]>([]);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Sync HTML .dark class for Tailwind v4 custom-variant dark
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Persist demo state changes
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
    } catch {
      // ignore quota
    }
  }, [demoState]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await ensureUserProfile(user);
          setAuthProfile(profile);
          setIsDemoMode(false);
          setPortalView((curr) => (curr === 'landing' || curr === 'auth' ? profile.role : curr));
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setAuthError('Unable to load your profile from Firestore. Please check permissions and retry.');
        }
      } else {
        setAuthProfile(null);
        setFsLearnerModel({});
        setFsAssessments([]);
        setFsRevisions([]);
        setFsMaterials([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore Real-time Subscriptions (only when authenticated & NOT in Demo mode)
  useEffect(() => {
    if (!authReady || !firebaseUser || isDemoMode) return;
    const uid = firebaseUser.uid;
    const onErr = (err: Error) => {
      console.error('Subscription error:', err.message);
    };

    const unsubModel = subscribeLearnerModel(uid, setFsLearnerModel, onErr);
    const unsubAssess = subscribeAssessments(uid, setFsAssessments, onErr);
    const unsubRev = subscribeRevisionItems(uid, setFsRevisions, onErr);
    const unsubMat = subscribeSavedMaterials(uid, setFsMaterials, onErr);

    return () => {
      unsubModel();
      unsubAssess();
      unsubRev();
      unsubMat();
    };
  }, [authReady, firebaseUser, isDemoMode]);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await ensureUserProfile(cred.user);
      setAuthProfile(profile);
      setIsDemoMode(false);
      setPortalView(profile.role);
      setStudentPage('dashboard');
      showToast(`Signed in as ${profile.displayName}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(
        msg.includes('popup-closed-by-user')
          ? 'Sign-in popup was closed before completing authentication.'
          : msg
      );
    } finally {
      setAuthLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    setIsDemoMode(false);
    if (firebaseUser) {
      await signOut(auth);
    }
    setPortalView('landing');
    showToast('Signed out of MASTERY AI', 'info');
  }, [firebaseUser, showToast]);

  const enterDemo = useCallback(
    (portal: 'student' | 'teacher' | 'parent') => {
      setIsDemoMode(true);
      setPortalView(portal);
      if (portal === 'student') setStudentPage('dashboard');
      if (portal === 'teacher') setTeacherPage('overview');
      if (portal === 'parent') setParentPage('overview');
      showToast(`Exploring ${portal.charAt(0).toUpperCase() + portal.slice(1)} Demo (Synthetic Demo Data)`, 'info');
    },
    [showToast]
  );

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    if (firebaseUser && authProfile) {
      setPortalView(authProfile.role);
    } else {
      setPortalView('landing');
    }
  }, [firebaseUser, authProfile]);

  const resetDemoState = useCallback(() => {
    const fresh: StoredDemoPayload = {
      profile: DEMO_STUDENT_PROFILE,
      learnerModel: buildDemoLearnerModel(),
      assessments: buildDemoAssessments(),
      revisions: buildDemoRevisions(),
      savedMaterials: buildDemoSavedMaterials(),
    };
    setDemoState(fresh);
    showToast('Demo data reset to initial state', 'info');
  }, [showToast]);

  const jumpToStudentPage = useCallback((page: StudentPage, ctx?: Partial<StudyContextSelection>) => {
    if (ctx) {
      setSelectedContext((prev) => ({ ...prev, ...ctx }));
    }
    setStudentPage(page);
  }, []);

  const userProfile = isDemoMode ? demoState.profile : authProfile;
  const learnerModel = isDemoMode ? demoState.learnerModel : fsLearnerModel;
  const assessments = isDemoMode ? demoState.assessments : fsAssessments;
  const revisions = isDemoMode ? demoState.revisions : fsRevisions;
  const savedMaterials = isDemoMode ? demoState.savedMaterials : fsMaterials;

  const submitValidatedAssessment: AppContextValue['submitValidatedAssessment'] = useCallback(
    async (params) => {
      const uid = isDemoMode ? demoState.profile.uid : firebaseUser?.uid;
      if (!uid) {
        throw new Error('Sign in or enter Demo Mode to record assessment progress.');
      }

      const currentModel = isDemoMode ? demoState.learnerModel : fsLearnerModel;
      const currentRevs = isDemoMode ? demoState.revisions : fsRevisions;

      // Deduplication check on existing completed assessments
      const existingAssess = (isDemoMode ? demoState.assessments : fsAssessments).find(
        (a) => a.assessmentId === params.assessmentId && a.status === 'completed'
      );
      if (existingAssess) {
        return {
          updatedConcepts: [],
          newOrUpdatedRevisions: [],
          skippedDuplicate: true,
          masteryDeltas: [],
        };
      }

      const summary = applyValidatedAssessmentToModel({
        uid,
        assessmentId: params.assessmentId,
        currentModel,
        currentRevisions: currentRevs,
        results: params.results.map((r) => ({
          conceptId: r.conceptId,
          conceptName: r.conceptName,
          chapterId: r.chapterId ?? params.chapterId,
          subject: r.subject ?? params.subject,
          classLevel: r.classLevel ?? params.classLevel,
          isCorrect: r.isCorrect,
          difficultyLevel: r.difficultyLevel,
        })),
        misconceptionHypotheses: params.misconceptionHypotheses,
      });

      const correctCount = params.results.filter((r) => r.isCorrect).length;
      const totalQuestions = Math.max(1, params.results.length);
      const scorePercent = Math.round((correctCount / totalQuestions) * 100);
      const nowIso = new Date().toISOString();
      const ch = getChapterById(params.chapterId);

      const assessmentRecord: AssessmentRecord = {
        assessmentId: params.assessmentId,
        uid,
        type: params.type,
        classLevel: params.classLevel,
        subject: params.subject,
        chapterId: params.chapterId,
        chapterTitle: ch?.title ?? params.chapterId,
        scorePercent,
        totalQuestions,
        correctCount,
        status: 'completed',
        curriculumVersion: CURRICULUM_VERSION,
        createdAt: nowIso,
        completedAt: nowIso,
      };

      const attemptRecords: AttemptRecord[] = params.results.map((r, idx) => ({
        attemptId: `att_${params.assessmentId}_${idx}`,
        uid,
        assessmentId: params.assessmentId,
        conceptId: r.conceptId,
        questionId: r.questionId,
        selectedOptionIndex: r.selectedOptionIndex,
        isCorrect: r.isCorrect,
        difficultyLevel: r.difficultyLevel,
        timeSpentSeconds: r.timeSpentSeconds,
        createdAt: nowIso,
      }));

      if (isDemoMode) {
        setDemoState((prev) => {
          const nextModel = { ...prev.learnerModel };
          for (const c of summary.updatedConcepts) {
            nextModel[c.conceptId] = c;
          }
          const revMap = new Map(prev.revisions.map((r) => [r.itemId, r]));
          for (const r of summary.newOrUpdatedRevisions) {
            revMap.set(r.itemId, r);
          }
          return {
            ...prev,
            learnerModel: nextModel,
            assessments: [assessmentRecord, ...prev.assessments],
            revisions: Array.from(revMap.values()).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
          };
        });
      } else {
        await commitAssessmentTransaction({
          uid,
          assessment: assessmentRecord,
          attempts: attemptRecords,
          updatedConcepts: summary.updatedConcepts,
          updatedRevisions: summary.newOrUpdatedRevisions,
        });
      }

      if (summary.masteryDeltas.length > 0) {
        const first = summary.masteryDeltas[0];
        showToast(
          `Living Learner Model updated: ${first.conceptName} (${first.previousMastery}% → ${first.newMastery}%)`,
          'success'
        );
      }

      return summary;
    },
    [isDemoMode, demoState, firebaseUser, fsLearnerModel, fsRevisions, fsAssessments, showToast]
  );

  const completeRevisionTask = useCallback(
    async (itemId: string, recallSuccessful: boolean) => {
      const uid = isDemoMode ? demoState.profile.uid : firebaseUser?.uid;
      if (!uid) return;
      const list = isDemoMode ? demoState.revisions : fsRevisions;
      const target = list.find((r) => r.itemId === itemId);
      if (!target) return;

      const model = isDemoMode ? demoState.learnerModel : fsLearnerModel;
      const conceptMastery = model[target.conceptId]?.masteryScore ?? 60;
      const nextPlan = computeNextRevisionSchedule({
        masteryScore: conceptMastery,
        wasSuccessful: recallSuccessful,
        currentStage: target.repetitionStage,
      });

      const nowIso = new Date().toISOString();
      const updatedItem: RevisionItem = {
        ...target,
        status: recallSuccessful ? 'completed' : 'pending',
        dueDate: recallSuccessful ? nextPlan.dueDate : todayISO(),
        intervalDays: nextPlan.intervalDays,
        repetitionStage: nextPlan.nextStage,
        priority: nextPlan.priority,
        reason: recallSuccessful
          ? `Recall succeeded! Next spaced review extended to ${nextPlan.intervalDays} days (${nextPlan.dueDate}).`
          : `Needs another review cycle. Priority kept high for immediate follow-up.`,
        updatedAt: nowIso,
      };

      if (isDemoMode) {
        setDemoState((prev) => ({
          ...prev,
          revisions: prev.revisions.map((r) => (r.itemId === itemId ? updatedItem : r)),
        }));
      } else {
        await upsertRevisionItemDoc(uid, updatedItem);
      }
      showToast(
        recallSuccessful
          ? `Revision completed — next review scheduled in ${nextPlan.intervalDays}d`
          : 'Revision kept in high-priority queue for re-study',
        'success'
      );
    },
    [isDemoMode, demoState, firebaseUser, fsRevisions, fsLearnerModel, showToast]
  );

  const addManualRevisionTask = useCallback(
    async (concept: {
      conceptId: string;
      conceptName: string;
      subject: string;
      chapterId: string;
      reason: string;
    }) => {
      const uid = isDemoMode ? demoState.profile.uid : firebaseUser?.uid;
      if (!uid) return;
      const nowIso = new Date().toISOString();
      const item: RevisionItem = {
        itemId: `rev_${concept.conceptId}`,
        uid,
        conceptId: concept.conceptId,
        conceptName: concept.conceptName,
        subject: concept.subject,
        chapterId: concept.chapterId,
        dueDate: todayISO(),
        intervalDays: 1,
        repetitionStage: 0,
        priority: 'high',
        status: 'pending',
        reason: concept.reason,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (isDemoMode) {
        setDemoState((prev) => {
          const filtered = prev.revisions.filter((r) => r.itemId !== item.itemId);
          return { ...prev, revisions: [item, ...filtered] };
        });
      } else {
        await upsertRevisionItemDoc(uid, item);
      }
      showToast(`Added "${concept.conceptName}" to Revision Planner`, 'success');
    },
    [isDemoMode, demoState.profile.uid, firebaseUser, showToast]
  );

  const saveStudyNote = useCallback(
    async (material: Omit<SavedMaterial, 'itemId' | 'uid' | 'createdAt'>) => {
      const uid = isDemoMode ? demoState.profile.uid : firebaseUser?.uid;
      if (!uid) return;
      const item: SavedMaterial = {
        ...material,
        itemId: `mat_${Date.now()}`,
        uid,
        createdAt: new Date().toISOString(),
      };
      if (isDemoMode) {
        setDemoState((prev) => ({
          ...prev,
          savedMaterials: [item, ...prev.savedMaterials],
        }));
      } else {
        await saveMaterialDoc(uid, item);
      }
      showToast(`Saved "${material.title}" to Study Materials`, 'success');
    },
    [isDemoMode, demoState.profile.uid, firebaseUser, showToast]
  );

  const removeStudyNote = useCallback(
    async (itemId: string) => {
      const uid = isDemoMode ? demoState.profile.uid : firebaseUser?.uid;
      if (!uid) return;
      if (isDemoMode) {
        setDemoState((prev) => ({
          ...prev,
          savedMaterials: prev.savedMaterials.filter((m) => m.itemId !== itemId),
        }));
      } else {
        await deleteMaterialDoc(uid, itemId);
      }
      showToast('Removed material from library', 'info');
    },
    [isDemoMode, demoState.profile.uid, firebaseUser, showToast]
  );

  const updateStudentSettings = useCallback(
    async (updates: {
      classLevel?: ClassLevel;
      selectedSubjects?: string[];
      dailyGoalMinutes?: number;
    }) => {
      if (isDemoMode) {
        setDemoState((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            ...updates,
          },
        }));
      } else if (firebaseUser) {
        await updateUserProfileSettings(firebaseUser.uid, updates);
        setAuthProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      }
      showToast('Learning preferences updated', 'success');
    },
    [isDemoMode, firebaseUser, showToast]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      authReady,
      firebaseUser,
      userProfile,
      isDemoMode,
      portalView,
      setPortalView,
      studentPage,
      setStudentPage,
      teacherPage,
      setTeacherPage,
      parentPage,
      setParentPage,
      authError,
      authLoading,
      signInWithGoogle,
      logout,
      enterDemo,
      exitDemo,
      resetDemoState,
      selectedContext,
      setSelectedContext,
      jumpToStudentPage,
      learnerModel,
      assessments,
      revisions,
      savedMaterials,
      submitValidatedAssessment,
      completeRevisionTask,
      addManualRevisionTask,
      saveStudyNote,
      removeStudyNote,
      updateStudentSettings,
      toast,
      showToast,
      clearToast,
    }),
    [
      theme,
      toggleTheme,
      authReady,
      firebaseUser,
      userProfile,
      isDemoMode,
      portalView,
      studentPage,
      teacherPage,
      parentPage,
      authError,
      authLoading,
      signInWithGoogle,
      logout,
      enterDemo,
      exitDemo,
      resetDemoState,
      selectedContext,
      jumpToStudentPage,
      learnerModel,
      assessments,
      revisions,
      savedMaterials,
      submitValidatedAssessment,
      completeRevisionTask,
      addManualRevisionTask,
      saveStudyNote,
      removeStudyNote,
      updateStudentSettings,
      toast,
      showToast,
      clearToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
