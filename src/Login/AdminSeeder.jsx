import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

const AdminSeeder = () => {
  const [status, setStatus] = useState('Initializing push...');
  const navigate = useNavigate();

  useEffect(() => {
    const runSeed = async () => {
      try {
        const email = 'admin@gmail.com';
        const password = 'admin@123';

        setStatus('Pushing to Auth...');
        const { data: signUpData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        let uid = signUpData?.user?.id;

        if (signupError && signupError.message.includes('already registered')) {
          setStatus('Account already exists in Auth. Checking database link...');
          // We still need the UID. Let's try to sign in to get it.
          const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
          uid = signInData?.user?.id;
        }

        if (uid) {
          setStatus('Linking to tbl_admin...');
          await supabase.from('tbl_admin').upsert({
            admin_id: uid,
            admin_name: 'System Admin',
            admin_email: email,
            admin_photo: 'https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff'
          });
          setStatus('🎉 SUCCESS! Admin pushed to database.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('Error: Could not retrieve User ID. ' + (signupError?.message || 'Check Supabase logs.'));
        }
      } catch (err) {
        setStatus('Failed: ' + err.message);
      }
    };

    runSeed();
  }, [navigate]);

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: '#0f172a', color: '#10b981', fontFamily: 'Inter, sans-serif' 
    }}>
      <div style={{ textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '20px', border: '1px solid #10b981' }}>
        <h2 style={{ marginBottom: '20px' }}>Database Admin Seeder</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
        <p style={{ marginTop: '20px', color: '#64748b', fontSize: '12px' }}>Redirecting to login shortly...</p>
      </div>
    </div>
  );
};

export default AdminSeeder;
