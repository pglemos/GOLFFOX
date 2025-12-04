/**
 * Testes para Alert Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert', () => {
  it('deve renderizar alert com role="alert"', () => {
    render(<Alert>Test alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Test alert')
  })

  it('deve aplicar variant default', () => {
    render(<Alert variant="default">Default alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-background')
  })

  it('deve aplicar variant destructive', () => {
    render(<Alert variant="destructive">Error alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('border-red-500/50')
  })

  it('deve aplicar variant warning', () => {
    render(<Alert variant="warning">Warning alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('border-yellow-500/50')
  })

  it('deve aplicar className customizada', () => {
    render(<Alert className="custom-class">Alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })

  it('deve aceitar ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Alert ref={ref}>Alert</Alert>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('AlertTitle', () => {
  it('deve renderizar título do alert', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
      </Alert>
    )
    expect(screen.getByText('Alert Title')).toBeInTheDocument()
  })

  it('deve aplicar className customizada', () => {
    render(
      <Alert>
        <AlertTitle className="custom-title">Title</AlertTitle>
      </Alert>
    )
    const title = screen.getByText('Title')
    expect(title).toHaveClass('custom-title')
  })
})

describe('AlertDescription', () => {
  it('deve renderizar descrição do alert', () => {
    render(
      <Alert>
        <AlertDescription>Alert description</AlertDescription>
      </Alert>
    )
    expect(screen.getByText('Alert description')).toBeInTheDocument()
  })

  it('deve aplicar className customizada', () => {
    render(
      <Alert>
        <AlertDescription className="custom-desc">Description</AlertDescription>
      </Alert>
    )
    const desc = screen.getByText('Description')
    expect(desc).toHaveClass('custom-desc')
  })
})

