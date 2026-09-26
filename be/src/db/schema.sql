-- Supabase PostgreSQL Schema for Task Scheduler Application

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Drop existing tables (in reverse dependency order) if re-running script
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.daily_updates CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.employee_permissions CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 3. Positions Table
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- 'admin', 'manager', 'tl', 'employee'
    department_id UUID REFERENCES public.departments (id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions (id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES public.employees (id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 5. Employee Permissions Table
CREATE TABLE IF NOT EXISTS public.employee_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    employee_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id, permission_key)
);
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- 6. Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    invited_by_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES public.departments (id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions (id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES public.employees (id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'employee',
    token VARCHAR(255) UNIQUE NOT NULL,
    custom_permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'completed'
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    created_by_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES public.employees (id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments (id) ON DELETE SET NULL,
    due_date DATE,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 8. Daily Task Updates Table
CREATE TABLE IF NOT EXISTS public.daily_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks (id) ON DELETE SET NULL,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours_spent NUMERIC(4, 2) DEFAULT 0,
    summary TEXT NOT NULL,
    blockers TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;

-- 9. Direct & Task Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.employees (id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees (company_id);
CREATE INDEX IF NOT EXISTS idx_employees_reporting ON public.employees (reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks (company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks (assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_daily_updates_employee ON public.daily_updates (employee_id);
CREATE INDEX IF NOT EXISTS idx_messages_task ON public.messages (task_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages (sender_id, receiver_id);