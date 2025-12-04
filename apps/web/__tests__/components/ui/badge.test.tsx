/**
 * Testes para Badge Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('deve renderizar badge', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('deve aplicar variant default', () => {
    render(<Badge variant="default">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('bg-[var(--brand)]')
  })

  it('deve aplicar variant secondary', () => {
    render(<Badge variant="secondary">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('bg-[var(--accent)]')
  })

  it('deve aplicar variant destructive', () => {
    render(<Badge variant="destructive">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('bg-[var(--error)]')
  })

  it('deve aplicar variant outline', () => {
    render(<Badge variant="outline">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('border')
  })

  it('deve aplicar variant success', () => {
    render(<Badge variant="success">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('bg-[var(--success)]')
  })

  it('deve aplicar variant warning', () => {
    render(<Badge variant="warning">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('bg-[var(--warning)]')
  })

  it('deve aplicar className customizada', () => {
    render(<Badge className="custom-class">Badge</Badge>)
    const badge = screen.getByText('Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('deve aceitar todas as props HTML padrão', () => {
    render(<Badge data-testid="badge" aria-label="Status badge">Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('aria-label', 'Status badge')
  })
})

