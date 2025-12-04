import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
import { renderWithProviders } from '../../../helpers/component-helpers'

describe('Button Component', () => {
  it('deve renderizar com texto', () => {
    renderWithProviders(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('deve aplicar variante default', () => {
    const { container } = renderWithProviders(<Button>Teste</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-[var(--brand)]')
  })

  it('deve aplicar variante destructive', () => {
    const { container } = renderWithProviders(<Button variant="destructive">Deletar</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-[var(--error)]')
  })

  it('deve aplicar variante outline', () => {
    const { container } = renderWithProviders(<Button variant="outline">Cancelar</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('border')
  })

  it('deve aplicar tamanho sm', () => {
    const { container } = renderWithProviders(<Button size="sm">Pequeno</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-9')
  })

  it('deve aplicar tamanho lg', () => {
    const { container } = renderWithProviders(<Button size="lg">Grande</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-14')
  })

  it('deve chamar onClick quando clicado', async () => {
    const handleClick = jest.fn()
    renderWithProviders(<Button onClick={handleClick}>Clique</Button>)
    
    const button = screen.getByText('Clique')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('deve estar desabilitado quando disabled', () => {
    renderWithProviders(<Button disabled>Desabilitado</Button>)
    const button = screen.getByText('Desabilitado')
    expect(button).toBeDisabled()
  })

  it('deve aceitar className customizada', () => {
    const { container } = renderWithProviders(<Button className="custom-class">Teste</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('deve renderizar como Slot quando asChild', () => {
    renderWithProviders(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    expect(screen.getByText('Link')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
  })
})

