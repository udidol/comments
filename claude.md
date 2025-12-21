I want you to build a very rudimentary figma-like web app, in that it has a web interface with an endless canvas, but with only ONE feature - comments.

The backend should be built using Nest.js.
It needs to have a comments API - GET with pagination that returns comments from the DB, a POST to add a comment, a PUT to update a comment text content (only the author can update their own comments), and a DELETE to delete a comment (only the author can delete their own comment). I want the server to have a simple authentication system via username and password that return a token with an expiration of 30 minutes, simple rate limiting, and I want to be able to control the message that returns in case rate limit is reached, so I'll need the necessary db tables (with .sql schema files), endpoints, everything you think is necessary. This will all be a single server on a single machine which will also serve the frontend and house the SQLite DB file. We can do it in phases if that's easier, starting with the backend.

## Database

I want SQLite, which will also be hosted on the same server. Frontend and backend and DB will all be hosted on the same server. Here's the SQL models for users and comments:
-- Users table for authentication
CREATE TABLE users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments table with spatial coordinates
CREATE TABLE comments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
file_id TEXT NOT NULL, -- To identify which canvas/project the comment belongs to
user_id INTEGER NOT NULL,
text_content TEXT NOT NULL,
-- Positioning on the infinite canvas
x_coord REAL NOT NULL,
y_coord REAL NOT NULL,
date_last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);

## Folder Structure

You can do a monolith structure with a /client folder and a /server folder.

### Server folder structure:

src/
├── auth/ # Auth logic (Login, JWT generation)
├── comments/ # CRUD logic for comments
├── common/ # Guards (Rate limiting, Auth checks)
├── database/ # SQLite connection and migrations
├── app.module.ts # Root module
└── main.ts # Server entry point & Rate limit config

## The Rate Limiter (Throttler)

To meet your requirement of a custom message, you’ll configure the ThrottlerModule in your AppModule. NestJS allows you to override the default behavior easily.

Logic flow:

User hits the POST /comments endpoint.

The Throttler checks the IP/User ID.

If limit is exceeded, it throws a 429 Too Many Requests error with your specific string: "You're talking too much! Please wait a moment."

## Authentication Flow

Since you want a 30-minute expiration, we will use Passport.js with a JWT Strategy.

Login: User sends username/password -> Server validates -> Server returns a signed JWT.

Access: User sends JWT in the header -> Server validates signature and "exp" (expiration) claim.

Expired: If the time is > 30 mins, the server returns 401 Unauthorized, and the frontend redirects to login.

### The Auth + Rate Limit Configuration

To give you total control over the rate limit message as you requested, you would implement a Global Guard. Here is the logic for your AppModule configuration:
TypeScript// Conceptual NestJS Configuration
ThrottlerModule.forRoot([{
ttl: 60000, // 1 minute
limit: 10, // 5 requests
// This is where you control the message
errorMessage: 'Haha nice try DoSing, NO SOUP FOR YOU!'
}]),

## The API Endpoints

A CommentsController will handle these routes, all protected by the 30-minute JWT token:

GET/comments?page=1&page_size=10 Returns paginated comments (including coordinates).

POST/comments Adds a new comment at specific $x, y$ coordinates.

PUT/comments/:id Updates text_content and sets date_last_updated. Enforce that only text content can be changed.

DELETE/comments/:id Removes the comment (with ownership check).

## Addressing the "Single Server" Frontend

Since the server is also serving the frontend, you will use the NestJS ServeStaticModule.You'll have a folder (like /public or /client/dist).NestJS will serve your index.html and Canvas JS bundle from that folder.
Any request that doesn't start with /api will simply point to the UI.

## Frontend

Frontend should be React+Typescript+Zustand for state+TanStack Query for APIs.
Types should be shared between backend and frontend, handle the type sharing in the best way you see fit.
