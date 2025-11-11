export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { supabaseServiceRole } from "@/lib/supabase-server"
import { debug, error as logError } from "@/lib/logger"

const CONTEXT = "AdminVehiclesAPI"

// Regex para validar UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function sanitizeId(value: string | string[] | undefined): string | null {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  const sanitized = raw?.trim()
  return sanitized ? sanitized : null
}

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

export async function DELETE(_req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const vehicleId = sanitizeId(params?.vehicleId)

  if (!vehicleId) {
    return NextResponse.json({ error: "invalid_vehicle_id" }, { status: 400 })
  }

  // Validar formato UUID antes de consultar banco
  if (!isValidUUID(vehicleId)) {
    debug("UUID inválido recebido", { vehicleId }, CONTEXT)
    return NextResponse.json({ error: "invalid_vehicle_id_format", tripsCount: 0, archived: false }, { status: 400 })
  }

  try {
    // PRIMEIRO: Verificar se o veículo existe antes de qualquer outra operação
    const { data: existingVehicle, error: checkError } = await supabaseServiceRole
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .maybeSingle()

    if (checkError) {
      logError("Erro ao verificar existência do veículo", { vehicleId, error: checkError }, CONTEXT)
      return NextResponse.json({ error: "vehicle_check_failed", tripsCount: 0, archived: false }, { status: 500 })
    }

    // Se o veículo não existe, retornar sucesso (idempotência)
    if (!existingVehicle) {
      debug("Veículo não encontrado (já foi deletado ou nunca existiu)", { vehicleId }, CONTEXT)
      return NextResponse.json({ 
        success: true, 
        archived: false, 
        tripsCount: 0, 
        message: "Vehicle not found" 
      }, { status: 200 })
    }

    // SEGUNDO: Verificar viagens associadas ao veículo
    const { count: tripsCount, error: tripsError } = await supabaseServiceRole
      .from("trips")
      .select("id", { head: true, count: "exact" })
      .eq("vehicle_id", vehicleId)

    if (tripsError) {
      logError("Erro ao verificar viagens associadas ao veículo", { vehicleId, error: tripsError }, CONTEXT)
      return NextResponse.json({ error: "trip_check_failed", tripsCount: 0, archived: false }, { status: 500 })
    }

    if ((tripsCount ?? 0) > 0) {
      const { error: archiveError } = await supabaseServiceRole
        .from("vehicles")
        .update({ is_active: false })
        .eq("id", vehicleId)

      if (archiveError) {
        logError("Erro ao arquivar veículo com viagens associadas", { vehicleId, error: archiveError }, CONTEXT)
        return NextResponse.json({ error: "vehicle_archive_failed", tripsCount: tripsCount ?? 0, archived: false }, { status: 500 })
      }

      debug("Veículo marcado como inativo devido a viagens associadas", { vehicleId, tripsCount }, CONTEXT)
      return NextResponse.json({ success: true, archived: true, tripsCount: tripsCount ?? 0 }, { status: 200 })
    }

    // TERCEIRO: Deletar dependências (manutenções e checklists)
    const { error: maintenanceError } = await supabaseServiceRole
      .from("gf_vehicle_maintenance")
      .delete()
      .eq("vehicle_id", vehicleId)

    if (maintenanceError) {
      logError("Erro ao excluir manutenções vinculadas ao veículo", { vehicleId, error: maintenanceError }, CONTEXT)
      return NextResponse.json({ error: "maintenance_delete_failed", tripsCount: 0, archived: false }, { status: 500 })
    }

    const { error: checklistError } = await supabaseServiceRole
      .from("gf_vehicle_checklists")
      .delete()
      .eq("vehicle_id", vehicleId)

    if (checklistError) {
      logError("Erro ao excluir checklists vinculados ao veículo", { vehicleId, error: checklistError }, CONTEXT)
      return NextResponse.json({ error: "checklist_delete_failed", tripsCount: 0, archived: false }, { status: 500 })
    }

    // QUARTO: Deletar o veículo
    const { error: deleteError } = await supabaseServiceRole
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)

    if (deleteError) {
      logError("Erro ao excluir veículo", { vehicleId, error: deleteError }, CONTEXT)
      if (deleteError.code === "23503") {
        // Violação de foreign key - tentar arquivar
        const { count: blockingTrips } = await supabaseServiceRole
          .from("trips")
          .select("id", { head: true, count: "exact" })
          .eq("vehicle_id", vehicleId)

        const { error: archiveAfterFailure } = await supabaseServiceRole
          .from("vehicles")
          .update({ is_active: false })
          .eq("id", vehicleId)

        if (archiveAfterFailure) {
          logError("Erro ao arquivar veículo após falha de exclusão por dependências", { vehicleId, error: archiveAfterFailure }, CONTEXT)
          return NextResponse.json({ error: "vehicle_in_use", tripsCount: blockingTrips ?? 0, archived: false }, { status: 409 })
        }

        debug("Veículo marcado como inativo após detectar viagens associadas na exclusão", { vehicleId, tripsCount: blockingTrips }, CONTEXT)
        return NextResponse.json({ success: true, archived: true, tripsCount: blockingTrips ?? 0 }, { status: 200 })
      }
      return NextResponse.json({ error: "vehicle_delete_failed", tripsCount: 0, archived: false }, { status: 500 })
    }

    debug("Veículo excluído com sucesso", { vehicleId }, CONTEXT)
    return NextResponse.json({ success: true, tripsCount: 0, archived: false }, { status: 200 })
  } catch (error: unknown) {
    logError("Erro inesperado ao excluir veículo", { vehicleId, error }, CONTEXT)
    return NextResponse.json({ error: "internal_error", tripsCount: 0, archived: false }, { status: 500 })
  }
}

