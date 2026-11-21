export type ClassLevel = '10' | '11' | '12';
export type UserRole = 'student' | 'teacher' | 'parent';
export type PortalView = 'landing' | 'auth' | 'student' | 'teacher' | 'parent';

export type StudentPage =
  | 'dashboard'
  | 'tutor'
  | 'my-learning'
  | 'curriculum'
  | 'diagnostic'
  | 'practice'
  | 'materials'
  | 'exam'
  | 'revision'
  | 'progress';

export type TeacherPage = 'overview' | 'performance' | 'gaps' | 'assessments';
export type ParentPage = 'overview' | 'progress' | 'reports' | 'linking';

export type ExplanationMode = 'beginner' | 'simple' | 'detailed' | 'exam_prep';
export type DifficultyLevel = 'foundational' | 'standard' | 'application' | 'challenge';
export type LearningStatus = 'not_started' | 'needs_attention' | 'developing' | 'proficient' | 'mastered';

export type VerificationStatus = 'demo_seed' | 'verified_syllabus' | 'pending_review';

/**
 * Official CBSE 2026-27 curriculum verification & provenance statuses.
 */
export type CurriculumVerificationStatus =
  | 'Verified'
  | 'Pending Verification'
  | 'Incomplete'
  | 'Source Unavailable'
  | 'Superseded';

export type SubjectCategory =
  | 'main_academic'
  | 'language'
  | 'academic_elective'
  | 'skill_education';

export type LessonType =
  | 'theory'
  | 'numerical'
  | 'practical'
  | 'literature'
  | 'grammar'
  | 'historical'
  | 'case_study'
  | 'skill_based'
  | 'project_based';

export type LessonAIAction =
  | 'explain_lesson'
  | 'explain_difficult_concept'
  | 'simple_example'
  | 'detailed_explanation'
  | 'generate_notes'
  | 'generate_flashcards'
  | 'practice_questions'
  | 'test_understanding'
  | 'explain_mistake'
  | 'revision_summary';

export type MaterialType =
  | 'tutor_note'
  | 'chapter_notes'
  | 'summary'
  | 'revision_notes'
  | 'flashcards'
  | 'formula_sheet'
  | 'practice_questions'
  | 'concept_list';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  classLevel: ClassLevel;
  selectedSubjects: string[];
  dailyGoalMinutes: number;
  streakDays: number;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Expanded Scalable CBSE 2026-27 Curriculum Hierarchy
// Class -> Subject -> Chapter/Unit -> Lesson -> Topic -> Concept
// ---------------------------------------------------------------------------

export interface CurriculumSession {
  sessionId: string; // e.g. '2026-27'
  label: string; // 'CBSE Academic Session 2026-27'
  board: 'CBSE';
  isActive: boolean;
  officialSources: {
    academicUrl: string;
    skillEducationUrl: string;
  };
  lastVerifiedAt: string;
}

export interface CurriculumSubject {
  subjectId: string;
  academicSession: string; // '2026-27'
  classLevel: ClassLevel;
  name: string;
  subjectCode: string;
  category: SubjectCategory;
  sourceUrl: string;
  sourcePage: string;
  curriculumType: 'official_cbse_2026_27' | 'official_cbse_skill_2026_27';
  verificationStatus: CurriculumVerificationStatus;
  chapterCount: number;
  lessonCount: number;
  verifiedLessonCount: number;
  description?: string;
}

export interface CurriculumUnitChapter {
  chapterId: string;
  subjectId: string;
  academicSession: string;
  classLevel: ClassLevel;
  subject: string;
  subjectCategory: SubjectCategory;
  unitNumber: number;
  unitName: string;
  chapterNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  lessonCount: number;
  verificationStatus: CurriculumVerificationStatus;
  sourceUrl: string;
  curriculumVersion: string;
}

