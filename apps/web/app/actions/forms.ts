'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { z } from 'zod'

// Schema de validação para motorista
const motoristaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  cnh: z.string().optional(),
  cnh_category: z.string().optional(),
  transportadora_id: z.string().optional(),
})

// Server Action para criar/atualizar motorista
export async function saveMotoristaAction(
  prevState: { success: boolean; error?: string; motoristaId?: string } | null,
  formData: FormData
) {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      cpf: formData.get('cpf') as string || null,
      cnh: formData.get('cnh') as string || null,
      cnh_category: formData.get('cnh_category') as string || null,
      transportadora_id: formData.get('transportadora_id') as string || null,
      role: 'motorista' as const,
    }

    // Validar com Zod
    const validated = motoristaSchema.parse(data)
    const motoristaId = formData.get('motoristaId') as string | null

    const supabase = getSupabaseAdmin()

    if (motoristaId) {
      // Atualizar
      const { error } = await supabase
        .from('users')
        .update(validated)
        .eq('id', motoristaId)
        .eq('role', 'motorista')

      if (error) {
        return { success: false, error: error.message }
      }

      revalidatePath('/admin/transportadoras/motoristas')
      return { success: true, motoristaId }
    } else {
      // Criar - precisa de API route pois requer autenticação
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/motoristas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error || 'Erro ao criar motorista' }
      }

      const result = await response.json()
      revalidatePath('/admin/transportadoras/motoristas')
      return { success: true, motoristaId: result.motorista?.id }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Schema de validação para veículo
const veiculoSchema = z.object({
  plate: z.string().min(1, 'Placa é obrigatória'),
  model: z.string().optional(),
  year: z.number().int().optional().nullable(),
  capacity: z.number().int().optional().nullable(),
  prefix: z.string().optional(),
  transportadora_id: z.string().optional(),
  is_active: z.boolean().optional(),
})

// Server Action para criar/atualizar veículo
export async function saveVeiculoAction(
  prevState: { success: boolean; error?: string; veiculoId?: string } | null,
  formData: FormData
) {
  try {
    const data = {
      plate: formData.get('plate') as string,
      model: formData.get('model') as string || null,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null,
      prefix: formData.get('prefix') as string || null,
      transportadora_id: formData.get('transportadora_id') as string || null,
      is_active: formData.get('is_active') === 'true',
    }

    const validated = veiculoSchema.parse(data)
    const veiculoId = formData.get('veiculoId') as string | null

    const supabase = getSupabaseAdmin()

    if (veiculoId) {
      const { error } = await supabase
        .from('veiculos')
        .update(validated)
        .eq('id', veiculoId)

      if (error) {
        return { success: false, error: error.message }
      }

      revalidatePath('/admin/transportadoras/veiculos')
      return { success: true, veiculoId }
    } else {
      const { data: newVeiculo, error } = await supabase
        .from('veiculos')
        .insert(validated)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      revalidatePath('/admin/transportadoras/veiculos')
      return { success: true, veiculoId: newVeiculo?.id }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

