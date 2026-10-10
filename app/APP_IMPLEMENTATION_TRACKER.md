# The AcadeMIa Mobile App — Implementation Tracker

This checklist tracks feature parity with the website while the React Native app is built in small, reviewable batches. Website API and data behavior remain the source of truth. A screen is marked complete only after its loading, empty, error, success, and permission states are covered and it has been verified on Android.

## Mobile UX direction

- Design for phone interaction instead of copying the website's navigation or page composition.
- Keep the compact primary destinations in a safe-area-aware black top bar; place secondary destinations in the animated Workspace Drawer.
- Prefer compact touch-first controls, clear page hierarchy, and layouts that fit narrow screens without web-style overflow.

## Website journey inventory

| Website route / journey | Mobile destination | Status |
| --- | --- | --- |
| `/` — sign in, registration, public overview | Sign-in and registration | Implemented; public marketing overview not included in app shell |
| `/auth/callback` — Google OAuth callback | Mobile OAuth/deep-link flow | Implemented with a one-time PKCE exchange; provider setup and device verification remain |
| `/dashboard` | Student dashboard | Implemented; static checks pass |
| `/subjects` | Subject catalog and search | Implemented; static checks pass |
| `/subjects/:id` | Subject Vault, Academic/Career modes, embedded resources | Full-screen in-app PDF/web lecture viewer implemented; provider limitations have a browser fallback |
| `/progress` | Overall syllabus and career progress | Implemented; static checks pass |
| `/progress/:subjectId` | Subject and topic progress | Dedicated subject progress screen with unit/topic completion checklist |
| `/rankings` | Campus/branch cohort rankings | Implemented; static checks pass |
| `/study-tools` | Attendance, marks, and credit planner | Implemented; static checks pass |
| `/campus` | Campus notes, contributions, bounties, credits | Feed, bounties, history, Android/iOS PDF/image upload, authenticated in-app note viewing, and review status implemented |
| `/profile` | Profile, track, campus, preferences, activity | Profile setup and activity implemented; leaderboard preferences are under Rankings |
| `/settings` | App appearance and account preferences | Dedicated native Settings destination with persisted System/Light/Dark selection |
| `/admin` | Admin overview and moderation entry point | Implemented; static checks pass |
| `/admin/users` | User administration | User list/search and guarded deletion implemented |
| `/subjects/add` | Create subject, syllabus, exam and career resources | Guided mobile subject editor implemented; advanced Exam Night/Career Bridge blocks retain JSON editing |
| `/subjects/edit/:id` | Edit subject and resources | Guided mobile subject editor implemented; advanced Exam Night/Career Bridge blocks retain JSON editing |

## Feature parity checklist

