# Loading, accessibility, mobile, and speed audit

Date: 2026-10-06

## Scope

This pass is limited to the existing product and journeys. No new product feature, API payload, database schema, or data-layer migration was introduced. Existing theme-token work and the earlier core-journey repairs were preserved.

## Findings addressed

- **Exam Night:** units with no recurrence or revision data were previously omitted entirely. The vault now explains that data has not been added and what will appear there.
- **Rankings and practice activity:** both screens now offer a retry after API errors. Rankings distinguish a failed first load from a genuine unavailable/undersized cohort and preserve already loaded results on refresh. An untouched heatmap explains how activity is recorded.
- **Contributor history:** note, wallet, and history calls are treated independently. A failed history request no longer looks like an empty history; genuine empty history has a next action. Failed note loading no longer presents a false empty catalog. Partial failures have a retry action, and bounty posting is disabled when the balance cannot be confirmed.
- **Campus moderation:** queue and wallet results are handled independently, so one failing endpoint does not erase the other. The screen keeps loaded data visible during refresh, distinguishes an unavailable queue from an empty queue, and provides retry feedback. A failed wallet lookup no longer incorrectly denies moderator access. Ambassador-management options report partial load errors and can be retried.
- **Study tools:** failed subject/tool loading no longer permits a save with default data that could overwrite saved entries. Save actions remain disabled until saved tool data and the current subject catalog load successfully, with an explicit retry.
- **Topic progress accessibility:** completion is now an actual labeled, keyboard-operable button with pressed state, rather than relying on clicking a non-focusable card.
- **Admin mobile/accessibility:** subject and user tables can scroll horizontally on narrow screens, missing-result rows explain the empty state, icon-only deletion controls have accessible names, and the subject dialog scrolls within short viewports, locks background scrolling, traps keyboard focus, closes on Escape, and returns focus on close. Form labels are associated with their controls.
- **Route loading/perceived speed:** page modules are lazy-loaded with a visible, announced suspense state. This addresses the measured oversized initial bundle without changing API caching or response data.

## Verification

- `npm run lint` (client): exited successfully. Oxlint still reports existing React warnings about state updates in effects, context exports, and `Date` purity; these are non-fatal and span older, unrelated code too.
- `npm run build` (client): passed. Before route splitting, the main JavaScript bundle was about 764 kB minified. After splitting, the initial bundle is about 376 kB (about 119 kB gzip); subject-vault and form routes are separate chunks. Vite no longer emits the 500 kB single-chunk advisory.
- `git diff --check`: passed; Git only reported its configured LF-to-CRLF notices for modified files.
- The public home page was rendered in the local browser after the route split. Authenticated, API-backed behavior could not be manually exercised.

## Verification still blocked

- Server startup reached the configured MongoDB connection and failed with `MongoServerSelectionError` / `connect EACCES 127.0.0.1:27017`. Direct API access was also denied by the local socket policy. Therefore login, student/admin authorization, actual empty/error responses, writes, and post-write refresh behavior still require a run in an environment where MongoDB and the API are reachable.
- The available browser surface has no viewport override. Responsive breakpoints and dialog behavior were reviewed in source, but visual checks at actual phone/tablet dimensions are still needed. Keyboard semantics were improved for identified controls; this is not a certified full WCAG audit.
- The repository does not define a dedicated automated test script. Build/lint and static source checks do not replace the blocked end-to-end journeys.

## Conclusion

The confirmed frontend defects above are repaired, and the client builds cleanly. The agreed “flawless end-to-end” completion bar is not yet verifiable until MongoDB/API access and phone/tablet browser testing are available; those checks are recorded as pending rather than marked as passes.

## Follow-up run (2026-10-06)

The initially pending runtime and responsive checks were later completed against the local app with MongoDB available. See `CORE_JOURNEY_BASELINE.md` and `STABILIZATION_COMPLETION_REPORT.md` for the complete journey matrix and limitations.

Additional defects found and repaired during that run:

- Custom campus entry in onboarding disappeared when its value updated the selected campus state. The custom choice and custom text now have separate state, and switching tenants resets the dependent choice predictably.
- Long official resource titles and the contribution form's unit selector caused horizontal overflow in the subject vault at phone width. Their grid children and controls now shrink to the available width.
- The profile activity heatmap expanded the page beyond phone width. It now scrolls inside its own bounded region.
- The tablet navigation showed the desktop link row at 768px, pushing actions off-screen. The desktop navigation now starts at the larger breakpoint and the compact menu remains available on tablets.

Verification at 390×844 and 768×1024 found no page-level horizontal overflow on the tested student and admin screens in either theme. Browser console error/warning collection was empty. External UTU PDFs still depend on the provider permitting embedding.
