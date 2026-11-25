# Security Specification & Payload Audit

## 1. Data Invariants
1. **Owner-Only Mutations, Public Read-Only Views**: Only the authenticated, email-verified portal owner (`amshorif.vai5@gmail.com` or an entry in `/admins/{uid}`) may create, update, or delete daily work reports, work proofs, or profile settings. All other visitors have read-only access to published reports.
2. **Strict Path & Schema Validation**:
   - `daily_reports/{dateId}` requires `dateId` matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, `ownerUid == request.auth.uid` on creation (and immutable on update), bounded maps/arrays, and server timestamps (`createdAt`, `updatedAt == request.time`).
   - `daily_reports/{dateId}/proofs/{proofId}` requires `isValidId(proofId)`, parent existence (`exists(/databases/$(database)/documents/daily_reports/$(dateId))`) or verified admin ownership, `dateId` matching parent path, `isPublic == true`, bounded photo/description strings, and server timestamps.
   - `portal_settings/profile` allows only `ownerUid`, `photoDataUrl` (`<= 350000` chars), and `updatedAt == request.time`.
3. **No PII Storage**: Emails, phone numbers, and personal addresses are never stored in publicly readable Firestore documents.

## 2. "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. Unauthenticated `create` on `/daily_reports/2026-11-25` -> Rejected (`!isAdmin()`).
2. Signed-in non-owner (`other@example.com`, `email_verified: true`) `update` on `/daily_reports/2026-11-25` -> Rejected (`!isAdmin()`).
3. Spoofed admin with `email: "amshorif.vai5@gmail.com"` and `email_verified: false` -> Rejected (`email_verified == true` required).
4. Admin `create` with shadow field `{ ..., "isVerified": true }` -> Rejected (`keys().hasOnly(...)`).
5. Admin `create` with mismatched `ownerUid: "someone-else"` -> Rejected (`ownerUid == request.auth.uid`).
6. Admin `update` changing immutable `createdAt` or `ownerUid` or `dateId` -> Rejected (`affectedKeys().hasOnly(...)` & immutability check).
7. Admin `create` with client-forged `updatedAt` timestamp instead of `request.time` -> Rejected (`updatedAt == request.time`).
8. Admin `create` with invalid `dateId` path (`"../../etc/passwd"` or `"invalid"`) -> Rejected (`isValidDateId(dateId)`).
9. Admin `update` with `dutyStatus: "INVALID_SITE"` -> Rejected (`dutyStatus in ['', 'HQ', 'TS', 'HQ/TS']`).
10. Admin `update` with > 5000 char `notes` string -> Rejected (`notes.size() <= 5000`).
11. Admin `create` on `/daily_reports/2026-11-25/proofs/bad$id` -> Rejected (`isValidId(proofId)`).
12. Unauthenticated `list` on `/admins` or catch-all `/unknown/doc` -> Rejected (default deny).
