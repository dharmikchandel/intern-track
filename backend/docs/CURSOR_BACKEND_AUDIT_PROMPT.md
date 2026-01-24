# ROLE
You are a Principal Backend Engineer and Security Reviewer. You must perform a full audit and repair of this repository’s backend. Your job is to make it production-safe, correct, stable, and developer-friendly — without changing product behavior unless required to fix a bug/security issue.

You are NOT allowed to ignore issues. If you find a problem, you must either:
1) Fix it directly in code, OR
2) Add explicit TODOs with exact steps + file + line-level guidance if the change is too large/risky.

You MUST be brutally thorough.

---

# CONTEXT
Project: Intern-Stack backend (Node.js + TypeScript backend, likely Express or NestJS).  
Goal: Ensure backend is correct + safe + clean before real world usage.

I already received code from another agent; your task is to verify the entire backend, locate errors/holes, and correct them. Assume this will be used by real users.

---

# HIGH-LEVEL OBJECTIVES
## Primary Objectives (must complete)
1. Locate and fix ALL runtime bugs and crash scenarios.
2. Locate and fix ALL TypeScript/type-level issues.
3. Locate and fix ALL logical bugs (wrong business logic, wrong permission checks, incorrect DB queries).
4. Identify and fix security vulnerabilities and auth holes.
5. Ensure consistent API behavior and error responses.
6. Ensure database consistency: correct schema usage, transaction safety, race condition prevention.
7. Ensure code follows clean architecture and is maintainable.
8. Ensure good DX: clean env usage, stable startup, predictable logs.

## Output Expectations
You MUST produce:
- A detailed audit report (as markdown) at: `docs/backend-audit-report.md`
- All fixes applied directly in code (not hypothetical).
- List of changed files.
- Explanation for each major change.
- Commands to run to verify.
- A list of remaining “non-blocking improvements”.

---

# VERY IMPORTANT RULES
- You MUST inspect the entire backend folder tree (every .ts file).
- You MUST follow imports and understand actual runtime flow.
- No shallow review.
- Do NOT create new architecture unless necessary; prefer small, surgical fixes.
- All changes must compile and pass lint/tests.
- If tests are missing, you MUST add tests for critical flows.
- Use strong typing, avoid `any`.
- No insecure defaults.

---

# STEP 0 — REPO DISCOVERY
Start by discovering and summarizing:
- Backend framework: Express
- ORM / DB layer: Prisma
- Auth system: JWT / session
- Main resources: Users, internships, tasks, applications, etc.

Generate:
1) A dependency map: entrypoints → modules → controllers/services → repositories
2) A request lifecycle map: request → middleware/guards → controller → service → db

---

# STEP 1 — BUILD & RUN HEALTH CHECK
You MUST attempt to run the backend mentally and check for:
- Missing env vars
- Wrong dotenv setup
- Missing scripts
- Incorrect tsconfig
- Incorrect build output paths
- Bad imports
- circular dependencies
- incorrect module resolution

Then apply fixes.

You MUST ensure:
- `npm run build` works
- `npm run start` or equivalent works
- `npm run dev` works if present

If Docker exists, ensure Docker works too.

---

# STEP 2 — CRITICAL CHECKLIST (MANDATORY)
For each item below: find problems and FIX THEM.

## 2A. Runtime Stability
- All async functions have error handling
- No unhandled promise rejections
- No missing `await`
- No mismatched async middleware patterns
- Ensure server doesn’t crash on invalid JSON
- Ensure invalid inputs never crash server

## 2B. Validation & DTOs
- Every POST/PUT/PATCH validates body payload
- Every route validates params and query
- Validation must be consistent
- Reject unknown fields when appropriate
- Strict schema validation using:
  - Zod (preferred)

Add missing schemas.

