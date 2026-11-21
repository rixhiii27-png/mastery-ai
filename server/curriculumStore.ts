import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { SEED_CURRICULUM_CHAPTERS_V2, SEED_CURRICULUM_LESSONS } from '../src/data/cbse2026_27_lessons.js';
import type {
  ClassLevel,
  CurriculumCoverageReport,
  CurriculumImportJob,
  CurriculumLesson,
  CurriculumSearchHit,
  CurriculumSession,
  CurriculumSubject,
  CurriculumUnitChapter,
  CurriculumVerificationStatus,
  LessonGeneratedContent,
  SubjectCategory,
} from '../src/types/mastery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawCatalogueEntry {
  subjectId: string;
  academicSession: string;
  classLevel: ClassLevel;
  name: string;
  subjectCode: string;
  category: SubjectCategory;
  sourceUrl: string;
  sourcePage: string;
  curriculumType: 'official_cbse_2026_27' | 'official_cbse_skill_2026_27';
}

const ACTIVE_SESSION: CurriculumSession = {
  sessionId: '2026-27',
  label: 'CBSE Academic Session 2026–27',
  board: 'CBSE',
  isActive: true,
  officialSources: {
    academicUrl: 'https://cbseacademic.nic.in/curriculum_2027.html',
    skillEducationUrl: 'https://cbseacademic.nic.in/skill-education-curriculum.html',
  },
  lastVerifiedAt: '2026-04-01T00:00:00.000Z',
};

const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  main_academic: 'Main Academic Subjects',
  language: 'Languages',
  academic_elective: 'Academic Electives',
  skill_education: 'Skill Education Subjects',
};

function loadOfficialCatalogue(): RawCatalogueEntry[] {
  const catPath = path.resolve(__dirname, '../src/data/cbse2026_27_catalogue.json');
  const raw = fs.readFileSync(catPath, 'utf8');
  return JSON.parse(raw) as RawCatalogueEntry[];
}

// Mutable in-memory store hydrated from official 2026-27 catalogue + verified chapters/lessons
// Supports live validated JSON/CSV syllabus ingestion with duplicate detection & audit logs.
const rawSubjects = loadOfficialCatalogue();
const chaptersMap = new Map<string, CurriculumUnitChapter>();
const lessonsMap = new Map<string, CurriculumLesson>();
const lessonContentCache = new Map<string, LessonGeneratedContent>();
const importJobs: CurriculumImportJob[] = [];

for (const ch of SEED_CURRICULUM_CHAPTERS_V2) {
  chaptersMap.set(ch.chapterId, { ...ch });
}
for (const l of SEED_CURRICULUM_LESSONS) {
  lessonsMap.set(l.lessonId, { ...l });
}

// Record the initial catalogue + verified syllabus ingestion audit log transparently
importJobs.push({
  importId: 'imp_cbse_2026_27_bootstrap',
  academicSession: '2026-27',
  format: 'json',
  sourceLabel: 'Official CBSE 2026-27 Academic & Skill Curriculum Catalogues + Verified Starter Syllabus Pack',
  status: 'completed',
  totalRecords: rawSubjects.length + SEED_CURRICULUM_LESSONS.length,
  insertedCount: rawSubjects.length + SEED_CURRICULUM_LESSONS.length,
  skippedDuplicateCount: 0,
  failedCount: 0,
  errors: [],
  importedBy: 'system_cbse_2026_27_ingestor',
  createdAt: '2026-04-01T00:00:00.000Z',
});

