import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { renderWithProviders } from '../../../helpers/component-helpers'

describe('Table Components', () => {
  it('deve renderizar Table', () => {
    const { container } = renderWithProviders(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Teste</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(container.querySelector('table')).toBeInTheDocument()
    expect(screen.getByText('Teste')).toBeInTheDocument()
  })

  it('deve renderizar TableHeader', () => {
    renderWithProviders(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coluna 1</TableHead>
            <TableHead>Coluna 2</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    )

    expect(screen.getByText('Coluna 1')).toBeInTheDocument()
    expect(screen.getByText('Coluna 2')).toBeInTheDocument()
  })

  it('deve renderizar TableBody', () => {
    renderWithProviders(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Dado 1</TableCell>
            <TableCell>Dado 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByText('Dado 1')).toBeInTheDocument()
    expect(screen.getByText('Dado 2')).toBeInTheDocument()
  })

  it('deve renderizar TableFooter', () => {
    renderWithProviders(
      <Table>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )

    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('deve aceitar className customizada', () => {
    const { container } = renderWithProviders(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Teste</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const table = container.querySelector('table')
    expect(table).toHaveClass('custom-table')
  })
})

