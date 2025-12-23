/**
 * Tipos centralizados para entidades do sistema GolfFox
 * 
 * Este arquivo centraliza todas as interfaces de entidades para evitar duplicação
 * e garantir consistência de tipos em todo o projeto.
 */

// ============================================================================
// VEÍCULO
// ============================================================================

/**
 * Veículo base - campos comuns a todas as variações
 */
export interface VeiculoBase {
  id: string
  plate: string
  model: string
  year?: number
  capacity?: number
  prefix?: string
  photo_url?: string | null
  is_active?: boolean
}

/**
 * Veículo para formulários de criação/edição
 */
export interface VeiculoForm {
  id?: string
  plate: string
  model: string
  year: number | string
  capacity: number | string
  prefix?: string
  company_id?: string
  transportadora_id?: string
  is_active?: boolean
  photo_url?: string | null
}

/**
 * Veículo com dados da transportadora
 */
export interface VeiculoWithCarrier extends VeiculoBase {
  transportadora_id?: string
  carrier_name?: string
}

/**
 * Veículo para exibição em mapas
 */
export interface VeiculoMapItem {
  id: string
  plate: string
  lat: number
  lng: number
  status: 'on_route' | 'available' | 'delayed' | 'moving' | 'stopped_short' | 'stopped_long' | 'garage'
}

/**
 * Veículo para seleção em picker/modal
 */
export interface VeiculoPicker {
  id: string
  plate: string
  model: string
  capacity: number
  status: string
  is_active: boolean
}

/**
 * Veículo para manutenção
 */
export interface VeiculoMaintenance {
  id: string
  plate: string
  model: string
}

// ============================================================================
// MOTORISTA
// ============================================================================

/**
 * Motorista base - campos comuns
 */
export interface MotoristaBase {
  id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  role: string
  is_active?: boolean
}

/**
 * Motorista para formulários de criação/edição
 */
export interface MotoristaForm {
  id?: string
  name: string
  email: string
  phone?: string
  cpf?: string
  rg?: string
  cnh?: string
  cnh_category?: string
  role: string
  transportadora_id?: string
  is_active?: boolean
}

/**
 * Motorista com dados da transportadora
 */
export interface MotoristaWithCarrier extends MotoristaBase {
  transportadora_id?: string
  transportadora_name?: string
}

/**
 * Motorista para seleção em picker/modal
 */
export interface MotoristaPicker {
  id: string
  name: string
  cpf: string
  documents_valid: boolean
  rating?: number
}

/**
 * Motorista para mensagens
 */
export interface MotoristaMessage {
  id: string
  name: string
  is_online: boolean
  last_message?: string
}

// ============================================================================
// USUÁRIO
// ============================================================================

/**
 * Roles disponíveis no sistema
 * Atualizado em 2025-01-29: empresa → gestor_empresa, operador → gestor_transportadora, transportadora removido
 */
export type UserRole = 'admin' | 'gestor_empresa' | 'gestor_transportadora' | 'motorista' | 'passageiro'

/**
 * Usuário base
 */
export interface UserBase {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string | null
  is_active?: boolean
}

/**
 * Usuário com dados de empresa/transportadora
 */
export interface UserWithCompany extends UserBase {
  company_id?: string
  transportadora_id?: string
  company_name?: string
  transportadora_name?: string
}

/**
 * Usuário para autenticação
 */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name?: string
  avatar_url?: string | null
  company_id?: string
  transportadora_id?: string
  accessToken?: string
}

// ============================================================================
// EMPRESA (COMPANY)
// ============================================================================

/**
 * Empresa base
 */
export interface CompanyBase {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  is_active?: boolean
}

/**
 * Empresa com endereço
 */
export interface CompanyWithAddress extends CompanyBase {
  address?: string
  address_zip_code?: string
  address_street?: string
  address_number?: string
  address_neighborhood?: string
  address_complement?: string
  address_city?: string
  address_state?: string
}

// ============================================================================
// ROTA
// ============================================================================

/**
 * Rota base
 */
export interface RouteBase {
  id: string
  name: string
  company_id?: string
  transportadora_id?: string
  is_active?: boolean
}

/**
 * Rota para listagem
 */
export interface RouteListItem extends RouteBase {
  company_name?: string
  transportadora_name?: string
  stops_count?: number
  origin_address?: string
  destination_address?: string
}

/**
 * Ponto de rota
 */
export interface RoutePoint {
  lat: number
  lng: number
  address?: string
  stop_name?: string
  passenger_name?: string
  estimated_arrival?: string
}

// ============================================================================
// VIAGEM (TRIP)
// ============================================================================

/**
 * Status de viagem
 */
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Viagem base
 */
export interface TripBase {
  id: string
  route_id: string
  veiculo_id?: string
  motorista_id?: string
  status: TripStatus
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
}

// ============================================================================
// ALERTA
// ============================================================================

/**
 * Severidade de alerta
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Tipo de alerta
 */
export type AlertType = 'incident' | 'assistance' | 'document_expiring' | 'route_deviation' | 'performance' | 'other'

/**
 * Alerta base
 */
export interface AlertBase {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  is_resolved: boolean
  created_at: string
  resolved_at?: string
}

// ============================================================================
// DOCUMENTO
// ============================================================================

/**
 * Status de documento
 */
export type DocumentStatus = 'valid' | 'expired' | 'pending' | 'rejected'

/**
 * Nível de alerta de documento
 */
export type DocumentAlertLevel = 'ok' | 'warning' | 'critical' | 'expired'

/**
 * Documento base
 */
export interface DocumentBase {
  id: string
  document_type: string
  document_number?: string | null
  expiry_date?: string | null
  issue_date?: string | null
  file_url?: string | null
  file_name?: string | null
  status: DocumentStatus
}

// ============================================================================
// CUSTO
// ============================================================================

/**
 * Status de custo
 */
export type CostStatus = 'pending' | 'confirmed' | 'cancelled'

/**
 * Custo manual
 */
export interface ManualCostEntry {
  id: string
  company_id?: string
  route_id?: string
  veiculo_id?: string
  motorista_id?: string
  cost_category_id: string
  date: string
  amount: number
  qty?: number | null
  unit?: string | null
  notes?: string | null
  source: 'manual' | 'import' | 'api'
  status: CostStatus
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

/**
 * Resposta paginada da API
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Opção para selects/dropdowns
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Filtros de período
 */
export type PeriodFilter = 'today' | 'week' | 'month' | 'custom'

/**
 * Direção de ordenação
 */
export type SortDirection = 'asc' | 'desc'

