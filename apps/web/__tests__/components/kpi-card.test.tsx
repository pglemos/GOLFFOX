import React from 'react'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '@/components/kpi-card'
import { renderWithProviders } from '../../helpers/component-helpers'
import { TrendingUp } from 'lucide-react'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('KpiCard Component', () => {
  it('deve renderizar KPI card', () => {
    renderWithProviders(
      <KpiCard
        icon={TrendingUp}
        label="Viagens Hoje"
        value={10}
      />
    )

    expect(screen.getByText('Viagens Hoje')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('deve exibir hint quando fornecido', () => {
    renderWithProviders(
      <KpiCard
        icon={TrendingUp}
        label="Viagens"
        value={10}
        hint="Últimas 24 horas"
      />
    )

    expect(screen.getByText('Últimas 24 horas')).toBeInTheDocument()
  })

  it('deve exibir trend quando fornecido', () => {
    renderWithProviders(
      <KpiCard
        icon={TrendingUp}
        label="Viagens"
        value={10}
        trend={5}
      />
    )

    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('deve aceitar valor como string', () => {
    renderWithProviders(
      <KpiCard
        icon={TrendingUp}
        label="Custo"
        value="R$ 1.000,00"
      />
    )

    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
  })

  it('deve aceitar className customizada', () => {
    const { container } = renderWithProviders(
      <KpiCard
        icon={TrendingUp}
        label="Teste"
        value={10}
        className="custom-kpi"
      />
    )

    const card = container.querySelector('.custom-kpi')
    expect(card).toBeInTheDocument()
  })
})

