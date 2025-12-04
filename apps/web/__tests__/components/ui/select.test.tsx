import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { renderWithProviders } from '../../../helpers/component-helpers'

// Mock Radix UI Select
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }: any) => <div data-testid="select-root" {...props}>{children}</div>,
  Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} data-testid="select-trigger" {...props}>{children}</button>
  )),
  Value: ({ children, ...props }: any) => <span data-testid="select-value" {...props}>{children}</span>,
  Content: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  Item: ({ children, ...props }: any) => <div data-testid="select-item" {...props}>{children}</div>,
  Group: ({ children, ...props }: any) => <div data-testid="select-group" {...props}>{children}</div>,
  ScrollUpButton: ({ children, ...props }: any) => <div data-testid="select-scroll-up" {...props}>{children}</div>,
  ScrollDownButton: ({ children, ...props }: any) => <div data-testid="select-scroll-down" {...props}>{children}</div>,
  Viewport: ({ children, ...props }: any) => <div data-testid="select-viewport" {...props}>{children}</div>,
  Icon: ({ children, ...props }: any) => <div data-testid="select-icon" {...props}>{children}</div>,
}))

describe('Select Component', () => {
  it('deve renderizar Select', () => {
    renderWithProviders(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Opção 1</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByTestId('select-root')).toBeInTheDocument()
    expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
  })

  it('deve exibir placeholder', () => {
    renderWithProviders(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma opção" />
        </SelectTrigger>
      </Select>
    )

    expect(screen.getByText('Selecione uma opção')).toBeInTheDocument()
  })

  it('deve renderizar itens', () => {
    renderWithProviders(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Opção 1</SelectItem>
          <SelectItem value="option2">Opção 2</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByText('Opção 1')).toBeInTheDocument()
    expect(screen.getByText('Opção 2')).toBeInTheDocument()
  })
})

