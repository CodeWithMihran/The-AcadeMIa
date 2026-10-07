# The AcadeMIa

The AcadeMIa is a multi-tenant academic platform for university students and competitive-exam learners. It brings syllabus-based study material, exam preparation, progress tracking, and campus contributions together in one responsive web app.

## What’s inside

### Student workspace

- **Personal dashboard and subject vault:** Discover subjects for your university, campus, branch, year, and semester. Open notes, PDFs, lectures, books, and PYQs in embedded viewers.
- **Exam Night toolkit:** Review topic-level PYQ recurrence, high-yield topics, rapid-revision sheets, and structured long-answer outlines when available.
- **Career Bridge:** Find subject-mapped interview questions, coding practice links, and GATE weightage/PYQs. Track practice and report broken links.
- **Daily Study Tools:** Forecast attendance (by subject or overall), plan SGPA/credits, and track internal and external marks.
- **Progress and rankings:** Track syllabus and career-practice progress, view activity heatmaps and skill summaries, and compare progress within eligible campus cohorts.
- **Campus contributions:** Submit notes for review, discover and rate shared material, and participate in bounties and contributor-credit workflows where enabled.
- **Profile and preferences:** Manage your academic track and campus details, and use the responsive interface in light or dark theme.

### Admin workspace

- Manage users and subject catalogs.
- Add and edit syllabus units, study resources, Exam Night content, and Career Bridge materials.
- Review student contributions, moderate campus content, and handle reported links.

Feature availability and content depend on the configured university, campus, and material entered by administrators or contributors.

## Technology

- **Frontend:** React, Vite, and Tailwind CSS (`client/`)
- **Backend:** Node.js and Express (`server/`)
- **Database:** MongoDB with Mongoose
- **Authentication:** Session/JWT-based authentication, with optional Google OAuth

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and a reachable MongoDB instance.

1. Install dependencies from the project root and for the frontend:

   ```bash
   npm install
   npm --prefix client install
   ```

2. Create `server/.env`:

   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/academia
   JWT_KEY=replace-with-a-long-random-secret
   EXPRESS_SESSION_SECRET=replace-with-another-long-random-secret
   CLIENT_URL=http://localhost:5173
   ```

   Google sign-in is optional. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` if you enable it; the callback URL must also be registered with Google. If the frontend calls an API hosted separately, set `VITE_API_BASE_URL` in the client environment to that API’s base URL.

3. Start the backend and frontend in separate terminals:

   ```bash
   npm run dev
   ```

   ```bash
   npm --prefix client run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The API defaults to port `3000`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the backend without the development watcher |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run the configured frontend lint checks |
| `npm --prefix client run preview` | Preview a production frontend build |

## Database utilities

- `node server/utils/seedTenants.js` initializes the supported tenant records.
- `node server/utils/seedAndMigrate.js` seeds and migrates data; review the script and back up an existing database before running it.
- `node server/utils/createAdmin.js` creates an admin using `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the environment. Use a strong password and do not commit credentials or `.env` files.

## Project layout

```text
client/   React application, pages, components, and frontend utilities
server/   Express app, routes, controllers, models, middleware, and utilities
views/    Server-rendered views used by the backend
```
