/**
 * Testes de Integração: GenericPickerModal
 * 
 * Testa a integração do modal genérico de seleção com:
 * - Busca de itens
 * - Seleção e confirmação
 * - Acessibilidade (keyboard navigation, focus trap)
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenericPickerModal, PickerItem } from '@/components/shared/generic-picker-modal'

// Mock de dados
const mockItems: PickerItem[] = [
  { id: '1', name: 'Item 1', description: 'Descrição do item 1' },
  { id: '2', name: 'Item 2', description: 'Descrição do item 2' },
  { id: '3', name: 'Item 3', description: 'Descrição do item 3' },
  { id: '4', name: 'Item Diferente', description: 'Com busca diferente' },
  { id: '5', name: 'Outro Item', description: 'Para testar filtro' },
]

describe('GenericPickerModal - Integração', () => {
  const defaultProps = {
    open: true,
    title: 'Selecionar Item',
    items: mockItems,
    onSelect: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderização e Estado Inicial', () => {
    it('deve renderizar com título correto', () => {
      render(<GenericPickerModal {...defaultProps} />)
      
      expect(screen.getByText('Selecionar Item')).toBeInTheDocument()
    })

    it('deve mostrar todos os itens quando aberto', () => {
      render(<GenericPickerModal {...defaultProps} />)
      
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('deve mostrar mensagem quando não há itens', () => {
      render(<GenericPickerModal {...defaultProps} items={[]} />)
      
      expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument()
    })

    it('não deve renderizar quando fechado', () => {
      render(<GenericPickerModal {...defaultProps} open={false} />)
      
      expect(screen.queryByText('Selecionar Item')).not.toBeInTheDocument()
    })
  })

  describe('Funcionalidade de Busca', () => {
    it('deve filtrar itens baseado na busca', async () => {
      const user = userEvent.setup()
      render(<GenericPickerModal {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/buscar/i)
      await user.type(searchInput, 'Diferente')
      
      await waitFor(() => {
        expect(screen.getByText('Item Diferente')).toBeInTheDocument()
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
      })
    })

    it('deve mostrar todos os itens quando busca é limpa', async () => {
      const user = userEvent.setup()
      render(<GenericPickerModal {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/buscar/i)
      await user.type(searchInput, 'Item 1')
      
      await waitFor(() => {
        expect(screen.queryByText('Item 2')).not.toBeInTheDocument()
      })
      
      await user.clear(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
      })
    })

    it('deve fazer busca case-insensitive', async () => {
      const user = userEvent.setup()
      render(<GenericPickerModal {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/buscar/i)
      await user.type(searchInput, 'ITEM')
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item Diferente')).toBeInTheDocument()
      })
    })
  })

  describe('Seleção de Itens', () => {
    it('deve chamar onSelect ao clicar em um item', async () => {
      const user = userEvent.setup()
      const onSelect = jest.fn()
      render(<GenericPickerModal {...defaultProps} onSelect={onSelect} />)
      
      const item = screen.getByText('Item 1')
      await user.click(item)
      
      expect(onSelect).toHaveBeenCalledWith(mockItems[0])
    })

    it('deve fechar o modal após seleção', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      render(<GenericPickerModal {...defaultProps} onClose={onClose} />)
      
      const item = screen.getByText('Item 1')
      await user.click(item)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('deve mostrar item pré-selecionado quando fornecido', () => {
      render(<GenericPickerModal {...defaultProps} selectedId="2" />)
      
      // O item selecionado deve ter alguma indicação visual
      const selectedItem = screen.getByText('Item 2').closest('button, div[role="option"]')
      expect(selectedItem).toHaveClass(/selected|active|bg-/i)
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter role="dialog" no modal', () => {
      render(<GenericPickerModal {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('deve focar no campo de busca ao abrir', async () => {
      render(<GenericPickerModal {...defaultProps} />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/buscar/i)
        expect(document.activeElement).toBe(searchInput)
      })
    })

    it('deve fechar com Escape', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      render(<GenericPickerModal {...defaultProps} onClose={onClose} />)
      
      await user.keyboard('{Escape}')
      
      expect(onClose).toHaveBeenCalled()
    })

    it('deve navegar pelos itens com teclado', async () => {
      const user = userEvent.setup()
      render(<GenericPickerModal {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/buscar/i)
      
      // Navegar para baixo
      await user.keyboard('{ArrowDown}')
      
      // Verificar que o foco mudou
      await waitFor(() => {
        expect(document.activeElement).not.toBe(searchInput)
      })
    })

    it('deve selecionar item com Enter', async () => {
      const user = userEvent.setup()
      const onSelect = jest.fn()
      render(<GenericPickerModal {...defaultProps} onSelect={onSelect} />)
      
      // Navegar para o primeiro item
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(onSelect).toHaveBeenCalled()
    })
  })

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar loading quando isLoading é true', () => {
      render(<GenericPickerModal {...defaultProps} isLoading />)
      
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })

    it('deve mostrar mensagem de erro quando fornecida', () => {
      render(<GenericPickerModal {...defaultProps} error="Erro ao carregar itens" />)
      
      expect(screen.getByText(/erro ao carregar itens/i)).toBeInTheDocument()
    })
  })

  describe('Renderização Customizada', () => {
    it('deve usar renderItem customizado quando fornecido', () => {
      const renderItem = (item: PickerItem) => (
        <div data-testid={`custom-item-${item.id}`}>
          Custom: {item.name}
        </div>
      )
      
      render(<GenericPickerModal {...defaultProps} renderItem={renderItem} />)
      
      expect(screen.getByTestId('custom-item-1')).toBeInTheDocument()
      expect(screen.getByText('Custom: Item 1')).toBeInTheDocument()
    })
  })
})