- [x] Authentication: email/password, secure token persistence, logout, validation, API failures, and expired-token recovery back to sign-in are implemented. Native Google OAuth uses a one-time PKCE code exchange; provider setup and device verification remain.
- [x] Academic profile/onboarding: onboarding plus profile changes for track, tenant/campus, branch, year/semester, and exam/year are implemented.
- [x] Student dashboard and subject catalog: API-backed lists, search, empty/error states and navigation are implemented. The phone app uses three primary top-bar destinations and a role-aware slide-out Workspace Drawer for secondary pages.
- [ ] Subject Vault: unit/resource navigation, Exam Night and Career Bridge are implemented; topic completion is intentionally kept in its dedicated Progress screen. Full-screen in-app PDF/lecture viewing is implemented; device and provider compatibility verification remains.
- [x] Exam Night: high-yield filter, historical recurrence context using entered years, rapid revision and structured outlines are implemented.
- [x] Career Bridge: interview/coding completion, difficulty/company filters, GATE material, broken-link reports and activity integration are implemented; resource data still depends on admin curation.
- [x] Study tools: overall/per-subject attendance, marks, SGPA/CGPA planning and server persistence with input validation are implemented.
- [x] Progress: subject readiness, a dedicated per-subject unit/topic checklist, career activity heatmap, cohort rankings/opt-in, and a native dependency-free career skill radar on Dashboard and Progress are implemented.
- [ ] Community: campus feed, note voting, wallet, contribution history, bounties, credits, Android/iOS PDF/JPEG/PNG note upload, and authenticated in-app note viewing are implemented; native device verification remains.
- [x] Campus/admin moderation: contribution review is available to authorized moderators in the Campus Desk; administrators can assign/revoke campus ambassador scopes and perform audited credit adjustments using existing backend endpoints.
- [x] Admin: overview, user directory/search/deletion, subject listing and guided create/edit/delete, contribution moderation, link-report resolution, and campus ambassador/credit administration are implemented. Advanced nested Exam Night/Career Bridge fields retain JSON editing.
- [ ] Theme: persisted System/Light/Dark appearance selection is available in Profile and shared app styles adapt to the selected palette; visual, accessibility, and device verification remain.
- [ ] App quality: native responsive layouts, loading/error/empty states, and explicit debug/release API configuration exist; production API URL, iOS build/device verification, broad accessibility review, and offline behavior remain.

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
| 8 | Cross-screen polish, permissions, accessibility and Android verification | Static accessibility/responsiveness review complete for core screens; device-level size, safe-area, keyboard, and screen-reader checks remain with the user |
| 9 | Native career skill radar on Dashboard and Progress | Complete; static checks pass, device rendering remains for user verification |
| 10 | Protected API session expiry handling | Complete; authenticated 401 responses clear the matching stale token and route the app to sign-in |
| 11 | App-style destination menu and mobile tab bar | Replaced by Batch 20's animated left-side Workspace Drawer; the former More tab/screen has been removed |
| 12 | Black top navigation with animated icons | Reworked in Batch 20 as a safe-area-aware two-row top bar with three labeled tabs, active states, and a morphing menu control |
| 13 | Dedicated subject progress destination | Implemented; each progress row opens unit/topic progress and the Subject Vault links to the dedicated completion checklist; device flow check remains |
| 14 | Admin user directory mobile search | Implemented; user searches are debounced and served by the existing admin API across name, email, campus, and branch; stale responses are ignored, and loading/error/empty states are explicit |
| 15 | Design tokens, reusable UI system, and Dashboard & Subject Catalog polish | Implemented; defined shared tokens (theme.ts), created reusable AppCard, AppHeader, SectionHeading, PrimaryButton, BadgePill, SearchInput, EmptyState, ErrorState, LoadingState components; polished Dashboard with stat cards, study tools shortcut, and subject cards; polished Subject Catalog with debounced search and clear action |
| 16 | Subject Vault, Study Tools, and Navigation transitions & active indicators polish | Implemented; added smooth slide transitions (slide_from_right) to RootStack and AuthStack; added active indicator dot to TabGlyph with enhanced contrast; polished SubjectVault with classical top bar, segmented academic/career mode switch, high-yield filter toggle, exam recurrence cards, and career bridge resources; polished StudyTools with attendance forecasting, sessional targets, and SGPA/CGPA planners |
| 17 | Vault focus and cross-screen UI consistency | Implemented; removed duplicate unit topic lists while retaining metadata for high-yield filtering, Exam Night, Career Bridge, and resources; added resource empty states; aligned secondary screen headings, cards, and actions to shared components; tuned shared card variants for dark mode; system Reduce Motion disables navigation and overlay transitions |
| 18 | Responsiveness and accessibility static review | Keyboard-aware scrolling added to Profile, Study Tools, Campus, and Admin flows; compact admin/campus/profile controls enlarged; navigation, drawer, viewer, heatmap, and shared controls have accessible names/focus states; ESLint, TypeScript, and diff checks pass. App was not launched; visual/device and assistive-technology verification remains pending. |

## Current platform constraints to resolve during implementation

- The API accepts JWT bearer tokens and also sets browser cookies. Mobile will persist only the bearer token in Android secure storage and must not depend on cookies.
- The Android emulator reaches the development computer at `http://10.0.2.2:3000`. Physical devices need the computer's LAN address; production builds need the deployed HTTPS API URL.
- Native Google sign-in uses Passport in the system browser and returns a single-use PKCE-protected code to the app. Configure the Google redirect URI and `GOOGLE_MOBILE_CALLBACK_URL`, then verify on devices.
- Study resources open in a full-screen native PDF view or embedded WebView; providers that disallow embedding offer a browser fallback. Authenticated campus notes send the bearer token only in the request header.
- Community uploads use native Android and iOS document pickers. Both restrict selection to PDF/JPEG/PNG and enforce the 8 MB limit before upload where the OS exposes file size.

## Batch log

