# MVP Roadmap — Step 1 (Architecture Audit + Delivery Plan)

## 1) Current architecture snapshot

### Backend (Django + DRF)
- Auth API exists for login (`/api/auth/login/`), me (`/api/auth/me/`), and refresh (`/api/auth/refresh/`).
- Domain apps already exist for candidates, recruitment (job applications), positions, template grid, and evaluations.
- Role enum currently includes: admin, hr, manager, director, employee.
- Some role-based permissions exist (`IsHrAdminOrDirector`) but are not consistently applied across all sensitive endpoints.

### Frontend internal app (Angular)
- Has login page, token storage, auth guard, role guard, and auth interceptor.
- Internal routes are already protected with auth + role checks for several feature areas.
- Current login payload includes `profile` while backend login serializer authenticates with only email/password.

### Candidate app (Angular)
- Has jobs list, job detail, apply flow, and auth modal (sign in/sign up in modal).
- Uses same backend auth endpoints and candidate creation endpoint.
- Has own auth service and auth interceptor (separate from internal app auth foundation).

## 2) Gaps vs target MVP

1. **Shared authentication foundation is duplicated** between internal and candidate apps.
2. **Role model mismatch** with requested MVP roles:
   - requested: Admin/RH, Driver, Manager, Candidate
   - current: admin, hr, manager, director, employee
3. **Backend authorization coverage is incomplete**:
   - some critical endpoints are open or missing strict object-level ownership checks.
4. **Evaluation workflow exists at data level** but lacks end-to-end guarded flows for:
   - launch test,
   - manager section-only evaluation,
   - final RH/Admin validation/rejection,
   - controlled subject visibility.
5. **Candidate history/results dashboard slice is not yet complete**.

## 3) Ordered MVP implementation slices

### Slice 1 — Baseline hardening + auth contract alignment
- Align login contract between backend and both Angular apps.
- Add missing register endpoint strategy (candidate-safe only).
- Standardize token refresh and logout behavior.
- Add backend permission coverage baseline tests.

### Slice 2 — Role system normalization
- Introduce explicit role mapping for `driver` and `candidate` while keeping backward compatibility where needed.
- Add centralized backend role policy helpers.
- Enforce role checks at API layer first (never frontend-only).

### Slice 3 — Candidate portal complete flow
- Public jobs list + job details + clean apply for authenticated and unauthenticated users.
- Candidate account creation/login.
- Candidate dashboard basics (applications + own evaluation history).

### Slice 4 — Internal recruitment operations
- Admin/RH job offer management hardening.
- Launch test from candidate/driver context.
- Link evaluation creation with application/user ownership and template version snapshot.

### Slice 5 — Templates/tests minimal production flow
- Ensure template + section + pool rules are reusable and validated.
- Add mandatory question behavior enforcement if configured.
- Add tests to protect template integrity and reusability.

### Slice 6 — Manager partial evaluation flow
- Section assignment API (manager can only read/write assigned section answers/comments).
- Object-level permission checks for every manager write.
- UI for manager section task queue and section form.

### Slice 7 — Results, validation, decision
- Subject view (candidate/driver): only allowed result fields/comments.
- RH/Admin full review view.
- RH/Admin validate/reject endpoint with audit fields and status transitions.

### Slice 8 — Final MVP stabilization
- End-to-end permission matrix test coverage.
- CI parity checks with project GitHub Actions jobs.
- Final UX consistency pass (dark design system, responsive behavior, shared UI reuse).

## 4) Definition of done for Step 1
- Existing architecture inspected.
- MVP roadmap split into coherent, incremental vertical slices.
- Next implementation step can start with Slice 1 only, using TDD.
