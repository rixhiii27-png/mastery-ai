import { auth } from '../lib/firebase';
import type {
  ClassLevel,
  CurriculumCoverageReport,
  CurriculumImportJob,
  CurriculumLesson,
  CurriculumSearchHit,
  CurriculumSubject,
  CurriculumUnitChapter,
  CurriculumVerificationStatus,
  DifficultyLevel,
  ExplanationMode,
  LessonAIAction,
  LessonGeneratedContent,
  MisconceptionHypothesis,
  QuestionItem,
  SubjectCategory,
  TutorStructuredResponse,
} from '../types/mastery';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

async function buildProtectedHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
      return headers;
    }
  } catch {
    // Fall through to demo header if Firebase Auth token fetch fails in unauthenticated preview
  }
  headers['X-Mastery-Demo-Mode'] = 'true';
  return headers;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(
      payload?.error || `Request failed with status ${res.status}`,
      payload?.code || 'API_ERROR',
      res.status
    );
  }
  return payload as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const headers = await buildProtectedHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(
      payload?.error || `Request failed with status ${res.status}`,
      payload?.code || 'API_ERROR',
      res.status
    );
  }
  return payload as T;
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  model: string;
  geminiConfigured: boolean;
  academicSession?: string;
  officialSubjectsCatalogued?: number;
  verifiedLessons?: number;
}> {
  return getJson('/api/health');
}

