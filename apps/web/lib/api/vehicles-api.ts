/**
 * Serviços de API para gerenciamento de veículos
 * Centraliza todas as chamadas relacionadas a veículos
 */

import { fetchWithAuth } from '../fetch-with-auth'

export interface Vehicle {
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

export interface VehicleInsert {
  plate: string
  model: string
  year: number | null
  capacity: number | null
  prefix?: string | null
  company_id?: string | null
  transportadora_id?: string | null
  is_active?: boolean
  photo_url?: string | null
}

export interface VehicleUpdate extends Partial<VehicleInsert> {
  id: string
}

export interface VehicleResponse {
  success: boolean
  data?: Vehicle
  error?: string
}

export interface UploadPhotoResponse {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload de foto de veículo
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  file: File
): Promise<UploadPhotoResponse> {
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'veiculo-photos')
    form.append('folder', 'veiculos')
    form.append('entityId', vehicleId)

    const response = await fetchWithAuth('/api/upload', {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        success: false,
        error: err.error || 'Erro ao fazer upload',
      }
    }

    const result = await response.json()
    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer upload',
    }
  }
}

/**
 * Criar um novo veículo
 */
export async function createVehicle(
  payload: VehicleInsert
): Promise<VehicleResponse> {
  try {
    const response = await fetchWithAuth('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao criar veículo',
      }
    }

    return {
      success: true,
      data: result.data || result.veiculo,
    }
  } catch (error) {
    console.error('Erro ao criar veículo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar veículo',
    }
  }
}

/**
 * Atualizar um veículo existente
 */
export async function updateVehicle(
  id: string,
  payload: Partial<VehicleInsert>
): Promise<VehicleResponse> {
  try {
    const response = await fetchWithAuth(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao atualizar veículo',
      }
    }

    return {
      success: true,
      data: result.data || result.veiculo,
    }
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar veículo',
    }
  }
}

/**
 * Buscar informações do usuário para determinar company_id/transportadora_id
 */
export async function getUserInfo(): Promise<{
  role?: string
  company_id?: string
  transportadora_id?: string
}> {
  try {
    const { supabase } = await import('../supabase')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {}
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role, company_id, transportadora_id')
      .eq('id', session.user.id)
      .single()

    if (error || !userData) {
      return {}
    }

    return {
      role: userData.role,
      company_id: userData.company_id,
      transportadora_id: userData.transportadora_id,
    }
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error)
    return {}
  }
}

