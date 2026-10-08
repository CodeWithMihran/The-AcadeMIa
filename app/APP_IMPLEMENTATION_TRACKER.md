# The AcadeMIa Mobile App — Implementation Tracker

This checklist tracks feature parity with the website while the React Native app is built in small, reviewable batches. Website API and data behavior remain the source of truth. A screen is marked complete only after its loading, empty, error, success, and permission states are covered and it has been verified on Android.

## Mobile UX direction

- Design for phone interaction instead of copying the website's navigation or page composition.
- Keep navigation at the top in the black mobile header; place secondary destinations in the native-style Workspace Menu.
- Prefer compact touch-first controls, clear page hierarchy, and layouts that fit narrow screens without web-style overflow.

## Website journey inventory

| Website route / journey | Mobile destination | Status |
| --- | --- | --- |
| `/` — sign in, registration, public overview | Sign-in and registration | Implemented; public marketing overview not included in app shell |
| `/auth/callback` — Google OAuth callback | Mobile OAuth/deep-link flow | Planned; requires a mobile callback flow |
| `/dashboard` | Student dashboard | Implemented; static checks pass |
| `/subjects` | Subject catalog and search | Implemented; static checks pass |
| `/subjects/:id` | Subject Vault, Academic/Career modes, embedded resources | Vault lists syllabus and resources; native in-app viewer remains |
| `/progress` | Overall syllabus and career progress | Implemented; static checks pass |
| `/progress/:subjectId` | Subject and topic progress | Dedicated subject progress screen with unit/topic completion checklist |
| `/rankings` | Campus/branch cohort rankings | Implemented; static checks pass |
| `/study-tools` | Attendance, marks, and credit planner | Implemented; static checks pass |
| `/campus` | Campus notes, contributions, bounties, credits | Feed, bounties, history, Android PDF/image upload, and review status implemented; file viewing remains |
| `/profile` | Profile, track, campus, preferences, activity | Profile setup and activity implemented; leaderboard preferences are under Rankings |
| `/admin` | Admin overview and moderation entry point | Implemented; static checks pass |
| `/admin/users` | User administration | User list/search and guarded deletion implemented |
| `/subjects/add` | Create subject, syllabus, exam and career resources | Admin JSON editor implemented; backend validates payload |
| `/subjects/edit/:id` | Edit subject and resources | Admin JSON editor implemented; backend validates payload |

## Feature parity checklist

- [x] Authentication: email/password, secure token persistence, logout, validation, API failures, and expired-token recovery back to sign-in are implemented; native Google OAuth and physical-device/production URL setup remain.
- [x] Academic profile/onboarding: onboarding plus profile changes for track, tenant/campus, branch, year/semester, and exam/year are implemented.
- [x] Student dashboard and subject catalog: API-backed lists, search, empty/error states and navigation are implemented. The phone app has a native destination menu and dedicated bottom-tab glyphs rather than using website navigation patterns.
- [ ] Subject Vault: syllabus/topics, resources, Exam Night and Career Bridge are implemented; topic completion now lives in its own subject progress screen. PDFs/lectures still open externally, and an authenticated native file/embedded viewer remains.
- [x] Exam Night: high-yield filter, historical recurrence context using entered years, rapid revision and structured outlines are implemented.
- [x] Career Bridge: interview/coding completion, difficulty/company filters, GATE material, broken-link reports and activity integration are implemented; resource data still depends on admin curation.
- [x] Study tools: overall/per-subject attendance, marks, SGPA/CGPA planning and server persistence with input validation are implemented.
- [x] Progress: subject readiness, a dedicated per-subject unit/topic checklist, career activity heatmap, cohort rankings/opt-in, and a native dependency-free career skill radar on Dashboard and Progress are implemented.
- [ ] Community: campus feed, note voting, wallet, contribution history, bounties, and Android PDF/JPEG/PNG note upload are implemented; authenticated file viewing remains, and the native picker currently has no iOS implementation.
- [ ] Campus/admin moderation: contribution review actions are implemented for administrators; ambassador scope, moderator access and credit adjustment UI remain.
- [x] Admin: overview, user directory/search/deletion, subject listing and JSON create/edit/delete, contribution moderation, and link-report resolution are implemented; rich structured native subject forms remain a UX improvement.
- [ ] App quality: native responsive layouts and many loading/error/empty states exist; theme system, broad accessibility audit, full device checks, offline behavior and release configuration remain.

## Delivery batches