// ---------------------------------------------------------------------------
// Scalable CBSE 2026-27 Curriculum & Ingestion API Client
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export async function fetchCurriculumSubjects(params: {
  classLevel?: ClassLevel;
  category?: SubjectCategory | 'all';
  verificationStatus?: CurriculumVerificationStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: CurriculumSubject[]; pagination: PaginationMeta }> {
  const qs = new URLSearchParams();
  if (params.classLevel) qs.set('classLevel', params.classLevel);
  if (params.category) qs.set('category', params.category);
  if (params.verificationStatus) qs.set('verificationStatus', params.verificationStatus);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return getJson(`/api/curriculum/subjects?${qs.toString()}`);
}

export async function fetchCurriculumChapters(params: {
  subjectId?: string;
  classLevel?: ClassLevel;
  page?: number;
  pageSize?: number;
}): Promise<{ items: CurriculumUnitChapter[]; pagination: PaginationMeta }> {
  const qs = new URLSearchParams();
  if (params.subjectId) qs.set('subjectId', params.subjectId);
  if (params.classLevel) qs.set('classLevel', params.classLevel);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return getJson(`/api/curriculum/chapters?${qs.toString()}`);
}

export async function fetchCurriculumLessons(params: {
  chapterId?: string;
  subjectId?: string;
  classLevel?: ClassLevel;
  page?: number;
  pageSize?: number;
}): Promise<{ items: CurriculumLesson[]; pagination: PaginationMeta }> {
  const qs = new URLSearchParams();
  if (params.chapterId) qs.set('chapterId', params.chapterId);
  if (params.subjectId) qs.set('subjectId', params.subjectId);
  if (params.classLevel) qs.set('classLevel', params.classLevel);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return getJson(`/api/curriculum/lessons?${qs.toString()}`);
}

export async function fetchLessonDetail(lessonId: string): Promise<{
  lesson: CurriculumLesson;
  cachedContent: LessonGeneratedContent | null;
}> {
  return getJson(`/api/curriculum/lessons/${encodeURIComponent(lessonId)}`);
}

export async function searchCurriculumApi(params: {
  query: string;
  classLevel?: ClassLevel;
  session?: string;
  limit?: number;
}): Promise<{
  query: string;
  academicSession: string;
  classLevel: string;
  hits: CurriculumSearchHit[];
}> {
  const qs = new URLSearchParams({ q: params.query });
  if (params.classLevel) qs.set('classLevel', params.classLevel);
  if (params.session) qs.set('session', params.session);
  if (params.limit) qs.set('limit', String(params.limit));
  return getJson(`/api/curriculum/search?${qs.toString()}`);
}

export async function fetchCurriculumCoverage(): Promise<CurriculumCoverageReport> {
  return getJson('/api/curriculum/coverage');
}

export async function importCurriculumApi(params: {
  format: 'json' | 'csv';
  sourceLabel: string;
  importedBy: string;
  payload: unknown;
}): Promise<{ job: CurriculumImportJob; coverage: CurriculumCoverageReport; authMode?: string }> {
  const headers = await buildProtectedHeaders();
  const res = await fetch('/api/curriculum/import', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data?.job) {
    throw new ApiClientError(data?.error || `Import failed (${res.status})`, data?.code || 'IMPORT_ERROR', res.status);
  }
  return data as { job: CurriculumImportJob; coverage: CurriculumCoverageReport; authMode?: string };
}

export async function generateLessonContentApi(
  lessonId: string,
  forceRegenerate = false
): Promise<{ model: string; cached: boolean; content: LessonGeneratedContent }> {
  return postJson(`/api/ai/lessons/${encodeURIComponent(lessonId)}/content`, { forceRegenerate });
}

export async function runLessonActionApi(
  lessonId: string,
  action: LessonAIAction,
  studentInput?: string
): Promise<{
  model: string;
  action: LessonAIAction;
  data: {
    title: string;
    summary: string;
    blocks: { heading: string; points: string[] }[];
    quickTip: string;
  };
}> {
  return postJson(`/api/ai/lessons/${encodeURIComponent(lessonId)}/action`, { action, studentInput });
}

// ---------------------------------------------------------------------------
// Core Six AI Agents + Study Materials
// ---------------------------------------------------------------------------
export async function askTutorAgent(params: {
  question: string;
  classLevel: ClassLevel;
  subject: string;
  chapterTitle: string;
  conceptName?: string;
  lessonId?: string;
  mode: ExplanationMode;
  hintFirst: boolean;
  includePractice: boolean;
  learnerContext?: {
    masteryScore?: number;
    potentialMisconception?: string;
    difficultyLevel?: string;
  };
  history?: { role: 'student' | 'tutor'; text: string }[];
}): Promise<{ model: string; data: TutorStructuredResponse }> {
  return postJson('/api/ai/tutor', params);
}

export async function generateAdaptiveQuestions(params: {
  classLevel: ClassLevel;
  subject: string;
  chapterTitle: string;
  conceptName: string;
  conceptId: string;
  chapterId: string;
  difficultyLevel: DifficultyLevel;
  count: number;
  focusMisconception?: string;
}): Promise<{ model: string; questions: QuestionItem[] }> {
  return postJson('/api/ai/assessment/generate', params);
}

export async function analyzeDiagnosticMistakes(params: {
  classLevel: ClassLevel;
  subject: string;
  chapterTitle: string;
  incorrectItems: {
    conceptId: string;
    conceptName: string;
    questionPrompt: string;
    chosenOption: string;
    correctOption: string;
    studentNote?: string;
  }[];
}): Promise<{
  model: string;
  data: {
    hypotheses: MisconceptionHypothesis[];
    overallEncouragement: string;
    recommendedNextStep: string;
  };
}> {
  return postJson('/api/ai/diagnostic/analyze', params);
}

export async function fetchAdaptiveRecommendation(params: {
  classLevel: ClassLevel;
  conceptsSummary: {
    conceptId: string;
    conceptName: string;
    subject: string;
    masteryScore: number;
    difficultyLevel: string;
    potentialMisconception: string;
  }[];
}): Promise<{
  model: string;
  data: {
    recommendedConceptId: string;
    recommendedAction: string;
    difficultyGuidance: string;
    simplerAnalogy: string;
    prerequisiteCheck: string;
  };
}> {
  return postJson('/api/ai/adaptive/recommend', params);
}

export async function fetchRevisionRecallPrompts(params: {
  classLevel: ClassLevel;
  dueItems: {
    conceptName: string;
    subject: string;
    dueDate: string;
    priority: string;
    reason: string;
  }[];
}): Promise<{
  model: string;
  data: {
    studyStrategy: string;
    recallPrompts: {
      conceptName: string;
      quickRecallQuestion: string;
      keyCheckpoints: string;
    }[];
  };
}> {
  return postJson('/api/ai/revision/prioritize', params);
}

export async function fetchRoleAnalyticsSummary(params: {
  role: 'student' | 'teacher' | 'parent';
  authorizedMetrics: Record<string, unknown>;
}): Promise<{
  model: string;
  data: {
    headline: string;
    strengths: string[];
    priorityGaps: string[];
    actionablePlan: string[];
  };
}> {
  return postJson('/api/ai/analytics/summarize', params);
}

export async function generateStudyMaterial(params: {
  classLevel: ClassLevel;
  subject: string;
  chapterTitle: string;
  topics: string[];
  materialType:
    | 'chapter_notes'
    | 'summary'
    | 'revision_notes'
    | 'flashcards'
    | 'formula_sheet'
    | 'practice_questions'
    | 'concept_list';
  focusWeakConcepts?: string[];
}): Promise<{
  model: string;
  data: {
    title: string;
    overview: string;
    sections: { heading: string; bullets: string[] }[];
    flashcards?: { front: string; back: string }[];
    examTips: string[];
  };
}> {
  return postJson('/api/ai/materials/generate', params);
}
