import { DELETE, PATCH } from '@/app/api/admin/veiculos/[vehicleId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestVehicle } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('DELETE /api/admin/veiculos/[vehicleId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NODE_ENV = 'test'
  })

  it('deve excluir veículo sem viagens associadas', async () => {
    const veiculo = createTestVehicle('transportadora-1', { plate: 'ABC1234' })
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('gf_vehicle_maintenance', [])
    mockSupabaseClient.setTableData('gf_veiculo_checklists', [])

    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: veiculo.id }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve arquivar veículo com viagens associadas', async () => {
    const veiculo = createTestVehicle('transportadora-1', { plate: 'ABC1234' })
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', veiculo_id: veiculo.id },
    ])

    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: veiculo.id }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.archived).toBe(true)
  })

  it('deve rejeitar se veículo não encontrado', async () => {
    mockSupabaseClient.setTableData('veiculos', [])

    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('veiculo not found')
  })

  it('deve validar UUID do vehicleId', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: 'invalid-uuid' }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('invalid_vehicle_id_format')
  })
})

describe('PATCH /api/admin/veiculos/[vehicleId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar veículo', async () => {
    const veiculo = createTestVehicle('transportadora-1', { plate: 'ABC1234' })
    mockSupabaseClient.setTableData('veiculos', [veiculo])

    const req = createAdminRequest({
      method: 'PATCH',
      body: {
        plate: 'XYZ5678',
        model: 'Modelo Atualizado',
        is_active: false,
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: veiculo.id }),
    }

    const response = await PATCH(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.plate).toBe('XYZ5678')
  })

  it('deve rejeitar campos não permitidos', async () => {
    const veiculo = createTestVehicle('transportadora-1')
    mockSupabaseClient.setTableData('veiculos', [veiculo])

    const req = createAdminRequest({
      method: 'PATCH',
      body: {
        invalid_field: 'value',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: veiculo.id }),
    }

    const response = await PATCH(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('no_fields_to_update')
  })

  it('deve validar UUID do vehicleId', async () => {
    const req = createAdminRequest({
      method: 'PATCH',
      body: {
        plate: 'ABC1234',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ vehicleId: 'invalid-uuid' }),
    }

    const response = await PATCH(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('invalid_vehicle_id_format')
  })
})

