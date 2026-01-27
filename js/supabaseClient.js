import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://kwfhwrerevplenhzqoml.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Zmh3cmVyZXZwbGVuaHpxb21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjgxODYsImV4cCI6MjA4NDcwNDE4Nn0.g88luu8ARt0cCeqdsXDL0xLmZBFsqyDqteRLhrbT7sM'

export const supabase = createClient(supabaseUrl, supabaseKey)