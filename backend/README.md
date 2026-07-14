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
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM="CIT Scheduler <notifications@example.com>"
```

Use [backend/.env.example](.env.example) as the complete template. For Gmail, create a Google App Password and use `smtp.gmail.com` with port `587`.

3. Start server:

```
npm run dev
```

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)
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
