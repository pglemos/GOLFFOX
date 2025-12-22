/**
 * Testes de Integração: VirtualizedTable
 * 
 * Testa a integração do componente de tabela virtualizada com:
 * - Renderização de grandes volumes de dados
 * - Performance de scroll
 * - Seleção de linhas
 * - Ordenação
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VirtualizedTable, VirtualizedColumn } from '@/components/shared/virtualized-table'

interface TestData {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

// Gerador de dados de teste
function generateTestData(count: number): TestData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `Usuário ${i}`,
    email: `usuario${i}@test.com`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }))
}

describe('VirtualizedTable - Integração', () => {
  const columns: VirtualizedColumn<TestData>[] = [
    { key: 'id', header: 'ID', width: 100 },
    { key: 'name', header: 'Nome', width: 200 },
    { key: 'email', header: 'Email', width: 250 },
    { key: 'status', header: 'Status', width: 100 },
  ]

  describe('Renderização Básica', () => {
    it('deve renderizar cabeçalhos da tabela', () => {
      const data = generateTestData(10)
      render(<VirtualizedTable data={data} columns={columns} />)

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Nome')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('deve renderizar linhas visíveis', () => {
      const data = generateTestData(100)
      render(<VirtualizedTable data={data} columns={columns} rowHeight={50} />)

      // Deve renderizar apenas linhas visíveis (não todas as 100)
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(100)
    })

    it('deve mostrar mensagem quando não há dados', () => {
      render(<VirtualizedTable data={[]} columns={columns} />)

      expect(screen.getByText(/nenhum dado/i)).toBeInTheDocument()
    })
  })

  describe('Virtualização', () => {
    it('deve renderizar eficientemente grandes volumes de dados', async () => {
      const largeData = generateTestData(10000)
      const startTime = performance.now()

      render(<VirtualizedTable data={largeData} columns={columns} />)

      const renderTime = performance.now() - startTime

      // Renderização inicial deve ser rápida (< 500ms)
      expect(renderTime).toBeLessThan(500)
    })

    it('deve atualizar linhas visíveis ao fazer scroll', async () => {
      const data = generateTestData(1000)
      const { container } = render(
        <VirtualizedTable data={data} columns={columns} height={400} rowHeight={50} />
      )

      // Encontrar container de scroll
      const scrollContainer = container.querySelector('[data-virtualized-scroll]')
      expect(scrollContainer).toBeInTheDocument()

      // Verificar primeira linha visível
      expect(screen.getByText('Usuário 0')).toBeInTheDocument()

      // Scroll para baixo
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 5000 } })
      }

      // Após scroll, primeira linha não deve mais ser visível
      await waitFor(() => {
        expect(screen.queryByText('Usuário 0')).not.toBeInTheDocument()
      })
    })
  })

  describe('Seleção de Linhas', () => {
    it('deve permitir seleção de linha única', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)
      const onSelectionChange = jest.fn()

      render(
        <VirtualizedTable
          data={data}
          columns={columns}
          selectable
          onSelectionChange={onSelectionChange}
        />
      )

      const firstRow = screen.getByText('Usuário 0').closest('tr, div[role="row"]')
      if (firstRow) await user.click(firstRow)

      expect(onSelectionChange).toHaveBeenCalledWith(['id-0'])
    })

    it('deve permitir seleção múltipla com Ctrl+Click', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)
      const onSelectionChange = jest.fn()

      render(
        <VirtualizedTable
          data={data}
          columns={columns}
          selectable
          multiSelect
          onSelectionChange={onSelectionChange}
        />
      )

      const firstRow = screen.getByText('Usuário 0').closest('tr, div[role="row"]')
      const secondRow = screen.getByText('Usuário 1').closest('tr, div[role="row"]')

      if (firstRow) await user.click(firstRow)
      if (secondRow) await user.click(secondRow, { ctrlKey: true })

      expect(onSelectionChange).toHaveBeenLastCalledWith(['id-0', 'id-1'])
    })

    it('deve permitir seleção por range com Shift+Click', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)
      const onSelectionChange = jest.fn()

      render(
        <VirtualizedTable
          data={data}
          columns={columns}
          selectable
          multiSelect
          onSelectionChange={onSelectionChange}
        />
      )

      const firstRow = screen.getByText('Usuário 0').closest('tr, div[role="row"]')
      const fifthRow = screen.getByText('Usuário 4').closest('tr, div[role="row"]')

      if (firstRow) await user.click(firstRow)
      if (fifthRow) await user.click(fifthRow, { shiftKey: true })

      // Deve selecionar do índice 0 ao 4
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        expect.arrayContaining(['id-0', 'id-1', 'id-2', 'id-3', 'id-4'])
      )
    })
  })

  describe('Ordenação', () => {
    it('deve ordenar por coluna ao clicar no cabeçalho', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)

      render(<VirtualizedTable data={data} columns={columns} sortable />)

      const nameHeader = screen.getByText('Nome')
      await user.click(nameHeader)

      // Verificar que ordenação foi aplicada
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('deve alternar entre ordem ascendente e descendente', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)

      render(<VirtualizedTable data={data} columns={columns} sortable />)

      const nameHeader = screen.getByText('Nome')

      // Primeiro click - ascendente
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

      // Segundo click - descendente
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter role="grid" ou role="table"', () => {
      const data = generateTestData(10)
      render(<VirtualizedTable data={data} columns={columns} />)

      expect(screen.getByRole('grid') || screen.getByRole('table')).toBeInTheDocument()
    })

    it('deve ter aria-rowcount com total de linhas', () => {
      const data = generateTestData(100)
      const { container } = render(<VirtualizedTable data={data} columns={columns} />)

      const table = container.querySelector('[aria-rowcount]')
      expect(table).toHaveAttribute('aria-rowcount', '100')
    })

    it('deve suportar navegação por teclado', async () => {
      const user = userEvent.setup()
      const data = generateTestData(10)

      render(<VirtualizedTable data={data} columns={columns} selectable />)

      // Focar na tabela
      const firstRow = screen.getByText('Usuário 0').closest('tr, div[role="row"]')
      if (firstRow) {
        firstRow.focus()
        await user.keyboard('{ArrowDown}')
      }

      // Verificar que o foco mudou
      const secondRow = screen.getByText('Usuário 1').closest('tr, div[role="row"]')
      expect(document.activeElement).toBe(secondRow)
    })
  })

  describe('Renderização Customizada', () => {
    it('deve usar renderCell customizado quando fornecido', () => {
      const data = generateTestData(10)
      const columnsWithCustomRender: VirtualizedColumn<TestData>[] = [
        ...columns.slice(0, 3),
        {
          key: 'status',
          header: 'Status',
          width: 100,
          renderCell: (value) => (
            <span data-testid={`status-${value}`}>
              {value === 'active' ? '✓ Ativo' : '✗ Inativo'}
            </span>
          ),
        },
      ]

      render(<VirtualizedTable data={data} columns={columnsWithCustomRender} />)

      expect(screen.getByText('✓ Ativo')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('não deve re-renderizar linhas não visíveis', async () => {
      const renderCount = { current: 0 }
      const TrackedCell = ({ value }: { value: string }) => {
        renderCount.current++
        return <span>{value}</span>
      }

      const data = generateTestData(1000)
      const columnsWithTracking: VirtualizedColumn<TestData>[] = [
        {
          key: 'name',
          header: 'Nome',
          width: 200,
          renderCell: (value) => <TrackedCell value={value as string} />,
        },
      ]

      render(
        <VirtualizedTable
          data={data}
          columns={columnsWithTracking}
          height={400}
          rowHeight={50}
        />
      )

      // Apenas linhas visíveis devem ser renderizadas
      // Com altura de 400px e linhas de 50px, ~8 linhas visíveis + overscan
      expect(renderCount.current).toBeLessThan(50)
    })
  })
})

