# ⬡ TaskForge – Team Task Manager

A full-stack team task management app with role-based access control, project management, and real-time task tracking.

---

## 🌐 Live Demo

> **Live URL:** `https://your-app.up.railway.app`  
> *(Update after deployment)*

---

## ✨ Features

- **Authentication** – JWT-based Signup & Login with role selection (Admin / Member)
- **Role-Based Access Control** – Admins can create/delete projects, add/remove members, create/assign tasks; Members can update status of their assigned tasks
- **Project Management** – Create projects, invite team members by email
- **Task Board** – Kanban-style board with columns: To Do, In Progress, Done, Overdue
- **Task Assignment** – Assign tasks to project members with priority levels (Low/Medium/High) and due dates
- **Auto Overdue Detection** – Tasks past due date are automatically marked Overdue
- **Dashboard** – Summary stats, overdue alerts, my tasks, project progress bars

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Styling | Custom CSS (dark industrial aesthetic) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # DB schema (User, Project, Task, ProjectMember)
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/signup|login|me
│   │   ├── projects.js         # CRUD + member management
│   │   ├── tasks.js            # CRUD tasks per project
│   │   └── dashboard.js        # GET /api/dashboard
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── isAdmin.js          # Role check
│   ├── index.js                # Express app entry
│   ├── railway.toml            # Railway deploy config
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── context/AuthContext.js   # Global auth state
    │   ├── utils/api.js             # Axios instance + all API calls
    │   ├── pages/
    │   │   ├── Login.js / Signup.js
    │   │   ├── Dashboard.js         # Stats + overdue + my tasks
    │   │   ├── Projects.js          # Project list + create
    │   │   └── ProjectDetail.js     # Kanban board + member management
    │   ├── components/
    │   │   └── Navbar.js
    │   └── App.js                   # Router + ProtectedRoute
    └── railway.toml
```

---

## ⚡ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or use Railway's hosted DB)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
# Optional: create .env with REACT_APP_API_URL=http://localhost:5000/api
npm start
```

The app runs on `http://localhost:3000`, proxying API calls to `:5000`.

---

## 🚀 Deployment on Railway

### Step 1 – Push to GitHub
```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Step 2 – Deploy Backend
1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Add PostgreSQL** service → copy the `DATABASE_URL`
3. Click **Deploy from GitHub Repo** → select your repo → set root dir to `backend`
4. Add environment variables:
   - `DATABASE_URL` = (from PostgreSQL service)
   - `JWT_SECRET` = any long random string
   - `FRONTEND_URL` = (your frontend Railway URL, add after)
5. Railway auto-runs `npx prisma migrate deploy && node index.js`

### Step 3 – Deploy Frontend
1. In the same Railway project → **New Service** → GitHub Repo → root dir `frontend`
2. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend.up.railway.app/api`
3. Add `serve` package: `npm install serve` or Railway handles it via `railway.toml`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/projects` | ✅ | My projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | ✅ | Project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove member |
| GET | `/api/tasks/project/:id` | ✅ | Get project tasks |
| POST | `/api/tasks/project/:id` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| GET | `/api/dashboard` | ✅ | Dashboard stats |

---

## 👤 Default Roles

| Feature | Admin | Member |
|---------|-------|--------|
| Create/delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/assign/delete tasks | ✅ | ❌ |
| Update their own task status | ✅ | ✅ |
| View all project tasks | ✅ | ✅ |
| View dashboard | ✅ | ✅ |

---

## 📹 Demo Video

[Link to Loom / YouTube demo] *(Add after recording)*
