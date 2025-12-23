/**
 * Hooks customizados para formulário de veículo
 * Gerencia estado e operações relacionadas a veículos
 */

import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createVehicle,
  updateVehicle,
  uploadVehiclePhoto,
  getUserInfo,
  type Vehicle,
  type VehicleInsert,
} from '@/lib/api/vehicles-api'
import { notifySuccess, notifyError } from '@/lib/toast'

export interface VehicleFormData {
  plate: string
  model: string
  year: number | string
  capacity: number | string
  prefix?: string
  company_id?: string
  transportadora_id?: string
  is_active?: boolean
  photo_url?: string | null
}

export interface UseVehicleFormOptions {
  initialData?: Vehicle | null
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook para gerenciar formulário de veículo
 */
export function useVehicleForm(options: UseVehicleFormOptions = {}) {
  const { initialData, onSuccess, onError } = options
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<VehicleFormData>({
    plate: initialData?.plate || '',
    model: initialData?.model || '',
    year: initialData?.year || '',
    capacity: initialData?.capacity || '',
    prefix: initialData?.prefix || '',
    company_id: initialData?.company_id,
    transportadora_id: initialData?.transportadora_id,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    photo_url: initialData?.photo_url || null,
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [userInfo, setUserInfo] = useState<{
    role?: string
    company_id?: string
    transportadora_id?: string
  }>({})

  // Carregar informações do usuário
  useEffect(() => {
    const loadUserInfo = async () => {
      const info = await getUserInfo()
      setUserInfo(info)
    }
    loadUserInfo()
  }, [])

  // Atualizar formData quando initialData mudar
  useEffect(() => {
    if (initialData) {
      setFormData({
        plate: initialData.plate || '',
        model: initialData.model || '',
        year: initialData.year || '',
        capacity: initialData.capacity || '',
        prefix: initialData.prefix || '',
        company_id: initialData.company_id,
        transportadora_id: initialData.transportadora_id,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        photo_url: initialData.photo_url || null,
      })
      setPhotoPreview(initialData.photo_url || '')
    } else {
      setFormData({
        plate: '',
        model: '',
        year: '',
        capacity: '',
        prefix: '',
        is_active: true,
      })
      setPhotoPreview('')
    }
    setPhotoFile(null)
  }, [initialData])

  // Mutation para criar veículo
  const createMutation = useMutation({
    mutationFn: async (payload: VehicleInsert) => {
      const result = await createVehicle(payload)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar veículo')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      notifySuccess('Veículo criado com sucesso!')
      onSuccess?.()
    },
    onError: (error: Error) => {
      notifyError(error.message || 'Erro ao criar veículo')
      onError?.(error)
    },
  })

  // Mutation para atualizar veículo
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<VehicleInsert> }) => {
      const result = await updateVehicle(id, payload)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar veículo')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      notifySuccess('Veículo atualizado com sucesso!')
      onSuccess?.()
    },
    onError: (error: Error) => {
      notifyError(error.message || 'Erro ao atualizar veículo')
      onError?.(error)
    },
  })

  // Handler para mudança de arquivo de foto
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyError('Arquivo muito grande. Máximo 5MB')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Handler para remover foto
  const handleRemovePhoto = useCallback(() => {
    setPhotoFile(null)
    setPhotoPreview('')
  }, [])

  // Função para fazer upload da foto
  const uploadPhoto = useCallback(async (vehicleId: string): Promise<string | null> => {
    if (!photoFile) return formData.photo_url || null

    try {
      const result = await uploadVehiclePhoto(vehicleId, photoFile)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }
      return result.url || null
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      throw error
    }
  }, [photoFile, formData.photo_url])

  // Função para preparar dados do veículo com validação
  const prepareVehicleData = useCallback((): VehicleInsert => {
    // Converter year e capacity para números
    let yearValue: number | null = null
    if (formData.year) {
      const yearNum = typeof formData.year === 'string' ? parseInt(formData.year) : formData.year
      if (!isNaN(yearNum)) {
        yearValue = yearNum
      }
    }

    let capacityValue: number | null = null
    if (formData.capacity) {
      const capacityNum =
        typeof formData.capacity === 'string' ? parseInt(formData.capacity) : formData.capacity
      if (!isNaN(capacityNum)) {
        capacityValue = capacityNum
      }
    }

    const vehicleData: any = {
      plate: formData.plate?.trim().toUpperCase() || null,
      model: formData.model?.trim() || null,
      year: yearValue,
      prefix: formData.prefix?.trim() || null,
      capacity: capacityValue,
      is_active: formData.is_active !== undefined ? Boolean(formData.is_active) : true,
    }

    // Incluir company_id ou transportadora_id baseado no papel do usuário
    if (userInfo.role === 'admin') {
      if (formData.company_id) {
        vehicleData.company_id = formData.company_id
      }
      if (formData.transportadora_id) {
        vehicleData.transportadora_id = formData.transportadora_id
      }
    } else if (userInfo.role === 'gestor_transportadora' || userInfo.role === 'operador') {
      if (userInfo.company_id) {
        vehicleData.company_id = userInfo.company_id
      } else if (formData.company_id) {
        vehicleData.company_id = formData.company_id
      }
    } else if (userInfo.role === 'gestor_transportadora' || userInfo.role === 'transportadora') {
      if (userInfo.transportadora_id) {
        vehicleData.transportadora_id = userInfo.transportadora_id
      }
    }

    // Se for update, manter company_id/transportadora_id existente se não foi alterado
    if (initialData?.id) {
      if (!vehicleData.company_id && initialData.company_id) {
        vehicleData.company_id = initialData.company_id
      }
      if (!vehicleData.transportadora_id && (initialData as any).transportadora_id) {
        vehicleData.transportadora_id = (initialData as any).transportadora_id
      }
    }

    return vehicleData
  }, [formData, userInfo, initialData])

  // Função para validar dados do veículo
  const validateVehicleData = useCallback((data: VehicleInsert): string | null => {
    if (!data.plate) {
      return 'Placa é obrigatória'
    }
    if (!data.model) {
      return 'Modelo é obrigatório'
    }
    if (
      data.year !== null &&
      data.year !== undefined &&
      (isNaN(data.year) || data.year < 1900 || data.year > new Date().getFullYear() + 1)
    ) {
      return 'Ano inválido'
    }
    if (
      data.capacity !== null &&
      data.capacity !== undefined &&
      data.capacity !== '' &&
      (isNaN(data.capacity) || data.capacity < 1)
    ) {
      return 'Capacidade deve ser um número maior que zero'
    }
    return null
  }, [])

  // Função para submeter formulário
  const handleSubmit = useCallback(
    async (uploadPhotoFirst: boolean = false) => {
      try {
        const vehicleData = prepareVehicleData()
        const validationError = validateVehicleData(vehicleData)
        if (validationError) {
          throw new Error(validationError)
        }

        let photoUrl: string | null = vehicleData.photo_url ?? null

        // Upload da foto se necessário
        if (photoFile) {
          if (uploadPhotoFirst && initialData?.id) {
            // Upload antes de atualizar (já temos o ID)
            try {
              const uploadPromise = uploadPhoto(initialData.id)
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout no upload da foto (30s)')), 30000)
              )

              const uploadedUrl = await Promise.race([uploadPromise, timeoutPromise])
              if (uploadedUrl) {
                photoUrl = uploadedUrl
                vehicleData.photo_url = photoUrl
              }
            } catch (uploadError: any) {
              console.warn('⚠️ Erro no upload da foto (continuando sem foto):', uploadError)
            }
          }
        }

        if (initialData?.id) {
          // Update
          await updateMutation.mutateAsync({
            id: initialData.id,
            payload: vehicleData,
          })
        } else {
          // Create
          const createdVehicle = await createMutation.mutateAsync(vehicleData)
          
          // Upload da foto após criar (agora temos o ID)
          if (photoFile && createdVehicle?.id) {
            try {
              const uploadedUrl = await uploadPhoto(createdVehicle.id)
              if (uploadedUrl) {
                // Atualizar veículo com URL da foto
                await updateMutation.mutateAsync({
                  id: createdVehicle.id,
                  payload: { photo_url: uploadedUrl },
                })
              }
            } catch (uploadError: any) {
              console.warn('⚠️ Erro no upload da foto após criar:', uploadError)
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        notifyError(errorMessage)
        onError?.(error instanceof Error ? error : new Error(errorMessage))
        throw error
      }
    },
    [
      prepareVehicleData,
      validateVehicleData,
      photoFile,
      uploadPhoto,
      initialData,
      createMutation,
      updateMutation,
      onError,
    ]
  )

  return {
    formData,
    setFormData,
    photoFile,
    photoPreview,
    userInfo,
    handleFileChange,
    handleRemovePhoto,
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}

