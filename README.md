# CIT_Scheduler

Comprehensive setup and run instructions for the CIT Scheduler project (frontend + backend).

## Overview

- Monorepo with a Vite + Vue frontend (root `src/`) and an Express + MongoDB backend (`backend/`).
- Frontend dev server runs on port 5173 (Vite). Backend listens on port 5000 by default.

## Prerequisites

- Node.js (16+ recommended) and npm installed.
- Access to a MongoDB instance (Atlas or local). The backend reads `MONGODB_URI` from `backend/.env`.

## Quick start (development)

1. Install dependencies

```bash
# from project root (frontend)
npm install

# backend deps
cd backend
npm install
cd ..
```

2. Configure backend environment variables

- Review and update `backend/.env` with your values. Required variables are listed in the Environment Variables section.

3. Start both frontend and backend together (recommended)

```bash
# from project root
npm run dev:all
```

This runs the frontend (`vite`) and the backend (`node src/server.js/index.js`) concurrently using `npx concurrently`.

## Production deployment

Deploy the frontend to Vercel and the backend to Render. In Vercel, add this environment variable before building:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

After changing it, redeploy Vercel. In Render, configure `MONGODB_URI`, `JWT_SECRET`, `RECAPTCHA_SECRET`, `SMTP_HOST` or `SMTP_SERVICE`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `NODE_ENV=production`.

For Gmail login verification, use an App Password for `SMTP_PASS`. The frontend cannot complete a two-factor login until the Render backend can send the OTP email.

Alternative: run in separate terminals

```bash
# terminal A (backend)
cd backend
npm run dev

# terminal B (frontend)
cd <project-root>
npm run dev
```

4. Health check

```bash
curl http://localhost:5000/api/health
# expected: {"status":"ok","message":"Backend is running"}
```

## Build the Android APK

### Prerequisites

- Install Android Studio with Android SDK Platform 36.
- Install JDK 17 or newer and make sure Java is available from the terminal.
- Install the root project dependencies with `npm install`.
- Ensure the backend is deployed or running on an address that the Android device can reach.

### 1. Configure the Android API address

Create or update `.env.android.local` in the project root:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

For testing with a physical phone on the same Wi-Fi, use the computer's LAN IP address instead:

```env
VITE_API_BASE_URL=http://192.168.1.100:5000/api
```

Do not use `localhost` for a physical phone because it refers to the phone itself. The backend must be running, its port must be allowed through the firewall, and its CORS configuration must allow the Capacitor application.

### 2. Build the debug APK

Run this command from the project root on Windows:

```bash
npm run android:build
```

This command:

1. Builds the Vue application using `.env.android.local`.
2. Copies and synchronizes the web build into the Capacitor Android project.
3. Runs the Gradle debug APK build.

The generated APK is located at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The equivalent manual commands are:

```bash
npm run build:android
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
```

### 3. Install or share the APK

You can copy `app-debug.apk` to an Android phone and open it. Android may ask you to allow installation from unknown sources.

To provide a download link over the local network:

```bash
npm run android:serve
```

Keep that terminal running. On another terminal, generate a QR code for the download:

```bash
npm run android:qr
```

The QR code is saved as `apk-download-qr.png`. The computer and phone must be connected to the same network.

### Release APK

The command above creates a debug APK intended for testing. For a signed production release, open the Android project:

```bash
npx cap open android
```

In Android Studio, select **Build > Generate Signed App Bundle or APK**, choose **APK**, and follow the signing wizard. Keep the signing keystore and passwords secure and do not commit them to Git.

## Environment Variables (backend)

Set these in `backend/.env` for local development. Do NOT commit production secrets.

- `MONGODB_URI` — MongoDB connection string (required).
- `PORT` — Port for backend (default: `5000`).
- `JWT_SECRET` — Secret for signing JWTs.
- `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP settings for email delivery.
- `RECAPTCHA_SECRET` — Google reCAPTCHA secret (production).

### Email notifications

The backend sends email notifications when:

- A student logs in with email verification enabled (login OTP).
- A student changes or resets their password (password OTP).
- A newly registered account is approved by an administrator, including bulk approval.
- A student's consultation request is approved, including consultations that are approved automatically for the student's subject teacher.

Consultation approval emails are sent to the student's registered email address. SMTP must be configured in `backend/.env`; otherwise, the consultation is still approved and an email delivery warning is logged by the backend.

### Login security

The login lockout escalates after repeated failed attempts:

- 1st lockout: 1 minute
- 2nd lockout: 5 minutes
- 3rd lockout: 30 minutes
- final lockout: permanent until an administrator unlocks the account

After repeated incorrect password attempts, the account is locked and the user is told to contact the administrator at `citscheduler@gmail.com`. The lockout is stored in MongoDB and applies across browsers and devices. A successful login resets the failed-attempt counter and clears the lockout state.

## Useful commands

- `npm run dev` — start frontend (Vite) in root.
- `cd backend && npm run dev` — start backend.
- `npm run dev:all` — start both (root script added to `package.json`).
- `npm run build` — build frontend for production.

Optional: install `concurrently` as a dev dependency to avoid `npx` each run:

```bash
npm install --save-dev concurrently
```

## Troubleshooting

- ECONNREFUSED when frontend proxies `/api/*` to backend:
  - Ensure backend is running on `http://localhost:5000`.
  - Check backend health: `curl http://localhost:5000/api/health`.

- Port 5000 already in use (Windows example):
  - Find the process: `netstat -ano | findstr :5000`
  - Get process details: `tasklist /FI "PID eq <pid>"`
  - Stop it: `taskkill /PID <pid> /F`

- MongoDB connection errors:
  - Verify `MONGODB_URI` and network access (Atlas IP whitelist, credentials).

- Backend exits on startup with connection errors: ensure MongoDB is reachable and credentials are correct.
- Approval email not received:
  - Confirm `SMTP_SERVICE` or `SMTP_HOST` is configured.
  - Confirm `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM` are set in `backend/.env`.
  - Restart the backend after changing environment variables.
- Account locked after incorrect passwords:
  - The first block lasts 1 minute, then escalates to 5 minutes, then 30 minutes.
  - After repeated failures, the account is permanently locked and the user should contact the administrator at `citscheduler@gmail.com`.
  - A successful login clears the failed-attempt counter and lockout state.

## Production

1. Build frontend:

```bash
npm run build
```

2. Serve built static files from a static host (Netlify, Vercel) or serve them via backend.

3. Configure environment variables on your production host (MongoDB, SMTP, JWT secret, reCAPTCHA).

## Recommended workflow & tips

- Use the `dev:all` script for local development to run both services together.
- If you need to change the backend port, set `PORT` in `backend/.env`.
- Keep secrets out of source control and use environment settings or CI/CD secrets for production.

## Project structure (high level)

- `backend/` — Express API, Mongoose models, routes, and `backend/.env`.
- `src/` — Frontend Vue app (Vite).
- `android/`, `ios/` — Capacitor platform projects for mobile builds.

## Contributing

Open issues or PRs. For local development, follow Quick start steps above.

## License

Add a license file if you intend to publish or share this project.
