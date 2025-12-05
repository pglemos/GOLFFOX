import { createClient, SupabaseClient } from '@supabase/supabase-js'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Tipo para o cliente Supabase
type SupabaseClientType = SupabaseClient<Record<string, unknown>>

// Tipo para o fallback mock - expandido para incluir métodos comuns
type MockQueryBuilder = {
  eq: (column: string, value: unknown) => MockQueryBuilder
  gte: (column: string, value: unknown) => MockQueryBuilder
  lte: (column: string, value: unknown) => MockQueryBuilder
  lt: (column: string, value: unknown) => MockQueryBuilder
  neq: (column: string, value: unknown) => MockQueryBuilder
  like: (column: string, pattern: string) => MockQueryBuilder
  ilike: (column: string, pattern: string) => MockQueryBuilder
  is: (column: string, value: unknown) => MockQueryBuilder
  in: (column: string, values: unknown[]) => MockQueryBuilder
  or: (filter: string) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder
  limit: (count: number) => MockQueryBuilder
  range: (from: number, to: number) => MockQueryBuilder
  select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => MockQueryBuilder
  single: () => Promise<{ data: null; error: Error }>
  maybeSingle: () => Promise<{ data: null; error: Error }>
  data: null
  error: Error
  count: number
}

type MockRealtimeChannel = {
  on: (event: 'postgres_changes' | 'presence', filter: any, callback: (payload: any) => void) => MockRealtimeChannel
  subscribe: (callback?: (status: string) => void) => MockRealtimeChannel
  unsubscribe: () => Promise<string>
}

type MockSupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    signInWithPassword: () => Promise<{ data: null; error: Error }>
    signOut: () => Promise<{ error: null }>
    getUser: (token?: string) => Promise<{ data: { user: null }; error: Error }>
    setSession: (session: any) => Promise<{ data: { session: null }; error: null }>
    onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: any }; error: null }
  }
  from: (table: string) => {
    select: (columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => MockQueryBuilder
    insert: (values: unknown) => MockQueryBuilder & { select: (columns?: string) => MockQueryBuilder }
    update: (values: unknown) => MockQueryBuilder & { select: (columns?: string) => MockQueryBuilder }
    upsert: (values: unknown, options?: { onConflict?: string }) => MockQueryBuilder & { select: (columns?: string) => MockQueryBuilder }
    delete: () => MockQueryBuilder
  }
  rpc: (functionName: string, params?: Record<string, unknown>) => Promise<{ data: null; error: Error }>
  channel: (name: string) => MockRealtimeChannel
  removeChannel: (channel: MockRealtimeChannel) => void
}

let supabase: SupabaseClientType | MockSupabaseClient

if (envUrl && envAnon) {
  // Criar cliente com configurações otimizadas
  supabase = createClient<Record<string, unknown>>(envUrl, envAnon, {
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

  const createMockChannel = (): MockRealtimeChannel => {
    const ch: MockRealtimeChannel = {
      on: (_event: 'postgres_changes' | 'presence', _filter: any, _callback: (payload: any) => void) => ch,
      subscribe: (cb?: (status: string) => void) => {
        if (cb) cb('SUBSCRIBED')
        return ch
      },
      unsubscribe: async () => Promise.resolve('ok'),
    }
    return ch
  }

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: mockError }),
      setSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
    },
    from: () => {
      const builder = createMockBuilder()
      return {
        select: () => builder,
        insert: () => ({ ...builder, select: () => builder }),
        update: () => ({ ...builder, select: () => builder }),
        upsert: () => ({ ...builder, select: () => builder }),
        delete: () => builder,
      }
    },
    rpc: async () => ({ data: null, error: mockError }),
    channel: createMockChannel,
    removeChannel: () => {},
  } as MockSupabaseClient
}

export { supabase }
// Tipos do Supabase - importar de types/supabase.ts quando gerados
// Para gerar: npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
export type { Database } from '@/types/supabase'
