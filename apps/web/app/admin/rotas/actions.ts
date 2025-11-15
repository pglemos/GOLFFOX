"use server"

import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import type { RouteFormData } from "@/types/routes"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const routeSchema = z.object({
  name: z.string().min(1),
  company_id: z.string().uuid(),
  description: z.string().optional(),
  origin_address: z.string().optional(),
  origin_lat: z.number().optional(),
  origin_lng: z.number().optional(),
  destination_address: z.string().optional(),
  destination_lat: z.number().optional(),
  destination_lng: z.number().optional(),
  scheduled_time: z.string(),
  shift: z.enum(["manha", "tarde", "noite"]),
  days_of_week: z.array(z.number()),
  exceptions: z.array(z.string()),
  is_active: z.boolean(),
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  selected_employees: z.array(z.string().uuid()),
})

export async function createRoute(data: RouteFormData) {
  try {
    const validated = routeSchema.parse(data)
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        name: validated.name,
        company_id: validated.company_id,
        description: validated.description || null,
        origin_address: validated.origin_address || null,
        origin_lat: validated.origin_lat || null,
        origin_lng: validated.origin_lng || null,
        destination_address: validated.destination_address || null,
        destination_lat: validated.destination_lat || null,
        destination_lng: validated.destination_lng || null,
        scheduled_time: validated.scheduled_time,
        shift: validated.shift,
        days_of_week: validated.days_of_week,
        exceptions: validated.exceptions,
        is_active: validated.is_active,
        driver_id: validated.driver_id,
        vehicle_id: validated.vehicle_id,
      })
      .select()
      .single()

    if (routeError) throw routeError

    return { success: true, routeId: route.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