| Date | Batch | Files / result |
| --- | --- | --- |
| 2026-10-09 | 18 | Added persisted system/light/dark appearance selection and adaptive styling, editable grade bands, guided subject create/edit form, admin ambassador scope/credit tools, and moderator contribution review queue. Targeted ESLint, TypeScript, and diff checks pass; app/device verification remains with the user. |
| 2026-10-09 | 19 | Replaced the mobile light blue accents with a shared forest-green/pale-green palette, kept dark mode with tuned green contrast, and redesigned sign-in/registration as an open cardless form. Onboarding now shares the same visual language and keyboard-aware scrolling; text fields support next/done focus flow. Targeted ESLint and TypeScript pass; app was not launched. |
| 2026-10-10 | 20 | Replaced the More screen/tab with a notch-aware, two-row top navigation bar and animated hamburger-to-close control; added a role-aware animated side drawer containing all secondary destinations; moved appearance/account preferences to Settings; replaced the old navigation icons with a consistent custom glyph set. Targeted ESLint, TypeScript, and diff checks pass; app was not launched. |
| 2026-10-10 | 21 | Simplified Subject Vault and applied the shared UI system across secondary destinations. TypeScript, full app lint, and diff checks pass. No app or emulator was launched. |
| 2026-10-10 | 22 | Increased dark-mode drawer-toggle contrast, moved the animated menu control to the top-left, and added Progress as a direct primary tab. Replaced raw JSON editing for rapid-revision sections, 10-mark outlines, and past exam questions with structured fields while preserving the existing API schema. ESLint, TypeScript, and diff checks pass; app was not launched. |
| 2026-10-10 | 23 | Added the shared safe-area top bar and role-aware drawer to the admin workspace, with an Admin Console destination, Settings/theme access, and sign-out. Local logout now clears the app session immediately and sends server logout as best effort, preventing network delay from trapping a signed-in screen. Improved admin section labels and overview guidance. ESLint, TypeScript, and diff checks pass; app was not launched. |
| 2026-10-10 | 24 | Moved the shared menu-and-brand header to the top-left of both student and admin workspaces. Student primary destinations remain in the bottom bar, with Progress directly accessible; admin section navigation (Overview, Users, Subjects, Review, Reports, Campus) now lives in the side drawer instead of a cramped horizontal row. Settings and sign-out remain available in the drawer. Static checks pass; app was not launched. |
| 2026-10-10 | 25 | Replaced the mobile admin Career Bridge JSON text area with guided interview, coding-link, GATE-weightage, and PYQ fields with validation while retaining the website API shape. Admin subject write validation/cast failures now return a client error instead of being misreported as server failures, and unexpected failures no longer expose raw database error details. Reused the exact supplied logo asset across mobile sign-in, onboarding, top navigation, and drawer. Mobile lint and TypeScript, web production build, and syntax checks for all 50 server source files pass. The web linter still reports existing React effect/Fast Refresh warnings; the Jest runner is blocked by sandbox EPERM resolving its Windows temp/cache path. No app was launched. |
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

| 2026-10-09 | 17 | Added Android/iOS development API env examples and iOS simulator config, fixed env-file ignore exceptions, validated release API URLs for Android, and documented provider/release setup. Added full-screen native PDF and embedded web/video study material viewer; authenticated campus PDFs use bearer headers. Added native iOS PDF/JPEG/PNG picker and PKCE support, secure mobile Google OAuth callback/code exchange, and OAuth state validation. Android `clean :app:assembleDebug`, ESLint, TypeScript, server syntax, and diff checks pass. iOS Xcode build and runtime checks require macOS/iOS devices. |

## Verification notes

- App lint is scoped to `App.tsx` and `src/`; `eslint .` traversed the native project tree and did not finish promptly.
- Runtime app/emulator checks are intentionally being left to the user; this build pass uses static checks only, per the user's instruction.
- `npm install` reported 54 dependency audit findings (5 moderate, 49 high); review the dependency tree before release and resolve findings without blindly applying breaking upgrades.
- Gradle emits upstream Android Gradle Plugin and React Native dependency deprecation warnings, but the clean Android debug build and subsequent incremental build both completed successfully.
- The app has not yet reached website feature parity. Remaining workflows and platform gaps are listed above; implemented features still need user verification on-device before they are considered runtime-verified.
- An earlier attempt to install the in-app viewer packages failed due to temporary npm registry DNS resolution. They were subsequently installed successfully on 2026-10-09; Android native linking and compilation passed.
- This pass did not launch the app or emulator, in line with the user's instruction. iOS compilation could not be run because Xcode and CocoaPods are unavailable in this Windows environment; run `pod install` and build on macOS before relying on iOS runtime behavior.
- Batch 14 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.
- Batch 15 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.
- Batch 16 verification: `npm run lint`, `npx tsc --noEmit`, and `git diff --check` all pass. No app or emulator was launched.
- Batch 18 verification: `npx tsc --noEmit --pretty false`, targeted ESLint on the changed modules, and `git diff --check` pass. The full scoped ESLint command did not complete promptly. No app, Metro server, native build, or emulator was started. Theme and role-gated flows remain unverified on device.
- Batch 19 verification: `npx tsc --noEmit --pretty false`, targeted ESLint across the changed UI modules, and `git diff --check` pass. No app, Metro server, native build, or emulator was started; visual spacing and keyboard behavior still need your device check.
- Batch 20 verification: `npx tsc --noEmit --pretty false`, targeted ESLint across navigation/settings modules, and `git diff --check` pass. No app, Metro server, native build, or emulator was started; notch spacing, drawer gestures, and tab transitions need your device check.
- Batch 21 verification: `npm run lint`, `npx tsc --noEmit --pretty false`, and `git diff --check` pass. No app, Metro server, native build, or emulator was started; screen spacing and Reduce Motion behavior need your device check.
- Batch 17 verification: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and `node --check` for the mobile OAuth backend files pass. `gradlew clean :app:assembleDebug --no-daemon` and the incremental debug build pass; the app/emulator was not launched. Production build remains deliberately blocked until the real HTTPS API URL is supplied in the ignored `app/.env.production` file. iOS needs `pod install` and an Xcode build on macOS.
