# 📋 TaskBoard — Plan • Assign • Track • Grow

**TaskBoard** is a modern, enterprise-grade Task Scheduling, Workforce Management, and Real-Time Collaboration Application built with **React 19**, **Node.js / Express.js**, and **Supabase PostgreSQL**.

---

## 🔗 Quick Links

- 💻 **GitHub Repository**: [https://github.com/surajit21102004/task-scheduler.git](https://github.com/surajit21102004/task-scheduler.git)
- 🌐 **Live Vercel Deployment**: [https://task-scheduler-theta-ten.vercel.app](https://task-scheduler-theta-ten.vercel.app)

---

## 💡 The Main Idea & Architecture

In modern workforce management, teams need a unified platform to assign tasks, track daily work progress, communicate in real time, and analyze performance without context switching.

**TaskBoard** solves this by uniting:
1. **Multi-Tenant Company Workspaces**: Independent companies register their workspace with custom logos, departments, and positions.
2. **Granular Role-Based Control (RBAC)**: Admins, Managers, and Employees operate with custom permission matrices (`view_all_tasks`, `view_subordinate_tasks`, `send_messages`, etc.).
3. **Interactive Task Board**: Kanban columns (To Do, In Progress, Review, Completed) and List views with priority tags, due dates, and file attachments.
4. **Daily Work Update Approval System**: Employees submit daily work hours, completed tasks, and blockers; Managers review and approve/reject logs.
5. **Real-Time WebSocket Messaging**: Instant direct employee chat and task discussion threads powered by **Supabase Realtime WebSockets**.
6. **Executive Performance Analytics**: Recharts visual pie charts and top performer completion leaderboards.
7. **Virtual Employee ID Card**: Official digital identity pass with card flip, QR code, and print capability.

---

## 🛠️ Technology Stack

| Layer | Technology Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS v4, Lucide React Icons, Recharts, React Hot Toast |
| **Backend API** | Node.js, Express.js (MVC Pattern), JWT Authentication, Bcrypt, Nodemailer |
| **Database & WebSockets** | Supabase PostgreSQL DB, Supabase Realtime Channels, PostgREST API |
| **Hosting & Deployment** | Vercel (Unified Monorepo: `@vercel/static-build` + `@vercel/node`) |

---

## 📂 Detailed Project Structure

```text
task-scheduler/
├── package.json                   # Root monorepo dependency config for Vercel
├── vercel.json                     # Monorepo routing, static asset headers & rewrite rules
├── README.md                       # Project documentation
│
├── api/                            # Vercel Serverless Function Entrypoint
│   └── index.js                    # Imports Express app from be/src/app.js
│
├── fe/                             # React 19 Frontend Application
│   ├── index.html                  # HTML entry point with Task Board title & logo favicon
│   ├── vite.config.js              # Vite build config with Rollup manualChunks splitting
│   ├── package.json                # Frontend dependencies (@supabase/supabase-js, recharts, etc.)
│   └── src/
│       ├── main.jsx                # React DOM render entry
│       ├── App.jsx                 # Main SPA Router & Modal Manager (Reload-free UI state)
│       ├── index.css               # Global TailwindCSS v4 stylesheet
│       ├── config/
│       │   └── supabaseClient.js   # Supabase Realtime WebSocket client instance
│       ├── context/
│       │   └── AuthContext.jsx     # Global JWT authentication & RBAC permission state
│       ├── services/
│       │   └── api.js              # Axios HTTP client with JWT Bearer Token interceptor
│       ├── components/
│       │   ├── Navbar.jsx          # Top branding bar, Company Logo & Virtual ID button
│       │   ├── Sidebar.jsx         # Navigation menu & badge indicators
│       │   ├── TaskModal.jsx       # Create/Edit task modal with attachment uploads
│       │   ├── TaskDetailModal.jsx # Detailed task drawer with instructions & status updates
│       │   ├── DailyUpdateModal.jsx# Submit daily work updates & logged hours
│       │   ├── InviteModal.jsx     # Send employee email invitations with permission matrices
│       │   ├── ChatDrawer.jsx      # Real-time task discussion comments
│       │   ├── VirtualIdCardModal.jsx # Metallic digital employee pass with QR code & print
│       │   └── SearchableSelect.jsx# Filterable dropdown select component
│       └── pages/
│           ├── DashboardView.jsx   # Executive overview & recent updates feed
│           ├── TaskBoardView.jsx   # Kanban & List task management board
│           ├── DailyUpdatesLogView.jsx # Daily work update logs & approval buttons
│           ├── WorkplaceMessagesView.jsx # Instant direct WebSocket employee chat
│           ├── ReportsView.jsx     # Recharts visual analytics & rank leaderboards
│           ├── OrgHierarchyView.jsx # Organizational chart & employee directory
│           ├── PermissionsMatrixView.jsx # Granular role permission management
│           ├── CompanyProfileView.jsx # Company workspace profile & departments
│           ├── LoginPage.jsx       # User login page
│           ├── RegisterPage.jsx    # Company registration & admin setup
│           └── JoinPage.jsx        # Employee invitation acceptance page
│
└── be/                             # Node.js / Express.js Backend API
    ├── package.json                # Backend dependencies (express, supabase-js, bcryptjs, etc.)
    ├── .env.example                # Environment variables template
    └── src/
        ├── server.js               # Express server listener (Local Port 5000)
        ├── app.js                  # Express app setup, CORS, routes & global error handler
        ├── config/
        │   └── supabase.js         # Supabase Admin client setup
        ├── db/
        │   ├── schema.sql          # Complete PostgreSQL Database Schema & SQL tables
        │   └── updateSchema.js     # DB migration helper script
        ├── middleware/
        │   ├── auth.js             # JWT authentication middleware
        │   ├── permission.js       # Granular permission check middleware
        │   └── security.js         # Security headers & global error handler
        ├── routes/                 # Express API routes
        │   ├── auth.routes.js
        │   ├── company.routes.js
        │   ├── employee.routes.js
        │   ├── permission.routes.js
        │   ├── task.routes.js
        │   ├── update.routes.js
        │   ├── message.routes.js
        │   └── dashboard.routes.js
        └── controllers/            # Controller business logic
            ├── authController.js
            ├── companyController.js
            ├── employeeController.js
            ├── permissionController.js
            ├── taskController.js
            ├── updateController.js
            ├── messageController.js
            └── dashboardController.js
```

---

## ⚡ How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase Project ([supabase.com](https://supabase.com))

---

### Step 1: Database Setup
1. Log into your **Supabase Dashboard** and open the **SQL Editor**.
2. Copy the contents of `be/src/db/schema.sql` and run it to create all tables (`companies`, `employees`, `departments`, `positions`, `employee_permissions`, `tasks`, `daily_updates`, `workplace_messages`, `invitations`).

---

### Step 2: Backend Setup (`be/`)
```bash
# Navigate to backend directory
cd be

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Fill in your `.env` configuration:
```env
PORT=5000
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_key
SUPABASE_SECRET_KEY=sb_secret_key
JWT_SECRET=super_secret_jwt_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```
Backend API will start at `http://127.0.0.1:5000`.

---

### Step 3: Frontend Setup (`fe/`)
```bash
# Navigate to frontend directory
cd fe

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend application will start at `http://127.0.0.1:5173`.

---

## 🌐 Deploying to Vercel

1. Push your repository to **GitHub**:
   ```bash
   git push origin main
   ```
2. Import your repository into **Vercel** ([vercel.com](https://vercel.com)).
3. In **Vercel Project Settings ➔ Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `NODE_ENV=production`
4. Click **Deploy**. Vercel will automatically build the static frontend (`fe/`) and serverless function backend (`api/index.js`).

---

## 📄 License
This project is open source and available under the **MIT License**.