## 2C. Auth / Security
Verify:
- JWT secret strength and env storage
- token expiry
- refresh token logic if used
- password hashing (bcrypt/argon2)
- rate limiting for auth endpoints
- brute force prevention
- CORS correctness
- Helmet/security headers
- CSRF if cookies used
- SQL injection prevention (ORM safe)
- unsafe `eval` or dangerous parsing
- file upload security if applicable

AUTHORIZATION MUST BE CHECKED:
- Users can only access their own data
- Admin routes locked down
- Resource ownership checks exist and are correct

## 2D. Database Correctness
- check schema vs usage mismatch
- correct indexes + unique constraints
- transaction handling for multi-write flows
- concurrency/race conditions (double apply / duplicate create)
- ensure safe updates (`where` conditions correct)
- no silent failures
- consistent pagination patterns
- consistent sorting and filtering

## 2E. API Contracts
- consistent route naming
- consistent status codes
- consistent error format
- correct 401 vs 403
- correct 404 vs 403 for non-owned resources
- output DTOs hide sensitive fields

Sensitive fields NEVER returned:
- passwordHash
- refresh tokens
- internal IDs if not required
- secrets

## 2F. Logging & Observability
- do not log passwords/tokens
- request logging with correlation/request-id
- meaningful errors in logs (stack traces server-side)
- safe client-facing error messages

## 2G. Code Quality
- remove dead code
- remove unused imports
- consistent naming
- consistent folder structure
- avoid duplicated logic (extract utilities)
- ensure `eslint` compliance

---

# STEP 3 — ROUTE BY ROUTE AUDIT
You MUST go route-by-route:

For each API route:
1) Identify route + method + path
2) Identify required authentication
3) Identify validation schema
4) Identify service logic
5) Identify DB call correctness
6) Identify returned response structure
7) Identify possible edge cases and failure modes
8) Fix all discovered issues

Document each in the report.

---

# STEP 4 — THREAT MODELING
You MUST perform security analysis like:
- IDOR vulnerabilities
- Privilege escalation
- leaking sensitive data
- broken access control
- insecure defaults
- improper error messages
- missing rate limiting
- token replay issues

Fix them.

---

# STEP 5 — WRITE TESTS (CRITICAL)
If there is no testing:
- add testing using Jest + Supertest (Express) or Nest testing utilities
- at minimum test:
  - auth flow: register/login/token validation
  - protected route rejects unauthenticated
  - ownership enforcement for resources
  - invalid payload returns 400
  - DB constraints / duplicate prevention
  - pagination works

If tests exist, improve them.

---

# STEP 6 — DELIVERABLES
## Code Changes
- implement all fixes in code
- update env examples `.env.example`
- ensure migrations/prisma schema correct
- ensure README has correct backend instructions

## Report File: docs/backend-audit-report.md
Your report MUST include:

### 1. Repo Summary
- backend framework
- DB/ORM
- auth method
- major modules

### 2. Issues Found (Table)
Columns:
- Severity (Critical/High/Medium/Low)
- Area (Auth/DB/API/Runtime/etc)
- File
- Description
- Fix Summary

### 3. Route Audit
List every route with:
- security expectations
- current behavior
- fixes applied

### 4. Security Posture Summary
- what was insecure
- what’s now fixed
- remaining recommendations

### 5. How to Verify
- exact commands
- env vars required
- run tests

### 6. Remaining TODOs (Non-blocking)
- enhancements

---

# IMPLEMENTATION CONSTRAINTS
- Keep the existing API paths unless needed.
- Never remove fields silently; if changing response shape, document.
- Use common error handler middleware / exception filter.
- Never weaken security.

---

# FINAL EXECUTION ORDER
You MUST proceed in this order:
1) Scan folder structure & summarize architecture
2) Fix build/lint/runtime issues
3) Fix auth & authorization holes (highest priority)
4) Fix validation and API consistency
5) Fix DB correctness/race conditions
6) Add tests
7) Produce final report

---

# COMPLETION CRITERIA
You are done only when:
- Project builds without TypeScript errors
- Lint passes
- Tests pass
- You have fixed all critical/high issues
- Audit report is created and accurate