import type {
  DifficultyLevel,
  LearnerConceptState,
  LearningStatus,
  MisconceptionHypothesis,
  RevisionItem,
} from '../types/mastery';
import { getAllConcepts } from '../data/curriculumSeed';

/**
 * Centralized Deterministic Living Learner Model Engine.
 * All mastery scoring, adaptive difficulty transitions, deduplication checks,
 * and spaced-repetition dates live here—never invented by an LLM.
 */

export const LEARNING_ENGINE_CONFIG = {
  PREVIOUS_MASTERY_WEIGHT: 0.7,
  NEW_ASSESSMENT_WEIGHT: 0.3,
  MIN_QUESTIONS_FOR_VALIDATED_MASTERY_UPDATE: 2,
  SPACED_REPETITION_INTERVALS_DAYS: [1, 3, 7, 14, 30] as const,
  THRESHOLDS: {
    NEEDS_ATTENTION_MAX: 49,
    DEVELOPING_MAX: 69,
    PROFICIENT_MAX: 84,
    MASTERED_MIN_SCORE: 85,
    MASTERED_MIN_EVIDENCE: 3,
  },
} as const;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Deterministic mastery heuristic:
 * New Mastery = (0.7 * Previous Mastery) + (0.3 * Validated Assessment Score)
 * Clamped strictly to [0, 100].
 */
export function calculateNewMastery(previousMastery: number, validatedAssessmentScore: number): number {
  const prev = clampScore(previousMastery);
  const score = clampScore(validatedAssessmentScore);
  const raw =
    LEARNING_ENGINE_CONFIG.PREVIOUS_MASTERY_WEIGHT * prev +
    LEARNING_ENGINE_CONFIG.NEW_ASSESSMENT_WEIGHT * score;
  return clampScore(raw);
}

export function deriveLearningStatus(masteryScore: number, evidenceCount: number): LearningStatus {
  if (evidenceCount <= 0) return 'not_started';
  if (
    masteryScore >= LEARNING_ENGINE_CONFIG.THRESHOLDS.MASTERED_MIN_SCORE &&
    evidenceCount >= LEARNING_ENGINE_CONFIG.THRESHOLDS.MASTERED_MIN_EVIDENCE
  ) {
    return 'mastered';
  }
  if (masteryScore >= 70) return 'proficient';
  if (masteryScore >= 50) return 'developing';
  return 'needs_attention';
}

const DIFFICULTY_LADDER: DifficultyLevel[] = ['foundational', 'standard', 'application', 'challenge'];

export function adaptDifficultyLevel(
  current: DifficultyLevel,
  sessionAccuracyPercent: number,
  masteryScore: number
): DifficultyLevel {
  const idx = DIFFICULTY_LADDER.indexOf(current);
  const safeIdx = idx === -1 ? 1 : idx;

  if (sessionAccuracyPercent < 50 || masteryScore < 45) {
    return DIFFICULTY_LADDER[Math.max(0, safeIdx - 1)];
  }
  if (sessionAccuracyPercent >= 80 && masteryScore >= 70) {
    return DIFFICULTY_LADDER[Math.min(DIFFICULTY_LADDER.length - 1, safeIdx + 1)];
  }
  return DIFFICULTY_LADDER[safeIdx];
}

