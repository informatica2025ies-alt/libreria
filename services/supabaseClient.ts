import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://subaioyyauyaxcspiifm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1YmFpb3l5YXV5YXhjc3BpaWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjU5NTEsImV4cCI6MjA4MDAwMTk1MX0.abr4azy7JFTgJyXufKaMhW1Mq7qrP_YmQ25MOxoxvoc';

export const supabase = createClient(supabaseUrl, supabaseKey);