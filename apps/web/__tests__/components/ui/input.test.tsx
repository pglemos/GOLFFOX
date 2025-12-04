import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { renderWithProviders } from '../../../helpers/component-helpers'

describe('Input Component', () => {
  it('deve renderizar input', () => {
    renderWithProviders(<Input placeholder="Digite aqui" />)
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument()
  })

  it('deve aceitar valor controlado', () => {
    const { rerender } = renderWithProviders(<Input value="teste" onChange={() => {}} />)
    const input = screen.getByDisplayValue('teste')
    expect(input).toBeInTheDocument()
    
    rerender(<Input value="atualizado" onChange={() => {}} />)
    expect(screen.getByDisplayValue('atualizado')).toBeInTheDocument()
  })

  it('deve chamar onChange quando digitado', async () => {
    const handleChange = jest.fn()
    renderWithProviders(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'teste')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('deve estar desabilitado quando disabled', () => {
    renderWithProviders(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('deve aceitar diferentes tipos', () => {
    const { rerender } = renderWithProviders(<Input type="text" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    
    rerender(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password')
  })

  it('deve aceitar className customizada', () => {
    const { container } = renderWithProviders(<Input className="custom-class" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('custom-class')
  })
})

