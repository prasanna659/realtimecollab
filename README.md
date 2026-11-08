<<<<<<< HEAD
# realtimecollab
=======
# 🚀 RealtimeCollab

> A real-time collaborative Kanban workspace for managing projects, tasks, and team communication. Built with React, Spring Boot, and WebSocket—zero-latency updates for seamless team collaboration.

## 📋 Overview

RealtimeCollab enables teams to collaborate on projects in real-time with:

- **User authentication** — Register, login, and manage secure sessions with JWT + refresh token rotation
- **Workspaces** — Organize projects and invite teammates by email
- **Kanban board** — Drag-and-drop tasks across columns (Backlog, In Progress, Done)
- **Real-time sync** — Every change (task create/update/move/delete, comments) broadcasts to all viewers instantly via WebSocket
- **Task management** — Create, assign, prioritize, and comment on tasks
- **Team collaboration** — Invite members, control permissions (Owner/Member roles), and track activity

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **Authentication & Authorization** | JWT access tokens + refresh token rotation, BCrypt password hashing, workspace-scoped roles |
| **Workspaces & Membership** | Create workspaces, invite/remove members, enforce access control |
| **Projects & Kanban Board** | Drag-and-drop task board, project-level task management |
| **Real-time Collaboration** | STOMP WebSocket subscriptions, live event broadcasting (task/comment changes) |
| **Task Management** | Create, update, move, assign, prioritize, and delete tasks with due dates |
| **Comments** | Add and delete comments on tasks for inline discussion |
| **REST API** | Fully documented, protected endpoints with JSON responses |
| **Database Migrations** | Flyway-managed SQL schemas, PostgreSQL persistence |
| **Containerized Deployment** | Docker + Docker Compose for one-command deployment |
| **Security** | CORS, stateless sessions, workspace-level authorization on every resource |

## 🛠️ Tech Stack

### Frontend
- **Framework** — React 19 + Vite 6 (blazing-fast dev & build)
- **Language** — TypeScript 5.7
- **State Management** — React Hooks + TanStack Query 5 (server state) + Zustand (UI state)
- **Routing** — React Router 6
- **Forms & Validation** — React Hook Form + Zod
- **Drag-and-Drop** — dnd-kit v6
- **Real-time Communication** — @stomp/stompjs v7 (STOMP over WebSocket)
- **Styling** — Tailwind CSS 3 + PostCSS
- **Icons** — Lucide React

### Backend
- **Framework** — Spring Boot 3.3
- **Language** — Java 21
- **Security** — Spring Security 6, JWT (jjwt 0.12.6), BCrypt
- **API** — Spring MVC REST controllers
- **Real-time** — Spring WebSocket + STOMP
- **Database** — Spring Data JPA + Hibernate + PostgreSQL 16
- **Migrations** — Flyway
- **Build** — Maven 3.9

### Infrastructure
- **Containerization** — Docker + Docker Compose
- **Reverse Proxy** — Nginx (serves frontend, proxies `/api` and `/ws` to backend)
- **Database** — PostgreSQL 16 with persistence volume

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────┐              ┌──────────────────────────────┐
│   React 19 Frontend         │    HTTPS     │   Spring Boot 3 Backend      │
│   (React Router, TQ5, Zustand) ◀────────▶  │   (Controllers → Services    │
│   Vite + Tailwind CSS       │    JSON      │    → Repositories → JPA)     │
│   dnd-kit Board             │              │                              │
│   @stomp/stompjs            │    STOMP     │   Spring Security JWT Auth   │
│   (WebSocket client)        │ ◀──────────▶ │   Spring WebSocket (STOMP)   │
└─────────────────────────────┘              │   Flyway DB Migrations       │
        (Port 8081)                          └────────────┬─────────────────┘
                                                           │ JPA / Hibernate
                                                           ▼
                                             ┌──────────────────────────┐
                                             │   PostgreSQL 16          │
                                             │   (Persisted on pgdata   │
                                             │    volume)               │
                                             └──────────────────────────┘
