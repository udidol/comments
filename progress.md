# Comments Canvas - Progress Report

## Project Overview

Building a Figma-like web app with an infinite canvas and comment placement feature.

**Stack:**

- Backend: NestJS + SQLite + JWT Auth + Rate Limiting
- Frontend: React + TypeScript + Zustand + TanStack Query

## Completed Work

### 1. Project Structure Created

```
/comments
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # TanStack Query hooks
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand stores
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── auth/          # Auth module
│   │   ├── comments/      # Comments CRUD module
│   │   ├── common/        # Throttler exception filter
│   │   ├── database/      # SQLite setup
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── database/
│   │   ├── schema.sql     # DB schema
│   │   └── seed.sql       # Seed data (not used - seeding done in code)
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # Shared types
│   └── types/
│       ├── auth.ts
│       ├── comment.ts
│       ├── user.ts
│       └── index.ts
└── package.json           # Root package.json
```

### 2. Backend Implementation (server/)

#### Database Module

- **Files created:**
  - `server/database/schema.sql` - SQLite schema for users and comments tables
  - `server/src/database/database.module.ts` - Global database module
  - `server/src/database/database.service.ts` - SQLite connection and query helpers
- **Features:**
  - Uses sqlite3 for SQLite
  - Auto-creates tables on startup
  - Seeds test users with password the value of JOINT_PASSWORD from the .env file
  - bcryptjs for password hashing

#### Auth Module

- **Files created:**
  - `server/src/auth/auth.module.ts` - Auth module with JWT configuration
  - `server/src/auth/auth.controller.ts` - POST /api/auth/login endpoint
  - `server/src/auth/auth.service.ts` - Login validation and JWT generation
  - `server/src/auth/jwt.strategy.ts` - Passport JWT strategy
  - `server/src/auth/jwt-auth.guard.ts` - Route protection guard
- **Features:**
  - JWT tokens with 30-minute expiration
  - Login endpoint validates credentials and returns token
  - JwtAuthGuard protects comments endpoints

#### Comments Module

- **Files created:**
  - `server/src/comments/comments.module.ts`
  - `server/src/comments/comments.controller.ts`
  - `server/src/comments/comments.service.ts`
  - `server/src/comments/dto/create-comment.dto.ts`
  - `server/src/comments/dto/update-comment.dto.ts`
- **Endpoints:**
  - `GET /api/comments` - Paginated list (page, page_size params)
  - `POST /api/comments` - Create comment (text_content, x_coord, y_coord)
  - `PUT /api/comments/:id` - Update text_content (owner only)
  - `DELETE /api/comments/:id` - Delete comment (owner only)
- **Features:**
  - Single shared canvas (file_id = "default")
  - Ownership checks on update/delete
  - Returns username with each comment

#### Rate Limiting

- **Files created:**
  - `server/src/common/throttler-exception.filter.ts`
- **Configuration:**
  - 10 requests per 60 seconds
  - Custom message: "Haha nice try DoSing, NO SOUP FOR YOU!"

#### Static File Serving

- Configured ServeStaticModule to serve client/dist
- API routes prefixed with /api

### 3. Frontend Implementation (client/)

#### Foundation

- **Files created:**
  - `client/package.json` - Dependencies configured
  - `client/vite.config.ts` - Vite config with proxy to backend
  - `client/tsconfig.json` - TypeScript config with shared types path
  - `client/index.html` - Entry HTML
  - `client/src/main.tsx` - React + TanStack Query setup

#### State Management (Zustand)

- **Files created:**
  - `client/src/store/authStore.ts` - Token, user, login/logout with persistence
  - `client/src/store/canvasStore.ts` - Pan/zoom/selection state

#### API Layer (TanStack Query)

- **Files created:**
  - `client/src/api/client.ts` - Axios instance with auth interceptor
  - `client/src/api/auth.ts` - useLogin mutation
  - `client/src/api/comments.ts` - useComments, useCreateComment, useUpdateComment, useDeleteComment

#### Components

- **Files created:**
  - `client/src/App.tsx` - Main app with auth gate
  - `client/src/components/LoginForm.tsx` - Login form UI
  - `client/src/components/Canvas.tsx` - Infinite canvas with pan/zoom
  - `client/src/components/Comment.tsx` - Comment bubble with edit/delete
  - `client/src/components/CommentForm.tsx` - New comment form

### 4. Shared Types (shared/)

- **Files created:**
  - `shared/types/user.ts` - User interface
  - `shared/types/comment.ts` - Comment, CreateCommentRequest, UpdateCommentRequest, PaginatedResponse
  - `shared/types/auth.ts` - LoginRequest, LoginResponse
  - `shared/types/index.ts` - Re-exports

## Testing Activities

### Server Startup

- **Status:** WORKS
- Server starts successfully on port 3000
- Database initializes and seeds users
- All routes are registered correctly:
  - POST /api/auth/login
  - GET /api/comments
  - POST /api/comments
  - PUT /api/comments/:id
  - DELETE /api/comments/:id

### API Testing Results

| Endpoint          | Method | Status   | Notes                                      |
| ----------------- | ------ | -------- | ------------------------------------------ |
| /api/auth/login   | POST   | ✅ WORKS | Returns access_token and user object       |
| /api/comments     | GET    | ✅ WORKS | Returns paginated comments with auth token |
| /api/comments     | POST   | ✅ WORKS | Creates comment with coordinates           |
| /api/comments/:id | PUT    | ✅ WORKS | Updates comment (ownership check enforced) |
| /api/comments/:id | DELETE | ✅ WORKS | Deletes comment (ownership check enforced) |

### Additional Features Tested

| Feature                   | Status   | Notes                                                   |
| ------------------------- | -------- | ------------------------------------------------------- |
| Ownership checks          | ✅ WORKS | Returns 403 when trying to edit/delete others' comments |
| Rate limiting             | ✅ WORKS | Returns 429 after 10 requests per minute                |
| Custom rate limit message | ✅ WORKS | "Haha nice try DoSing, NO SOUP FOR YOU!"                |
| Static file serving       | ✅ WORKS | Client app served from /client/dist                     |

### Resolved Issues

1. **Static file serving path** - Fixed `ServeStaticModule` path to use `process.cwd()` instead of `__dirname` for reliable path resolution

## Next Steps

1. ✅ ~~Debug JWT auth issue~~ - JWT authentication works correctly
2. ✅ ~~Build client~~ - Frontend built successfully
3. ✅ ~~Test full API flow~~ - All endpoints tested and working
4. ✅ ~~Test rate limiting~~ - Working with custom message
5. **Test frontend UI** - Open http://localhost:3000 to test canvas interactions
6. **Polish and deploy** - Final testing and production deployment
