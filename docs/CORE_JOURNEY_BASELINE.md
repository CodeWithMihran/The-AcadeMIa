# The AcadeMIa: Scope and Core Journey Baseline

## Scope lock

This stabilization pass does not add product features or change the existing feature set. It is limited to diagnosing and repairing defects in the current user journeys while preserving API payloads and stored data shapes.

Included journeys:

1. Registration, login, session restoration, logout, and onboarding.
2. Dashboard loading, curriculum summary, progress, and navigation.
3. Subject catalog, subject vault, embedded study material, and per-subject progress.
4. Attendance, sessional marks, and credit planning in Study Tools.
5. Exam Night resources: PYQs, recurrence indicators, rapid revision, and summaries.
6. Career Bridge resources and completion tracking.
7. Contributor notes, wallet, bounties, and campus moderation.
8. Cohort rankings and activity history.
9. Profile and university/track changes.
10. Admin subject/user management and link-report moderation.

Out of scope: new features, UI redesign, new monetization, new university rules/content, and broad framework or data-layer migrations.

## Repository baseline (before this stabilization pass)

- Branch: `main`.
- The working tree was already modified in the frontend when this pass began, including theme-token/dark-mode work from the preceding task. Those changes are treated as user work and preserved; this document does not claim a clean-checkout diff.
- `npm run build`: passed. Vite emitted an existing warning that the minified JavaScript chunk is about 755 kB, above its 500 kB advisory threshold.
- `npm run lint`: exited successfully. Oxlint reported existing React warnings, including effect-driven state updates, context exports, and impure `Date` calls in the footer; it did not report lint errors.
- No automated test script is configured in the root or server package scripts.
- Runtime startup was attempted with the configured server environment. The API loaded `server/.env` but did not reach its `MongoDB Connected` or listening messages during the observation window, so database-backed end-to-end journeys were not available for baseline browser/API verification. Secret values are intentionally not recorded here.
- A local-browser visual check was not possible in the restricted environment because the browser could not connect to the local Vite socket. This is an environment limitation, not evidence that the site itself fails in a normal local browser.

## Journey map and baseline evidence

| Journey | Frontend entry | API/backend path | Baseline evidence |
| --- | --- | --- | --- |
| Register/login/session | `Home`, `AuthContext`, OAuth callback | `/api/auth/*`, `authApiController`, `user` model | Routes and request shapes traced; live DB verification unavailable. |
| Dashboard | `Dashboard` | `/api/subjects`, `/api/progress/overview` | Static review found progress-query failures were ignored by the dashboard error state. |
| Catalog and vault | `SubjectCatalog`, `SubjectVault`, `UnitMaterialCard`, `StudyMaterialViewer` | `/api/subjects`, `subjectApiController`, `Subject` model | Route and student-scope checks traced; stale responses could overwrite a newer subject route. |
| Subject progress | `SubjectDetail` | `/api/progress/:subjectId`, `/api/progress/toggle` | Static review found a failed progress request was not shown if the subject request succeeded; a follow-up read was also required after a successful toggle. |
| Study tools | `StudyTools` | `/api/study-tools/*`, `studyToolsApiController`, `StudyTools` model | Validation and request shapes traced; live persistence verification unavailable. |
| Exam Night | `ExamNightKit`, subject editors | Subject payload and exam-night validation | Data fields and validation path traced; source/content accuracy requires curated data and is out of this pass. |
| Career Bridge | `SubjectCareerResources`, `CareerBridgeEditor` | `/api/progress/career*`, premium filtering and activity models | Authorization/resource checks traced; live progress verification unavailable. |
| Contributor flow | `CommunityNotes` | `/api/community/*`, upload/action middleware, wallet/note/bounty models | Upload and moderation paths traced; live storage/credit verification unavailable. |
| Rankings/activity | `Rankings`, `Profile`, `ActivityHeatmap` | `/api/progress/leaderboard`, `/activity`, aggregation/activity models | Cohort privacy and aggregation paths traced; live aggregation verification unavailable. |
| Profile/tenant changes | `Profile`, `OnboardingModal` | `/api/auth/profile`, `/api/tenants/*`, user/tenant models | Validation and tenant selection paths traced; live profile persistence unavailable. |
| Admin | `AdminDashboard`, `AdminUsers`, `CampusDashboard`, subject editors | `/api/admin/*`, moderation endpoints, role middleware | Role gates and endpoints traced; live authorization and moderation verification unavailable. |

