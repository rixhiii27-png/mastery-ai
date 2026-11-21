import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { AIServiceError, GEMINI_MODEL_ID, isGeminiConfigured } from './server/aiConfig.js';
import {
  runAdaptiveAgent,
  runAnalyticsAgent,
  runAssessmentAgent,
  runDiagnosticAgent,
  runLessonActionAgent,
  runLessonContentGenerator,
  runRevisionAgent,
  runStudyMaterialGenerator,
  runTutorAgent,
} from './server/aiOrchestrator.js';
import {
  getCachedLessonContent,
  getCoverageReport,
  getCurriculumSessions,
  getImportJobs,
  getLessonById,
  getSubjectById,
  ingestCurriculumPayload,
  queryChapters,
  queryLessons,
  querySubjects,
  searchCurriculum,
  setCachedLessonContent,
} from './server/curriculumStore.js';
import {
  requireAuthOrDemo,
  requireCurriculumAdminOrDemoSandbox,
} from './server/authMiddleware.js';
import type { ClassLevel, CurriculumVerificationStatus, SubjectCategory } from './src/types/mastery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '2mb' }));

function handleRouteError(res: Response, err: unknown) {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: 'Invalid request payload.',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }
  if (err instanceof AIServiceError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error.';
  res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
}

// ---------------------------------------------------------------------------
// Health & Configuration Inspection
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  const coverage = getCoverageReport();
  res.json({
    ok: true,
    service: 'MASTERY AI Backend',
    model: GEMINI_MODEL_ID,
    geminiConfigured: isGeminiConfigured(),
    academicSession: coverage.academicSession,
    officialSubjectsCatalogued: coverage.totals.officialSubjectsCatalogued,
    verifiedLessons: coverage.totals.verifiedLessons,
  });
});

// ---------------------------------------------------------------------------
// Scalable CBSE 2026-27 Curriculum & Ingestion Endpoints
// ---------------------------------------------------------------------------
app.get('/api/curriculum/sessions', (_req: Request, res: Response) => {
  res.json({ sessions: getCurriculumSessions() });
});

app.get('/api/curriculum/subjects', (req: Request, res: Response) => {
  const classLevel = typeof req.query.classLevel === 'string' && ['10', '11', '12'].includes(req.query.classLevel)
    ? (req.query.classLevel as ClassLevel)
    : undefined;
  const category = typeof req.query.category === 'string'
    ? (req.query.category as SubjectCategory | 'all')
    : 'all';
  const verificationStatus = typeof req.query.verificationStatus === 'string'
    ? (req.query.verificationStatus as CurriculumVerificationStatus | 'all')
    : 'all';
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 24;

  res.json(querySubjects({ classLevel, category, verificationStatus, search, page, pageSize }));
});

app.get('/api/curriculum/subjects/:subjectId', (req: Request, res: Response) => {
  const subject = getSubjectById(String(req.params.subjectId));
  if (!subject) {
    res.status(404).json({ error: 'Subject not found in CBSE 2026-27 catalogue.' });
    return;
  }
  res.json({ subject });
});

app.get('/api/curriculum/chapters', (req: Request, res: Response) => {
  const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
  const classLevel = typeof req.query.classLevel === 'string' && ['10', '11', '12'].includes(req.query.classLevel)
    ? (req.query.classLevel as ClassLevel)
    : undefined;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;

  res.json(queryChapters({ subjectId, classLevel, page, pageSize }));
});

app.get('/api/curriculum/lessons', (req: Request, res: Response) => {
  const chapterId = typeof req.query.chapterId === 'string' ? req.query.chapterId : undefined;
  const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
  const classLevel = typeof req.query.classLevel === 'string' && ['10', '11', '12'].includes(req.query.classLevel)
    ? (req.query.classLevel as ClassLevel)
    : undefined;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;

  res.json(queryLessons({ chapterId, subjectId, classLevel, page, pageSize }));
});

app.get('/api/curriculum/lessons/:lessonId', (req: Request, res: Response) => {
  const lesson = getLessonById(String(req.params.lessonId));
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }
  res.json({
    lesson,
    cachedContent: getCachedLessonContent(lesson.lessonId),
  });
});

app.get('/api/curriculum/search', (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const classLevel = typeof req.query.classLevel === 'string' && ['10', '11', '12'].includes(req.query.classLevel)
    ? (req.query.classLevel as ClassLevel)
    : undefined;
  const academicSession = typeof req.query.session === 'string' ? req.query.session : '2026-27';
  const limit = Number(req.query.limit) || 15;

  res.json({
    query,
    academicSession,
    classLevel: classLevel ?? 'all',
    hits: searchCurriculum({ query, classLevel, academicSession, limit }),
  });
});

app.get('/api/curriculum/coverage', (_req: Request, res: Response) => {
  res.json(getCoverageReport());
});

