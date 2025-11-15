/**
 * Tipos do Supabase
 * 
 * Para gerar tipos atualizados, execute:
 * npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 * 
 * Ou usando a URL do projeto:
 * npx supabase gen types typescript --project-id $(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||') > types/supabase.ts
 */

// Placeholder para tipos do Supabase
// Substitua este arquivo com os tipos gerados do seu projeto Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

