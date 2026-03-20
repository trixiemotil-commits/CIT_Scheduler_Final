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
```

3. Start server:

```
npm run dev
```

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)
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
