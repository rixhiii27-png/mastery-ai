import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  AssessmentRecord,
  AttemptRecord,
  ClassLevel,
  LearnerConceptState,
  ParentLink,
  RevisionItem,
  SavedMaterial,
  UserProfile,
} from '../types/mastery';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        role: data.role,
        classLevel: data.classLevel,
        selectedSubjects: Array.isArray(data.selectedSubjects) ? data.selectedSubjects : ['Mathematics', 'Science'],
        dailyGoalMinutes: Number(data.dailyGoalMinutes ?? 45),
        streakDays: Number(data.streakDays ?? 1),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    }

    // Self-registration strictly creates role: 'student' (enforced by firestore.rules)
    const displayName = clampString(user.displayName || user.email?.split('@')[0] || 'Student', 120);
    const email = clampString(user.email || 'student@masteryai.local', 254);

    await setDoc(userRef, {
      uid: user.uid,
      displayName,
      email,
      role: 'student',
      classLevel: '10',
      selectedSubjects: ['Mathematics', 'Science'],
      dailyGoalMinutes: 45,
      streakDays: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      displayName,
      email,
      role: 'student',
      classLevel: '10',
      selectedSubjects: ['Mathematics', 'Science'],
      dailyGoalMinutes: 45,
      streakDays: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileSettings(
  uid: string,
  updates: {
    displayName?: string;
    classLevel?: ClassLevel;
    selectedSubjects?: string[];
    dailyGoalMinutes?: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.displayName) payload.displayName = clampString(updates.displayName, 120);
    if (updates.classLevel) payload.classLevel = updates.classLevel;
    if (updates.selectedSubjects) payload.selectedSubjects = updates.selectedSubjects.slice(0, 10);
    if (typeof updates.dailyGoalMinutes === 'number') {
      payload.dailyGoalMinutes = Math.max(10, Math.min(480, Math.round(updates.dailyGoalMinutes)));
    }
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeLearnerModel(
  uid: string,
  onData: (concepts: Record<string, LearnerConceptState>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `learnerModels/${uid}/concepts`;
  const q = query(collection(db, 'learnerModels', uid, 'concepts'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const map: Record<string, LearnerConceptState> = {};
      snap.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          uid: data.uid,
          conceptId: data.conceptId,
          conceptName: data.conceptName,
          chapterId: data.chapterId,
          subject: data.subject,
          classLevel: data.classLevel,
          masteryScore: Number(data.masteryScore ?? 0),
          attempts: Number(data.attempts ?? 0),
          correctAnswers: Number(data.correctAnswers ?? 0),
          incorrectAnswers: Number(data.incorrectAnswers ?? 0),
          latestAssessmentResult: Number(data.latestAssessmentResult ?? 0),
          difficultyLevel: data.difficultyLevel,
          lastPracticeDate: data.lastPracticeDate ?? '',
          nextRevisionDate: data.nextRevisionDate ?? '',
          evidenceCount: Number(data.evidenceCount ?? 0),
          potentialMisconception: data.potentialMisconception ?? '',
          misconceptionConfidence: Number(data.misconceptionConfidence ?? 0),
          learningStatus: data.learningStatus ?? 'not_started',
          lastProcessedAssessmentId: data.lastProcessedAssessmentId,
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError?.(e as Error);
      }
    }
  );
}

/**
 * Atomic transaction: records the completed assessment, attempts, Living Learner Model updates,
 * and spaced-repetition revision tasks together. Prevents duplicate submissions from double-updating mastery.
 */
export async function commitAssessmentTransaction(params: {
  uid: string;
  assessment: AssessmentRecord;
  attempts: AttemptRecord[];
  updatedConcepts: LearnerConceptState[];
  updatedRevisions: RevisionItem[];
}): Promise<{ duplicateSkipped: boolean }> {
  const { uid, assessment, attempts, updatedConcepts, updatedRevisions } = params;
  const assessId = sanitizeId(assessment.assessmentId);
  const assessRef = doc(db, 'assessments', assessId);

  try {
    let duplicateSkipped = false;

    await runTransaction(db, async (tx) => {
      const existingAssess = await tx.get(assessRef);
      if (existingAssess.exists() && existingAssess.data()?.status === 'completed') {
        duplicateSkipped = true;
        return;
      }

      // Read existing revision docs before writes (Firestore transaction requirement)
      const revDocs = await Promise.all(
        updatedRevisions.map(async (rev) => {
          const itemId = sanitizeId(rev.itemId);
          const ref = doc(db, 'revisionSchedules', uid, 'items', itemId);
          const snap = await tx.get(ref);
          return { rev, itemId, ref, exists: snap.exists() };
        })
      );

      // 1. Write terminal completed assessment
      tx.set(assessRef, {
        assessmentId: assessId,
        uid,
        type: assessment.type,
        classLevel: assessment.classLevel,
        subject: clampString(assessment.subject, 80),
        chapterId: sanitizeId(assessment.chapterId),
        scorePercent: Math.max(0, Math.min(100, Math.round(assessment.scorePercent))),
        totalQuestions: Math.max(1, assessment.totalQuestions),
        correctCount: Math.max(0, Math.min(assessment.totalQuestions, assessment.correctCount)),
        status: 'completed',
        curriculumVersion: clampString(assessment.curriculumVersion, 32),
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      });

      // 2. Write immutable attempts
      for (const att of attempts) {
        const attId = sanitizeId(att.attemptId);
        tx.set(doc(db, 'attempts', attId), {
          attemptId: attId,
          uid,
          assessmentId: assessId,
          conceptId: sanitizeId(att.conceptId),
          questionId: clampString(att.questionId, 128),
          selectedOptionIndex: Math.max(0, Math.min(10, att.selectedOptionIndex)),
          isCorrect: Boolean(att.isCorrect),
          difficultyLevel: att.difficultyLevel,
          timeSpentSeconds: Math.max(0, Math.min(7200, Math.round(att.timeSpentSeconds))),
          createdAt: serverTimestamp(),
        });
      }

      // 3. Upsert Living Learner Model concept documents
      for (const c of updatedConcepts) {
        const cid = sanitizeId(c.conceptId);
        tx.set(doc(db, 'learnerModels', uid, 'concepts', cid), {
          uid,
          conceptId: cid,
          conceptName: clampString(c.conceptName, 200),
          chapterId: sanitizeId(c.chapterId),
          subject: clampString(c.subject, 80),
          classLevel: c.classLevel,
          masteryScore: Math.max(0, Math.min(100, c.masteryScore)),
          attempts: Math.max(0, c.attempts),
          correctAnswers: Math.max(0, Math.min(c.attempts, c.correctAnswers)),
          incorrectAnswers: Math.max(0, Math.min(c.attempts, c.incorrectAnswers)),
          latestAssessmentResult: Math.max(0, Math.min(100, c.latestAssessmentResult)),
          difficultyLevel: c.difficultyLevel,
          lastPracticeDate: clampString(c.lastPracticeDate, 40),
          nextRevisionDate: clampString(c.nextRevisionDate, 40),
          evidenceCount: Math.max(0, c.evidenceCount),
          potentialMisconception: clampString(c.potentialMisconception, 500),
          misconceptionConfidence: Math.max(0, Math.min(1, c.misconceptionConfidence)),
          learningStatus: c.learningStatus,
          lastProcessedAssessmentId: assessId,
          updatedAt: serverTimestamp(),
        });
      }

      // 4. Upsert deterministic revision schedule items
      for (const { rev, itemId, ref, exists } of revDocs) {
        if (exists) {
          tx.update(ref, {
            dueDate: clampString(rev.dueDate, 40),
            intervalDays: Math.max(1, Math.min(180, rev.intervalDays)),
            repetitionStage: Math.max(0, Math.min(20, rev.repetitionStage)),
            priority: rev.priority,
            status: rev.status,
            reason: clampString(rev.reason, 300),
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.set(ref, {
            itemId,
            uid,
            conceptId: sanitizeId(rev.conceptId),
            conceptName: clampString(rev.conceptName, 200),
            subject: clampString(rev.subject, 80),
            chapterId: sanitizeId(rev.chapterId),
            dueDate: clampString(rev.dueDate, 40),
            intervalDays: Math.max(1, Math.min(180, rev.intervalDays)),
            repetitionStage: Math.max(0, Math.min(20, rev.repetitionStage)),
            priority: rev.priority,
            status: rev.status,
            reason: clampString(rev.reason, 300),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    });

    return { duplicateSkipped };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `assessments/${assessId}`);
  }
}

export function subscribeAssessments(
  uid: string,
  onData: (items: AssessmentRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'assessments';
  const q = query(collection(db, 'assessments'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: AssessmentRecord[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          assessmentId: data.assessmentId,
          uid: data.uid,
          type: data.type,
          classLevel: data.classLevel,
          subject: data.subject,
          chapterId: data.chapterId,
          scorePercent: Number(data.scorePercent ?? 0),
          totalQuestions: Number(data.totalQuestions ?? 0),
          correctCount: Number(data.correctCount ?? 0),
          status: data.status,
          curriculumVersion: data.curriculumVersion,
          createdAt: timestampToIso(data.createdAt),
          completedAt: data.completedAt ? timestampToIso(data.completedAt) : undefined,
        });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError?.(e as Error);
      }
    }
  );
}

export function subscribeRevisionItems(
  uid: string,
  onData: (items: RevisionItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `revisionSchedules/${uid}/items`;
  const q = query(collection(db, 'revisionSchedules', uid, 'items'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: RevisionItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          itemId: data.itemId,
          uid: data.uid,
          conceptId: data.conceptId,
          conceptName: data.conceptName,
          subject: data.subject,
          chapterId: data.chapterId,
          dueDate: data.dueDate,
          intervalDays: Number(data.intervalDays ?? 1),
          repetitionStage: Number(data.repetitionStage ?? 0),
          priority: data.priority,
          status: data.status,
          reason: data.reason,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        });
      });
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError?.(e as Error);
      }
    }
  );
}

export async function upsertRevisionItemDoc(uid: string, item: RevisionItem): Promise<void> {
  const itemId = sanitizeId(item.itemId);
  const path = `revisionSchedules/${uid}/items/${itemId}`;
  const ref = doc(db, 'revisionSchedules', uid, 'items', itemId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        dueDate: clampString(item.dueDate, 40),
        intervalDays: Math.max(1, Math.min(180, item.intervalDays)),
        repetitionStage: Math.max(0, Math.min(20, item.repetitionStage)),
        priority: item.priority,
        status: item.status,
        reason: clampString(item.reason, 300),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        itemId,
        uid,
        conceptId: sanitizeId(item.conceptId),
        conceptName: clampString(item.conceptName, 200),
        subject: clampString(item.subject, 80),
        chapterId: sanitizeId(item.chapterId),
        dueDate: clampString(item.dueDate, 40),
        intervalDays: Math.max(1, Math.min(180, item.intervalDays)),
        repetitionStage: Math.max(0, Math.min(20, item.repetitionStage)),
        priority: item.priority,
        status: item.status,
        reason: clampString(item.reason, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeSavedMaterials(
  uid: string,
  onData: (items: SavedMaterial[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `savedMaterials/${uid}/items`;
  const q = query(collection(db, 'savedMaterials', uid, 'items'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: SavedMaterial[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          itemId: data.itemId,
          uid: data.uid,
          title: data.title,
          materialType: data.materialType,
          classLevel: data.classLevel,
          subject: data.subject,
          chapterId: data.chapterId,
          content: data.content,
          createdAt: timestampToIso(data.createdAt),
        });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError?.(e as Error);
      }
    }
  );
}

export async function saveMaterialDoc(uid: string, item: SavedMaterial): Promise<void> {
  const itemId = sanitizeId(item.itemId);
  const path = `savedMaterials/${uid}/items/${itemId}`;
  try {
    await setDoc(doc(db, 'savedMaterials', uid, 'items', itemId), {
      itemId,
      uid,
      title: clampString(item.title, 200),
      materialType: item.materialType,
      classLevel: item.classLevel,
      subject: clampString(item.subject, 80),
      chapterId: sanitizeId(item.chapterId),
      content: clampString(item.content, 24500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMaterialDoc(uid: string, itemId: string): Promise<void> {
  const cleanId = sanitizeId(itemId);
  const path = `savedMaterials/${uid}/items/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'savedMaterials', uid, 'items', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeParentLinks(
  uid: string,
  onData: (links: ParentLink[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'parentLinks';
  const q = query(collection(db, 'parentLinks'), where('studentUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: ParentLink[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          linkId: data.linkId,
          parentUid: data.parentUid,
          studentUid: data.studentUid,
          status: data.status,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        });
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError?.(e as Error);
      }
    }
  );
}

export async function syncVerifiedCurriculumBatch(params: {
  subjects: {
    subjectId: string;
    academicSession: string;
    classLevel: ClassLevel;
    name: string;
    subjectCode: string;
    category: string;
    sourceUrl: string;
    verificationStatus: string;
  }[];
  chapters: {
    chapterId: string;
    subjectId: string;
    academicSession: string;
    classLevel: ClassLevel;
    subject: string;
    unitName: string;
    title: string;
    description: string;
    verificationStatus: string;
  }[];
  lessons: {
    lessonId: string;
    academicSession: string;
    classLevel: ClassLevel;
    subjectId: string;
    chapterId: string;
    lessonNumber: number;
    lessonTitle: string;
    lessonType: string;
    lessonDescription: string;
    topics: string[];
    concepts: string[];
    learningObjectives: string[];
    estimatedStudyTime: number;
    difficultyLevel: string;
    verificationStatus: string;
  }[];
}): Promise<{ syncedSubjects: number; syncedChapters: number; syncedLessons: number }> {
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);

  batch.set(doc(db, 'curriculumSessions', '2026-27'), {
    sessionId: '2026-27',
    label: 'CBSE Academic Session 2026-27',
    board: 'CBSE',
    isActive: true,
    updatedAt: serverTimestamp(),
  });

  const subSlice = params.subjects.slice(0, 120);
  for (const s of subSlice) {
    const sid = sanitizeId(s.subjectId);
    batch.set(doc(db, 'curriculumSubjects', sid), {
      subjectId: sid,
      academicSession: clampString(s.academicSession, 20),
      classLevel: s.classLevel,
      name: clampString(s.name, 160),
      subjectCode: clampString(s.subjectCode || '', 20),
      category: s.category,
      sourceUrl: clampString(s.sourceUrl, 500),
      verificationStatus: s.verificationStatus,
      updatedAt: serverTimestamp(),
    });
  }

  const chSlice = params.chapters.slice(0, 120);
  for (const c of chSlice) {
    const cid = sanitizeId(c.chapterId);
    batch.set(doc(db, 'curriculumChapters', cid), {
      chapterId: cid,
      subjectId: sanitizeId(c.subjectId),
      academicSession: clampString(c.academicSession, 20),
      classLevel: c.classLevel,
      subject: clampString(c.subject, 160),
      unitName: clampString(c.unitName, 180),
      title: clampString(c.title, 200),
      description: clampString(c.description, 600),
      verificationStatus: c.verificationStatus,
      updatedAt: serverTimestamp(),
    });
  }

  const lesSlice = params.lessons.slice(0, 180);
  for (const l of lesSlice) {
    const lid = sanitizeId(l.lessonId);
    batch.set(doc(db, 'curriculumLessons', lid), {
      lessonId: lid,
      academicSession: clampString(l.academicSession, 20),
      classLevel: l.classLevel,
      subjectId: sanitizeId(l.subjectId),
      chapterId: sanitizeId(l.chapterId),
      lessonNumber: Math.max(1, Math.min(100, l.lessonNumber)),
      lessonTitle: clampString(l.lessonTitle, 200),
      lessonType: l.lessonType,
      lessonDescription: clampString(l.lessonDescription, 1000),
      topics: l.topics.slice(0, 20),
      concepts: l.concepts.slice(0, 20),
      learningObjectives: l.learningObjectives.slice(0, 15),
      estimatedStudyTime: Math.max(5, Math.min(240, l.estimatedStudyTime)),
      difficultyLevel: l.difficultyLevel,
      verificationStatus: l.verificationStatus,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return {
      syncedSubjects: subSlice.length,
      syncedChapters: chSlice.length,
      syncedLessons: lesSlice.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'curriculumSubjects');
  }
}