function buildEnrichedSubjects(): CurriculumSubject[] {
  const chaptersBySubject = new Map<string, CurriculumUnitChapter[]>();
  for (const ch of chaptersMap.values()) {
    const arr = chaptersBySubject.get(ch.subjectId) ?? [];
    arr.push(ch);
    chaptersBySubject.set(ch.subjectId, arr);
  }

  const lessonsBySubject = new Map<string, CurriculumLesson[]>();
  for (const les of lessonsMap.values()) {
    const arr = lessonsBySubject.get(les.subjectId) ?? [];
    arr.push(les);
    lessonsBySubject.set(les.subjectId, arr);
  }

  return rawSubjects.map((s) => {
    const chs = chaptersBySubject.get(s.subjectId) ?? [];
    const less = lessonsBySubject.get(s.subjectId) ?? [];
    const verifiedLessons = less.filter((l) => l.verificationStatus === 'Verified').length;

    let verificationStatus: CurriculumVerificationStatus = 'Pending Verification';
    if (chs.length > 0 && verifiedLessons > 0) {
      verificationStatus = 'Verified';
    } else if (chs.length > 0 || less.length > 0) {
      verificationStatus = 'Incomplete';
    }

    return {
      ...s,
      verificationStatus,
      chapterCount: chs.length,
      lessonCount: less.length,
      verifiedLessonCount: verifiedLessons,
      description:
        verificationStatus === 'Verified'
          ? `CBSE 2026–27 official syllabus subject with ${chs.length} verified chapter(s) and ${verifiedLessons} structured lesson(s).`
          : `Official CBSE 2026–27 subject catalogued from cbseacademic.nic.in. Full chapter & lesson syllabus PDF awaits structured ingestion.`,
    };
  });
}

export function getCurriculumSessions(): CurriculumSession[] {
  return [ACTIVE_SESSION];
}

