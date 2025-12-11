import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RouteModal } from '../components/modals/route-modal'

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  success: jest.fn(),
  error: jest.fn(),
}))

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ error: null }),
    rpc: jest.fn(),
    channel: jest.fn().mockReturnValue({ on: jest.fn().mockReturnThis(), subscribe: jest.fn(), }),
    removeChannel: jest.fn(),
  }
}))

describe('RouteModal generator integration', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stops: [], gfRoutePlan: [] })
    })
  })

  it('calls generate-stops API when clicking Gerar Pontos', async () => {
    const onSave = jest.fn()
    const onClose = jest.fn()
    const onGenerateStops = jest.fn()

    render(
      <RouteModal
        route={{ id: 'route-123', name: 'Rota X', company_id: 'comp-1' }}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        onGenerateStops={onGenerateStops}
      />
    )

    const btn = await screen.findByText('Gerar Pontos')
    fireEvent.click(btn)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/generate-stops', expect.objectContaining({ method: 'POST' }))
  })
})


