/**
 * Testes para Pagination Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/ui/pagination'

describe('Pagination', () => {
  it('deve não renderizar quando totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar botões de navegação', () => {
    const handlePageChange = jest.fn()
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} />
    )

    const buttons = screen.getAllByRole('button')
    // Primeiro botão é anterior, último é próximo
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    expect(buttons[0]).toBeInTheDocument()
    expect(buttons[buttons.length - 1]).toBeInTheDocument()
  })

  it('deve desabilitar botão anterior na primeira página', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />)

    const buttons = screen.getAllByRole('button')
    const prevButton = buttons[0]
    expect(prevButton).toBeDisabled()
  })

  it('deve desabilitar botão próximo na última página', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />)

    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[buttons.length - 1]
    expect(nextButton).toBeDisabled()
  })

  it('deve mostrar todas as páginas quando totalPages <= 5', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('deve mostrar ellipsis quando há muitas páginas', () => {
    render(<Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />)

    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('deve chamar onPageChange ao clicar em número de página', async () => {
    const handlePageChange = jest.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={handlePageChange} />)

    await userEvent.click(screen.getByText('3'))

    expect(handlePageChange).toHaveBeenCalledWith(3)
  })

  it('deve chamar onPageChange ao clicar em próximo', async () => {
    const handlePageChange = jest.fn()
    render(<Pagination currentPage={2} totalPages={5} onPageChange={handlePageChange} />)

    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[buttons.length - 1]
    await userEvent.click(nextButton)

    expect(handlePageChange).toHaveBeenCalledWith(3)
  })

  it('deve chamar onPageChange ao clicar em anterior', async () => {
    const handlePageChange = jest.fn()
    render(<Pagination currentPage={3} totalPages={5} onPageChange={handlePageChange} />)

    const buttons = screen.getAllByRole('button')
    const prevButton = buttons[0]
    await userEvent.click(prevButton)

    expect(handlePageChange).toHaveBeenCalledWith(2)
  })

  it('deve destacar página atual', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />)

    const currentPageButton = screen.getByText('3')
    expect(currentPageButton).toHaveClass('bg-orange-500')
  })

  it('deve aplicar className customizada', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={() => {}}
        className="custom-class"
      />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

