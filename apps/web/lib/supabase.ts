import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Tipo para o cliente Supabase
type SupabaseClientType = SupabaseClient<Database>

// Tipo para o fallback mock - expandido para incluir métodos comuns
type MockQueryBuilder = {
  eq: (column: string, value: unknown) => MockQueryBuilder
  gte: (column: string, value: unknown) => MockQueryBuilder
  lte: (column: string, value: unknown) => MockQueryBuilder
  lt: (column: string, value: unknown) => MockQueryBuilder
  gt: (column: string, value: unknown) => MockQueryBuilder
  neq: (column: string, value: unknown) => MockQueryBuilder
  like: (column: string, pattern: string) => MockQueryBuilder
  ilike: (column: string, pattern: string) => MockQueryBuilder
  is: (column: string, value: unknown) => MockQueryBuilder
  in: (column: string, values: unknown[]) => MockQueryBuilder
  or: (filter: string) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder
  limit: (count: number) => MockQueryBuilder
  range: (from: number, to: number) => MockQueryBuilder
  select: (columns?: string) => MockQueryBuilder
  single: () => Promise<{ data: null; error: Error }>
  maybeSingle: () => Promise<{ data: null; error: Error }>
  data: null
  error: Error
  count: number
}

type MockRealtimeChannel = {
  on: (event: 'postgres_changes' | 'presence' | 'broadcast', filter: any, callback: (payload: any) => void) => MockRealtimeChannel & RealtimeChannel
  subscribe: (callback?: (status: string) => void) => MockRealtimeChannel & RealtimeChannel
  unsubscribe: () => Promise<void>
}

// Type union para canais Realtime
export type RealtimeChannelUnion = MockRealtimeChannel | RealtimeChannel

type MockSupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    signInWithPassword: () => Promise<{ data: null; error: Error }>
    signOut: () => Promise<{ error: null }>
    getUser: (token?: string) => Promise<{ data: { user: null }; error: Error }>
    setSession: (session: any) => Promise<{ data: { session: null }; error: null }>
  }
  from: (table: string) => {
    select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => MockQueryBuilder
    insert: (values: unknown) => MockQueryBuilder
    update: (values: unknown) => MockQueryBuilder
    upsert: (values: unknown, options?: { onConflict?: string }) => MockQueryBuilder
    delete: () => MockQueryBuilder
  }
  channel: (name: string) => MockRealtimeChannel & RealtimeChannel
  removeChannel: (channel: RealtimeChannelUnion) => void
  rpc: (functionName: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>
}

// Tipo union para o cliente Supabase (real ou mock)
export type SupabaseClientUnion = SupabaseClientType | MockSupabaseClient

let supabase: SupabaseClientUnion

if (envUrl && envAnon) {
  // Criar cliente com configurações otimizadas
  supabase = createClient<Database>(envUrl, envAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'golffox-web@1.0.0'
      }
    },
    db: {
      schema: 'public'
    }
  }) as SupabaseClientType

  // Removido: interceptação global do fetch.
  // Motivo: alterar globalThis.fetch mascara erros reais (ex.: net::ERR_ABORTED),
  // dificulta o diagnóstico e pode afetar requisições não-Supabase (HMR, rotas internas).
  // Agora deixamos o cliente Supabase operar com o fetch padrão do ambiente.

} else {
  // Fallback seguro: permite que a UI funcione sem backend configurado
  // Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.
  const mockError = new Error('Supabase não configurado')

  // Criar builder mock recursivo
  const createMockBuilder = (): MockQueryBuilder => {
    const builder = {
      eq: () => builder,
      gte: () => builder,
      lte: () => builder,
      lt: () => builder,
      gt: () => builder,
      neq: () => builder,
      like: () => builder,
      ilike: () => builder,
      is: () => builder,
      in: () => builder,
      or: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      select: () => builder,
      single: async () => ({ data: null, error: mockError }),
      maybeSingle: async () => ({ data: null, error: mockError }),
      data: null,
      error: mockError,
      count: 0,
    }
    return builder
  }

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: mockError }),
      setSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => createMockBuilder(),
      insert: () => createMockBuilder(),
      update: () => createMockBuilder(),
      upsert: () => createMockBuilder(),
      delete: () => createMockBuilder(),
    }),
    channel: () => {
      const ch: MockRealtimeChannel & RealtimeChannel = {
        on: (_event: 'postgres_changes' | 'presence' | 'broadcast', _filter: any, _callback: (payload: any) => void) => ch as MockRealtimeChannel & RealtimeChannel,
        subscribe: (cb?: (status: string) => void) => {
          if (cb) cb('SUBSCRIBED')
          return ch as MockRealtimeChannel & RealtimeChannel
        },
        unsubscribe: async () => { return Promise.resolve() },
      }
      return ch
    },
    removeChannel: () => {},
    rpc: async () => ({ data: null, error: mockError }),
  } as unknown as MockSupabaseClient
}

export { supabase }
// Tipos do Supabase - importar de types/supabase.ts quando gerados
// Para gerar: npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
export type { Database } from '@/types/supabase'
