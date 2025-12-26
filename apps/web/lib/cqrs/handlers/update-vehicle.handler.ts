/**
 * Update Vehicle Command Handler
 * 
 * Handler para executar UpdateVehicleCommand
 */

import { publishUpdatedEvent } from '@/lib/events'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

import { ICommandHandler } from './command-handler.interface'
import { UpdateVeiculoCommand } from '../commands/update-vehicle.command'

type VeiculoRow = Database['public']['Tables']['veiculos']['Row']
type VeiculoUpdate = Database['public']['Tables']['veiculos']['Update']

export interface UpdateVehicleResult {
    success: boolean
    vehicle?: VeiculoRow
    error?: string
}

export class UpdateVehicleHandler implements ICommandHandler<UpdateVeiculoCommand, UpdateVehicleResult> {
    async handle(command: UpdateVeiculoCommand): Promise<UpdateVehicleResult> {
        try {
            const supabase = getSupabaseAdmin()
            const { vehicleId, ...updateData } = command.payload

            // Verificar se veículo existe
            const { data: existingVehicle, error: findError } = await supabase
                .from('veiculos')
                .select('*')
                .eq('id', vehicleId)
                .single()

            if (findError || !existingVehicle) {
                return {
                    success: false,
                    error: 'Veículo não encontrado'
                }
            }

            // Preparar dados para atualização
            const updatePayload: VeiculoUpdate = {}

            if (updateData.plate !== undefined) updatePayload.plate = updateData.plate
            if (updateData.model !== undefined) updatePayload.model = updateData.model
            if (updateData.brand !== undefined) updatePayload.manufacturer = updateData.brand
            if (updateData.year !== undefined) updatePayload.year = updateData.year
            if (updateData.capacity !== undefined) updatePayload.capacity = updateData.capacity
            if (updateData.company_id !== undefined) updatePayload.empresa_id = updateData.company_id
            if (updateData.transportadora_id !== undefined) updatePayload.transportadora_id = updateData.transportadora_id
            if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active

            // Atualizar veículo
            const { data: updatedVehicle, error: updateError } = await supabase
                .from('veiculos')
                .update(updatePayload)
                .eq('id', vehicleId)
                .select()
                .single()

            if (updateError) {
                logError('Erro ao atualizar veículo', { error: updateError, vehicleId }, 'UpdateVehicleHandler')
                return {
                    success: false,
                    error: updateError.message
                }
            }

            // Publicar evento de atualização
            await publishUpdatedEvent('vehicle', vehicleId, updatePayload)

            return {
                success: true,
                vehicle: updatedVehicle
            }
        } catch (error) {
            logError('Exceção ao atualizar veículo', { error }, 'UpdateVehicleHandler')
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
        }
    }
}

// Instância singleton do handler
export const updateVehicleHandler = new UpdateVehicleHandler()
