# Care Learn

Home-based care training for care workers, family carers, and care managers/trainers across Africa.

Care Learn is a full-stack learning application with a searchable course library, learner enrolments, saved lesson progress, multiple-choice assessments, course and assessment retakes, completion certificates, public QR-code verification, team management, and administration tools.

## Contents

- [Local PC installation with npm](#local-pc-installation-with-npm)
- [Course catalogue and estimated durations](#course-catalogue-and-estimated-durations)
- [Categories and browsing filters](#categories-and-browsing-filters)
- [Features built so far](#features-built-so-far)
- [User roles](#user-roles)
- [Application pages](#application-pages)
- [Technology and project structure](#technology-and-project-structure)
- [Development and maintenance](#development-and-maintenance)
- [Implementation notes](#implementation-notes)

## Local PC installation with npm

This runs the Care Learn web application on your PC. It still needs an internet connection to the configured **Supabase** project for accounts, courses and saved learning records; it is not an offline database installation.

### 1. Install Node.js and download the project

Install **Node.js 24 LTS**, which includes npm. Open **Windows Command Prompt (CMD)**, change into the downloaded project folder (the folder containing this README), and check:

```
node --version
npm --version
```

### 2. Install directly in the existing project

No duplicate application folder or preparation script is needed. Open CMD in the existing app folder containing `package.json`, `index.html` and `src` (normally `artifacts\care-learn` in this repository). Then run:

```
npm i
```

The existing **`artifacts/care-learn` app folder can now run on its own**, including its own `src/api` client, public assets, package manifest, Vite configuration and compiler configuration. Copy the whole app folder, not only selected `.jsx` files. It does not need a sibling `lib` directory, the repository's root compiler configuration, or private workspace package linking. React and React DOM use the same exact version. The original repository and its pnpm workflows remain supported.

Use npm on your PC and pnpm in Replit; do not alternate package managers over the same `node_modules` directory. Keep your local `package-lock.json` for repeatable npm installs.

### 3. Configure your public Supabase settings

In the existing `artifacts\care-learn` folder:

```
copy .env.example .env.local
notepad .env.local
```

Fill in the **project URL** and **public publishable key** for the Supabase project you intend to use:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

`VITE_SUPABASE_ANON_KEY` accepts your Supabase public anon/publishable key. The older `VITE_SUPABASE_PUBLISHABLE_KEY` name is also supported for compatibility; if both are set, `VITE_SUPABASE_ANON_KEY` takes precedence. Restart the development server after changing `.env` or `.env.local`.

Never put a database password, database connection string, service-role key or secret API key into `VITE_` variables: these values are bundled into browser code. Do not commit `.env.local`.

Using the existing Supabase project means using its existing accounts, courses, enrolments and certificates. Local actions can therefore change those same records; use a separate development project if you need isolated test data. For a fresh Supabase project, follow [the Supabase setup guide](supabase/README.md) in the original repository first. `npm i` installs JavaScript packages only—it does not create the database, migrate accounts, approve courses or assign administrator access.

For email confirmation and password-reset links, add `http://localhost:5173/**` and `http://127.0.0.1:5173/**` to **Supabase Authentication → URL Configuration → Redirect URLs**. Keep any existing published-site URLs and Site URL; do not replace them merely to run a local copy.

### 4. Start the app

```
npm run dev
```

Open **http://localhost:5173** in your browser. Leave CMD running; press **Ctrl+C** to stop. Restart after changing `.env.local`. No `PORT` or `BASE_PATH` settings are needed locally: Vite defaults to port 5173 and `/`. Keep that port available so email callbacks match your allowed auth URLs.

To build and preview the production frontend locally:

```
npm run build
npm run serve
```

The preview is at **http://localhost:4173**. If testing email callbacks there, also allow the corresponding port-4173 redirect URLs in Supabase.

Certificate QR codes created using a localhost address are only useful on that PC. Use the publicly hosted app when issuing certificates whose verification links must work on other people's devices.

### Installing packages with `npm i <package-names>`

Run this single command in the existing `artifacts\care-learn` folder. The list was checked against every application `.jsx` file, including retained UI components and tests, plus JavaScript helpers, the shared client, CSS plugins, Vite configuration and type-checking requirements. It includes only required packages, without version numbers or Replit packages.

```
npm i @hookform/resolvers @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-toast @radix-ui/react-tooltip @supabase/supabase-js @tailwindcss/typography @tailwindcss/vite @tanstack/react-query @types/node @types/qrcode @types/react @types/react-dom @vitejs/plugin-react class-variance-authority clsx date-fns framer-motion jsqr lucide-react qrcode react react-dom react-hook-form tailwind-merge tailwindcss tw-animate-css typescript vite wouter zod
```

Paste the command as one line, without adding quotes or a language label. Dependencies of these packages are installed automatically. Do not install `@workspace/api-client-react` from npm; the API client is included in the app's own `src/api` directory. All required application packages, including Supabase, compiler tools and type declarations, are declared in the app's own manifest.

For additional packages, use `npm i <package-names>` or `npm i -D <package-names>`; replace the placeholder without typing angle brackets. Keep React and React DOM on the **exact same version** when updating them. For repeatable reinstalls, use `npm ci` in the folder containing the matching `package-lock.json`: the repository root for a workspace install, or the app folder for an independent installation.

The repository's `package.json` retains its tested dependency versions/ranges; the version-free command instead asks npm for current releases, which may include newer major versions that require code changes. Removing versions or unused libraries does not guarantee a vulnerability-free installation. After installing, run `npm audit` to identify affected packages. Review any proposed updates before applying them, and do not use `npm audit fix --force` blindly because it can introduce breaking upgrades.

#### Required package inventory

The command above contains **43 registry packages** covering the following uses. Dependencies pulled in by these packages are installed automatically; do not list transitive packages separately.

| Purpose | Packages |
| --- | --- |
| React rendering and routing | `react`, `react-dom`, `wouter` |
| Supabase access and data caching | `@supabase/supabase-js`, `@tanstack/react-query` |
| Forms and validation | `@hookform/resolvers`, `react-hook-form`, `zod` |
| Dialogs, menus and accessible overlays | `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip` |
| Accessible controls and layout components | `@radix-ui/react-accordion`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toast` |
| Component styling utilities | `class-variance-authority`, `clsx`, `tailwind-merge` |
| Animation and functional icons | `framer-motion`, `lucide-react` |
| Dates and certificate QR generation | `date-fns`, `qrcode` |
| Certificate QR decoding tests | `jsqr` |
| Development server, build and type checking | `vite`, `@vitejs/plugin-react`, `typescript` |
| CSS, typography and animation styles | `@tailwindcss/vite`, `@tailwindcss/typography`, `tailwindcss`, `tw-animate-css` |
| Type declarations for development | `@types/node`, `@types/qrcode`, `@types/react`, `@types/react-dom` |

The API client is included in the app's own `src/api` directory. No runtime source imports leave the app folder. The list intentionally excludes the separate component-preview workspace and the retired API server. The old shared-library entry points remain compatibility re-exports for repository tools; the independent app does not need them. The legacy cross-backend lesson test lives under the repository's `tests` directory rather than inside the portable frontend.

Keep the Vite configuration's deduplication of `react`, `react-dom` and `@tanstack/react-query`. The application and its API hooks must use the same React and query-provider instances.

### Removing previously installed Replit plugins

Care Learn no longer requires Replit-specific packages. If they were installed in an older local copy, use the updated `vite.config.js` from this repository (which no longer imports the runtime-error plugin), then run this in the app folder:

```
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-dev-banner @replit/vite-plugin-runtime-error-modal
```

This removes the old dependencies from your local installation and updates your npm lockfile. It does not replace the standard Vite/React/Tailwind plugins, which are still required.

### Troubleshooting a missing package such as wouter

The full install command above already includes `wouter`. If Vite reports `Failed to resolve import wouter from src/App.jsx`, stop the dev server and open CMD in the **same app folder that contains `package.json` and `src/App.jsx`** (`artifacts\care-learn` in this repository). Run:

```
npm i wouter --include=dev
npm run dev -- --force
```

The first command installs the router and includes development dependencies even if your npm environment normally omits them. The second restarts Vite with a fresh dependency cache. Installing packages globally or in a different project will not fix imports in this app.

For any other missing-package error, rerun the full package command above from that same folder and check that npm finishes successfully. Check the local router installation with `npm ls wouter`. If npm reports an installation error, resolve that error before restarting Vite.

The dependency checks in `tests/local-setup.test.mjs` compare the install command against **every JavaScript/JSX file (including tests), shared-client imports, CSS imports/plugins and Vite configuration imports**, not only the dependency manifests. They also reject unused library declarations and stale package names in the command, while allowing required compiler/type packages.

### Relative imports

Application-owned components, hooks, contexts and utilities use relative paths. Explicit file extensions make the target clear:

```jsx
import { Button } from "../components/ui/button.jsx";
import { cn } from "./utils.js";
```

Do not use `@/...` or `@workspace/...` for application-owned source imports. Use `./`, `../` or additional parent segments according to the importing file's location, without leaving the app folder. Genuine registry package imports, such as `react`, `@supabase/supabase-js` and `@radix-ui/react-dialog`, keep their published package names. Pages such as `src/pages/VerifyCertificate.jsx` import the client from `../api/index.js`; nested admin components use `../../api/index.js`.

If a local copy still reports a missing `../../../../lib/api-client-react/src/index.js`, update the **whole app folder**, including the new `src/api` files and updated imports. Installing an npm package cannot supply these application-owned source files. Stop the dev server and restart it with `npm run dev -- --force` after updating.

## Course catalogue and estimated durations

The current application catalogue was checked on **27 October 2026**. It contains **9 courses marked as published**, with a combined estimated learning time of **415 minutes — 6 hours 55 minutes**.

These are the course-level estimates displayed by the application, not enforced time limits. Actual study time can vary, especially with revision and retakes. The catalogue does not provide a separate assessment-time estimate.

### Induction

**6 courses · 300 minutes · 5 hours**

| Course | Intended audience | Estimated time | Coverage |
| --- | --- | --- | --- |
| Personal Care Fundamentals | Care Workers | 45 minutes | Respectful, person-centred personal care; bathing, dressing, grooming, dignity, and privacy in the home. |
| Medication Awareness for Care Workers | Care Workers | 60 minutes | Medication responsibilities, safe handling, administration support, and responding when something goes wrong. |
| Safeguarding Adults in Home Care | All audiences | 50 minutes | Recognising, responding to, and reporting abuse and neglect; safeguarding responsibilities and local reporting procedures. |
| Infection Prevention and Control | Care Workers | 35 minutes | Hand hygiene, personal protective equipment, waste management, and preventing infection in home care. |
| Dementia Awareness | All audiences | 50 minutes | Understanding dementia, its effects, communication, and practical support for people living with dementia. |
| Introduction to Care Management | Managers | 60 minutes | Staff supervision, induction, performance management, and developing a positive care culture. |

### Refresher

**1 course · 40 minutes**

| Course | Intended audience | Estimated time | Coverage |
| --- | --- | --- | --- |
| Moving and Handling in the Home | Care Workers | 40 minutes | Safe moving and handling, legislation, risk assessment, and practical techniques for home care. |

### Reference Guide

**2 courses · 75 minutes · 1 hour 15 minutes**

| Course | Intended audience | Estimated time | Coverage |
| --- | --- | --- | --- |
| Nutrition and Hydration in Home Care | Care Workers | 30 minutes | Recognising malnutrition, supporting mealtimes, hydration, and special dietary needs. |
| Home Care for Family Carers | Family Carers | 45 minutes | The family carer's role, accessing support, and practical skills for common caring tasks at home. |

## Categories and browsing filters

The Course Library provides three controls. They can be combined to narrow the results.

### 1. Search

- Searches **course titles**.
- Matching is case-insensitive and supports partial titles.
- For example, searching `care` matches titles containing that word; searching `dementia` finds Dementia Awareness.

### 2. Course Type

| Filter shown in the application | Stored category | Current courses | Combined estimate |
| --- | --- | ---: | --- |
| All Types | No type restriction | 9 | 6 hours 55 minutes |
| Induction | `induction` | 6 | 5 hours |
| Refresher | `refresher` | 1 | 40 minutes |
| Reference Guide | `guide` | 2 | 1 hour 15 minutes |

### 3. Target Audience

| Filter shown in the application | What it includes | Current courses | Combined estimate |
| --- | --- | ---: | --- |
| Everyone | Every published course, regardless of its audience tag | 9 | 6 hours 55 minutes |
| Care Workers | Courses tagged Care Workers, plus courses tagged for all audiences | 7 | 5 hours 10 minutes |
| Family Carers | Courses tagged Family Carers, plus courses tagged for all audiences | 3 | 2 hours 25 minutes |
| Managers | Courses tagged Managers, plus courses tagged for all audiences | 3 | 2 hours 40 minutes |

**Courses tagged for all audiences:** Safeguarding Adults in Home Care and Dementia Awareness. These appear under every specific audience filter.

The audience groups overlap, so their counts and durations should not be added together. The **Everyone** selection means no audience restriction; it does not mean only the two courses tagged for all audiences.

Audience tags describe the intended learners. They are separate from the application permission roles described below.

There are currently no duration, difficulty, or subject-specific filters, and no sort selector. Public catalogue results exclude draft/unpublished courses.

## Features built so far

### Public website and course discovery

- Care Learn-branded landing page with introductory information and navigation to the Course Library.
- Public course browsing and course detail pages.
- Course descriptions, type and audience labels, estimated learning times, and module/lesson outlines.
- Title search and combined course-type/audience filtering.
- Sign-in entry points and enrolment actions.
- Loading, empty-result, error, and not-found states.

### Accounts and navigation

- Supabase email/password sign-in, careworker registration, email confirmation and password recovery.
- Supabase-managed accounts and sessions with database-backed profiles.
- Learner, manager, and administrator permissions.
- Protected learner pages and role-restricted staff pages.
- Navigation to My Learning, Certificates, and the relevant staff dashboard.

### Learning and progress

- Enrolment in published courses.
- My Learning dashboard with in-progress and completed course sections.
- Courses organised into modules and ordered lessons.
- Lesson player for HTML/text content and embedded video.
- Lesson navigation and explicit lesson-completion actions.
- Saved per-learner lesson progress and updating percentage progress bars.
- Resume access to enrolled courses.
- Completing the last lesson leads to **Take assessment** rather than automatically awarding a certificate.

### Assessments

- Multiple-choice knowledge checks associated with each course.
- Each new attempt samples **10 questions** from a larger authored question bank.
- Topic-balanced sampling covers the course's lesson topics.
- Question and answer-option ordering is randomised.
- New assessment attempts use a different question selection from the immediately preceding attempt; questions can recur across attempts.
- The pass mark is **90%**, meaning at least **9 correct answers out of 10**.
- Answers are marked on the server, with stored attempt records and scores.
- In-progress attempts can resume; answer selections are retained in the browser session.
- Learners who fail return to the course with their lesson progress retained.
- **Complete course** becomes available only after the learner has passed the assessment for the current course run.
- Passing alone does not automatically issue a certificate: the learner explicitly completes the course.

### Retaking courses and assessments

- **Retake course** is available for completed courses.
- Starting a course retake resets the current run's displayed lesson progress without deleting the original achievement.
- A previously completed course stays in **Completed courses**, including while it is being retaken.
- Completed-course cards indicate an active retake and allow the learner to continue it.
- **Retake assessment** remains available after passing.
- Each assessment retake starts a fresh attempt rather than reusing the submitted attempt.
- A failed retake does **not** remove an already earned certificate.
- Existing certificate records and their original award dates are preserved.

### Certificates and public QR verification

- Certificates are issued after the required lessons, passing assessment, and explicit course completion.
- Learners can view their earned certificates from the Certificates page.
- Portrait **A4 sizing: 210 × 297 mm**.
- Care Learn logo, branded frame, ribbon/medallion detail, learner name, course title, and award date.
- No visible certificate ID in the certificate list, document preview, or PDF.
- The on-screen preview and print/PDF output use the same certificate document.
- **Save as PDF** uses the browser print dialog without opening an application popup window.
- Responsive preview with accessible close/download controls.
- Locally generated, printable QR code with a **Scan to verify** caption.
- A clickable verification link is also included in the certificate document.
- Public verification at `/verify/:code`, with **no sign-in required**.
- Verification looks up the actual issued-certificate record and displays the learner, course, and award date.
- Unknown records display **Certificate not found**.
- Connection/server failures display **Unable to verify right now**, rather than incorrectly declaring the certificate invalid; a retry action is provided.
- Verification pages include `noindex, nofollow` metadata.
- Certificate identifiers remain internal to retrieval and verification links; account email addresses are not used as fallback display names.

**Sharing certificates:** QR links use the address of the site from which the certificate is downloaded. Development previews display a warning outside the printable document. Publish the application, then download certificates from the live site before issuing permanent verification links. An existing PDF's QR destination does not change automatically after publishing.

### Manager dashboard

- Team dashboard for managers and administrators.
- Team member count, enrolment totals, completed-course totals, and member completion rates.
- Staff progress table.
- Add existing application users to a manager's team.
- Remove a team relationship without deleting the person's account or learning records.
- Team-management actions are protected by role checks.

### Administration

- Administrator-only content management dashboard.
- Create, edit, and delete courses.
- Manage course titles, descriptions, types, intended audiences, estimated durations, and publication status.
- View published courses and drafts in the administration interface.
- Create, edit, and delete course modules and lessons.
- Configure lesson titles, order, duration, content type, HTML content, and video embed URLs.
- View application users and change their learner/manager/administrator roles.
- Destructive changes use themed confirmation modals.

### Shared interface behaviour

- Care Learn-themed components, responsive layouts, dialogs, and toast notifications.
- Branded confirmation dialogs for course/assessment retakes, content deletion, and team-member removal instead of native `alert`/`confirm` prompts.
- Confirmation cancellation leaves the underlying records unchanged.
- Accessible dialog labels and loading/error feedback.

## User roles

| Role | Capabilities |
| --- | --- |
| Learner | Browse courses, enrol, study lessons, track progress, take/retake assessments, complete/retake courses, and access earned certificates. |
| Manager | Learner capabilities plus team membership and progress management. |
| Administrator | Learner and manager capabilities plus course/module/lesson management, publication controls, and user-role management. |
| Signed-out visitor | Browse public pages and verify a certificate through its QR/link. Learning records and staff tools require sign-in. |

New profiles default to the learner role. Staff access depends on the assigned application role, not the audience category of a course.

## Application pages

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/courses` | Course Library and filters | Public |
| `/courses/:id` | Course information and enrolment entry point | Public browsing; enrolment requires sign-in |
| `/courses/:id/lessons/:lessonId` | Lesson player | Signed-in learner |
| `/courses/:id/assessment` | Assessment and completion flow | Signed-in learner |
| `/my-learning` | Enrolled, in-progress, and completed courses | Signed-in learner |
| `/certificates` | Earned certificates, preview, and print/PDF | Signed-in learner |
| `/verify/:code` | Live certificate verification | Public |
| `/manager` | Team dashboard | Manager or administrator |
| `/admin` | Content and user-role management | Administrator |

## Technology and project structure

| Area | Implementation |
| --- | --- |
| Workspace | pnpm monorepo, TypeScript |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui/Radix components, Wouter, Framer Motion |
| API state | TanStack Query and generated API hooks |
| Backend | Supabase directly; no intermediate application server |
| Database | Supabase PostgreSQL, row-level security and database functions |
| Validation and API contract | Zod and shared client hooks; retained OpenAPI contract/codegen |
| Authentication | Supabase Auth with email/password registration and recovery |
| Certificate QR generation | Local `qrcode` encoding and inline SVG rendering |

```text
artifacts/
  care-learn/          Main React .jsx application
  mockup-sandbox/      Separate component/design preview workspace
lib/
  api-spec/            OpenAPI contract and generation configuration
  api-client-react/    Supabase client, compatibility layer and query hooks
supabase/              Database schema, migrations and backend setup guide
scripts/
  src/                 Authoring and maintenance scripts
```

Persistent records in Supabase cover accounts, profiles, courses, modules, lessons, enrolments, lesson progress, assessment questions/attempts, country reviews and issued certificates.

## Development and maintenance

### Prerequisites

- Node.js and pnpm for Replit workflows; npm is also supported directly in the existing project as described above.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the configured backend.
- The Replit workflow provides `PORT` and `BASE_PATH`; outside Replit these default to local development settings.

Keep credentials in the workspace's secret/environment configuration, never in this README or source control.

### Install and run the original workspace

```sh
pnpm install
```

Use the existing configured workflows:

- **Care Learn web:** `pnpm --filter @workspace/care-learn run dev`
- **Component Preview Server:** `pnpm --filter @workspace/mockup-sandbox run dev` — separate design tooling, not required for learner functionality.

### Database and initial content

Follow [supabase/README.md](supabase/README.md) for the current schema and migration order. Check the target project before running any maintenance operation. Do not run legacy database pushes or seeds as part of installing the frontend: those are not required for an existing backend and can change training data.

### Type checking and API generation

```sh
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
```

Change the OpenAPI contract before regenerating client/schema code rather than hand-editing generated files. The codegen command includes the project's export normalisation step.

### Focused automated checks

```sh
node --test tests/local-setup.test.mjs
pnpm --filter @workspace/scripts exec tsx --test ../artifacts/care-learn/src/lib/certificateVerification.test.js
```

These cover npm compatibility, documented package commands, relative-import rules and QR/verification helpers. Development browser checks have also exercised learner completion/retakes, certificate retention, themed confirmations, responsive certificate previews, QR decoding, anonymous verification, failure/retry states, and one-page portrait A4 PDF output. This is not a claim of a complete automated end-to-end regression suite.

### Principal API areas

The browser talks directly to Supabase Auth and the shared client's database/RPC layer for course management, enrolment/progress, assessments, completion/retakes, certificates, profiles, teams and roles. Authorisation is enforced by the Supabase backend, not a local Express server. Historical `/api` names in the client/contract are compatibility interfaces, not instructions to start another server.

## Implementation notes

- The current lessons and question banks are initial authored/seeded training content. Clinical, legal, and training-quality review should be completed before relying on them for real-world staff compliance.
- Certificates record completion within Care Learn. This README does not assert external accreditation or endorsement.
- The administration form offers a PDF lesson type, but the current lesson player renders non-video lessons through their HTML content. A dedicated PDF upload/viewer workflow is not implemented.
- Assessment banks are maintained through scripts; the administration UI does not currently include a question-bank editor.
- PDF saving uses the browser's print functionality. Browser print settings can affect background colours and headers/footers.
- The catalogue and durations above are a snapshot, not an automatically synchronised document. Update this README when administrators change the course offering.
