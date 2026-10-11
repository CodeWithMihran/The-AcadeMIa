# The AcadeMIa

The AcadeMIa is an academic workspace for university students and JEE/NEET learners. It brings tenant-aware subject material, exam revision, daily study utilities, progress tracking, career preparation, and campus contributions into one web platform and React Native app. Both clients use the same Express API and MongoDB data, so account and learning updates are shared.

## Contents

- [Platform at a glance](#platform-at-a-glance)
- [Student features](#student-features)
- [Admin features](#admin-features)
- [How the platform is organized](#how-the-platform-is-organized)
- [Technology](#technology)
- [Run the website locally](#run-the-website-locally)
- [Run the mobile app](#run-the-mobile-app)
- [Environment configuration](#environment-configuration)
- [Database setup and maintenance](#database-setup-and-maintenance)
- [API overview](#api-overview)
- [Security and privacy](#security-and-privacy)
- [Content and feature boundaries](#content-and-feature-boundaries)
- [Project layout](#project-layout)

## Platform at a glance

| Client | Location | Main use |
| --- | --- | --- |
| Website | `client/` | Responsive browser experience for students and administrators |
| Mobile app | `app/` | React Native experience with native navigation, secure token storage, and in-app study-material viewers |
| API and database layer | `server/` | Express REST API, authentication, authorization, and MongoDB persistence |

The website and app are separate clients of the same API. They share accounts, subjects, progress, study-tool records, and campus contributions. The app does not use a separate database.

## Student features

### Account, onboarding, and profile

- Register and sign in with email and password; request a password reset.
- Choose a university-study or competitive-exam track during onboarding.
- University profiles include tenant/university, affiliated college, branch, year, and semester. Competitive profiles select JEE or NEET and their target exam details.
- Update profile and academic setup later. Subject availability is filtered using the learner’s track and, for university content, tenant and normalized branch/semester details.
- The app stores its bearer token in Android Keystore or iOS Keychain through `react-native-keychain`. Website API requests use the browser’s configured authentication flow.
- Select light, dark, or system appearance. The web and mobile interfaces use responsive layouts and shared blue brand accents.

### Dashboard and subject workspace

- The dashboard summarizes the student’s academic context, subject access, learning activity, and shortcuts to frequently used tools.
- The subject catalog supports search and filters the available content to the student’s learning track and academic cohort.
- Each subject opens a Subject Vault for its units and study materials: notes, book PDFs, PYQs, and lecture links, plus available Exam Night and Career Bridge resources. Topic-completion checklists and readiness details live in Progress so they are not duplicated in the vault.
- Supported PDFs and lectures can be viewed inside the website or app. Providers may prevent embedding; in those cases the interface offers an external fallback where available.
- Progress checklists are kept in Progress views rather than duplicated as a topic checklist in the Subject Vault.

### Exam Night revision

Where administrators have entered the material, a unit can include:

- Past exam questions tagged with topic, year, marks, and source.
- Exam-years-covered data used to calculate a recurrence/frequency indicator and identify high-yield topics.
- A high-yield filter for focused revision.
- Rapid-revision notes for formulas, derivations, diagrams, and key points.
- An authored long-answer outline with definition, diagram, working principle, advantages, and disadvantages.

Frequency displays describe the years recorded in the content; they are not a promise that a topic will appear in a future exam.

### Career Bridge

Career material is attached to subjects so it appears alongside academic study:

- Interview questions with topic, difficulty, company tags, and Markdown answer content.
- Coding-practice links with platform, topic, and difficulty details.
- GATE subject weightage information and year-tagged PYQ links.
- Filters for question difficulty, company, and GATE exam year.
- Premium-resource access is enforced by the API; non-premium users do not receive protected answers or URLs in the response.
- Students can mark interview and coding resources as completed. Those updates feed career progress, the activity heatmap, and subject skill summaries.
- Students can report broken career links for administrator review.

### Daily Study Tools

- **Attendance forecaster:** Track attendance for individual subjects or enter an overall class-held/class-attended total. Set a required attendance threshold and see whether the next class can be missed or how many consecutive classes should be attended to reach the target.
- **Internal and sessional marks tracker:** Record midterms, class tests, lab viva, and other assessments, then estimate the external marks needed to meet a target percentage.
- **SGPA/CGPA and credit planner:** Use subject credits and projected marks/grade points to explore semester and cumulative outcomes. Students can configure a grade scale for their planning.

These calculators are planning aids. They do not automatically encode or certify the current official grading, pass, or back-paper rules of every university.

### Progress, activity, and rankings

- Mark syllabus topics complete and review subject-level and overall readiness.
- Review completed Career Bridge resources and subject skill summaries.
- See a calendar-style practice activity heatmap and daily streak history based on career-practice completion.
- View a skill radar chart based on completed resources across subjects.
- Opt into cohort rankings that compare eligible students within the applicable campus/tenant, branch, and semester grouping. Rankings are cohort-specific rather than a worldwide leaderboard.

### Campus contributions

University-track students can participate in the peer-learning workflow:

- Upload one PDF, JPEG, or PNG note (up to 8 MB) for a subject/unit and submit it for moderation.
- Track the contribution’s review status and any moderator feedback.
- Browse approved campus notes and upvote or remove an upvote.
- Create a bounty for a missing resource using AcadeMIa Credits; bounty credits are held, paid when a contribution fulfills the request, or returned if a bounty is cancelled under the workflow rules.
- Earn credits for eligible approved contributions and review the wallet ledger and contributor badges.
- Reported links and submitted notes enter administrator review workflows.

## Admin features

Administrators access role-protected screens in the website and mobile app. Available controls include:

- **Overview:** Review platform totals, pending community-note reviews, and open broken-link reports.
- **Users:** Search/manage student accounts and grant or adjust campus contributor/ambassador access where enabled.
- **Subjects:** Create, edit, and remove subject records; associate university subjects with a tenant, branch, semester, and credits; or configure competitive-exam categories.
- **Syllabus and resources:** Manage units, topics, notes, books, PYQs, and lecture links.
- **Exam Night editor:** Add exam-year coverage, sourced PYQs, high-yield context, rapid-revision content, and authored answer outlines.
- **Career Bridge editor:** Add interview questions and answers, company tags, coding links, premium flags, and GATE weightage/PYQ links.
- **Community moderation:** Review notes, approve/reject with feedback, handle reported links, and manage campus contribution workflows.
- **Campus controls:** Manage ambassador designations and credit adjustments where available.

Administrative routes and APIs require an authenticated administrator role. Admin editing tools are intended for maintaining curated content; creating subject records does not by itself populate verified learning resources.

## How the platform is organized

The backend stores the core records in MongoDB through Mongoose models. Important relationships include:

- **Tenants:** Universities/exam cohorts and their affiliated colleges/domains.
- **Subjects:** Track, tenant, branch, semester, credits, units, learning resources, Exam Night content, and Career Bridge content.
- **Progress:** Per-user, per-subject topic completion.
- **Career progress and activity:** Per-user completion of interview/coding resources and dated activity records.
- **Study tools:** Attendance, assessment results, credit projections, and student-selected grade bands.
- **Community:** Notes, votes, bounties, wallets/credit ledger, and broken-link reports.
- **Users:** Identity, role, track, profile/cohort, onboarding state, and campus permissions.

The subject document embeds unit resources and Career Bridge data so a subject vault can load its related learning content in one subject response. Progress, study-tool, community, and activity records are stored separately and fetched through their feature APIs.

## Technology

- **Website:** React 19, Vite, React Router, Tailwind CSS, TanStack Query, Axios, React Hook Form, and Zod.
- **Mobile:** React Native CLI, TypeScript, React Navigation, Axios, React Native PDF/WebView, safe-area support, and `react-native-keychain`.
- **Backend:** Node.js, Express 5, Mongoose, MongoDB, JWT, Express sessions, Passport, and optional Google OAuth.
- **Community file storage:** Local server disk by default. S3-compatible storage is optional and requires the AWS S3 SDK package plus the storage environment variables below; failed remote writes fall back to local disk.

## Run the website locally

### Requirements

- Node.js **22.12 or newer** is recommended for the combined web/mobile toolchain.
- A reachable MongoDB database (local or hosted).
- Android Studio and the React Native Android toolchain only if building the app.

### Install and configure

From the repository root:

```bash
npm install
npm --prefix client install
```

Create `server/.env` with the required server settings described under [Environment configuration](#environment-configuration). The Vite development server proxies `/api` requests to `http://127.0.0.1:3000`.

### Start the API and website

Run these in separate terminals from the repository root:

```bash
npm run dev
```

```bash
npm --prefix client run dev
```

Open the URL printed by Vite (the configuration normally uses `http://127.0.0.1:5173`). The API listens on port `3000` by default. The server only starts listening after it connects to MongoDB.

### Website commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the backend without Nodemon |
| `npm run dev` | Start the backend with Nodemon |
| `npm run build` | Build the website for production |
| `npm run lint` | Run the configured frontend Oxlint checks |
| `npm --prefix client run preview` | Preview the built website locally |

The configured root lint command covers `client/src`; it is not a full server or mobile static-analysis suite.

## Run the mobile app

Install the mobile dependencies once:

```bash
cd app
npm install
```

Create the local API environment file as described below. For an Android emulator, `10.0.2.2` routes to the development computer’s loopback interface.

Start Metro in one terminal and install/run Android from another, both from `app/`:

```bash
npm start
```

```bash
npm run android
```

For a physical device, use a development computer LAN IP reachable from the device and ensure the firewall permits the API port. For iOS, use a Mac with Xcode and CocoaPods configured; install pods after native dependency changes, then run `npm run ios`. Do not use a placeholder production host when creating a release build.

Mobile scripts:

| Command (from `app/`) | Purpose |
| --- | --- |
| `npm start` | Start Metro |
| `npm run android` | Build/install the Android app |
| `npm run ios` | Build/install the iOS app |
| `npm run lint` | Lint the React Native source |
| `npm test` | Run the configured Jest suite |

## Environment configuration

### Backend: `server/.env`

The API requires MongoDB, JWT, and session secrets before it starts:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/academia
JWT_KEY=replace-with-a-long-random-secret
EXPRESS_SESSION_SECRET=replace-with-another-long-random-secret
CLIENT_URL=http://127.0.0.1:5173
PORT=3000
```

`CLIENT_URL` is used for CORS and browser OAuth redirects. In production, set it to the deployed website origin and serve the API over HTTPS. `PORT` defaults to `3000`.

Optional settings:

```dotenv
# Google OAuth: configure all three for website Google sign-in.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.example.org/auth/google/callback

# Mobile Google browser callback/deep-link exchange (provider setup is also required).
GOOGLE_MOBILE_CALLBACK_URL=theacademia://auth/callback

# Optional S3-compatible note storage; omit to use server-local disk.
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=
```

Google sign-in is unavailable until valid provider credentials, authorized callback URLs, and the mobile redirect scheme are configured. Never commit populated environment files or production credentials.

### Mobile app: `app/.env` and `app/.env.production`

Local Android emulator configuration:

```dotenv
API_BASE_URL=http://10.0.2.2:3000/api
```

Production configuration must contain the real HTTPS API URL ending in `/api`:

```dotenv
API_BASE_URL=https://api.example.org/api
```

The example production URL above is a placeholder; replace it before building a release. Android Gradle selects `.env` for debug and `.env.production` for release, and validates the release URL. The `.env` files are ignored by Git. For a physical Android device or iOS simulator/device, configure a URL reachable from that device; do not assume the Android emulator address works on other targets.

The website uses same-origin `/api` in development through Vite’s proxy. For a separately hosted production API, create the appropriate client environment file and set `VITE_API_BASE_URL` to the API base URL ending in `/api`.

## Database setup and maintenance

Tenant setup:

```bash
node server/utils/seedTenants.js
```

This seeds the tenant and affiliated-college records bundled in the script. Review that list before using it for a new deployment.

Create or update an administrator:

1. Set `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`.
2. Run:

   ```bash
   node server/utils/createAdmin.js
   ```

   If the email already exists, this utility changes that account’s password and role to administrator. Use it deliberately and remove the temporary admin credentials from the environment after setup.

`server/utils/seedAndMigrate.js` performs database migrations and tenant/content seeding. It changes stored data; inspect the script, take a backup, and run it only when the migration is intended. Do not point seed or migration scripts at production without a reviewed backup and deployment plan.

## API overview

All REST endpoints are mounted below `/api`:

| Route group | Purpose |
| --- | --- |
| `/api/auth` | Registration, login, current user, profile update, logout, password reset, and mobile Google code exchange |
| `/api/tenants` | Tenant discovery/domain resolution and authenticated onboarding |
| `/api/subjects` | Student-filtered subject catalog, branches, subject vault data, and broken-link reporting |
| `/api/progress` | Topic progress, overall/subject readiness, career completion, activity heatmap, and cohort leaderboard |
| `/api/study-tools` | Saved attendance, sessional assessments, and grade/credit planner settings |
| `/api/community` | Notes, secure file delivery, votes, bounties, wallets, moderation, and campus-admin actions |
| `/api/admin` | Admin overview, subjects, users, and reported-link review |

Protected routes accept a bearer JWT. Browser requests also use credentials for the browser session/cookie flow. Admin endpoints additionally enforce the administrator role. Subject vault reads and high-value actions have server-side rate limits.

## Security and privacy

- Passwords are stored as hashes; API access is authenticated with JWTs.
- The mobile token is stored using the platform secure credential store, not ordinary AsyncStorage.
- API controllers enforce user/admin permissions; UI-only hiding is not the security boundary.
- Premium Career Bridge payloads are filtered by the backend for users without an eligible subscription.
- Subject-vault, authentication, upload, and community actions have rate-limiting controls.
- Community file routes are authenticated and return stored files through the API rather than exposing private storage paths.
- Ranking participation is cohort-scoped and opt-in; public global ranking is not provided.
- Use HTTPS, strong unique secrets, restricted database credentials, backups, and appropriate production file storage for deployment.

## Content and feature boundaries

The application provides tools for curated and student-contributed content, but code support does not imply that every university, subject, unit, or resource has been populated. Administrators should source and review syllabi, PYQs, frequency coverage, summaries, credits, and external links before publishing them. The recurrence score is only as complete as the years entered for a unit.

Current scope intentionally excludes an AI academic copilot, automatic Quantum/Master Notes summarization, JEE/NEET flashcard and daily-practice engines, automated official university grade/back-paper rule tables, and credit redemption for external rewards. Revision outlines are administrator-authored. Credits currently support the implemented contribution/bounty ledger workflow; they are not redeemable for merchandise or premium subscriptions.

## Project layout

```text
app/                       React Native CLI mobile app
  android/                 Android native project
  ios/                     iOS native project
  src/components/          Shared mobile UI components
  src/context/              Authentication and appearance state
  src/navigation/           Root, tab, and admin navigation
  src/screens/              Student, admin, and authentication screens
  src/services/             API, session, and secure token storage
  src/theme.ts              Mobile design tokens and adaptive theme
client/                    React + Vite website
  src/components/           Website navigation, viewers, and feature UI
  src/context/              Web authentication and appearance context
  src/hooks/                Query and shared data hooks
  src/pages/                Website route pages
  src/services/             Browser API client
  src/utils/                Embedding, branch, form, and feature helpers
server/                     Express + MongoDB backend
  config/                   Server configuration
  controllers/api/          API request handlers
  middlewares/              Authentication, role, upload, and rate-limit checks
  models/                   Mongoose models
  routes/api/               REST route definitions
  utils/                    Seeding, migration, storage, and access helpers
```
