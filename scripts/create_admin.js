import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxpjyeztoyxbxrwrnmuw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B639gO1DxpASR4IPl7sMcQ_imO8oaXu'; // Your key from .env

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin@123';
  const name = 'System Admin';

  console.log(`🚀 Attempting to register admin: ${email}...`);

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('✅ Auth account already exists.');
      // If user exists, we can't get their ID without being logged in or using service key.
      // We will assume they need to log in to link the profile if it's missing.
      console.log('Please log in once with these credentials to finalize the profile.');
      return;
    } else {
      console.error('❌ Auth Error:', authError.message);
      return;
    }
  }

  const userId = authData?.user?.id;
  if (!userId) {
    console.log('⚠️ Signup successful but no User ID returned. Check your email for a confirmation link.');
    return;
  }

  // 2. Create the profile in tbl_admin
  const { error: dbError } = await supabase
    .from('tbl_admin')
    .upsert({
      admin_id: userId,
      admin_name: name,
      admin_email: email,
      admin_photo: 'https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff'
    });

  if (dbError) {
    console.error('❌ Database Error:', dbError.message);
  } else {
    console.log('🎉 Admin profile created successfully!');
    console.log('--------------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('--------------------------------------------------');
    console.log('IMPORTANT: Please check your email inbox to confirm the account.');
  }
}

createAdmin();