## Confirmed defects repaired in this pass

1. **Dashboard progress failures were hidden.** The dashboard only considered the subjects request when choosing its error state, so a failed progress request could be rendered as zero progress. The error state now includes either request and offers a retry that invalidates both queries.
2. **Subject progress failures were silent on a loaded subject.** Subject details now show a retryable warning when the subject loads but its progress request fails. Topic completion now uses the successful mutation response to update local counts and the dashboard query, rather than depending on an additional GET to make the mutation appear successful.
3. **A failed admin subject load still rendered an empty edit form.** The edit route now blocks editing when the requested subject is missing or failed to load, explains the state, and offers retry/back actions.
4. **Out-of-order subject fetches could show stale content after route changes.** Subject vault and subject-progress requests now ignore responses that belong to an older route/load attempt.
5. **Session restoration conflated server failures with invalid credentials.** The auth middleware now returns infrastructure/database errors through the normal server-error handler instead of clearing a valid token. The client keeps an existing session on transient failures, shows a retry state when it cannot verify a session, guards token storage access, and applies a bounded request timeout.

## Remaining verification limits and separate cleanup

- Database-backed checks remain pending until MongoDB is reachable from the runtime environment. Do not treat static route/controller review as an end-to-end pass.
- Existing lint warnings and the large bundle advisory are recorded separately from the repaired journey defects; they are not feature-scope changes.
- Seeded content quality and visual/mobile polish are subsequent phases in the agreed stabilization plan.

## Follow-up baseline: authenticated and responsive run (2026-10-06)

The prior section records the initial restricted-runtime baseline. During this follow-up, the local Vite app, API server, and MongoDB were available, so database-backed student and admin journeys were exercised in the in-app browser.

- **Registration/onboarding:** a temporary student account was created; selecting the custom “Other / Main Campus” campus exposed a disappearing-input bug. The onboarding form was repaired and the student completed onboarding for VMSB UTU, CSE, Year 1, Semester 1.
- **Student:** dashboard, UTU subject catalog, seeded subject vault, subject progress, Study Tools (attendance, credit planner, internal marks), profile/track controls, and cohort rankings loaded. Topic completion persisted and showed updated progress. Attendance at 3/4 computed the next attendance requirement correctly; Study Tools save returned success.
- **Admin:** sign-in, overview, subjects, user directory, link-report empty state, campus moderation queue, and Add Subject form loaded. Admin subject rows showed the two sourced seed records. The existing three REVIEWING uploads were inspected in preview only; they were not moderated.
- **API:** admin overview, subjects, users, moderation queue, and link-report requests returned HTTP 200 during the authenticated run.
- **Runtime evidence:** browser console warnings/errors were empty at the end of the run. The official UTU PDF links opened the embedded viewer, but the remote PDF host refused iframe embedding; the viewer presented its provider-permission guidance. This is a source-host limitation, not a successful PDF-render verification.
- **Responsive:** principal student pages and admin overview/users/campus/Add Subject screens were checked at phone (390×844) and tablet (768×1024), in light and dark themes. Document width stayed within the viewport after repairs to resource/form sizing, the profile heatmap overflow, and the tablet navigation breakpoint. The heatmap retains its own horizontal scroll area.
- **Static checks:** client lint and production build passed; server entrypoint syntax and `git diff --check` were checked in the final pass. Lint still reports non-fatal React warnings; see the completion report.

The temporary verification student remains in the user directory pending explicit confirmation for permanent deletion; the dashboard's observed total of three users includes this test account.

The earlier statement that database and responsive verification were pending is historical and superseded by this follow-up. Remaining gaps are detailed in `STABILIZATION_COMPLETION_REPORT.md`, including contribution upload submission, a real moderation decision, and the source-host PDF embed restriction.
