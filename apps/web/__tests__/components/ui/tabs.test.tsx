/**
 * Testes para Tabs Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Mock Radix UI Tabs
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, defaultValue, value, onValueChange }: any) => {
    const [currentValue, setCurrentValue] = React.useState(value || defaultValue || '')
    React.useEffect(() => {
      if (value !== undefined) setCurrentValue(value)
    }, [value])
    return (
      <div data-testid="tabs-root" data-value={currentValue}>
        {React.Children.map(children, (child) =>
          React.cloneElement(child, {
            currentValue,
            onValueChange: (newValue: string) => {
              setCurrentValue(newValue)
              onValueChange?.(newValue)
            },
          })
        )}
      </div>
    )
  },
  List: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="tabs-list" className={className} {...props}>
      {children}
    </div>
  )),
  Trigger: React.forwardRef(
    ({ children, value, currentValue, onValueChange, className, ...props }: any, ref: any) => (
      <button
        ref={ref}
        data-testid={`tabs-trigger-${value}`}
        data-state={currentValue === value ? 'active' : 'inactive'}
        className={className}
        onClick={() => onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    )
  ),
  Content: React.forwardRef(
    ({ children, value, currentValue, className, ...props }: any, ref: any) => (
      <div
        ref={ref}
        data-testid={`tabs-content-${value}`}
        data-state={currentValue === value ? 'active' : 'inactive'}
        className={className}
        {...props}
      >
        {currentValue === value && children}
      </div>
    )
  ),
}))

const React = require('react')

describe('Tabs', () => {
  it('deve renderizar tabs com conteúdo', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByTestId('tabs-root')).toBeInTheDocument()
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument()
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('deve mostrar conteúdo da tab ativa', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
  })

  it('deve mudar tab quando trigger é clicado', async () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByText('Tab 2')
    await userEvent.click(tab2)

    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('deve aplicar className customizada', () => {
    render(
      <Tabs>
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content
        </TabsContent>
      </Tabs>
    )

    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list')
    expect(screen.getByTestId('tabs-content-tab1')).toHaveClass('custom-content')
  })

  it('deve marcar trigger como active quando tab está selecionada', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const trigger1 = screen.getByTestId('tabs-trigger-tab1')
    const trigger2 = screen.getByTestId('tabs-trigger-tab2')

    expect(trigger1).toHaveAttribute('data-state', 'active')
    expect(trigger2).toHaveAttribute('data-state', 'inactive')
  })

  it('deve chamar onValueChange quando tab muda', async () => {
    const handleChange = jest.fn()
    render(
      <Tabs defaultValue="tab1" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    await userEvent.click(screen.getByText('Tab 2'))

    expect(handleChange).toHaveBeenCalledWith('tab2')
  })
})

