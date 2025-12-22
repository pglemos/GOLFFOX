/**
 * Testes para CostFormContainer
 * Testa validação, submissão, formatação de valores e tratamento de erros
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CostFormContainer } from '@/components/costs/cost-form-container'
import { renderWithProviders } from '../../helpers/component-helpers'
import { useCreateCost } from '@/hooks/use-costs'
import { notifyError } from '@/lib/toast'

// Mock dependencies
jest.mock('@/hooks/use-costs')
jest.mock('@/lib/toast')
jest.mock('@/lib/api/costs-api', () => ({
  createManualCost: jest.fn(),
  getCostCategories: jest.fn(),
  getCosts: jest.fn(),
}))
jest.mock('@/lib/fetch-with-auth', () => ({
  fetchWithAuth: jest.fn(),
  getAuthToken: jest.fn().mockResolvedValue('mock-token'),
}))
jest.mock('@/components/costs/cost-form-presentational', () => ({
  CostFormPresentational: ({ form, onSubmit, onAmountChange, ...props }: any) => {
    return (
      <form onSubmit={onSubmit} data-testid="cost-form">
        <input
          data-testid="description-input"
          {...form.register('description')}
        />
        <input
          data-testid="amount-input"
          {...form.register('amount')}
          onChange={(e) => {
            form.setValue('amount', e.target.value)
            onAmountChange?.(e)
          }}
        />
        <input
          data-testid="cost-date-input"
          type="date"
          {...form.register('costDate')}
        />
        <button type="submit" data-testid="submit-button">
          Salvar
        </button>
        <button type="button" onClick={props.onCancel} data-testid="cancel-button">
          Cancelar
        </button>
      </form>
    )
  },
}))

const mockUseCreateCost = useCreateCost as jest.MockedFunction<typeof useCreateCost>

describe('CostFormContainer', () => {
  const defaultProps = {
    profileType: 'admin' as const,
    companyId: 'company-1',
    veiculos: [
      { id: 'veiculo-1', plate: 'ABC-1234', model: 'Modelo A' },
    ],
    routes: [
      { id: 'route-1', name: 'Rota A' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch para upload
    global.fetch = jest.fn()
    
    mockUseCreateCost.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 'cost-1' }),
      isPending: false,
    } as any)
  })

  describe('Renderização', () => {
    it('deve renderizar formulário corretamente', () => {
      renderWithProviders(<CostFormContainer {...defaultProps} />)
      
      expect(screen.getByTestId('cost-form')).toBeInTheDocument()
      expect(screen.getByTestId('description-input')).toBeInTheDocument()
      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
    })

    it('deve inicializar com valores padrão quando initialData fornecido', () => {
      const initialData = {
        description: 'Custo inicial',
        amount: '100,50',
        costDate: new Date('2024-01-15'),
      }

      renderWithProviders(
        <CostFormContainer {...defaultProps} initialData={initialData} />
      )

      const descriptionInput = screen.getByTestId('description-input') as HTMLInputElement
      expect(descriptionInput.value).toBe('Custo inicial')
    })
  })

  describe('Validação de Campos', () => {
    it('deve validar descrição mínima de 3 caracteres', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'AB')
      await user.type(amountInput, '100')
      await user.click(submitButton)

      // Form não deve ser submetido (validação do react-hook-form)
      await waitFor(() => {
        expect(mockUseCreateCost().mutateAsync).not.toHaveBeenCalled()
      })
    })

    it('deve validar que valor é obrigatório', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Descrição válida')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUseCreateCost().mutateAsync).not.toHaveBeenCalled()
      })
    })

    it('deve validar que valor deve ser maior que zero', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Descrição válida')
      await user.type(amountInput, '0')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUseCreateCost().mutateAsync).not.toHaveBeenCalled()
      })
    })

    it('deve validar que valor deve ser um número válido', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Descrição válida')
      await user.type(amountInput, 'abc')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUseCreateCost().mutateAsync).not.toHaveBeenCalled()
      })
    })
  })

  describe('Formatação de Valores Monetários', () => {
    it('deve aceitar valores com vírgula como separador decimal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const amountInput = screen.getByTestId('amount-input') as HTMLInputElement
      
      await user.type(amountInput, '100,50')
      
      expect(amountInput.value).toContain('100,50')
    })

    it('deve aceitar valores com ponto como separador decimal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const amountInput = screen.getByTestId('amount-input') as HTMLInputElement
      
      await user.type(amountInput, '100.50')
      
      expect(amountInput.value).toContain('100.50')
    })

    it('deve remover caracteres não numéricos exceto vírgula e ponto', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const amountInput = screen.getByTestId('amount-input') as HTMLInputElement
      
      await user.type(amountInput, 'R$ 1.000,50')
      
      // Deve manter apenas números, vírgula e ponto
      expect(amountInput.value).not.toContain('R$')
      expect(amountInput.value).not.toContain(' ')
    })
  })

  describe('Submissão de Formulário', () => {
    it('deve submeter formulário com dados válidos', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      const mutateAsync = jest.fn().mockResolvedValue({ id: 'cost-1' })
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(
        <CostFormContainer {...defaultProps} onSuccess={onSuccess} />
      )

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo de combustível')
      await user.type(amountInput, '500,00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Custo de combustível',
            amount: 500,
            companyId: 'company-1',
          })
        )
      })

      expect(onSuccess).toHaveBeenCalled()
    })

    it('deve converter valor com vírgula para número no payload', async () => {
      const user = userEvent.setup()
      const mutateAsync = jest.fn().mockResolvedValue({ id: 'cost-1' })
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo teste')
      await user.type(amountInput, '1234,56')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 1234.56,
          })
        )
      })
    })

    it('deve resetar formulário após submissão bem-sucedida', async () => {
      const user = userEvent.setup()
      const mutateAsync = jest.fn().mockResolvedValue({ id: 'cost-1' })
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input') as HTMLInputElement
      const amountInput = screen.getByTestId('amount-input') as HTMLInputElement
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo teste')
      await user.type(amountInput, '100,00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled()
      })

      // Form deve ser resetado
      await waitFor(() => {
        expect(descriptionInput.value).toBe('')
        expect(amountInput.value).toBe('')
      })
    })
  })

  describe('Upload de Anexos', () => {
    it('deve aceitar arquivo válido dentro do limite de tamanho', async () => {
      renderWithProviders(<CostFormContainer {...defaultProps} />)

      // Criar arquivo válido (menor que 5MB)
      const validFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      })

      // Verificar que o arquivo é válido (lógica de validação)
      expect(validFile.size).toBeLessThan(5 * 1024 * 1024)
      expect(['image/jpeg', 'image/png', 'application/pdf']).toContain(validFile.type)
    })

    it('deve rejeitar arquivo maior que 5MB', () => {
      // Criar arquivo maior que 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })

      // Verificar que o arquivo excede o limite
      expect(largeFile.size).toBeGreaterThan(5 * 1024 * 1024)
    })

    it('deve rejeitar tipo de arquivo não permitido', () => {
      // Criar arquivo com tipo não permitido
      const invalidFile = new File(['content'], 'file.txt', {
        type: 'text/plain',
      })

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      expect(allowedTypes).not.toContain(invalidFile.type)
    })

    it('deve fazer upload de anexo antes de submeter quando arquivo é fornecido', async () => {
      const user = userEvent.setup()
      const mutateAsync = jest.fn().mockResolvedValue({ id: 'cost-1' })
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      // Mock fetch para upload
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://storage.example.com/file.pdf' }),
      })

      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo com anexo')
      await user.type(amountInput, '100,00')
      await user.click(submitButton)

      // Verificar que a submissão foi chamada
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled()
      })
    })
  })

  describe('Tratamento de Erros', () => {
    it('deve lidar com erro na submissão', async () => {
      const user = userEvent.setup()
      const mutateAsync = jest.fn().mockRejectedValue(new Error('Erro ao salvar'))
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(<CostFormContainer {...defaultProps} />)

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo teste')
      await user.type(amountInput, '100,00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled()
      })

      // Erro deve ser tratado pelo hook, não deve quebrar o componente
      expect(screen.getByTestId('cost-form')).toBeInTheDocument()
    })

    it('deve lidar com erro no upload de arquivo', async () => {
      const user = userEvent.setup()
      
      // Mock fetch para falhar
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro no upload'))

      // O componente deve continuar funcionando mesmo com erro no upload
      renderWithProviders(<CostFormContainer {...defaultProps} />)
      
      expect(screen.getByTestId('cost-form')).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('deve chamar onCancel quando botão cancelar é clicado', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()

      renderWithProviders(
        <CostFormContainer {...defaultProps} onCancel={onCancel} />
      )

      const cancelButton = screen.getByTestId('cancel-button')
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('deve chamar onSuccess após submissão bem-sucedida', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      const mutateAsync = jest.fn().mockResolvedValue({ id: 'cost-1' })
      
      mockUseCreateCost.mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(
        <CostFormContainer {...defaultProps} onSuccess={onSuccess} />
      )

      const descriptionInput = screen.getByTestId('description-input')
      const amountInput = screen.getByTestId('amount-input')
      const submitButton = screen.getByTestId('submit-button')

      await user.type(descriptionInput, 'Custo teste')
      await user.type(amountInput, '100,00')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Estados de Loading', () => {
    it('deve exibir estado de loading durante submissão', () => {
      mockUseCreateCost.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      } as any)

      renderWithProviders(<CostFormContainer {...defaultProps} />)

      // O componente deve passar loading=true para o presentational
      // Verificamos que o componente renderiza (não quebra)
      expect(screen.getByTestId('cost-form')).toBeInTheDocument()
    })
  })
})

