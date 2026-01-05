# Comments Canvas

A Figma-like web application featuring an infinite canvas with a collaborative commenting system. Users can authenticate, pan and zoom around the canvas, and place comments at any position. Comments support threaded replies, editing, and deletion with ownership-based permissions. Built with a NestJS backend using SQLite for persistence and a React frontend with Zustand for state management.

<img width="2048" height="991" alt="image" src="https://github.com/user-attachments/assets/cdd9a77e-7334-4932-b799-49b45ca5e3e1" />

## Tech Stack

-   **Backend**: NestJS, SQLite (sqlite3), Passport JWT, Throttler
-   **Frontend**: React, TypeScript, Zustand, TanStack Query, styled-components
-   **Shared**: TypeScript types between frontend and backend

## Project Structure

```
comments/
├── client/          # React frontend
│   ├── src/
│   └── dist/        # Built frontend (after build)
├── server/          # NestJS backend
│   ├── src/
│   └── dist/        # Built backend (after build)
├── shared/          # Shared TypeScript types
└── package.json     # Root scripts
```

## Local Development Setup

### Prerequisites

-   Node.js 18+
-   npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd comments

# Install all dependencies (root, server, and client)
npm run install:all

# Set up environment variables
cp .env.example .env
```

The database initializes automatically on first server start.

### Running in Development

```bash
# Run both server and client in development mode
npm run dev

# Or run them separately:
npm run dev:server  # Backend on http://localhost:3000
npm run dev:client  # Frontend on http://localhost:5173
```

## Production Deployment

### Building for Production

```bash
# Build both frontend and backend
npm run build
```

This creates:

-   `client/dist/` - Static frontend files
-   `server/dist/` - Compiled backend JavaScript

### Deploying to a Remote Server (FTP)

1. **Build locally first**:

    ```bash
    npm run build
    ```

2. **Upload only these files/folders**:

    ```
    comments/
    ├── package.json           # Root scripts
    ├── server/
    │   ├── package.json       # Server dependencies
    │   └── dist/              # Compiled backend (entire folder)
    └── client/
        └── dist/              # Built frontend (entire folder)
    ```

    **Do NOT upload**: `node_modules/`, `src/` folders, `.git/`, `shared/`

3. **On the server**, navigate to the project root and run:

    ```bash
    # Install production dependencies
    npm run install:prod

    # Create .env with a secure JWT secret
    echo "JWT_SECRET=$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")" > .env

    # Start the production server
    npm start
    ```

The database initializes automatically on first startup (creates schema + seed users).
The server runs on port 3000 and serves both the API and frontend.

### Environment Variables

| Variable         | Default | Description                   |
| ---------------- | ------- | ----------------------------- |
| `PORT`           | `3000`  | Server port                   |
| `JWT_SECRET`     | —       | Secret key for signing tokens |
| `JOINT_PASSWORD` | —       | default user password         |

**Important:** Always set a unique `JWT_SECRET` in production.

### Quick Deploy Script

Create this script on your server for easy deployments:

```bash
#!/bin/bash
cd /path/to/comments
npm run install:prod
npm start
```

## API Endpoints

| Method | Endpoint            | Description                 | Auth |
| ------ | ------------------- | --------------------------- | ---- |
| POST   | `/api/auth/login`   | Login, returns JWT          | No   |
| GET    | `/api/comments`     | Get paginated comments      | Yes  |
| POST   | `/api/comments`     | Create comment              | Yes  |
| PUT    | `/api/comments/:id` | Update comment (owner only) | Yes  |
| DELETE | `/api/comments/:id` | Delete comment (owner only) | Yes  |

## Rate Limiting

The API is rate-limited to 10 requests per minute per IP. Exceeding this limit returns a 429 status with the message: "Haha nice try DoSing, NO SOUP FOR YOU!"

## Optimizations for scale, security, production
### UI
There are many things to improve in UI, like smooth zooming, element design, but those are less important.

#### Security
On the server side, this is a demo so I didn't put too much effort into security. If this was a real API, I'd invest in a solid CSP, sanitize inputs thoroughly, restrict CORS, add security headers to responses, and more.

#### Scale
For performance in scale I'd serve assets from CDN, add an in-memory DB like redis for query caching, add multiple servers with load balancing, and, if necessary, load handling by queue, all the fluff.

#### Performance optimizations
1. Dividing the canvas - quadtree strategy
    - If the document is huge with a lot of comments, fetch comments only for the part of the screen that the user is in at that moment. When the user pans/zooms, fetch only the relevant comments in real time.
2. Using protobuf - to make response payloads significantly smaller, protobuf protocol could be used for data transfer.
3. Split data fetching for efficient initial load
    1. Initially fetch only the necessary data for displaying the comment markers in the canvas, and after that request is fetched, trigger an asynchronous fetching of the actual comments.
    2. Another optimization is to only fetch comments, without replies, and fetch the replies afterwards, asynchronously.
    3. I implemented pagination for the `GET /comments` endpoint,so the pagination mechanism can be used to do a waterfall fetch of all data asynchronously until all comments are fetched
