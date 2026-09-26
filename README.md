# TaskBoard - Full-Stack Task Scheduler & Hierarchy Management Application

A modern, enterprise-grade Task Board & Workforce Management System built with **React.js** (Frontend), **Node.js / Express.js** (Backend API), and **Supabase PostgreSQL** (Database & Realtime Services).

---

## 🚀 Key Features

- **Company Registration & Multi-Tenant Branding**: Register new companies with custom logos and name branding.
- **Flexible Organizational Hierarchy**: Unlimited nested structure (Company → Manager → Team Lead → Employee).
- **Email Invitations**: Nodemailer integration with custom granular permission matrices.
- **Task Kanban Board & List Views**: Create, assign, drag-and-drop status changes, due dates, priority tags, and file attachments.
- **Task Detail & Attachment Pass**: Detailed modal view for instructions, file downloads, and embedded discussion comments.
- **Daily Work Updates Log**: Daily progress tracking with hours logged, blockers, and Admin/Manager approval workflows.
- **Workplace Direct Messaging**: Direct employee chat and discussion threads with unread notification badge & database message deletion.
- **Executive Performance Reports**: Recharts visual analytics (Pie Chart & Bar Chart) with rank-wise employee leaderboards.
- **Virtual Employee ID Card**: Official digital identity pass with card flip, QR code, and print support.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TailwindCSS v4, Lucide React Icons, Recharts, React Hot Toast.
- **Backend**: Node.js, Express.js (MVC Pattern), JWT Authentication, Bcrypt password hashing, Nodemailer.
- **Database**: Supabase PostgreSQL DB with Row Level Security (RLS) policies.

---

## 📂 Project Structure

```text
task-scheduler/
 ├── fe/               # React.js Frontend Application
 └── be/               # Node.js + Express.js Backend API
```

---

## 💻 Getting Started

### 1. Backend Setup (`be/`)

```bash
cd be
npm install
cp .env.example .env
# Fill in your Supabase & Nodemailer credentials in .env
npm run dev
```

### 2. Frontend Setup (`fe/`)

```bash
cd fe
npm install
npm run dev
```

The frontend will start at `http://127.0.0.1:5173` and backend API at `http://127.0.0.1:5000`.

---

## 📜 Database Schema Setup

To initialize the Supabase PostgreSQL database tables and relationships, execute the SQL script in `be/src/db/schema.sql` inside your Supabase Dashboard SQL Editor.
