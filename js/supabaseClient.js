import { createClient } from 'https://oypdcjkutcxvwjajvdlc.supabase.co'

const supabaseUrl = 'https://kwfhwrerevplenhzqoml.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cGRjamt1dGN4dndqYWp2ZGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTA4NjksImV4cCI6MjA4NTEyNjg2OX0.ck0javQ16O96xMrDpLAvXLztbCGezYgtWXThYJatO8w'

export const supabase = createClient(supabaseUrl, supabaseKey)