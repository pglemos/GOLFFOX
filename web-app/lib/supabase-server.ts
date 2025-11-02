import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service_role para operações server-side
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export { supabaseServiceRole }