export interface CurriculumLesson {
  lessonId: string;
  academicSession: string;
  classLevel: ClassLevel;
  subjectId: string;
  subject: string;
  subjectCategory: SubjectCategory;
  unitName: string;
  chapterId: string;
  chapterName: string;
  lessonNumber: number;
  lessonTitle: string;
  lessonType: LessonType;
  lessonDescription: string;
  topics: string[];
  concepts: string[];
  learningObjectives: string[];
  estimatedStudyTime: number; // minutes
  difficultyLevel: DifficultyLevel;
  prerequisites: string[];
  sourceUrl: string;
  verificationStatus: CurriculumVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LessonGeneratedContent {
  lessonId: string;
  contentOrigin: 'ai_generated_original';
  contentDisclaimer: string;
  introduction: string;
  detailedExplanation: {
    heading: string;
    body: string;
  }[];
  keyConcepts: {
    name: string;
    definition: string;
    importance: string;
  }[];
  examples: {
    title: string;
    scenario: string;
    explanation: string;
  }[];
  workedExamples: {
    problem: string;
    steps: string[];
    finalAnswer: string;
  }[];
  formulas: {
    name: string;
    expression: string;
    whenToUse: string;
  }[];
  misconceptions: {
    myth: string;
    correction: string;
  }[];
  revisionSummary: string[];
  knowledgeCheck: {
    questionId: string;
    conceptName: string;
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
  practiceQuestions: {
    difficulty: 'easy' | 'medium' | 'hard';
    prompt: string;
    hint: string;
    modelAnswer: string;
  }[];
  generatedAt: string;
  modelUsed: string;
}

export interface CurriculumImportJob {
  importId: string;
  academicSession: string;
  format: 'json' | 'csv';
  sourceLabel: string;
  status: 'completed' | 'partial_with_errors' | 'failed';
  totalRecords: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  errors: { row: number; message: string }[];
  importedBy: string;
  createdAt: string;
}

export interface CurriculumCoverageReport {
  academicSession: string;
  generatedAt: string;
  totals: {
    officialSubjectsCatalogued: number;
    subjectsWithVerifiedChapters: number;
    subjectsPendingSyllabusParsing: number;
    totalChapters: number;
    totalLessons: number;
    verifiedLessons: number;
    pendingLessons: number;
    totalConcepts: number;
    lessonCoveragePercent: number; // Honest % of catalogued subjects with detailed lessons
  };
  byClass: Record<
    ClassLevel,
    {
      officialSubjects: number;
      subjectsWithChapters: number;
      pendingSubjects: number;
      chapters: number;
      lessons: number;
      verifiedLessons: number;
    }
  >;
  byCategory: Record<
    SubjectCategory,
    {
      label: string;
      officialSubjects: number;
      subjectsWithChapters: number;
      lessons: number;
    }
  >;
  recentImports: CurriculumImportJob[];
}

export interface CurriculumSearchHit {
  hitType: 'subject' | 'chapter' | 'lesson' | 'topic' | 'concept';
  id: string;
  title: string;
  subtitle: string;
  classLevel: ClassLevel;
  subjectId: string;
  subjectName: string;
  category: SubjectCategory;
  chapterId?: string;
  lessonId?: string;
  verificationStatus: CurriculumVerificationStatus;
}

// ---------------------------------------------------------------------------
// Legacy / Living Learner Model Compatible Structures
// ---------------------------------------------------------------------------

export interface ConceptNode {
  conceptId: string;
  chapterId: string;
  name: string;
  description: string;
  prerequisites: string[];
  difficultyLevel: DifficultyLevel;
  keyFormulae: string[];
}

export interface CurriculumChapter {
  chapterId: string;
  classLevel: ClassLevel;
  subject: string;
  chapterNumber: number;
  title: string;
  academicSession: string;
  curriculumVersion: string;
  source: string;
  verificationStatus: VerificationStatus;
  estimatedMinutes: number;
  learningObjectives: string[];
  topics: string[];
  concepts: ConceptNode[];
}

export interface LearnerConceptState {
  uid: string;
  conceptId: string;
  conceptName: string;
  chapterId: string;
  subject: string;
  classLevel: ClassLevel;
  masteryScore: number; // 0-100 deterministic
  attempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  latestAssessmentResult: number; // 0-100
  difficultyLevel: DifficultyLevel;
  lastPracticeDate: string; // ISO YYYY-MM-DD or ''
  nextRevisionDate: string; // ISO YYYY-MM-DD or ''
  evidenceCount: number;
  potentialMisconception: string;
  misconceptionConfidence: number; // 0-1 hypothesis confidence
  learningStatus: LearningStatus;
  lastProcessedAssessmentId?: string;
  updatedAt?: string;
}

export interface QuestionItem {
  questionId: string;
  conceptId: string;
  chapterId: string;
  classLevel: ClassLevel;
  subject: string;
  difficultyLevel: DifficultyLevel;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hint: string;
  commonTrap: string;
  sourceType: 'demo_seed' | 'ai_generated';
}

export interface AttemptRecord {
  attemptId: string;
  uid: string;
  assessmentId: string;
  conceptId: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  difficultyLevel: DifficultyLevel;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface AssessmentRecord {
  assessmentId: string;
  uid: string;
  type: 'diagnostic' | 'practice' | 'exam';
  classLevel: ClassLevel;
  subject: string;
  chapterId: string;
  chapterTitle?: string;
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  status: 'in_progress' | 'completed';
  curriculumVersion: string;
  createdAt: string;
  completedAt?: string;
}

export interface RevisionItem {
  itemId: string;
  uid: string;
  conceptId: string;
  conceptName: string;
  subject: string;
  chapterId: string;
  dueDate: string; // YYYY-MM-DD
  intervalDays: number;
  repetitionStage: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedMaterial {
  itemId: string;
  uid: string;
  title: string;
  materialType: MaterialType;
  classLevel: ClassLevel;
  subject: string;
  chapterId: string;
  content: string;
  createdAt: string;
}

export interface ParentLink {
  linkId: string;
  parentUid: string;
  studentUid: string;
  status: 'pending' | 'verified' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

export interface TutorStructuredResponse {
  directAnswer: string;
  steps: { title: string; detail: string }[];
  realWorldExample: string;
  hintFirstPrompt?: string;
  followUpQuestions: string[];
  quickPracticeQuestion?: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  curriculumNote: string;
}

export interface TutorMessage {
  id: string;
  role: 'student' | 'tutor';
  text: string;
  structured?: TutorStructuredResponse;
  mode?: ExplanationMode;
  contextLabel?: string;
  timestamp: string;
}

export interface MisconceptionHypothesis {
  conceptId: string;
  conceptName: string;
  hypothesis: string;
  confidence: number;
  remediationTip: string;
  prerequisiteToReview: string;
}

export interface StudyContextSelection {
  classLevel: ClassLevel;
  subject: string;
  chapterId: string;
  conceptId?: string;
  subjectId?: string;
  lessonId?: string;
  lessonTitle?: string;
}

export interface WeeklyActivityPoint {
  day: string;
  minutes: number;
  questions: number;
  accuracy: number;
}
