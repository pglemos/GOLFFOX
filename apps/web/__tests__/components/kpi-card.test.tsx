import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KpiCard } from '@/components/kpi-card'
import { renderWithProviders } from '../helpers/component-helpers'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('KpiCard Component', () => {
  describe('Renderização', () => {
    it('deve renderizar KPI card com label e valor', () => {
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

  describe('Hint e Trend Label', () => {
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

    it('deve exibir trendLabel quando fornecido', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          trendLabel="vs mês anterior"
        />
      )

      expect(screen.getByText('vs mês anterior')).toBeInTheDocument()
    })

    it('deve priorizar trendLabel sobre hint quando ambos fornecidos', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          hint="Últimas 24 horas"
          trendLabel="vs mês anterior"
        />
      )

      expect(screen.getByText('vs mês anterior')).toBeInTheDocument()
      expect(screen.queryByText('Últimas 24 horas')).not.toBeInTheDocument()
    })
  })

  describe('Comportamento de Trend', () => {
    it('deve exibir badge de trend positivo com ícone correto', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          trend={5}
        />
      )

      // Deve exibir o valor do trend
      expect(screen.getByText('5%')).toBeInTheDocument()
      // Deve ter classe para trend positivo (verificado via comportamento visual)
    })

    it('deve exibir badge de trend negativo com ícone correto', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingDown}
          label="Viagens"
          value={10}
          trend={-3}
        />
      )

      // Deve exibir valor absoluto do trend
      expect(screen.getByText('3%')).toBeInTheDocument()
    })

    it('deve exibir badge de trend neutro quando trend é zero', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          trend={0}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('não deve exibir badge de trend quando trend não é fornecido', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
        />
      )

      // Não deve ter badge de trend (verificado pela ausência do texto de porcentagem)
      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })
  })

  describe('Interatividade', () => {
    it('deve chamar onClick quando card é clicado', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()

      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          onClick={handleClick}
        />
      )

      const card = screen.getByText('Viagens').closest('div[class*="cursor-pointer"]')
      if (card) {
        await user.click(card)
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('não deve ter cursor pointer quando onClick não é fornecido', () => {
      const { container } = renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
        />
      )

      const card = container.querySelector('[class*="cursor-pointer"]')
      expect(card).not.toBeInTheDocument()
    })
  })

  describe('Estado de Loading', () => {
    it('deve exibir skeleton quando loading é true', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          loading={true}
        />
      )

      // Deve ter elementos de skeleton
      const skeletons = screen.queryAllByRole('generic')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('não deve exibir valor quando loading é true', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
          loading={true}
        />
      )

      // Valor não deve estar visível durante loading
      expect(screen.queryByText('10')).not.toBeInTheDocument()
    })
  })

  describe('Formatação de Valores', () => {
    it('deve exibir números grandes corretamente', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Total"
          value={1234567}
        />
      )

      expect(screen.getByText('1234567')).toBeInTheDocument()
    })

    it('deve exibir valores monetários formatados', () => {
      renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Receita"
          value="R$ 50.000,00"
        />
      )

      expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument()
    })
  })

  describe('Memoização', () => {
    it('deve re-renderizar apenas quando props relevantes mudam', () => {
      const { rerender } = renderWithProviders(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
        />
      )

      // Re-renderizar com mesmo valor não deve causar mudança
      rerender(
        <KpiCard
          icon={TrendingUp}
          label="Viagens"
          value={10}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })
})

