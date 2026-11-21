# MASTERY AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero Self-Elevation**: Student self-registration at `users/{uid}` MUST enforce `role == 'student'`. Users cannot create or update their profile to `teacher` or `parent` (or inject `isAdmin`).
2. **Strict PII Isolation**: `users/{uid}` contains `email` and personal profile metadata; only the owner (`request.auth.uid == uid`) or a verified admin may `get` it. `list` on `/users` is denied for non-admins.
3. **Learner Model Ownership**: Only the owning student (`uid == request.auth.uid`) can create/update `learnerModels/{uid}/concepts/{conceptId}`, and `masteryScore` MUST remain bounded in `[0, 100]` with valid `evidenceCount >= 0`.
4. **Terminal Assessment Locking**: Once an `assessments/{assessmentId}` document has `status == 'completed'`, it is immutable so duplicate submissions cannot double-update mastery.
5. **Immutable Attempts**: `attempts/{attemptId}` records are append-only by the owning student and cannot be edited or forged for another `uid`.
6. **Parent Link Verification**: Parents cannot self-approve a `parentLinks/{linkId}` document (`status: 'verified'`). Only the target student (`studentUid`) or an admin may verify or revoke a pending link.
7. **Curriculum Integrity**: `curriculum/{chapterId}` is read-only for signed-in users; only verified admins may write curriculum records.
8. **Private Tutor Conversations & Materials**: `savedMaterials/{uid}/items/{itemId}` and `revisionSchedules/{uid}/items/{itemId}` are strictly scoped to the owning student (`uid == request.auth.uid`); teachers and parents never get access to private student tutor notes.
9. **Path ID Hardening**: All single-document target path IDs MUST satisfy `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
10. **Strict Server Timestamps**: `createdAt` and `updatedAt` MUST equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Privilege Escalation on Create (`users/attacker`)**: `{ uid: "attacker", displayName: "Eve", email: "eve@x.com", role: "teacher", ... }` -> Denied because self-created role must be `"student"`.
2. **Privilege Escalation on Update (`users/student1`)**: Updating `{ role: "teacher" }` -> Denied by `affectedKeys().hasOnly(...)` and immutable `role`.
3. **Shadow Field Injection (`users/student1`)**: Creating profile with extra field `isAdmin: true` -> Denied by `hasOnly(...)`.
4. **Cross-User PII Read (`get /users/student2` as `student1`)**: Denied because `request.auth.uid != uid`.
5. **Cross-User Learner Model Tampering (`learnerModels/student2/concepts/c1` as `student1`)**: Denied by path ownership and `incoming().uid == request.auth.uid`.
6. **Out-of-Bounds Mastery Poisoning (`learnerModels/student1/concepts/c1`)**: `{ masteryScore: 9999 }` -> Denied by `0 <= masteryScore <= 100`.
7. **Terminal Assessment Replay (`update /assessments/a1` where `status == 'completed'`)**: Denied by terminal state lock `existing().status != 'completed'`.
8. **Attempt Forgery (`create /attempts/att1` as `student1` with `uid: 'student2'`)**: Denied by `incoming().uid == request.auth.uid`.
9. **Parent Self-Verification (`create /parentLinks/l1` with `status: 'verified'`)**: Denied; parents can only request `pending`, and only `studentUid` or admin can transition to `verified`.
10. **Curriculum Vandalism (`write /curriculum/ch1` as student)**: Denied; restricted to admin.
11. **Path ID Poisoning (`create /savedMaterials/student1/items/<1KB-invalid-id>`)**: Denied by `isValidId(itemId)`.
12. **Unverified Email Write (`create /studyPlans/p1` with `email_verified: false`)**: Denied by `isVerifiedUser()`.
