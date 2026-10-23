-- =========================================================================
-- Face-Attendance IAM: Admin & Analytics Schema Enhancements
-- Adds enterprise audit columns, device metrics, and index optimizations
-- =========================================================================

-- 1. Extend tbl_admin with audit & profile attributes
alter table if exists public.tbl_admin
  add column if not exists role text not null default 'SuperAdmin',
  add column if not exists phone text,
  add column if not exists last_login timestamptz default now(),
  add column if not exists created_at timestamptz not null default now();

-- 2. Extend tbl_attendance with verification confidence & device telemetry
alter table if exists public.tbl_attendance
  add column if not exists confidence_score numeric default 0.98,
  add column if not exists device_info text default 'Browser Kiosk (Face-API)',
  add column if not exists verified_by text default 'Biometric Neural Net';

-- 3. Extend tbl_student with status & enrollment identifiers
alter table if exists public.tbl_student
  add column if not exists status text not null default 'Active',
  add column if not exists registered_at timestamptz default now();

-- 4. Extend tbl_tutor with last_active tracking
alter table if exists public.tbl_tutor
  add column if not exists status text not null default 'Active',
  add column if not exists last_login timestamptz default now();

-- 5. Performance Indexes for Rapid Daily Dashboard Querying
create index if not exists tbl_attendance_date_idx on public.tbl_attendance(attendance_date desc);
create index if not exists tbl_attendance_student_status_idx on public.tbl_attendance(student_id, status);
create index if not exists tbl_admin_email_role_idx on public.tbl_admin(admin_email, role);

-- 6. Ensure default system admin record exists
insert into public.tbl_admin (admin_id, admin_name, admin_email, admin_password, admin_photo, role)
values (
  '9bd53015-514d-4ca7-9e5a-9390706c13e7',
  'System Administrator',
  'admin@gmail.com',
  'admin@123',
  'https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff',
  'SuperAdmin'
)
on conflict (admin_id) do update set
  admin_email = excluded.admin_email,
  admin_password = excluded.admin_password,
  role = excluded.role;