| Batch | Scope | Status |
| --- | --- | --- |
| 0 | React Native CLI scaffold and emulator smoke check | Complete (user verified) |
| 1 | App inventory, API client, secure token storage | Complete |
| 2 | Navigation, auth state, sign-in/registration/onboarding | Implemented; manual device check pending |
| 3 | Dashboard, subject catalog, subject vault | Implemented; lint and TypeScript pass |
| 4 | Exam Night, Career Bridge, study tools | Implemented; lint and TypeScript pass |
| 5 | Profile, progress, rankings, activity analytics | Implemented; lint and TypeScript pass |
| 6 | Community notes, voting, bounties, credits, campus moderation | Feed, voting, bounties, wallet, contribution history, and Android native file upload implemented; iOS picker and authenticated file viewing remain |
| 7 | Admin dashboard, users, subject editor and reports | Overview, user directory, subject list, contribution moderation, broken-link triage, and JSON subject CRUD implemented |
| 8 | Cross-screen polish, permissions, accessibility and Android verification | In progress; profile editing and activity heatmap polished; native/manual checks left to user |
| 9 | Native career skill radar on Dashboard and Progress | Complete; static checks pass, device rendering remains for user verification |
| 10 | Protected API session expiry handling | Complete; authenticated 401 responses clear the matching stale token and route the app to sign-in |
| 11 | App-style destination menu and mobile tab bar | Complete; Menu opens a grouped full-screen native modal, supports Android back/close, and exposes role-appropriate destinations with custom tab glyphs |
| 12 | Black top navigation with animated icons | Implemented; primary destinations are in a black top bar and icons animate on selection; device layout check remains |
| 13 | Dedicated subject progress destination | Implemented; each progress row opens unit/topic progress and the Subject Vault shows syllabus topics without completion checkboxes; device flow check remains |
| 14 | Admin user directory mobile search | Implemented; user searches are debounced and served by the existing admin API across name, email, campus, and branch; stale responses are ignored, and loading/error/empty states are explicit |
| 15 | Design tokens, reusable UI system, and Dashboard & Subject Catalog polish | Implemented; defined shared tokens (theme.ts), created reusable AppCard, AppHeader, SectionHeading, PrimaryButton, BadgePill, SearchInput, EmptyState, ErrorState, LoadingState components; polished Dashboard with stat cards, study tools shortcut, and subject cards; polished Subject Catalog with debounced search and clear action |
| 16 | Subject Vault, Study Tools, and Navigation transitions & active indicators polish | Implemented; added smooth slide transitions (slide_from_right) to RootStack and AuthStack; added active indicator dot to TabGlyph with enhanced contrast; polished SubjectVault with classical top bar, segmented academic/career mode switch, high-yield filter toggle, exam recurrence cards, and career bridge resources; polished StudyTools with attendance forecasting, sessional targets, and SGPA/CGPA planners |

## Current platform constraints to resolve during implementation

- The API accepts JWT bearer tokens and also sets browser cookies. Mobile will persist only the bearer token in Android secure storage and must not depend on cookies.
- The Android emulator reaches the development computer at `http://10.0.2.2:3000`. Physical devices need the computer's LAN address; production builds need the deployed HTTPS API URL.
- Google OAuth currently redirects to the website callback. Native Google sign-in is not considered complete until the server/app have a safe mobile callback/deep-link flow.
- PDF, video, and external resource handling will use native viewers or in-app browser surfaces; browser-only iframe behavior cannot be reused as-is.
- Community upload currently uses an Android system file-picker bridge with no third-party picker dependency. iOS file selection still needs an iOS-native implementation.

## Batch log

