/**
 * Índice de tipos centralizados
 * 
 * Exporta todos os tipos do projeto para facilitar importação.
 * Use: import { Veiculo, Motorista, ... } from '@/types'
 */

// Entidades principais
export * from './entities'

// Custos e finanças
export * from './costs'

// Contratos
export * from './contracts'

// Notificações
export * from './notifications'

// Dashboard
export * from './dashboard'

// Mapa
export * from './map'

// Carrier/Transportadora
export * from './carrier'

// API Response types
export type { Database } from './supabase'

// Re-export dos tipos de supabase-data se existir
export type {
  SupabaseRoute,
  SupabaseStopWithRoute,
  SupabaseTripWithDates,
  SupabaseVeiculo,
} from './supabase-data'

