# The AcadeMIa

Academic resource portal built with a React/Vite client and an Express/MongoDB API.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB connection string

## Configure

Create `server/.env` with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/academia
JWT_KEY=replace-with-a-long-random-secret
EXPRESS_SESSION_SECRET=replace-with-another-long-random-secret
CLIENT_URL=http://localhost:5173
```

Google sign-in also needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_CALLBACK_URL` configured in Google Cloud. Set
`VITE_API_BASE_URL=http://localhost:3000/api` in `client/.env` only when the
API is hosted at a different address.

## Run locally

From the repository root, run `npm run dev` for the API and `npm --prefix client run dev`
for the web client in separate terminals. The API listens on port 3000 by default.

Use `npm start` for the API without file watching, `npm run build` for a
production client build, and `npm run lint` for client lint checks.

To add the default universities without changing user records, run
`node server/utils/seedTenants.js` from the root. The broader
`node server/utils/seedAndMigrate.js` command also migrates existing subjects,
users, and progress records. To create an administrator, set `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in `server/.env` and run `node server/utils/createAdmin.js`.
