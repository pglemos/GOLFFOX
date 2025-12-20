"use server"

import { NextResponse } from "next/server"

export async function GET() {
    // Mock data for route executions
    // In a real scenario, this would query a 'route_executions' table joined with 'routes', 'motoristas', etc.
    const executions = [
        {
            id: "1",
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            municipality: "Belo Horizonte",
            route: "Rota Centro - Zona Sul",
            motorista: "Carlos Silva",
            duration: "1h 30min",
            distance: 25.5,
            passengers: 12,
            punctuality: 98,
            optimization: 95,
            cost: 150.00,
            status: "completed",
        },
        {
            id: "2",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            municipality: "Contagem",
            route: "Rota Industrial",
            motorista: "João Nunes",
            duration: "2h 10min",
            distance: 45.2,
            passengers: 28,
            punctuality: 85,
            optimization: 88,
            cost: 280.50,
            status: "completed",
        },
        {
            id: "3",
            date: new Date().toISOString(), // Now
            municipality: "Betim",
            route: "Rota Logística",
            motorista: "Roberto Silva",
            duration: "45min",
            distance: 15.0,
            passengers: 8,
            punctuality: 100,
            optimization: 92,
            cost: 95.00,
            status: "in_progress",
        },
        {
            id: "4",
            date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            municipality: "Belo Horizonte",
            route: "Rota Norte",
            motorista: "Ana Pereira",
            duration: "0min",
            distance: 0,
            passengers: 0,
            punctuality: 0,
            optimization: 0,
            cost: 0,
            status: "cancelled",
        },
    ]

    return NextResponse.json({ executions })
}
