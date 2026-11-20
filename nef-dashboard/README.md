# NEF Dashboard (frontend)

Static HTML/CSS/JS dashboard for the NEF School Portal. It needs the
`nef-backend` API for real use. Version 2.2.0 - see `CHANGES.md`.

## Run locally

1. Start the backend (`npm run dev` in `nef-backend`, port 3000).
2. Open `index.html` with VS Code Live Server (usually `http://127.0.0.1:5500`).
   On localhost the dashboard uses `http://localhost:3000/api` automatically.
3. Log in with the Admin account you created with `npm run create-admin`.

**Demo mode without a backend:** set `USE_MOCK_API: true` in `config.js`.
Data then lives only in that browser's localStorage, with demo logins
`admin@nef.gov.pk` / `password123`. Never deploy with demo mode on.

## Deploy (Render Static Site)

1. In `config.js`, set `PRODUCTION_API_BASE_URL` to your backend, e.g.
   `https://nef-backend.onrender.com/api`. Keep `USE_MOCK_API: false`.
   Commit and push.
2. render.com -> New -> Static Site -> this repo. Leave the build command
   empty and set the publish directory to `.` (index.html is in the root).
3. Copy the site's URL (e.g. `https://nef-dashboard.onrender.com`) into the
   backend's `CORS_ORIGIN` and redeploy the backend.
4. Open the site, log in, and check the browser console (F12) for errors.

Any static host works the same way (Netlify, Vercel, GitHub Pages, nginx).
