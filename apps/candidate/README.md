# Candidate

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Candidate App Architecture & Documentation

Goal

Build a fully isolated Angular candidate application in apps/candidate, connected only to the Django backend API.

This app must not share business UI code with the RH/internal frontend in apps/frontend.

Target repository layout
apps/
├── backend/
│   ├── core/
│   ├── users/
│   ├── candidates/
│   ├── positions/
│   ├── recruitment/
│   ├── templates_grid/
│   ├── evaluations/
│   └── ...
│
├── frontend/                # RH / internal Angular app
│   ├── src/
│   └── ...
│
└── candidate/               # Candidate Angular app
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   ├── features/
    │   │   ├── shared/
    │   │   ├── app.routes.ts
    │   │   ├── app.config.ts
    │   │   └── app.component.ts
    │   ├── environments/
    │   ├── assets/
    │   ├── styles.scss
    │   ├── main.ts
    │   └── index.html
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── README.md
Angular application architecture
1. core/

Contains singleton, app-wide technical concerns.

src/app/core/
├── api/
│   ├── api.config.ts
│   └── api-endpoints.ts
├── auth/
│   ├── models/
│   │   ├── auth-tokens.model.ts
│   │   ├── current-user.model.ts
│   │   └── login-request.model.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── token-storage.service.ts
│   │   └── session.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── guest.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── api-error.interceptor.ts
│   └── utils/
│       └── jwt.utils.ts
├── layout/
│   ├── public-layout/
│   └── private-layout/
├── state/
│   └── app.state.ts
└── utils/
    ├── date.utils.ts
    └── storage.utils.ts

Rules

No feature business logic in core

Services here are singletons

Interceptors, guards, auth, and app config belong here

2. features/

Contains business domains, one folder per use case.

src/app/features/
├── auth/
│   ├── pages/
│   │   ├── login-page/
│   │   ├── register-page/
│   │   ├── forgot-password-page/
│   │   └── reset-password-page/
│   ├── components/
│   ├── services/
│   └── auth.routes.ts
│
├── dashboard/
│   ├── pages/
│   │   └── dashboard-page/
│   └── dashboard.routes.ts
│
├── jobs/
│   ├── pages/
│   │   ├── jobs-list-page/
│   │   └── job-detail-page/
│   ├── components/
│   │   ├── job-card/
│   │   └── job-filters/
│   ├── services/
│   │   └── jobs.service.ts
│   ├── models/
│   │   └── job-offer.model.ts
│   └── jobs.routes.ts
│
├── applications/
│   ├── pages/
│   │   ├── applications-list-page/
│   │   └── application-detail-page/
│   ├── components/
│   ├── services/
│   │   └── applications.service.ts
│   ├── models/
│   └── applications.routes.ts
│
├── profile/
│   ├── pages/
│   │   └── profile-page/
│   ├── components/
│   ├── services/
│   │   └── profile.service.ts
│   ├── models/
│   └── profile.routes.ts
│
└── results/
    ├── pages/
    │   ├── results-list-page/
    │   └── result-detail-page/
    ├── components/
    ├── services/
    │   └── results.service.ts
    ├── models/
    └── results.routes.ts

Rules

One folder per domain

Pages orchestrate use cases

Components are presentation-focused

Services call API or encapsulate domain workflows

Models are feature-local unless truly reusable

3. shared/

Contains dumb reusable building blocks.

src/app/shared/
├── ui/
│   ├── button/
│   ├── card/
│   ├── input/
│   ├── empty-state/
│   ├── page-header/
│   └── loader/
├── forms/
│   ├── validators/
│   └── form-errors/
├── pipes/
├── directives/
└── models/

Rules

No feature-specific business logic

Reusable presentation and utilities only

Keep shared small, or it becomes the landfill of the empire

