/**
 * Phase 0 Payload-First Security Test Specification for MASTERY AI Firestore Rules.
 * Verifies the "Dirty Dozen" adversarial payloads must be denied by firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: { uid: string; email: string; email_verified: boolean };
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_SECURITY_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Role self-elevation on user creation',
    operation: 'create',
    path: '/users/attacker_1',
    actor: { uid: 'attacker_1', email: 'eve@example.com', email_verified: true },
    payload: {
      uid: 'attacker_1',
      displayName: 'Eve',
      email: 'eve@example.com',
      role: 'teacher',
      classLevel: '10',
      selectedSubjects: ['Mathematics'],
      dailyGoalMinutes: 45,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: "incoming().role == 'student'",
  },
  {
    id: 2,
    name: 'Role elevation on profile update',
    operation: 'update',
    path: '/users/student_1',
    actor: { uid: 'student_1', email: 'student@example.com', email_verified: true },
    payload: { role: 'parent' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().role == existing().role && affectedKeys().hasOnly(...)',
  },
  {
    id: 3,
    name: 'Shadow field injection on user creation',
    operation: 'create',
    path: '/users/student_2',
    actor: { uid: 'student_2', email: 's2@example.com', email_verified: true },
    payload: { uid: 'student_2', role: 'student', isAdmin: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'data.keys().hasOnly([...])',
  },
  {
    id: 4,
    name: 'Cross-user PII read on users/{uid}',
    operation: 'get',
    path: '/users/student_2',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'isOwner(uid) || isAdmin()',
  },
  {
    id: 5,
    name: 'Cross-user Living Learner Model write',
    operation: 'update',
    path: '/learnerModels/student_2/concepts/c_quad_1',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { masteryScore: 100 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'isOwner(uid) && data.uid == request.auth.uid',
  },
  {
    id: 6,
    name: 'Out-of-bounds mastery score poisoning',
    operation: 'create',
    path: '/learnerModels/student_1/concepts/c_quad_1',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { masteryScore: 9999 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'data.masteryScore >= 0 && data.masteryScore <= 100',
  },
  {
    id: 7,
    name: 'Terminal completed assessment replay',
    operation: 'update',
    path: '/assessments/assess_done_1',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { scorePercent: 100, status: 'completed' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: "existing().status != 'completed'",
  },
  {
    id: 8,
    name: 'Attempt forgery for another student uid',
    operation: 'create',
    path: '/attempts/att_forged',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { attemptId: 'att_forged', uid: 'student_2', isCorrect: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'data.uid == request.auth.uid',
  },
  {
    id: 9,
    name: 'Parent self-verifying link without student approval',
    operation: 'create',
    path: '/parentLinks/link_1',
    actor: { uid: 'parent_1', email: 'p1@example.com', email_verified: true },
    payload: { parentUid: 'parent_1', studentUid: 'student_1', status: 'verified' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: "incoming().status == 'pending'",
  },
  {
    id: 10,
    name: 'Unauthorized curriculum overwrite by student',
    operation: 'create',
    path: '/curriculum/cbse_10_math_ch4',
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { chapterId: 'cbse_10_math_ch4', title: 'Tampered' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'isAdmin()',
  },
  {
    id: 11,
    name: 'Path ID poisoning with oversized/invalid characters',
    operation: 'create',
    path: `/savedMaterials/student_1/items/${'x'.repeat(250)}`,
    actor: { uid: 'student_1', email: 's1@example.com', email_verified: true },
    payload: { title: 'Note' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(itemId)',
  },
  {
    id: 12,
    name: 'Unverified email user write attempt',
    operation: 'create',
    path: '/studyPlans/plan_1',
    actor: { uid: 'student_unverified', email: 'rixhiii27@gmail.com', email_verified: false },
    payload: { planId: 'plan_1', uid: 'student_unverified' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedBy: 'isVerifiedUser() (email_verified == true)',
  },
];
