/**
 * Testes para Skeleton Components
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('deve renderizar skeleton', () => {
    render(<Skeleton />)
    const skeleton = screen.getByRole('generic')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('deve aplicar className customizada', () => {
    render(<Skeleton className="custom-class" />)
    const skeleton = screen.getByRole('generic')
    expect(skeleton).toHaveClass('custom-class')
  })

  it('deve aceitar todas as props HTML padrão', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading')
  })
})

describe('SkeletonCard', () => {
  it('deve renderizar card skeleton com múltiplos elementos', () => {
    render(<SkeletonCard />)
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('SkeletonList', () => {
  it('deve renderizar lista com 5 cards por padrão', () => {
    render(<SkeletonList />)
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve renderizar lista com count customizado', () => {
    render(<SkeletonList count={3} />)
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('SkeletonTable', () => {
  it('deve renderizar tabela skeleton com header e rows', () => {
    render(<SkeletonTable />)
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve renderizar tabela com rows e cols customizados', () => {
    render(<SkeletonTable rows={3} cols={2} />)
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

