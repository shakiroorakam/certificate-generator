import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// Replace these with your actual Supabase Project URL and API Key
// You can find these in your Supabase project settings under "API"
const supabaseUrl = 'https://uulhedbaojzhsdnidfvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bGhlZGJhb2p6aHNkbmlkZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjMyMjgsImV4cCI6MjA3Njg5OTIyOH0.p1O6MF86HIbuAQfb9I2YKnQ_ByZBEoU1byIQXeiWSa8';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