app.get('/api/curriculum/imports', (_req: Request, res: Response) => {
  res.json({ imports: getImportJobs() });
});

const importReqSchema = z.object({
  format: z.enum(['json', 'csv']),
  sourceLabel: z.string().min(2).max(180).default('Admin Syllabus Import'),
  importedBy: z.string().min(2).max(120).default('curriculum_admin'),
  payload: z.unknown(),
});

app.post('/api/curriculum/import', requireCurriculumAdminOrDemoSandbox, (req: Request, res: Response) => {
  try {
    const parsed = importReqSchema.parse(req.body);
    const verifiedActor = req.authContext?.authenticated
      ? req.authContext.email || req.authContext.uid
      : 'demo_sandbox';
    const job = ingestCurriculumPayload({
      ...parsed,
      importedBy: verifiedActor,
    });
    const statusCode = job.status === 'failed' ? 422 : 200;
    res.status(statusCode).json({
      job,
      coverage: getCoverageReport(),
      authMode: req.authContext?.authenticated ? 'verified_admin' : 'demo_sandbox',
    });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// Protect all Gemini AI routes with Firebase ID Token verification (or explicit Demo Mode header)
app.use('/api/ai', requireAuthOrDemo);

// ---------------------------------------------------------------------------
// AI Lesson Content & Lesson Action Endpoints (Bounded Context -> Gemini 4 Hydrogen)
// ---------------------------------------------------------------------------
app.post('/api/ai/lessons/:lessonId/content', async (req: Request, res: Response) => {
  try {
    const lesson = getLessonById(String(req.params.lessonId));
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found in curriculum store.' });
      return;
    }

    const forceRegenerate = Boolean(req.body?.forceRegenerate);
    if (!forceRegenerate) {
      const cached = getCachedLessonContent(lesson.lessonId);
      if (cached) {
        res.json({ model: GEMINI_MODEL_ID, cached: true, content: cached });
        return;
      }
    }

    const generated = await runLessonContentGenerator({
      lessonId: lesson.lessonId,
      classLevel: lesson.classLevel,
      subject: lesson.subject,
      chapterName: lesson.chapterName,
      lessonTitle: lesson.lessonTitle,
      lessonType: lesson.lessonType,
      lessonDescription: lesson.lessonDescription,
      topics: lesson.topics,
      concepts: lesson.concepts,
      learningObjectives: lesson.learningObjectives,
    });

    setCachedLessonContent(generated);
    res.json({ model: GEMINI_MODEL_ID, cached: false, content: generated });
  } catch (err) {
    handleRouteError(res, err);
  }
});

const lessonActionReqSchema = z.object({
  action: z.enum([
    'explain_lesson',
    'explain_difficult_concept',
    'simple_example',
    'detailed_explanation',
    'generate_notes',
    'generate_flashcards',
    'practice_questions',
    'test_understanding',
    'explain_mistake',
    'revision_summary',
  ]),
  studentInput: z.string().max(600).optional(),
});

app.post('/api/ai/lessons/:lessonId/action', async (req: Request, res: Response) => {
  try {
    const lesson = getLessonById(String(req.params.lessonId));
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found in curriculum store.' });
      return;
    }
    const payload = lessonActionReqSchema.parse(req.body);
    const data = await runLessonActionAgent({
      action: payload.action,
      classLevel: lesson.classLevel,
      subject: lesson.subject,
      chapterName: lesson.chapterName,
      lessonTitle: lesson.lessonTitle,
      lessonType: lesson.lessonType,
      topics: lesson.topics,
      concepts: lesson.concepts,
      studentInput: payload.studentInput,
    });
    res.json({ model: GEMINI_MODEL_ID, action: payload.action, data });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 1. Tutor Agent Endpoint (Bounded lesson retrieval + off-chapter flexibility)
// ---------------------------------------------------------------------------
const tutorReqSchema = z.object({
  question: z.string().min(2).max(2000),
  classLevel: z.enum(['10', '11', '12']),
  subject: z.string().min(1).max(120),
  chapterTitle: z.string().min(1).max(200),
  conceptName: z.string().max(200).optional(),
  lessonId: z.string().max(128).optional(),
  mode: z.enum(['beginner', 'simple', 'detailed', 'exam_prep']).default('simple'),
  hintFirst: z.boolean().default(false),
  includePractice: z.boolean().default(true),
  learnerContext: z
    .object({
      masteryScore: z.number().min(0).max(100).optional(),
      potentialMisconception: z.string().max(500).optional(),
      difficultyLevel: z.string().max(30).optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['student', 'tutor']),
        text: z.string().max(1000),
      })
    )
    .max(10)
    .optional(),
});

app.post('/api/ai/tutor', async (req: Request, res: Response) => {
  try {
    const payload = tutorReqSchema.parse(req.body);
    const boundedLesson = payload.lessonId ? getLessonById(payload.lessonId) : null;
    const result = await runTutorAgent({
      ...payload,
      lessonTitle: boundedLesson?.lessonTitle,
      lessonDescription: boundedLesson?.lessonDescription,
      lessonTopics: boundedLesson?.topics,
      lessonObjectives: boundedLesson?.learningObjectives,
    });
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 2. Assessment Agent Endpoint
// ---------------------------------------------------------------------------
const assessmentReqSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  subject: z.string().min(1).max(120),
  chapterTitle: z.string().min(1).max(200),
  conceptName: z.string().min(1).max(200),
  conceptId: z.string().min(1).max(128),
  chapterId: z.string().min(1).max(128),
  difficultyLevel: z.enum(['foundational', 'standard', 'application', 'challenge']),
  count: z.number().int().min(1).max(4).default(2),
  focusMisconception: z.string().max(500).optional(),
});

app.post('/api/ai/assessment/generate', async (req: Request, res: Response) => {
  try {
    const payload = assessmentReqSchema.parse(req.body);
    const questions = await runAssessmentAgent(payload);
    res.json({ model: GEMINI_MODEL_ID, questions });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 3. Diagnostic Agent Endpoint
// ---------------------------------------------------------------------------
const diagnosticReqSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  subject: z.string().min(1).max(120),
  chapterTitle: z.string().min(1).max(200),
  incorrectItems: z
    .array(
      z.object({
        conceptId: z.string().min(1).max(128),
        conceptName: z.string().min(1).max(200),
        questionPrompt: z.string().min(1).max(1000),
        chosenOption: z.string().min(1).max(400),
        correctOption: z.string().min(1).max(400),
        studentNote: z.string().max(500).optional(),
      })
    )
    .min(1)
    .max(10),
});

app.post('/api/ai/diagnostic/analyze', async (req: Request, res: Response) => {
  try {
    const payload = diagnosticReqSchema.parse(req.body);
    const result = await runDiagnosticAgent(payload);
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 4. Adaptive Learning Agent Endpoint
// ---------------------------------------------------------------------------
const adaptiveReqSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  conceptsSummary: z
    .array(
      z.object({
        conceptId: z.string().min(1),
        conceptName: z.string().min(1),
        subject: z.string().min(1),
        masteryScore: z.number().min(0).max(100),
        difficultyLevel: z.string().min(1),
        potentialMisconception: z.string().max(500),
      })
    )
    .min(1)
    .max(25),
});

app.post('/api/ai/adaptive/recommend', async (req: Request, res: Response) => {
  try {
    const payload = adaptiveReqSchema.parse(req.body);
    const result = await runAdaptiveAgent(payload);
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 5. Revision Agent Endpoint
// ---------------------------------------------------------------------------
const revisionReqSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  dueItems: z
    .array(
      z.object({
        conceptName: z.string().min(1),
        subject: z.string().min(1),
        dueDate: z.string().min(4),
        priority: z.string().min(1),
        reason: z.string().min(1),
      })
    )
    .min(1)
    .max(10),
});

app.post('/api/ai/revision/prioritize', async (req: Request, res: Response) => {
  try {
    const payload = revisionReqSchema.parse(req.body);
    const result = await runRevisionAgent(payload);
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 6. Analytics Agent Endpoint
// ---------------------------------------------------------------------------
const analyticsReqSchema = z.object({
  role: z.enum(['student', 'teacher', 'parent']),
  authorizedMetrics: z.record(z.string(), z.unknown()),
});

app.post('/api/ai/analytics/summarize', async (req: Request, res: Response) => {
  try {
    const payload = analyticsReqSchema.parse(req.body);
    const result = await runAnalyticsAgent(payload);
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// 7. Study Materials Generator Endpoint
// ---------------------------------------------------------------------------
const materialReqSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  subject: z.string().min(1).max(120),
  chapterTitle: z.string().min(1).max(200),
  topics: z.array(z.string().min(1).max(120)).min(1).max(12),
  materialType: z.enum([
    'chapter_notes',
    'summary',
    'revision_notes',
    'flashcards',
    'formula_sheet',
    'practice_questions',
    'concept_list',
  ]),
  focusWeakConcepts: z.array(z.string().max(200)).max(8).optional(),
});

app.post('/api/ai/materials/generate', async (req: Request, res: Response) => {
  try {
    const payload = materialReqSchema.parse(req.body);
    const result = await runStudyMaterialGenerator(payload);
    res.json({ model: GEMINI_MODEL_ID, data: result });
  } catch (err) {
    handleRouteError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Vite Dev Middleware / Production Static Server
// ---------------------------------------------------------------------------
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MASTERY AI server running on http://0.0.0.0:${PORT} (model: ${GEMINI_MODEL_ID})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MASTERY AI server:', err);
  process.exit(1);
});
