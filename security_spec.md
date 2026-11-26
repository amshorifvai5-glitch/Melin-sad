# Security Specification & Payload Audit

## 1. Data Invariants
1. **Owner-Only Mutations, Public Read-Only Views**: Only the authenticated, email-verified portal owner (`amshorif.vai5@gmail.com` or an entry in `/admins/{uid}`) may create, update, or delete daily work reports, work proofs, or profile settings. All other visitors have read-only access to published reports.
2. **Strict Path & Schema Validation**:
   - `daily_reports/{dateId}` requires `dateId` matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, `ownerUid == request.auth.uid` on creation (and immutable on update), bounded maps/arrays, and server timestamps (`createdAt`, `updatedAt == request.time`).
   - `daily_reports/{dateId}/proofs/{proofId}` requires `isValidId(proofId)`, parent existence (`exists(/databases/$(database)/documents/daily_reports/$(dateId))`) or verified admin ownership, `dateId` matching parent path, `isPublic == true`, bounded photo/description strings, and server timestamps.
   - `daily_reports/{dateId}/expenses/{expenseId}` requires `isValidId(expenseId)`, parent existence, `dateId` matching parent path, `isPublic == true`, bounded `title`/`category`/`amount` (`0 <= amount <= 1000000`)/`note`/`receiptPhoto` (`<= 350000` chars), and server timestamps; readable publicly, writable only by `isAdmin()`.
   - `portal_settings/profile` allows only `ownerUid`, `photoDataUrl` (`<= 350000` chars), and `updatedAt == request.time`.
   - `portal_settings/live_location` allows only `ownerUid`, `locationLabel` (`1..80` chars), `note` (`<= 160` chars), `isActive` (`bool`), and `updatedAt == request.time`; publicly readable (`get`), writable only by `isAdmin()`.
   - `feedback/{feedbackId}` is a write-once public drop-box: any visitor may `create` a submission with `isValidId(feedbackId)`, bounded `category`/`senderName`/`message`, forced initial `status == 'নতুন'`, empty `adminNote == ''`, and `createdAt == request.time && updatedAt == request.time`. Only `isAdmin()` may `get`, `list`, `update` (`status`, `adminNote`, `updatedAt` only), or `delete`.
   - `inventory_items/{itemId}` requires `isValidId(itemId)`, `itemId == itemId`, `ownerUid == request.auth.uid`, `isPublic == true`, bounded `name` (`1..120`), `quantity` (`0..100000`), allowlisted `unit`, bounded `note` (`<= 300`), and server timestamps; readable publicly (`isPublic == true` for list), writable only by `isAdmin()`.
3. **No Public PII Exposure**: Emails, phone numbers, and private feedback/complaints are never readable by non-admin visitors.

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
11. Non-admin `list` or `get` on `/feedback` or `/feedback/{id}`, or `create` on `/feedback` with `status: "সমাধান হয়েছে"` or > 2000 char `message` -> Rejected (`!isAdmin()` for reads; initial state & size guards on create).
12. Unauthenticated `list` on `/admins` or catch-all `/unknown/doc` -> Rejected (default deny).
