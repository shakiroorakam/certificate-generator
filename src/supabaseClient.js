import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// Replace these with your actual Supabase Project URL and API Key
// You can find these in your Supabase project settings under "API"
const supabaseUrl = 'https://uulhedbaojzhsdnidfvt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bGhlZGJhb2p6aHNkbmlkZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjMyMjgsImV4cCI6MjA3Njg5OTIyOH0.p1O6MF86HIbuAQfb9I2YKnQ_ByZBEoU1byIQXeiWSa8';

// Error handling if variables are missing during build/runtime
    if (!supabaseUrl) {
        console.error("Error: REACT_APP_SUPABASE_URL environment variable is not set.");
    }
    if (!supabaseAnonKey) {
        console.error("Error: REACT_APP_SUPABASE_ANON_KEY environment variable is not set.");
    }

    // Initialize Supabase client, checking if keys are present
    export const supabase = (supabaseUrl && supabaseAnonKey)
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null; // Or handle the error appropriately, maybe show a message

    // Optional: Log successful initialization or if keys are missing
    if (supabase) {
        console.log("Supabase client initialized.");
    } else {
        console.error("Supabase client could not be initialized due to missing environment variables.");
        // Consider throwing an error or displaying a user-friendly message
        // throw new Error("Supabase configuration is missing.");
            }