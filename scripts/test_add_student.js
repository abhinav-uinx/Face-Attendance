import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxpjyeztoyxbxrwrnmuw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B639gO1DxpASR4IPl7sMcQ_imO8oaXu';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAddStudent() {
  // Let's test departments, programmes, years to find IDs
  const { data: depts } = await supabase.from('tbl_department').select('*');
  const { data: progs } = await supabase.from('tbl_programme').select('*');
  const { data: years } = await supabase.from('tbl_year').select('*');

  console.log("Departments:", depts);
  console.log("Programmes:", progs);
  console.log("Years:", years);

  // Let's test insert
  const payload = {
    student_id: 22002134644,
    student_name: 'Abhinav Mani',
    stud_contact: '07994290394',
    stud_password: 'password123',
    stud_email: 'abhinavmani1994@gmail.com',
    year_id: years?.[0]?.year_id || 1,
    department_id: depts?.[0]?.department_id || 1,
    programme_id: progs?.[0]?.programme_id || 1,
    stud_gender: 'Male',
    stud_photo: null
  };

  console.log("\nAttempting insert with payload:", payload);
  const { data, error } = await supabase.from('tbl_student').insert([payload]).select();
  console.log("Insert result:", data, "Error:", error);

  // Also test uploading to "attendance" bucket without authentication
  const buffer = Buffer.from('fake image content');
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('attendance')
    .upload(`students/test_${Date.now()}.jpg`, buffer, { upsert: true });

  console.log("Storage upload to 'attendance':", uploadData, "Upload error:", uploadErr);
}

testAddStudent();
