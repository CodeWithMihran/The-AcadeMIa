# The AcadeMIa stabilization completion report

**Run date:** 2026-10-06  
**Scope:** sourced subject seed data, authenticated student/admin journeys, and phone/tablet checks in light/dark themes.

## Result

The local app, API, and MongoDB were available for this follow-up. The two new UTU subjects were created from the official UTU B.Tech syllabus, core student and admin screens were manually exercised, and the main responsive layouts were checked at phone and tablet widths. Confirmed usability defects found during those checks were repaired.

This is a verified stabilization pass, not a claim that every possible journey or external provider works flawlessly. The remaining verification and data-quality limits are listed below.

## Sourced subject data seeded

Both records are under the VMSB UTU tenant, CSE, Semester 1, with four official course credits each. Unit names and topic outlines follow the [official VMSB UTU B.Tech syllabus](https://uktech.ac.in/site/writereaddata/siteContent/202308171848316920BTECH_SYLLABUS_170823.pdf), which applies to B.Tech admissions from 2022–23 onward.

| Subject | Code | Coverage | Supporting resources |
| --- | --- | --- | --- |
| Engineering Physics | AHT-001 | 5 units, 29 topics | Official syllabus; UTU I Semester Examination 2022–23 Physics paper, linked as a course-level paper rather than falsely mapped to individual topics. |
| Introduction to Engineering Mathematics | AHT-003 | 5 units, 24 topics | Official syllabus; [UTU Mathematics model question paper](https://uktech.ac.in/newsletter/MQP/B-Tech/Mathematics.pdf), clearly labeled as a model paper, not a past-year paper. |

The [official Physics paper](https://uktech.ac.in/newsletter/MQP/B-Tech/Physics.pdf) is labeled with the 2022–23 examination session. Because the current subject schema expects a numeric year and topic-mapped PYQs, no unsupported structured year/frequency score was created from this single full-course PDF. Students see the absence of verified topic recurrence data rather than a fabricated prediction. Rapid-revision key points are syllabus checklists; no formulas, exam guarantees, or commercial “Quantum” text were invented.

Existing AKTU Basic Electrical Engineering and UTU Analytical Mathematics records were left untouched. Their current syllabus metadata contains placeholder/inconsistent content, and the available source verification did not establish a safe correction for those existing records. They should be reviewed and replaced through admin tools before being presented as curated content.

## Manual journey results

| Journey | Result | Notes |
| --- | --- | --- |
| Student registration and onboarding | Pass, with repair | Created a temporary student and completed custom campus selection for UTU/CSE/Semester 1. The “Other / Main Campus” input bug was fixed. |
| Dashboard and subject discovery | Pass | Dashboard loaded; UTU catalog showed the tenant/branch/semester subjects. |
| Subject vault and embedded materials | Partial | Syllabus content and empty-data states loaded. External UTU PDF links reached the in-app viewer, but the UTU host refused iframe embedding; the viewer exposed provider-permission guidance. |
| Subject progress | Pass | Marked a topic complete; progress changed to 1/29 and persisted successfully. |
| Study Tools | Pass | Attendance calculation for 3/4, save, credit planner, and internal marks calculation/save were exercised. |
| Profile and rankings | Pass | Profile track/tenant controls and empty activity state loaded. Rankings displayed the opt-in/cohort threshold state correctly. No profile mutation was saved. |
| Contributor flow | Partial | Contribution history and empty states rendered. The test file chooser did not attach a file, so a contribution was not submitted. |
| Admin sign-in and overview | Pass | Admin authenticated; overview loaded. |
| Admin subjects/users/reports | Pass | Seeded records and user directory were visible; empty link-report state was clear. |
| Admin moderation | Partial | Existing queue and a review preview loaded. Existing user uploads were not approved/rejected; a real moderation decision was not exercised. |

Authenticated admin requests for overview, subjects, users, moderation queue, and link reports returned HTTP 200. The app browser reported no console warnings or errors at the end of the run.

## Responsive and theme checks

Checked at **390×844 (phone)** and **768×1024 (tablet)** in both light and dark themes.

- Student dashboard, subject catalog, vault, subject progress, Study Tools, profile, and rankings.
- Admin overview, user directory, campus moderation, and Add Subject.
- No page-level horizontal overflow remained on these screens. The profile activity heatmap uses its own bounded horizontal scroll area.
- Dark theme used the existing true-black surface treatment; light theme retained the existing palette.

Repairs made from these checks:

1. Kept custom campus text separate from the selected campus option so the input no longer disappears while typing.
2. Constrained vault resource cards and contribution form controls so long titles and selectors fit phone widths.
3. Bounded the profile heatmap so its internal grid no longer expands the document width.
4. Moved full desktop navigation to the larger breakpoint so tablet actions remain reachable.

## Final code checks

- `npm --prefix client run build`: passed. Main client chunk is about 376 kB minified (119 kB gzip); route/form modules remain split.
- `npm run lint` in `client`: exited successfully, with non-fatal existing React warnings (effect-driven state updates, context exports, and date purity). There were no lint errors.
- `node --check server/app.js`: syntax check of server entrypoint.
- `git diff --check`: whitespace check.
- No dedicated automated test script is configured, so no automated suite result is claimed.

## Remaining work / limits

1. Verify a real student contribution upload and end-to-end admin approval/rejection with an attached file. The browser file chooser failed to attach the temporary fixture during this run.
2. Use a permitted PDF host or configure sharing so official source PDFs can render in the embedded viewer; until then, the PDF viewer path is only partially verified.
3. Audit and replace placeholder syllabus data in the two pre-existing subject records with institution-verified content. Existing content was preserved rather than silently overwritten.
4. Populate topic-mapped, exam-year-reviewed PYQs before enabling meaningful recurrence/heatmap claims for these seeds.
5. Run a broader manual keyboard/screen-reader and color-contrast audit. These checks cover responsive behavior and keyboard-operable controls encountered in the journeys, but are not formal WCAG certification.
6. The temporary student account used for onboarding and progress verification remains in the admin user directory. Permanent deletion would irreversibly remove that account and its test progress, so it is retained until you explicitly confirm its removal.

## Related baseline

- [Core journey baseline](CORE_JOURNEY_BASELINE.md)
- [UX stability audit](UX_STABILITY_AUDIT.md)
