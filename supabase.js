// supabase.js

const SUPABASE_URL = 'https://fqxbtojjhpkibixvnbnn.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_0F-CDySnOiJYUdAr8khcJA_QiZc6J2y';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
