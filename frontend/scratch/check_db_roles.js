global.WebSocket = class {}; // Mock WebSocket to avoid Node 18 Supabase Realtime crash

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRoles() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*');

  if (error) {
    console.error('Error fetching user roles:', error);
  } else {
    console.log('User Roles in DB:', data);
  }
}

checkRoles();
