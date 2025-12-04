/**
 * Testes para Switch Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
  it('deve renderizar switch', () => {
    render(<Switch />)
    const switchInput = screen.getByRole('checkbox')
    expect(switchInput).toBeInTheDocument()
  })

  it('deve estar desmarcado por padrão', () => {
    render(<Switch />)
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement
    expect(switchInput.checked).toBe(false)
  })

  it('deve estar marcado quando checked=true', () => {
    render(<Switch checked />)
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement
    expect(switchInput.checked).toBe(true)
  })

  it('deve chamar onCheckedChange quando muda', async () => {
    const handleChange = jest.fn()
    render(<Switch onCheckedChange={handleChange} />)
    const switchInput = screen.getByRole('checkbox')

    await userEvent.click(switchInput)

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('deve chamar onChange quando muda', async () => {
    const handleChange = jest.fn()
    render(<Switch onChange={handleChange} />)
    const switchInput = screen.getByRole('checkbox')

    await userEvent.click(switchInput)

    expect(handleChange).toHaveBeenCalled()
  })

  it('deve estar desabilitado quando disabled', () => {
    render(<Switch disabled />)
    const switchInput = screen.getByRole('checkbox')
    expect(switchInput).toBeDisabled()
  })

  it('deve aplicar className customizada', () => {
    render(<Switch className="custom-switch" />)
    const switchInput = screen.getByRole('checkbox')
    expect(switchInput.closest('label')).toHaveClass('custom-switch')
  })

  it('deve aceitar ref', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Switch ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('deve alternar estado ao clicar', async () => {
    const { rerender } = render(<Switch checked={false} />)
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement

    expect(switchInput.checked).toBe(false)

    rerender(<Switch checked={true} />)
    expect(switchInput.checked).toBe(true)
  })
})

