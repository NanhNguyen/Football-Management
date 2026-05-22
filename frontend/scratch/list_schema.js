const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envUrl = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const envKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(envUrl, envKey);

async function checkSchema() {
  // Let's query one row from each table to inspect fields
  for (const table of ['doi_bong', 'tran_dau', 'cau_thu', 'su_kien']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
    } else {
      console.log(`Table ${table} sample keys:`, data && data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }
  }
}

checkSchema();
