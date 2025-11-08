export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { supabaseServiceRole } from "@/lib/supabase-server"
import { debug, error as logError } from "@/lib/logger"

const CONTEXT = "AdminVehiclesAPI"

function sanitizeId(value: string | string[] | undefined): string | null {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  const sanitized = raw?.trim()
  return sanitized ? sanitized : null
}

export async function DELETE(_req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const vehicleId = sanitizeId(params?.vehicleId)

  if (!vehicleId) {
    return NextResponse.json({ error: "invalid_vehicle_id" }, { status: 400 })
  }

  try {
    const { count: tripsCount, error: tripsError } = await supabaseServiceRole
      .from("trips")
      .select("id", { head: true, count: "exact" })
      .eq("vehicle_id", vehicleId)

    if (tripsError) {
      logError("Erro ao verificar viagens associadas ao veículo", { vehicleId, error: tripsError }, CONTEXT)
      return NextResponse.json({ error: "trip_check_failed" }, { status: 500 })
    }

    if ((tripsCount ?? 0) > 0) {
      const { error: archiveError } = await supabaseServiceRole
        .from("vehicles")
        .update({ is_active: false })
        .eq("id", vehicleId)

      if (archiveError) {
        logError("Erro ao arquivar veículo com viagens associadas", { vehicleId, error: archiveError }, CONTEXT)
        return NextResponse.json({ error: "vehicle_archive_failed" }, { status: 500 })
      }

      debug("Veículo marcado como inativo devido a viagens associadas", { vehicleId, tripsCount }, CONTEXT)
      return NextResponse.json({ success: true, archived: true, tripsCount }, { status: 200 })
    }

    const { error: maintenanceError } = await supabaseServiceRole
      .from("gf_vehicle_maintenance")
      .delete()
      .eq("vehicle_id", vehicleId)

    if (maintenanceError) {
      logError("Erro ao excluir manutenções vinculadas ao veículo", { vehicleId, error: maintenanceError }, CONTEXT)
      return NextResponse.json({ error: "maintenance_delete_failed" }, { status: 500 })
    }

    const { error: checklistError } = await supabaseServiceRole
      .from("gf_vehicle_checklists")
      .delete()
      .eq("vehicle_id", vehicleId)

    if (checklistError) {
      logError("Erro ao excluir checklists vinculados ao veículo", { vehicleId, error: checklistError }, CONTEXT)
      return NextResponse.json({ error: "checklist_delete_failed" }, { status: 500 })
    }

    const { error: deleteError } = await supabaseServiceRole
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)

    if (deleteError) {
      logError("Erro ao excluir veículo", { vehicleId, error: deleteError }, CONTEXT)
      if (deleteError.code === "23503") {
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
          return NextResponse.json({ error: "vehicle_in_use", tripsCount: blockingTrips ?? null }, { status: 409 })
        }

        debug("Veículo marcado como inativo após detectar viagens associadas na exclusão", { vehicleId, tripsCount: blockingTrips }, CONTEXT)
        return NextResponse.json({ success: true, archived: true, tripsCount: blockingTrips ?? null }, { status: 200 })
      }
      return NextResponse.json({ error: "vehicle_delete_failed" }, { status: 500 })
    }

    debug("Veículo excluído com sucesso", { vehicleId }, CONTEXT)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    logError("Erro inesperado ao excluir veículo", { vehicleId, error }, CONTEXT)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