export function querySubjects(params: {
  classLevel?: ClassLevel;
  category?: SubjectCategory | 'all';
  verificationStatus?: CurriculumVerificationStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const all = buildEnrichedSubjects();
  const q = (params.search ?? '').trim().toLowerCase();

  let filtered = all.filter((s) => {
    if (params.classLevel && s.classLevel !== params.classLevel) return false;
    if (params.category && params.category !== 'all' && s.category !== params.category) return false;
    if (
      params.verificationStatus &&
      params.verificationStatus !== 'all' &&
      s.verificationStatus !== params.verificationStatus
    ) {
      return false;
    }
    if (q) {
      const hay = `${s.name} ${s.subjectCode} ${s.category} ${s.classLevel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Sort verified subjects with lessons first, then main_academic -> academic_elective -> language -> skill_education -> alphabetical
  const catWeight: Record<SubjectCategory, number> = {
    main_academic: 0,
    academic_elective: 1,
    language: 2,
    skill_education: 3,
  };
  filtered = filtered.sort((a, b) => {
    const aVer = a.verificationStatus === 'Verified' ? 0 : 1;
    const bVer = b.verificationStatus === 'Verified' ? 0 : 1;
    if (aVer !== bVer) return aVer - bVer;
    if (catWeight[a.category] !== catWeight[b.category]) return catWeight[a.category] - catWeight[b.category];
    return a.name.localeCompare(b.name);
  });

  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 24));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, params.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function getSubjectById(subjectId: string): CurriculumSubject | null {
  return buildEnrichedSubjects().find((s) => s.subjectId === subjectId) ?? null;
}

export function queryChapters(params: {
  subjectId?: string;
  classLevel?: ClassLevel;
  page?: number;
  pageSize?: number;
}) {
  let list = Array.from(chaptersMap.values());
  if (params.subjectId) list = list.filter((c) => c.subjectId === params.subjectId);
  if (params.classLevel) list = list.filter((c) => c.classLevel === params.classLevel);
  list.sort((a, b) => a.unitNumber - b.unitNumber || a.chapterNumber - b.chapterNumber);

  // Recalculate live lesson counts
  list = list.map((c) => {
    const chLessons = Array.from(lessonsMap.values()).filter((l) => l.chapterId === c.chapterId);
    return {
      ...c,
      lessonCount: chLessons.length,
      estimatedMinutes: chLessons.reduce((sum, l) => sum + l.estimatedStudyTime, 0) || c.estimatedMinutes,
    };
  });

  const pageSize = Math.max(1, Math.min(50, params.pageSize ?? 20));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, params.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: list.slice(start, start + pageSize),
    pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
}

export function queryLessons(params: {
  chapterId?: string;
  subjectId?: string;
  classLevel?: ClassLevel;
  page?: number;
  pageSize?: number;
}) {
  let list = Array.from(lessonsMap.values());
  if (params.chapterId) list = list.filter((l) => l.chapterId === params.chapterId);
  if (params.subjectId) list = list.filter((l) => l.subjectId === params.subjectId);
  if (params.classLevel) list = list.filter((l) => l.classLevel === params.classLevel);
  list.sort((a, b) => a.lessonNumber - b.lessonNumber);

  const pageSize = Math.max(1, Math.min(50, params.pageSize ?? 20));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, params.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: list.slice(start, start + pageSize),
    pagination: { page, pageSize, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
}

export function getLessonById(lessonId: string): CurriculumLesson | null {
  return lessonsMap.get(lessonId) ?? null;
}

export function getCachedLessonContent(lessonId: string): LessonGeneratedContent | null {
  return lessonContentCache.get(lessonId) ?? null;
}

export function setCachedLessonContent(content: LessonGeneratedContent): void {
  lessonContentCache.set(content.lessonId, content);
}

export function searchCurriculum(params: {
  query: string;
  classLevel?: ClassLevel;
  academicSession?: string;
  limit?: number;
}): CurriculumSearchHit[] {
  const q = params.query.trim().toLowerCase();
  if (!q) return [];
  const session = params.academicSession || '2026-27';
  const limit = Math.max(1, Math.min(30, params.limit ?? 15));
  const hits: CurriculumSearchHit[] = [];

  const subjects = buildEnrichedSubjects();
  for (const s of subjects) {
    if (s.academicSession !== session) continue;
    if (params.classLevel && s.classLevel !== params.classLevel) continue;
    if (s.name.toLowerCase().includes(q) || (s.subjectCode && s.subjectCode.toLowerCase().includes(q))) {
      hits.push({
        hitType: 'subject',
        id: s.subjectId,
        title: s.name,
        subtitle: `Class ${s.classLevel} · ${CATEGORY_LABELS[s.category]}${s.subjectCode ? ` (Code ${s.subjectCode})` : ''}`,
        classLevel: s.classLevel,
        subjectId: s.subjectId,
        subjectName: s.name,
        category: s.category,
        verificationStatus: s.verificationStatus,
      });
    }
  }

  for (const ch of chaptersMap.values()) {
    if (ch.academicSession !== session) continue;
    if (params.classLevel && ch.classLevel !== params.classLevel) continue;
    if (ch.title.toLowerCase().includes(q) || ch.unitName.toLowerCase().includes(q)) {
      hits.push({
        hitType: 'chapter',
        id: ch.chapterId,
        title: ch.title,
        subtitle: `Class ${ch.classLevel} · ${ch.subject} · ${ch.unitName}`,
        classLevel: ch.classLevel,
        subjectId: ch.subjectId,
        subjectName: ch.subject,
        category: ch.subjectCategory,
        chapterId: ch.chapterId,
        verificationStatus: ch.verificationStatus,
      });
    }
  }

  for (const les of lessonsMap.values()) {
    if (les.academicSession !== session) continue;
    if (params.classLevel && les.classLevel !== params.classLevel) continue;

    if (les.lessonTitle.toLowerCase().includes(q) || les.lessonDescription.toLowerCase().includes(q)) {
      hits.push({
        hitType: 'lesson',
        id: les.lessonId,
        title: les.lessonTitle,
        subtitle: `Class ${les.classLevel} · ${les.subject} · ${les.chapterName}`,
        classLevel: les.classLevel,
        subjectId: les.subjectId,
        subjectName: les.subject,
        category: les.subjectCategory,
        chapterId: les.chapterId,
        lessonId: les.lessonId,
        verificationStatus: les.verificationStatus,
      });
      continue;
    }

    const matchedTopic = les.topics.find((t) => t.toLowerCase().includes(q));
    if (matchedTopic) {
      hits.push({
        hitType: 'topic',
        id: `${les.lessonId}_topic_${matchedTopic}`,
        title: matchedTopic,
        subtitle: `Topic in ${les.lessonTitle} · Class ${les.classLevel} ${les.subject}`,
        classLevel: les.classLevel,
        subjectId: les.subjectId,
        subjectName: les.subject,
        category: les.subjectCategory,
        chapterId: les.chapterId,
        lessonId: les.lessonId,
        verificationStatus: les.verificationStatus,
      });
      continue;
    }

    const matchedConcept = les.concepts.find((c) => c.toLowerCase().includes(q));
    if (matchedConcept) {
      hits.push({
        hitType: 'concept',
        id: `${les.lessonId}_concept_${matchedConcept}`,
        title: matchedConcept,
        subtitle: `Concept in ${les.lessonTitle} · Class ${les.classLevel} ${les.subject}`,
        classLevel: les.classLevel,
        subjectId: les.subjectId,
        subjectName: les.subject,
        category: les.subjectCategory,
        chapterId: les.chapterId,
        lessonId: les.lessonId,
        verificationStatus: les.verificationStatus,
      });
    }
  }

  // Prioritize verified hits & exact title matches
  hits.sort((a, b) => {
    const aVer = a.verificationStatus === 'Verified' ? 0 : 1;
    const bVer = b.verificationStatus === 'Verified' ? 0 : 1;
    if (aVer !== bVer) return aVer - bVer;
    const aExact = a.title.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.title.toLowerCase().startsWith(q) ? 0 : 1;
    return aExact - bExact;
  });

  return hits.slice(0, limit);
}

export function getCoverageReport(): CurriculumCoverageReport {
  const subjects = buildEnrichedSubjects();
  const chapters = Array.from(chaptersMap.values());
  const lessons = Array.from(lessonsMap.values());

  const subjectsWithVerifiedChapters = subjects.filter((s) => s.verificationStatus === 'Verified').length;
  const subjectsPending = subjects.length - subjectsWithVerifiedChapters;
  const verifiedLessons = lessons.filter((l) => l.verificationStatus === 'Verified').length;
  const pendingLessons = lessons.length - verifiedLessons;
  const totalConcepts = lessons.reduce((sum, l) => sum + l.concepts.length, 0);

  const makeClassBucket = (cls: ClassLevel) => {
    const clsSubs = subjects.filter((s) => s.classLevel === cls);
    const clsChs = chapters.filter((c) => c.classLevel === cls);
    const clsLes = lessons.filter((l) => l.classLevel === cls);
    const verifiedSubs = clsSubs.filter((s) => s.verificationStatus === 'Verified').length;
    return {
      officialSubjects: clsSubs.length,
      subjectsWithChapters: verifiedSubs,
      pendingSubjects: clsSubs.length - verifiedSubs,
      chapters: clsChs.length,
      lessons: clsLes.length,
      verifiedLessons: clsLes.filter((l) => l.verificationStatus === 'Verified').length,
    };
  };

  const makeCatBucket = (cat: SubjectCategory) => {
    const catSubs = subjects.filter((s) => s.category === cat);
    const catLes = lessons.filter((l) => l.subjectCategory === cat);
    return {
      label: CATEGORY_LABELS[cat],
      officialSubjects: catSubs.length,
      subjectsWithChapters: catSubs.filter((s) => s.verificationStatus === 'Verified').length,
      lessons: catLes.length,
    };
  };

  return {
    academicSession: ACTIVE_SESSION.sessionId,
    generatedAt: new Date().toISOString(),
    totals: {
      officialSubjectsCatalogued: subjects.length,
      subjectsWithVerifiedChapters,
      subjectsPendingSyllabusParsing: subjectsPending,
      totalChapters: chapters.length,
      totalLessons: lessons.length,
      verifiedLessons,
      pendingLessons,
      totalConcepts,
      lessonCoveragePercent:
        subjects.length > 0 ? Math.round((subjectsWithVerifiedChapters / subjects.length) * 1000) / 10 : 0,
    },
    byClass: {
      '10': makeClassBucket('10'),
      '11': makeClassBucket('11'),
      '12': makeClassBucket('12'),
    },
    byCategory: {
      main_academic: makeCatBucket('main_academic'),
      language: makeCatBucket('language'),
      academic_elective: makeCatBucket('academic_elective'),
      skill_education: makeCatBucket('skill_education'),
    },
    recentImports: [...importJobs].reverse().slice(0, 15),
  };
}

export function getImportJobs(): CurriculumImportJob[] {
  return [...importJobs].reverse();
}

// ---------------------------------------------------------------------------
// Validated JSON & CSV Curriculum Ingestion Pipeline
// ---------------------------------------------------------------------------
const importRowSchema = z.object({
  classLevel: z.enum(['10', '11', '12']),
  subjectId: z.string().min(3).max(120),
  unitName: z.string().min(2).max(180).default('Unit I'),
  unitNumber: z.coerce.number().int().min(1).max(30).default(1),
  chapterNumber: z.coerce.number().int().min(1).max(50).default(1),
  chapterName: z.string().min(2).max(180),
  chapterDescription: z.string().max(600).optional(),
  lessonNumber: z.coerce.number().int().min(1).max(50).default(1),
  lessonTitle: z.string().min(2).max(200),
  lessonType: z
    .enum([
      'theory',
      'numerical',
      'practical',
      'literature',
      'grammar',
      'historical',
      'case_study',
      'skill_based',
      'project_based',
    ])
    .default('theory'),
  lessonDescription: z.string().min(5).max(800),
  topics: z.array(z.string().min(1).max(150)).min(1).max(15),
  concepts: z.array(z.string().min(1).max(150)).min(1).max(15),
  learningObjectives: z.array(z.string().min(1).max(220)).min(1).max(10),
  estimatedStudyTime: z.coerce.number().int().min(5).max(180).default(30),
  difficultyLevel: z.enum(['foundational', 'standard', 'application', 'challenge']).default('standard'),
  prerequisites: z.array(z.string().max(150)).max(10).default([]),
  verificationStatus: z
    .enum(['Verified', 'Pending Verification', 'Incomplete', 'Source Unavailable', 'Superseded'])
    .default('Pending Verification'),
  sourceUrl: z.string().url().optional(),
});

function parseCsvRows(csvText: string): Record<string, unknown>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }
  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const val = vals[idx] ?? '';
      if (['topics', 'concepts', 'learningObjectives', 'prerequisites'].includes(h)) {
        obj[h] = val
          ? val
              .split('|')
              .map((x) => x.trim())
              .filter(Boolean)
          : [];
      } else {
        obj[h] = val;
      }
    });
    return obj;
  });
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

export function ingestCurriculumPayload(input: {
  format: 'json' | 'csv';
  sourceLabel: string;
  importedBy: string;
  payload: unknown;
}): CurriculumImportJob {
  const now = new Date().toISOString();
  const importId = `imp_${Date.now()}`;
  const errors: { row: number; message: string }[] = [];
  let rows: unknown[] = [];

  try {
    if (input.format === 'csv') {
      if (typeof input.payload !== 'string') {
        throw new Error('CSV import expects a text string payload.');
      }
      rows = parseCsvRows(input.payload);
    } else {
      const parsed = typeof input.payload === 'string' ? JSON.parse(input.payload) : input.payload;
      rows = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (err) {
    const job: CurriculumImportJob = {
      importId,
      academicSession: ACTIVE_SESSION.sessionId,
      format: input.format,
      sourceLabel: input.sourceLabel,
      status: 'failed',
      totalRecords: 0,
      insertedCount: 0,
      skippedDuplicateCount: 0,
      failedCount: 1,
      errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to parse payload.' }],
      importedBy: input.importedBy,
      createdAt: now,
    };
    importJobs.push(job);
    return job;
  }

  let insertedCount = 0;
  let skippedDuplicateCount = 0;

  const subjectLookup = new Map(rawSubjects.map((s) => [s.subjectId, s]));

  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 1;
    const parsed = importRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      errors.push({
        row: rowNum,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const r = parsed.data;
    const subjectMeta = subjectLookup.get(r.subjectId);
    if (!subjectMeta) {
      errors.push({
        row: rowNum,
        message: `Unknown official subjectId "${r.subjectId}". Use an official CBSE 2026-27 subjectId from /api/curriculum/subjects.`,
      });
      return;
    }
    if (subjectMeta.classLevel !== r.classLevel) {
      errors.push({
        row: rowNum,
        message: `Class mismatch: subjectId "${r.subjectId}" belongs to Class ${subjectMeta.classLevel}, not Class ${r.classLevel}.`,
      });
      return;
    }

    const chapterId = `c${r.classLevel}_${slug(subjectMeta.name)}_ch${r.chapterNumber}_${slug(r.chapterName).slice(0, 18)}`;
    const existingChapter =
      Array.from(chaptersMap.values()).find(
        (c) =>
          c.subjectId === r.subjectId &&
          c.classLevel === r.classLevel &&
          c.title.toLowerCase() === r.chapterName.toLowerCase()
      ) ?? chaptersMap.get(chapterId);

    const resolvedChapterId = existingChapter ? existingChapter.chapterId : chapterId;

    // Duplicate detection by normalized (subjectId, chapterId, lessonTitle)
    const duplicateLesson = Array.from(lessonsMap.values()).find(
      (l) =>
        l.subjectId === r.subjectId &&
        l.chapterId === resolvedChapterId &&
        l.lessonTitle.trim().toLowerCase() === r.lessonTitle.trim().toLowerCase()
    );

    if (duplicateLesson) {
      skippedDuplicateCount += 1;
      return;
    }

    if (!existingChapter) {
      chaptersMap.set(resolvedChapterId, {
        chapterId: resolvedChapterId,
        subjectId: r.subjectId,
        academicSession: ACTIVE_SESSION.sessionId,
        classLevel: r.classLevel,
        subject: subjectMeta.name,
        subjectCategory: subjectMeta.category,
        unitNumber: r.unitNumber,
        unitName: r.unitName,
        chapterNumber: r.chapterNumber,
        title: r.chapterName,
        description: r.chapterDescription || r.lessonDescription,
        estimatedMinutes: r.estimatedStudyTime,
        lessonCount: 1,
        verificationStatus: r.verificationStatus,
        sourceUrl: r.sourceUrl || subjectMeta.sourceUrl,
        curriculumVersion: 'CBSE-2026-27-ingested',
      });
    }

    const lessonId = `les_${resolvedChapterId}_${r.lessonNumber}_${slug(r.lessonTitle).slice(0, 16)}`;
    lessonsMap.set(lessonId, {
      lessonId,
      academicSession: ACTIVE_SESSION.sessionId,
      classLevel: r.classLevel,
      subjectId: r.subjectId,
      subject: subjectMeta.name,
      subjectCategory: subjectMeta.category,
      unitName: r.unitName,
      chapterId: resolvedChapterId,
      chapterName: r.chapterName,
      lessonNumber: r.lessonNumber,
      lessonTitle: r.lessonTitle,
      lessonType: r.lessonType,
      lessonDescription: r.lessonDescription,
      topics: r.topics,
      concepts: r.concepts,
      learningObjectives: r.learningObjectives,
      estimatedStudyTime: r.estimatedStudyTime,
      difficultyLevel: r.difficultyLevel,
      prerequisites: r.prerequisites,
      sourceUrl: r.sourceUrl || subjectMeta.sourceUrl,
      verificationStatus: r.verificationStatus,
      createdAt: now,
      updatedAt: now,
    });

    insertedCount += 1;
  });

  const job: CurriculumImportJob = {
    importId,
    academicSession: ACTIVE_SESSION.sessionId,
    format: input.format,
    sourceLabel: input.sourceLabel,
    status: errors.length === 0 ? 'completed' : insertedCount > 0 ? 'partial_with_errors' : 'failed',
    totalRecords: rows.length,
    insertedCount,
    skippedDuplicateCount,
    failedCount: errors.length,
    errors,
    importedBy: input.importedBy,
    createdAt: now,
  };

  importJobs.push(job);
  return job;
}
