# Backend

MongoDB Atlas-backed authentication and RBAC API for CIT Scheduler.

## Setup

1. Install dependencies:

```
cd backend
npm install
```

2. Configure `backend/.env`:

```
MONGODB_URI=your_atlas_connection_string
PORT=5000
JWT_SECRET=your_long_random_secret
FRONTEND_URL=https://citscheduler.com
RESEND_API_KEY=your_resend_api_key
```

`FRONTEND_URL` is the public web app origin used to build new-device review links. Configure `RESEND_API_KEY` for security and account email delivery.

3. Start server:

```
npm run dev
```

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/security-review/confirm` (one-use email confirmation token)
- `GET /api/auth/me` (Bearer token required)
- `GET /api/auth/sessions` (Bearer token required; list active devices)
- `DELETE /api/auth/sessions/:sessionId` (Bearer token required; revoke a device session)
- `POST /api/auth/security/trust-current-device` (Bearer token required)
- `POST /api/auth/security/report-current-device` (Bearer token required)
- `POST /api/auth/request-password-otp` (Bearer token required; body: `{ "currentPassword": "..." }`)
- `POST /api/auth/change-password` (Bearer token required; body: `{ "currentPassword": "...", "otp": "123456", "newPassword": "..." }`)
- `GET /api/rbac/admin` (admin only)
- `GET /api/rbac/teacher` (teacher/admin)
- `GET /api/rbac/student` (student/teacher/admin)

## Register Payload

```
{
  "firstName": "Jane",
  "lastName": "Doe",
  "studentId": "2026-0001",
  "email": "jane@example.com",
  "password": "Password123",
  "role": "student"
}
```

`registeredId` is also accepted for backward compatibility with older clients.

Only `student` and `teacher` are allowed during public registration.