| Date | Batch | Files / result |
| --- | --- | --- |
| 2026-10-08 | 0 | Existing React Native CLI starter verified by user on Android emulator. |
| 2026-10-08 | 1 | Added feature/route parity inventory, Axios API client, Android emulator API default, and Keystore-backed bearer-token storage. Targeted ESLint and TypeScript checks pass. |
| 2026-10-08 | 2 | Added auth/session state, sign-in and registration, onboarding for university/JEE/NEET tracks, and dashboard/subject/tools/profile navigation shell. Targeted ESLint, TypeScript, Metro bundle, and Android debug build pass. Emulator interaction remains unverified here because ADB cannot start in this environment. |
| 2026-10-08 | 3 | Replaced Dashboard and Subjects tab placeholders with API-backed dashboard/catalog, added subject vault with topic progress toggles and syllabus/Exam Night/Career content surfaces. Resource links currently open through the device's compatible app; embedded in-app viewing is tracked for a later native-viewer batch. |
| 2026-10-08 | 4 | Added persistent attendance forecasts (per subject and overall), internal/sessional marks tracking, required-external calculations, and credit-based SGPA/CGPA planning with strict validation and honest zero-credit output. Lint, TypeScript, and diff checks pass. |
| 2026-10-08 | 4 | Completed native Exam Night high-yield filtering based on tagged importance and observed question history, recurrence context with reviewed-year denominators, Career Bridge difficulty/company filters, interview/coding completion, and broken-link reports. Lint, TypeScript, and diff checks pass. |
| 2026-10-08 | 5 | Added API-backed overall/subject/career progress, opt-in cohort rankings with anonymous peers, profile overview/name editing, and labeled career-activity history. Profile mutations include required current track/campus data. Lint, TypeScript, and diff checks pass. |
| 2026-10-08 | 6 | Added campus subject feed, recommended-note voting, wallet and badges, contribution history, credit bounty creation/cancellation, and empty/error states. Native file selection is pending a document picker package because registry access is unavailable in the workspace. |
| 2026-10-08 | 7 | Added role-gated admin console with overview counts, user search/deletion safeguards, subject directory and JSON CRUD, campus contribution review, and resolve/dismiss actions for link reports. |
| 2026-10-08 | 8 | Added Profile study-setup editing across university and competitive tracks, a month-aligned 52-week activity heatmap, and administrator subject create/edit/delete using complete JSON payloads validated by the existing API. Lint, TypeScript, and diff checks pass. |
| 2026-10-08 | 8 | Added Android system PDF/JPEG/PNG selection with 8 MB precheck and connected note uploads to the existing moderation API. Kotlin compile, ESLint, TypeScript, and diff checks pass; app/emulator was not launched. |
| 2026-10-08 | 8 | Consolidated secondary progress, rankings, and campus destinations under a “More” hub to keep the phone bottom navigation compact. ESLint, TypeScript, and diff checks pass. |
| 2026-10-08 | 9 | Added a responsive, screen-reader-described native radar plot using the backend's existing per-subject career scores, with an actionable empty state and score legend; surfaced it on Dashboard and Progress. No backend payload or new package required. |
| 2026-10-08 | 10 | Hardened shared mobile API authentication: authenticated 401 responses clear only the token used by that request and route the app back to sign-in, while login/register 401 responses remain normal form errors. |
| 2026-10-08 | 11 | Replaced the generic More destination page with an app-style grouped Workspace Menu modal, including account identity, all relevant destinations, confirmed sign-out, Android back handling, and custom line-style bottom-tab icons with safe-area sizing. |
| 2026-10-08 | 12 | Moved primary app navigation from the bottom to a safe-area-aware black top bar; added animated icon selection feedback and white-on-black Android status bar styling. |
| 2026-10-08 | 13 | Made overall progress subject rows actionable and added a dedicated per-subject progress screen with unit readiness, topic checklists, loading/empty/error states, refresh, and persisted topic toggles. Removed completion controls from the Subject Vault and added a clear link to the progress screen. |
| 2026-10-08 | 14 | Replaced client-side admin user-directory filtering with 300 ms debounced backend search. Extended the existing safe query to include branch, added request sequencing to ignore stale results, and added initial-loading, searching, retry, and no-results states. |
| 2026-10-08 | 15 | Added shared theme tokens (`theme.ts`) and unified UI components (`AppCard`, `AppHeader`, `SectionHeading`, `PrimaryButton`, `BadgePill`, `SearchInput`, `EmptyState`, `ErrorState`, `LoadingState`). Polished DashboardScreen with key stat counters, daily study-tools shortcut card, accessible subject progress cards, and standardized states. Polished SubjectCatalogScreen with debounced search with clear trigger, course code pills, academic metadata, and empty search states. |
| 2026-10-08 | 16 | Added smooth native stack animations (`slide_from_right`) to `RootStack` and `AuthStack`, enhanced top navbar tab contrast and added an active indicator dot to `TabGlyph`. Polished `SubjectVaultScreen` with classical navigation top bar, segmented academic/career mode tabs, high-yield filter bar with active state, topic priority badges, organized study material cards (notes, books, PYQs, lectures), Exam Night recurrence callouts, rapid revision flashcards, and Career Bridge difficulty/company filters with interactive practice completion checkmarks. Polished `StudyToolsScreen` with clean segmented tab switch, numeric inputs, live forecast cards with semantic safe/warning states, assessment categories, and accessible save actions. |

## Verification notes

- App lint is scoped to `App.tsx` and `src/`; `eslint .` traversed the native project tree and did not finish promptly.
- Runtime app/emulator checks are intentionally being left to the user; this build pass uses static checks only, per the user's instruction.
- `npm install` reported 54 dependency audit findings (5 moderate, 49 high); review the dependency tree before release and resolve findings without blindly applying breaking upgrades.
- Gradle emitted upstream Android Gradle Plugin and React Native dependency deprecation warnings, but `assembleDebug` completed successfully.
- The app has not yet reached website feature parity. Remaining workflows and platform gaps are listed above; implemented features still need user verification on-device before they are considered runtime-verified.
- Installing `react-native-webview` was attempted for the embedded study-material viewer, but npm registry DNS resolution failed (`ENOTFOUND registry.npmjs.org`). No dependency was added; the app retains its existing external-link handling until the package can be installed and native builds can link it.
- This pass did not launch the app or emulator, in line with the user's instruction. The Android Gradle resource task was blocked by an access-denied lock file in the Gradle cache; targeted static checks are the available verification for this batch.
- Batch 14 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.
- Batch 15 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.
- Batch 16 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.


