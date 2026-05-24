// supabase.js

const SUPABASE_URL = 'https://fqxbtojjhpkibixvnbnn.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'ВСТАВЬ_СЮДА_ВЕРХНИЙ_sb_publishable_KEY';

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
