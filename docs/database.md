# Database Setup

This project uses Supabase. The frontend is configured with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Create Tables

Open [20250525041805_initial_schema.sql](../supabase/migrations/20250525041805_initial_schema.sql), paste it into the Supabase SQL editor for your project, and run it.

The SQL creates the tables used by the React code:

- `tbl_admin`
- `tbl_department`
- `tbl_designation`
- `tbl_year`
- `tbl_programme`
- `tbl_student`
- `tbl_tutor`
- `tbl_attendance`
- `tbl_complaints`

It also creates the required storage buckets:

- `admin`
- `attendance`
- `tutor`

## Seed

Run [seed.sql](../supabase/seed.sql) after the schema if you want the default designation rows. The app checks `designation_id = 100` for HOD users.

## Note

The current policies are permissive so the existing frontend works. Tighten RLS before storing real attendance or profile data.
