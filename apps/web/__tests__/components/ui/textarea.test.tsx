/**
 * Testes para Textarea Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('deve renderizar textarea', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('deve aceitar placeholder', () => {
    render(<Textarea placeholder="Digite aqui" />)
    const textarea = screen.getByPlaceholderText('Digite aqui')
    expect(textarea).toBeInTheDocument()
  })

  it('deve aceitar value controlado', () => {
    const { rerender } = render(<Textarea value="Test value" onChange={() => {}} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('Test value')

    rerender(<Textarea value="Updated value" onChange={() => {}} />)
    expect(textarea.value).toBe('Updated value')
  })

  it('deve chamar onChange quando valor muda', async () => {
    const handleChange = jest.fn()
    render(<Textarea onChange={handleChange} />)
    const textarea = screen.getByRole('textbox')

    await userEvent.type(textarea, 'Hello')

    expect(handleChange).toHaveBeenCalled()
  })

  it('deve aplicar className customizada', () => {
    render(<Textarea className="custom-class" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('custom-class')
  })

  it('deve estar desabilitado quando disabled', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('deve aceitar ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('deve aceitar todas as props padrão de textarea', () => {
    render(
      <Textarea
        rows={5}
        cols={50}
        maxLength={100}
        required
        aria-label="Test textarea"
      />
    )
    const textarea = screen.getByRole('textbox', { name: 'Test textarea' })
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('cols', '50')
    expect(textarea).toHaveAttribute('maxLength', '100')
    expect(textarea).toBeRequired()
  })
})

