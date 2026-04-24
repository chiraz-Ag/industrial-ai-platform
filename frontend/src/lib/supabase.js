import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://larthtdtxbgsmkugqqis.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcnRodGR0eGJnc21rdWdxcWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTgyODUsImV4cCI6MjA5MjM3NDI4NX0.LX5FeClf_jWi4XDSeqIiqguzjIzI3eHFwXuZuAhXNfM"; // ← mets ton anon key ici

export const supabase = createClient(supabaseUrl, supabaseKey);