import { POST } from '@/app/api/costs/reconcile/route'
import { createAdminRequest, createOperatorRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any, roles?: string | string[]) => {
    const userRole = req.headers.get('x-user-role')
    if (!userRole) return { json: () => ({ error: 'Unauthorized' }), status: 401 }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (roles && !allowedRoles.includes(userRole)) {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('POST /api/costs/reconcile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve aprovar fatura sem divergência', async () => {
    const invoiceId = 'invoice-123'
    const routeId = 'route-123'
    
    const conciliationData = {
      invoice_id: invoiceId,
      route_id: routeId,
      discrepancy_amount: 10,
      discrepancy_percent: 1,
      notes: null,
    }

    mockSupabaseClient.setTableData('v_costs_conciliation', [conciliationData])
    mockSupabaseClient.setTableData('gf_invoices', [{
      id: invoiceId,
      reconciliation_status: 'pending',
    }])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        invoice_id: invoiceId,
        route_id: routeId,
        action: 'approve',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('approve')
    expect(data.data.has_significant_discrepancy).toBe(false)
  })

  it('deve rejeitar fatura com divergência significativa', async () => {
    const invoiceId = 'invoice-123'
    
    const conciliationData = {
      invoice_id: invoiceId,
      discrepancy_amount: 500,
      discrepancy_percent: 10,
    }

    mockSupabaseClient.setTableData('v_costs_conciliation', [conciliationData])
    mockSupabaseClient.setTableData('gf_invoices', [{
      id: invoiceId,
      reconciliation_status: 'pending',
    }])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        invoice_id: invoiceId,
        action: 'reject',
        notes: 'Divergência muito alta',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('reject')
    expect(data.data.has_significant_discrepancy).toBe(true)
  })

  it('deve validar permissões (operador ou admin)', async () => {
    const req = createOperatorRequest('company-1', {
      method: 'POST',
      body: {
        invoice_id: 'invoice-123',
        action: 'approve',
      },
    })

    // Deve permitir operador
    const response = await POST(req)
    expect([200, 404]).toContain(response.status) // 404 se não encontrar dados
  })

  it('deve validar schema Zod', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        invoice_id: 'invalid-uuid',
        action: 'approve',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve retornar 404 se dados de conciliação não encontrados', async () => {
    mockSupabaseClient.setTableData('v_costs_conciliation', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        invoice_id: '00000000-0000-0000-0000-000000000000',
        action: 'approve',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Dados de conciliação não encontrados')
  })
})

