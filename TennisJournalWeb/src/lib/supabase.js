import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vtbqxjgflojfccyusopt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0YnF4amdmbG9qZmNjeXVzb3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjYzNDgsImV4cCI6MjA5NzEwMjM0OH0.nPmblGYXsAcLdAlkYyNH_6cAB2_MdcgQxfkzK8FaSok',
  { auth: { flowType: 'pkce' } }
);

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