export function addDaysISO(baseDate: Date, days: number): string {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Deterministic spaced-repetition calculator.
 * Missed concepts reset to stage 0 (1 day, high priority).
 * Successful recall advances stage along [1, 3, 7, 14, 30] days.
 */
export function computeNextRevisionSchedule(params: {
  masteryScore: number;
  wasSuccessful: boolean;
  currentStage: number;
  baseDate?: Date;
}): {
  nextStage: number;
  intervalDays: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
} {
  const intervals = LEARNING_ENGINE_CONFIG.SPACED_REPETITION_INTERVALS_DAYS;
  const now = params.baseDate ?? new Date();

  let nextStage: number;
  if (!params.wasSuccessful || params.masteryScore < 50) {
    nextStage = 0;
  } else {
    nextStage = Math.min(intervals.length - 1, Math.max(0, params.currentStage) + 1);
  }

  const intervalDays = intervals[nextStage];
  const dueDate = addDaysISO(now, intervalDays);

  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (params.masteryScore < 55 || !params.wasSuccessful) {
    priority = 'high';
  } else if (params.masteryScore >= 80) {
    priority = 'low';
  }

  return { nextStage, intervalDays, dueDate, priority };
}

export interface EvaluatedQuestionResult {
  conceptId: string;
  conceptName?: string;
  chapterId?: string;
  subject?: string;
  classLevel?: '10' | '11' | '12';
  isCorrect: boolean;
  difficultyLevel: DifficultyLevel;
}

export interface ModelUpdateSummary {
  updatedConcepts: LearnerConceptState[];
  newOrUpdatedRevisions: RevisionItem[];
  skippedDuplicate: boolean;
  masteryDeltas: {
    conceptId: string;
    conceptName: string;
    previousMastery: number;
    newMastery: number;
    appliedFormula: boolean;
  }[];
}

/**
 * Applies a validated completed assessment deterministically to the Living Learner Model.
 * - Guards against duplicate assessmentId double-counting.
 * - Requires sufficient evidence (>= 2 total questions in assessment) before updating mastery heuristic.
 * - Accepts optional AI-proposed misconception hypotheses without allowing AI to overwrite scores.
 */
export function applyValidatedAssessmentToModel(params: {
  uid: string;
  assessmentId: string;
  currentModel: Record<string, LearnerConceptState>;
  currentRevisions: RevisionItem[];
  results: EvaluatedQuestionResult[];
  misconceptionHypotheses?: MisconceptionHypothesis[];
}): ModelUpdateSummary {
  const { uid, assessmentId, currentModel, currentRevisions, results, misconceptionHypotheses = [] } = params;
  const today = todayISO();
  const nowIso = new Date().toISOString();
  const allConceptDefs = new Map(getAllConcepts().map((c) => [c.conceptId, c]));

  // Group results by conceptId
  const byConcept = new Map<string, EvaluatedQuestionResult[]>();
  for (const r of results) {
    const list = byConcept.get(r.conceptId) ?? [];
    list.push(r);
    byConcept.set(r.conceptId, list);
  }

  const isMultiQuestionValidatedAssessment =
    results.length >= LEARNING_ENGINE_CONFIG.MIN_QUESTIONS_FOR_VALIDATED_MASTERY_UPDATE;

  const updatedConcepts: LearnerConceptState[] = [];
  const newOrUpdatedRevisions: RevisionItem[] = [];
  const masteryDeltas: ModelUpdateSummary['masteryDeltas'] = [];
  let skippedDuplicate = false;

  for (const [conceptId, conceptResults] of byConcept.entries()) {
    const existing = currentModel[conceptId];
    if (existing?.lastProcessedAssessmentId === assessmentId) {
      skippedDuplicate = true;
      continue;
    }

    const def = allConceptDefs.get(conceptId);
    const metaSample = conceptResults[0];
    const totalInSession = conceptResults.length;
    const correctInSession = conceptResults.filter((r) => r.isCorrect).length;
    const incorrectInSession = totalInSession - correctInSession;
    const sessionScore = clampScore((correctInSession / Math.max(1, totalInSession)) * 100);

    const prevMastery = existing?.masteryScore ?? 50;
    const prevEvidence = existing?.evidenceCount ?? 0;
    const nextEvidence = prevEvidence + totalInSession;

    // Only apply mastery update formula on a valid completed assessment (>= 2 total items)
    // or when cumulative evidence reaches >= 2, preventing a single lucky MCQ from faking mastery.
    const shouldApplyFormula = isMultiQuestionValidatedAssessment || nextEvidence >= 2;
    const nextMastery = shouldApplyFormula
      ? calculateNewMastery(prevMastery, sessionScore)
      : prevMastery;

    const nextDifficulty = adaptDifficultyLevel(
      existing?.difficultyLevel ?? def?.difficultyLevel ?? 'standard',
      sessionScore,
      nextMastery
    );

    const matchingHypothesis = misconceptionHypotheses.find((h) => h.conceptId === conceptId);
    let potentialMisconception = existing?.potentialMisconception ?? '';
    let misconceptionConfidence = existing?.misconceptionConfidence ?? 0;

    if (matchingHypothesis && incorrectInSession > 0) {
      potentialMisconception = matchingHypothesis.hypothesis.slice(0, 480);
      misconceptionConfidence = Math.max(0, Math.min(1, Number(matchingHypothesis.confidence.toFixed(2))));
    } else if (sessionScore >= 85 && correctInSession >= 2) {
      // Decay hypothesis confidence after strong verified performance
      misconceptionConfidence = Number(Math.max(0, misconceptionConfidence - 0.35).toFixed(2));
      if (misconceptionConfidence < 0.2) {
        potentialMisconception = '';
      }
    }

    const existingRev = currentRevisions.find((r) => r.conceptId === conceptId && r.status === 'pending');
    const revPlan = computeNextRevisionSchedule({
      masteryScore: nextMastery,
      wasSuccessful: sessionScore >= 70,
      currentStage: existingRev?.repetitionStage ?? 0,
    });

    const nextConcept: LearnerConceptState = {
      uid,
      conceptId,
      conceptName: existing?.conceptName ?? def?.name ?? metaSample?.conceptName ?? conceptId,
      chapterId: existing?.chapterId ?? def?.chapterId ?? metaSample?.chapterId ?? 'c10_math_ch4',
      subject: existing?.subject ?? def?.subject ?? metaSample?.subject ?? 'Mathematics',
      classLevel: existing?.classLevel ?? def?.classLevel ?? metaSample?.classLevel ?? '10',
      masteryScore: nextMastery,
      attempts: (existing?.attempts ?? 0) + totalInSession,
      correctAnswers: (existing?.correctAnswers ?? 0) + correctInSession,
      incorrectAnswers: (existing?.incorrectAnswers ?? 0) + incorrectInSession,
      latestAssessmentResult: sessionScore,
      difficultyLevel: nextDifficulty,
      lastPracticeDate: today,
      nextRevisionDate: revPlan.dueDate,
      evidenceCount: nextEvidence,
      potentialMisconception,
      misconceptionConfidence,
      learningStatus: deriveLearningStatus(nextMastery, nextEvidence),
      lastProcessedAssessmentId: assessmentId,
      updatedAt: nowIso,
    };

    updatedConcepts.push(nextConcept);
    masteryDeltas.push({
      conceptId,
      conceptName: nextConcept.conceptName,
      previousMastery: prevMastery,
      newMastery: nextMastery,
      appliedFormula: shouldApplyFormula,
    });

    const revItemId = existingRev?.itemId ?? `rev_${conceptId}`;
    newOrUpdatedRevisions.push({
      itemId: revItemId,
      uid,
      conceptId,
      conceptName: nextConcept.conceptName,
      subject: nextConcept.subject,
      chapterId: nextConcept.chapterId,
      dueDate: revPlan.dueDate,
      intervalDays: revPlan.intervalDays,
      repetitionStage: revPlan.nextStage,
      priority: revPlan.priority,
      status: 'pending',
      reason:
        sessionScore < 70
          ? `Missed questions in latest check (${sessionScore}%). Spaced recall scheduled in ${revPlan.intervalDays}d.`
          : `Reinforce retention (${nextMastery}% mastery). Next spaced review in ${revPlan.intervalDays}d.`,
      createdAt: existingRev?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });
  }

  return {
    updatedConcepts,
    newOrUpdatedRevisions,
    skippedDuplicate,
    masteryDeltas,
  };
}
