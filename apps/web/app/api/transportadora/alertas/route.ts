"use server"

import { NextResponse } from "next/server"

export async function GET() {
    // Mock alerts data – replace with real Supabase query later
    const alerts = [
        {
            id: "1",
            type: "veiculo_parado",
            title: "Veículo parado na rua 5",
            description: "O veículo 1234 está parado há mais de 30 minutos.",
            timestamp: new Date().toISOString(),
            vehicle: "ABC-1234",
            driver: "Carlos Silva",
            location: "Rua 5, Bairro Centro",
            status: "pending",
        },
        {
            id: "2",
            type: "critico",
            title: "Falha no motor",
            description: "Motorista relatou falha no motor do veículo 5678.",
            timestamp: new Date().toISOString(),
            vehicle: "DEF-5678",
            driver: "João Nunes",
            location: "Avenida Principal",
            status: "pending",
        },
        {
            id: "3",
            type: "aviso",
            title: "Manutenção programada",
            description: "Manutenção programada para o veículo 9012 amanhã.",
            timestamp: new Date().toISOString(),
            vehicle: "GHI-9012",
            driver: "Roberto Silva",
            location: "Depósito",
            status: "pending",
        },
    ]
    return NextResponse.json({ alerts })
}
