import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { renderWithProviders } from '../../../helpers/component-helpers'

// Mock Radix UI Dialog
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange, ...props }: any) => (
    <div data-testid="dialog-root" data-open={open} {...props}>{children}</div>
  ),
  Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} data-testid="dialog-trigger" {...props}>{children}</button>
  )),
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: React.forwardRef(({ ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dialog-overlay" {...props} />
  )),
  Content: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dialog-content" {...props}>{children}</div>
  )),
  Close: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} data-testid="dialog-close" {...props}>{children}</button>
  )),
  Title: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <h2 ref={ref} data-testid="dialog-title" {...props}>{children}</h2>
  )),
  Description: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <p ref={ref} data-testid="dialog-description" {...props}>{children}</p>
  )),
}))

describe('Dialog Component', () => {
  it('deve renderizar Dialog fechado', () => {
    renderWithProviders(
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título</DialogTitle>
            <DialogDescription>Descrição</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument()
  })

  it('deve renderizar Dialog aberto', () => {
    renderWithProviders(
      <Dialog open={true}>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título do Dialog</DialogTitle>
            <DialogDescription>Descrição do dialog</DialogDescription>
          </DialogHeader>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    expect(screen.getByText('Título do Dialog')).toBeInTheDocument()
    expect(screen.getByText('Descrição do dialog')).toBeInTheDocument()
  })

  it('deve ter botão de fechar', () => {
    renderWithProviders(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Título</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('dialog-close')).toBeInTheDocument()
  })
})