```

### Request Flow

1. **Frontend** — User interacts with React UI, TanStack Query fetches data
2. **Nginx reverse proxy** — Routes `/api/*` → backend, `/ws` → WebSocket upgrade
3. **Backend REST API** — Controllers validate workspace membership, execute business logic
4. **Database** — JPA entities persisted via Hibernate → PostgreSQL
5. **WebSocket broadcast** — BoardEventPublisher sends STOMP events to subscribed clients
6. **Real-time UI update** — @stomp/stompjs receives events, React state updates, UI re-renders

## 📊 Database Schema

Managed by Flyway migrations in [backend/src/main/resources/db/migration/](backend/src/main/resources/db/migration/).

### Migrations

| File | Purpose |
|------|---------|
| `V1__create_users_and_refresh_tokens.sql` | `users` table, `refresh_tokens` table, password hashing setup |
| `V2__create_workspace_project_task_tables.sql` | Workspaces, project memberships, projects, tasks, comments, and relationships |

## 👥 Team Member Management

### Overview

Team members are managed at the **workspace level**. Once invited to a workspace, members can view and collaborate on all projects and tasks within that workspace. Workspace owners can invite, remove, and manage member roles.

### How It Works

#### 1. **Inviting Team Members**

**Step-by-step Process:**

1. Navigate to your workspace → **Members** tab
2. Click **"Invite Member"** button
3. Enter the email address of the person you want to invite
4. Click **"Send Invite"**
5. The invited user receives an invitation (email notification)
6. Once they accept, they appear in the members list with **MEMBER** role

**Behind the scenes:**
- Backend validates the email exists in the system
- Creates a `WorkspaceMember` entry linking user to workspace
- Sets role to `MEMBER` by default
- Broadcasts event to all workspace members via WebSocket
- Real-time UI update shows new member instantly

#### 2. **Member Roles & Permissions**

| Role | Permissions | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| **OWNER** | Full control | • Invite/remove members<br/>• Create projects<br/>• Delete workspace<br/>• Manage settings<br/>• View all tasks | — |
| **MEMBER** | Collaboration | • Create projects<br/>• Create/edit/move tasks<br/>• Add comments<br/>• View workspace data<br/>• Leave workspace | • Remove members<br/>• Delete workspace<br/>• Change roles |

#### 3. **Removing Team Members**

**Owner actions:**
1. Go to workspace → **Members** tab
2. Click the member card or action menu
3. Click **"Remove Member"**
4. Confirm removal
5. Member loses access immediately

**Member leaving:**
- Members can click **"Leave Workspace"** to exit voluntarily
- Cannot leave if they're the sole owner

**Backend enforcement:**
- Every API call checks `WorkspaceMember` record
- Removed/left members get `401 Unauthorized` on next request
- WebSocket connection closes automatically
- UI shows "You no longer have access"

#### 4. **Real-time Member Presence**

**Features:**
- See who's currently viewing the board (via WebSocket subscriptions)
- Member list shows join date and last active timestamp
- Online status indicator next to member names

**Implementation:**
- When user subscribes to `/topic/projects/{projectId}/board`, they broadcast a "user-connected" event
- Other subscribers receive it and update their UI
- On disconnect, "user-disconnected" event is sent

### API Endpoints for Team Management

**POST** `/api/workspaces/{workspaceId}/members` — Invite member by email
```json
{
  "email": "teammate@company.com"
}
```
**Response:**
```json
{
  "id": "user-uuid",
  "email": "teammate@company.com",
  "name": "Team Mate",
  "role": "MEMBER",
  "joinedAt": "2026-08-18T10:30:00Z",
  "lastActive": "2026-08-18T10:35:45Z"
}
```

---

**GET** `/api/workspaces/{workspaceId}/members` — List all members
```json
{
  "members": [
    {
      "id": "owner-uuid",
      "email": "owner@company.com",
      "name": "Workspace Owner",
      "role": "OWNER",
      "joinedAt": "2026-08-15T14:20:00Z",
      "lastActive": "2026-08-18T11:00:00Z",
      "isOnline": true
    },
    {
      "id": "member-uuid",
      "email": "teammate@company.com",
      "name": "Team Mate",
      "role": "MEMBER",
      "joinedAt": "2026-08-18T10:30:00Z",
      "lastActive": "2026-08-18T10:45:30Z",
      "isOnline": false
    }
  ]
}
```

---

**DELETE** `/api/workspaces/{workspaceId}/members/{userId}` — Remove member
- Returns `204 No Content` on success
- Only workspace owner can remove members
- Returns `403 Forbidden` if not owner

---

**POST** `/api/workspaces/{workspaceId}/leave` — Leave workspace
- Current user leaves the workspace
- Returns `204 No Content` on success
- Cannot leave if you're sole owner (`400 Bad Request`)

### Features

#### 📧 Email Invitations
- Invites are sent to new members
- Links include workspace name and invitation context
- Graceful handling of non-existent email addresses

#### 🔐 Access Control
- Workspace-scoped authorization on every endpoint
- Members can only access workspaces they're members of
- Projects and tasks inherit workspace membership checks

#### 📊 Member List Page (`/pages/MembersPage.tsx`)
- **Display:**
  - All members in the workspace
  - Role badges (Owner/Member)
  - Join date and last activity
  - Online/offline status
  - Avatar with initials
- **Owner features:**
  - "Invite Member" button
  - Action menu per member (remove option)
  - Member search/filter
- **Member features:**
  - View-only access
  - "Leave Workspace" button in settings

#### 🔄 Real-time Updates via WebSocket

When a member is invited/removed, all connected clients receive:
```json
{
  "type": "member-joined",
  "userId": "new-member-uuid",
  "email": "teammate@company.com",
  "name": "Team Mate",
  "role": "MEMBER",
  "timestamp": "2026-08-18T10:30:00Z"
}
```

Or on removal:
```json
{
  "type": "member-left",
  "userId": "removed-member-uuid",
  "reason": "removed_by_owner",
  "timestamp": "2026-08-18T10:45:00Z"
}
```

### Code Structure

**Frontend:**
- `src/pages/MembersPage.tsx` — Members list and invite UI
- `src/hooks/useWorkspaces.ts` — Workspace membership state
- `src/services/workspaceService.ts` — API calls for invite/remove

**Backend:**
- `WorkspaceMember` entity — Junction table with role field
- `WorkspaceMemberController` — REST endpoints for member management
- `WorkspaceMemberService` — Business logic for invites/removals
- `WorkspaceMemberRepository` — JPA queries

**WebSocket:**
- `BoardEventPublisher` — Broadcasts member events
- STOMP topic: `/topic/workspaces/{workspaceId}/members`

### Security & Best Practices

✅ **Always enabled:**
- JWT token required for all member management endpoints
- Workspace membership verified before every operation
- Owner-only operations protected with `@PreAuthorize`
- Email validation before inviting
- SQL injection prevention via parameterized queries
- Rate limiting on invite endpoint (prevent spam)

⚠️ **Common pitfalls to avoid:**
- Don't invite users who aren't registered yet (validation error)
- Can't remove yourself as sole owner
- Removed members retain access until session expires (no real-time logout)

### Entity Relationships (Members)

```
User (1) ──── (many) WorkspaceMember
                        │
                        ├─→ Workspace
                        ├─→ role (OWNER/MEMBER)
                        ├─→ joinedAt
                        └─→ lastActive

Workspace (1) ─── (many) WorkspaceMember
```

### Entity Relationships

```
User (1) ─── (many) Workspace  (via workspace_members with role: OWNER/MEMBER)
  │
  └─────────▶ RefreshToken (refresh token hashes, one per rotation)
  └─────────▶ Task (as creator/assignee)

Workspace (1) ─── (many) Project
    └─────────▶ WorkspaceMember (with role & join date)

Project (1) ─── (many) Task
  │            (with position for drag-and-drop order)
  └─────────▶ Comment (via Task)

Task (1) ─── (many) Comment
    └─────────▶ User (creator)
```

## 📡 API Reference

All endpoints prefixed with `/api` and require `Authorization: Bearer <accessToken>` (except `/auth/*`).

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Create account, returns `accessToken` + `refreshToken` |
| POST | `/auth/login` | ❌ | Login with email/password, returns token pair |
| POST | `/auth/refresh` | ❌ | Rotate refresh token (old token is revoked) |
| POST | `/auth/logout` | ✅ | Revoke current refresh token |

**Token Details:**
- `accessToken` — short-lived (15 min default), include in `Authorization: Bearer` header
- `refreshToken` — long-lived, used to get new token pair; never stored plain (only SHA-256 hash)

### User Profile — `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current authenticated user |
| PATCH | `/users/me/password` | Change password (requires old password) |

### Workspaces — `/api/workspaces`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces` | List all workspaces for current user |
| POST | `/workspaces` | Create new workspace (user becomes owner) |
| GET | `/workspaces/{id}` | Get workspace details |
| DELETE | `/workspaces/{id}` | Delete workspace (owner only) |
| GET | `/workspaces/{id}/members` | List workspace members |
| POST | `/workspaces/{id}/members` | Invite user by email (owner only) |
| DELETE | `/workspaces/{id}/members/{userId}` | Remove member (owner only) |
| POST | `/workspaces/{id}/leave` | Leave workspace (member cannot be sole owner) |

### Projects — `/api/projects` & `/api/workspaces/{workspaceId}/projects`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/{id}/projects` | List projects in workspace |
| POST | `/workspaces/{id}/projects` | Create project (requires member role) |
| GET | `/projects/{id}` | Get project details |
| PUT | `/projects/{id}` | Update project name/description |
| POST | `/projects/{id}/archive` | Archive project (hides from board) |
| POST | `/projects/{id}/restore` | Restore archived project |

### Tasks — `/api/projects/{projectId}/tasks` & `/api/tasks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/tasks` | List active tasks in project |
| POST | `/projects/{id}/tasks` | Create new task |
| GET | `/tasks/{id}` | Get task details |
| PUT | `/tasks/{id}` | Update title, description, priority, due date, or assignee |
| PATCH | `/tasks/{id}/move` | Move task to column and position (drag-and-drop) |
| DELETE | `/tasks/{id}` | Soft-delete task |

**Task Move Request:**
```json
{
  "status": "IN_PROGRESS",
  "position": 0
}
```

### Comments — `/api/comments` & `/api/tasks/{taskId}/comments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/{id}/comments` | List comments on task |
| POST | `/tasks/{id}/comments` | Add comment (user is creator) |
| DELETE | `/comments/{id}` | Delete own comment (owner only) |

### WebSocket — Real-time Events

**Endpoint:** `ws://localhost:8080/ws`

**Subscribe to:** `/topic/projects/{projectId}/board`

**Event Types:**
- `TASK_CREATED` — New task added to board
- `TASK_UPDATED` — Task details changed (title, description, priority, assignee)
- `TASK_MOVED` — Task moved to different column or position
- `TASK_DELETED` — Task removed from board
- `COMMENT_ADDED` — New comment on task

**Example Connection (JavaScript):**
```javascript
import StompJs from "@stomp/stompjs";

const client = new StompJs.Client({
  brokerURL: "ws://localhost:8080/ws",
  connectHeaders: {
    Authorization: `Bearer ${accessToken}`,
  },
});

client.onConnect = () => {
  client.subscribe(`/topic/projects/${projectId}/board`, (message) => {
    const event = JSON.parse(message.body);
    console.log(`Event: ${event.eventType}`, event.data);
  });
};

client.activate();
```

## 🔒 Security

### Authentication
- **JWT (jjwt 0.12.6)** — Stateless, token-based authentication
- **Access tokens** — Short-lived (15 minutes default), sent as `Authorization: Bearer <token>`
- **Refresh tokens** — Long-lived, never stored plain; only SHA-256 hash persisted
- **Token rotation** — Each refresh revokes the used token and issues new access + refresh pair

### Password Security
- **BCrypt (cost 12)** — Industry-standard password hashing, never store plain passwords

### Authorization
- **Workspace-scoped** — Every resource (project, task, comment) enforces workspace membership via `WorkspaceAuthService`
- **Role-based** — OWNER (full permissions) vs MEMBER (limited permissions)
- **Stateless sessions** — `SessionCreationPolicy.STATELESS`; no server-side session storage

### Network Security
- **CORS** — Configured per origin via `app.cors.allowed-origins`; OPTIONS preflight explicitly permitted
- **HTTPS ready** — Built for production with TLS termination at reverse proxy
- **WebSocket security** — STOMP connections require valid JWT token in handshake

### Best Practices Implemented
✅ Never log sensitive data (tokens, passwords)  
✅ Access/refresh token expiry enforced at filter level  
✅ Cross-site request protection via stateless architecture  
✅ Input validation on all endpoints (Zod for frontend, Spring validation for backend)  
✅ Authorization checks before any business logic execution

## 📁 Project Structure

```
realtimecollab/
├── docker-compose.yml              # PostgreSQL, backend, frontend services
├── README.md                        # (this file)
│
├── backend/                         # Spring Boot API
│   ├── src/main/java/com/realtimecollab/
│   │   ├── RealtimeCollabApplication.java    # Entry point
│   │   ├── config/                  # SecurityConfig, WebSocketConfig, CorsConfig
│   │   ├── controller/              # REST endpoints (Auth, Workspace, Project, Task, Comment)
│   │   ├── service/                 # Business logic (TaskService, WorkspaceService, etc.)
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── entity/                  # JPA entities (User, Workspace, Project, Task, etc.)
│   │   ├── dto/                     # Request/response records (Java 17+)
│   │   ├── mapper/                  # Entity ↔ DTO mappers
│   │   ├── security/                # JwtService, JwtAuthFilter, UserPrincipal
│   │   ├── websocket/               # BoardEventPublisher, STOMP message handlers
│   │   └── exception/               # ApiException, GlobalExceptionHandler
│   ├── src/main/resources/
│   │   ├── application.yml          # Spring Boot configuration
│   │   ├── application-test.yml     # Test profile (in-memory H2 DB)
│   │   └── db/migration/            # Flyway SQL migrations
│   │       ├── V1__create_users_and_refresh_tokens.sql
│   │       ├── V2__create_workspace_project_task_tables.sql
│   │       └── V3__remove_extraneous_feature_tables.sql
│   ├── src/test/                    # Unit tests for services, security, WebSocket
│   ├── Dockerfile                   # Multi-stage build: Maven + OpenJDK 21
│   ├── pom.xml                      # Maven dependencies & plugins
│   └── target/                      # Compiled classes & JARs
│
├── frontend/                        # React 19 + Vite
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Root component & routing
│   │   ├── index.css                # Global styles (Tailwind)
│   │   ├── pages/                   # Page-level components
│   │   │   ├── auth/                # LoginPage, RegisterPage
│   │   │   ├── WorkspacesPage.tsx   # Workspace list & creation
│   │   │   ├── BoardPage.tsx        # Kanban board (main feature)
│   │   │   └── MembersPage.tsx      # Workspace members management
│   │   ├── layouts/                 # AppLayout (authenticated), AuthLayout (public)
│   │   ├── components/              # Reusable UI components
│   │   │   ├── kanban/              # Board, Column, TaskCard (dnd-kit powered)
│   │   │   ├── TopBar.tsx           # Navigation & user menu
│   │   │   ├── TaskDetailDrawer.tsx # Task edit modal
│   │   │   └── Toast.tsx            # Notifications
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts           # Auth state & login/logout
│   │   │   ├── useWorkspaces.ts     # Workspace CRUD
│   │   │   ├── useProjects.ts       # Project CRUD
│   │   │   ├── useTasks.ts          # Task CRUD
│   │   │   └── useBoardSocket.ts    # WebSocket subscription & events
│   │   ├── services/                # API clients (Axios)
│   │   │   ├── api.ts               # Base Axios instance with auth interceptor
│   │   │   ├── authService.ts       # register, login, logout
│   │   │   ├── workspaceService.ts  # Workspace & member management
│   │   │   ├── projectService.ts    # Project CRUD
│   │   │   ├── taskService.ts       # Task CRUD & move
│   │   │   └── commentService.ts    # Comment CRUD
│   │   ├── store/                   # Zustand state stores
│   │   │   ├── authStore.ts         # Persisted auth state (tokens, user)
│   │   │   └── uiStore.ts           # Transient UI state (modals, selections)
│   │   └── types/                   # Shared TypeScript interfaces
│   │       ├── auth.ts              # User, AuthResponse
│   │       ├── workspace.ts         # Workspace, Member
│   │       ├── project.ts           # Project
│   │       ├── task.ts              # Task, TaskStatus, TaskPriority
│   │       └── index.ts             # Barrel export
│   ├── index.html                   # HTML entry point
│   ├── nginx.conf                   # Reverse proxy config (for Docker)
│   ├── Dockerfile                   # Multi-stage: Node build + Nginx serve
│   ├── vite.config.ts               # Vite bundler configuration
│   ├── tailwind.config.js           # Tailwind CSS utilities
│   ├── tsconfig.json                # TypeScript compiler config
│   ├── package.json                 # npm dependencies & scripts
│   └── node_modules/                # Installed packages (git-ignored)
│
└── .gitignore                       # Excludes node_modules, target/, .env, etc.
```

### Key Design Patterns

**Backend:**
- **Service layer pattern** — Controllers delegate to services; services handle business logic
- **Repository pattern** — Data access abstracted via Spring Data JPA
- **DTO pattern** — Request/response objects decouple API from internal entities
- **SecurityContext** — Spring Security provides `UserPrincipal` for authorization checks
- **Event publishing** — STOMP broadcaster decouples real-time updates from business logic

**Frontend:**
- **Custom hooks** — Encapsulate API calls and state management
- **Zustand stores** — Lightweight state for auth + UI
- **TanStack Query** — Server state caching, synchronization, and stale-while-revalidate patterns
- **Axios interceptor** — Auto-attach JWT token to every request
- **@stomp/stompjs** — STOMP client for WebSocket subscriptions

## 🚀 Getting Started

### Option A — Docker Compose (Recommended)

**Prerequisites:** Docker Desktop running

**Steps:**
```bash
# Clone the repository (if not already done)
git clone <repo-url>
cd realtimecollab

# Build and start all services
docker compose up --build
```

**What this does:**
1. ✅ Spins up PostgreSQL 16 with a persistent volume
2. ✅ Builds and starts the Spring Boot backend (Port 8080)
3. ✅ Builds and starts the React frontend via Nginx (Port 8081)
4. ✅ Runs Flyway database migrations automatically
5. ✅ Configures networking between containers

**Wait for startup:**
```
backend  | Started RealtimeCollabApplication in X.XXX seconds
```

**Access the app:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:8081 |
| Backend API | http://localhost:8080/api |
| Health check | http://localhost:8080/actuator/health |
| PostgreSQL | localhost:5432 (host connection only) |

**Stop services:**
```bash
docker compose down        # Stop containers (data persists)
docker compose down -v     # Stop & remove volumes (clean slate)
```

### Option B — Local Development (All Services)

**Prerequisites:**
- Java 21 (JDK with Maven 3.9)
- Node.js 20+ (with npm)
- PostgreSQL 16 running locally
- Git

**Backend Setup:**
```bash
cd backend

# Install dependencies & compile
mvn clean install

# Start the server (default: http://localhost:8080)
mvn spring-boot:run
```

**Frontend Setup (in another terminal):**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (default: http://localhost:5173)
npm run dev
```

**Verify:**
- Backend → http://localhost:8080/actuator/health
- Frontend → http://localhost:5173
- Your browser will auto-reload on file changes

### Option C — Backend Only + Frontend Build

```bash
# Build backend
cd backend
mvn clean package -DskipTests

# Build frontend
cd ../frontend
npm run build

# Backend serves built frontend + API
cd ../backend
mvn spring-boot:run
```

Frontend will be served at http://localhost:8080 (no separate Nginx needed).

## 📝 First Steps

After starting the app:

1. **Register** — Create a new account on the login/register page
2. **Create workspace** — Name it "My Team" or similar
3. **Invite members** — Use "Members" tab to invite teammates by email (local dev: skip actual email)
4. **Create project** — Add a new project to your workspace
5. **Drag tasks** — Create tasks and drag them across the Kanban board
6. **Collaborate** — Open the same board in multiple browsers to see real-time updates!

## 🔧 Configuration

### Environment Variables

**Backend** — Create `backend/.env` (or set in `docker-compose.yml`):
```env
DB_URL=jdbc:postgresql://localhost:5432/realtimecollab
DB_USER=realtimecollab
DB_PASSWORD=realtimecollab
JWT_SECRET=your-long-random-secret-key-min-32-chars-for-prod
JWT_EXPIRATION_MS=900000
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

**Frontend** — Set `VITE_API_URL` in `.env` (optional, defaults to same origin):
```env
VITE_API_URL=http://localhost:8080
```

### Key Spring Boot Properties

Edit `backend/src/main/resources/application.yml`:
```yaml
server:
  port: 8080
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: ${JWT_EXPIRATION_MS:900000}
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:5173,http://localhost:8081}
```

## 🏛️ Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Refresh token hashing** | Raw tokens never stored; only SHA-256 hash persisted. Database breaches don't leak usable tokens. |
| **Soft-delete tasks** | Tasks marked deleted but not removed; can be restored and activity logs stay coherent. |
| **STOMP over raw WebSocket** | Direct WebSocket (no SockJS fallback) simplifies stack; modern browsers all support native WebSocket. |
| **Optimistic drag-and-drop** | Frontend updates TanStack Query cache immediately on drop; rolls back only if API fails. Feels instant. |
| **Workspace-scoped authorization** | `WorkspaceAuthService.requireMember()` is the single gate; no business logic runs without it. |
| **Transaction isolation for logging** | Activity logs use `REQUIRES_NEW` propagation so logging failures never roll back core business transactions. |
| **Invite-by-email (no SMTP)** | Out of scope; inviting unregistered users returns a clear error rather than silently queueing. |

## 🧪 Testing & Debugging

### View Live Logs

```bash
docker compose logs -f backend     # Spring Boot logs
docker compose logs -f postgres    # PostgreSQL logs
docker compose logs -f frontend    # Nginx reverse proxy
```

### Rebuild from Scratch

```bash
# Stop containers and delete all data volumes
docker compose down -v

# Full rebuild
docker compose up --build
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ERR_CONNECTION_REFUSED` on 8080 | Backend not started | Check `docker compose logs backend` |
| `password authentication failed` | Stale DB volume | Run `docker compose down -v` then `up --build` |
| `release version 21 not supported` | Local Java < 21 | Use Docker or install JDK 21+ locally |
| TypeScript build error | Missing `lib` in tsconfig | Verify `tsconfig.json` has `"lib": ["ES2020", "DOM", "DOM.Iterable"]` |
| `403 Forbidden` on API | No JWT token sent | Log in first; token stored in localStorage |
| CORS error in browser | Origin not whitelisted | Add origin to `CORS_ORIGINS` env var |
| WebSocket connection fails | Token expired | Refresh token via login endpoint |

## 📚 Future Enhancements

**Not implemented (out of scope):**
- Email notifications (SMTP integration)
- Presence indicators (who's online)
- File attachments / image uploads
- Rich text editors
- Redis caching / distributed sessions
- Rate limiting
- Automatic refresh token cleanup job
- Chat, video calls, calendar views
- Mobile app (iOS/Android)
- Time tracking, sprint planning
- GitHub/Slack integrations

**Known limitations:**
- `TaskMapper` performs 3 N+1 queries per task (acceptable for small boards; optimize with JPA joins for scale)
- Integration tests not included; unit tests cover `JwtService` and security components
- No automated backups of database volume

## 💬 Support & Contribution

Found a bug? Have a feature idea?

1. Check existing issues: [GitHub Issues](https://github.com/yourusername/realtimecollab/issues)
2. Create a new issue with:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment (Docker/local, browser, etc.)
3. Feel free to open pull requests for improvements!

## 📄 License

[Add your license here — MIT, Apache 2.0, etc.]
>>>>>>> 78122af (intial commit)
