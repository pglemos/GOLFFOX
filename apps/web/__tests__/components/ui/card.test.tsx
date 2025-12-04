import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { renderWithProviders } from '../../../helpers/component-helpers'

describe('Card Components', () => {
  it('deve renderizar Card', () => {
    const { container } = renderWithProviders(<Card>Conteúdo</Card>)
    expect(container.querySelector('.card-premium')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('deve aplicar variante glass', () => {
    const { container } = renderWithProviders(<Card glass>Conteúdo</Card>)
    expect(container.querySelector('.card-glass')).toBeInTheDocument()
  })

  it('deve desabilitar hover quando hover=false', () => {
    const { container } = renderWithProviders(<Card hover={false}>Conteúdo</Card>)
    const card = container.querySelector('.card-premium')
    expect(card).toHaveClass('hover:shadow-[var(--shadow-sm)]')
  })

  it('deve renderizar CardHeader', () => {
    renderWithProviders(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('deve renderizar CardTitle', () => {
    renderWithProviders(
      <Card>
        <CardTitle>Título</CardTitle>
      </Card>
    )
    expect(screen.getByText('Título')).toBeInTheDocument()
  })

  it('deve renderizar CardDescription', () => {
    renderWithProviders(
      <Card>
        <CardDescription>Descrição</CardDescription>
      </Card>
    )
    expect(screen.getByText('Descrição')).toBeInTheDocument()
  })

  it('deve renderizar CardContent', () => {
    renderWithProviders(
      <Card>
        <CardContent>Conteúdo</CardContent>
      </Card>
    )
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('deve renderizar CardFooter', () => {
    renderWithProviders(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('deve aceitar className customizada', () => {
    const { container } = renderWithProviders(<Card className="custom-class">Teste</Card>)
    const card = container.querySelector('.card-premium')
    expect(card).toHaveClass('custom-class')
  })
})