Routing strategy
Root routes
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then(m => m.JOBS_ROUTES),
      },
      {
        path: 'applications',
        loadChildren: () => import('./features/applications/applications.routes').then(m => m.APPLICATIONS_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
      {
        path: 'results',
        loadChildren: () => import('./features/results/results.routes').then(m => m.RESULTS_ROUTES),
      },
    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
Routing rules

Public auth routes under public layout

Candidate business routes under private layout

Lazy load major features

Use guards only for access, not business orchestration

Authentication strategy
Frontend

Use JWT access token + refresh token.

Recommended components:

token-storage.service.ts: token persistence

auth.service.ts: login, logout, refresh, me

session.service.ts: current user state

auth.interceptor.ts: inject bearer token and handle refresh

auth.guard.ts: block private pages

guest.guard.ts: block auth pages for authenticated users

Flow

Candidate logs in

Backend returns access token + refresh token

Frontend stores tokens securely according to chosen strategy

Interceptor adds access token to protected requests

If access token expires, refresh is attempted

If refresh fails, user is logged out and redirected

Security rules

Never trust the frontend for authorization

Candidate can access only own data

Role validation must happen on Django side

Refresh failures must fully clear session

Never expose internal admin endpoints to this app

Candidate-facing pages for phase 1
Public

Login

Register

Forgot password

Reset password

Private

Dashboard

Job offers list

Job offer detail

My applications

Application detail

My profile

My results

Result detail

API boundary with Django

The backend already contains candidate, positions, recruitment, templates, and evaluation domains. The candidate app must consume only a candidate-safe API surface.

Recommended endpoint groups
/api/candidate-auth/
/api/candidate-profile/
/api/candidate-jobs/
/api/candidate-applications/
/api/candidate-results/
Example contract
Auth
POST   /api/candidate-auth/register/
POST   /api/candidate-auth/login/
POST   /api/candidate-auth/refresh/
POST   /api/candidate-auth/logout/
GET    /api/candidate-auth/me/
Profile
GET    /api/candidate-profile/me/
PATCH  /api/candidate-profile/me/
Jobs
GET    /api/candidate-jobs/
GET    /api/candidate-jobs/{id}/
POST   /api/candidate-jobs/{id}/apply/
Applications
GET    /api/candidate-applications/
GET    /api/candidate-applications/{id}/
Results
GET    /api/candidate-results/
GET    /api/candidate-results/{id}/
Django backend integration rules

Based on the current backend layout, keep business domains split and expose role-specific views/serializers for candidate access.

Rules

Reuse domain models where sensible

Use dedicated candidate serializers for candidate-safe output

Use dedicated permissions for candidate ownership checks

Keep internal HR/manager endpoints separate

Do not leak evaluation generation internals or question bank internals to candidate endpoints

Recommended backend additions
apps/backend/
├── candidate_portal/
│   ├── serializers/
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── jobs.py
│   │   ├── applications.py
│   │   └── results.py
│   ├── views/
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── jobs.py
│   │   ├── applications.py
│   │   └── results.py
│   ├── permissions.py
│   ├── urls.py
│   └── services/

This keeps the public candidate API explicit instead of mixing candidate portal concerns inside internal endpoints.

Coding conventions
Angular

Standalone components

Strong typing, avoid any

ChangeDetectionStrategy.OnPush by default for presentational components

Keep templates declarative

Keep components small

Use async pipe where possible

Services contain business/API orchestration

One responsibility per file/class

Django

Thin views, explicit serializers, clear permissions

Services for non-trivial business workflows

Role-safe endpoint segregation

Consistent plural resource naming

Paginate list endpoints

Return explicit 4xx/5xx errors

Testing strategy
Angular
Unit tests

auth service

token storage service

auth guard

guest guard

auth interceptor

API error interceptor

feature services

critical page components

Integration/UI tests

login flow

private route protection

expired token refresh flow

application submission flow

result consultation flow

Django

auth endpoint tests

candidate ownership permission tests

profile update tests

jobs list/detail tests

apply to job tests

results visibility tests

regression tests ensuring candidate cannot access internal endpoints

Initial folder creation plan

Create these folders first:

src/app/
├── core/
│   ├── api/
│   ├── auth/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── layout/
│   │   ├── private-layout/
│   │   └── public-layout/
│   └── utils/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── jobs/
│   ├── applications/
│   ├── profile/
│   └── results/
└── shared/
    ├── ui/
    ├── forms/
    ├── directives/
    └── pipes/
Suggested documentation files

Inside apps/candidate/docs/ create:

docs/
├── architecture.md
├── frontend-structure.md
├── auth-flow.md
├── api-contract.md
├── routing.md
├── testing-strategy.md
└── contribution-guide.md
architecture.md

Explain isolation principle, app layers, backend integration boundary.

frontend-structure.md

Explain core, features, shared, naming rules, and file placement.

auth-flow.md

Explain login, refresh, logout, guard, interceptor, and token lifecycle.

api-contract.md

Document candidate-safe endpoints, DTOs, error responses, auth headers.

routing.md

Document public/private layouts and feature lazy loading.

testing-strategy.md

List required unit/integration tests and coverage expectations.

contribution-guide.md

Define rules for naming, code organization, reviews, and how to add a new feature.

Merge policy

This branch is ready to merge only when:

the candidate app compiles

folder architecture is created

root routes are in place

auth core foundation exists

docs are committed

no code from apps/frontend is imported into apps/candidate
