"use server"

import { NextResponse } from 'next/server'

// Mock data for motoristas (motoristas) ranking
const mockDrivers = [
    {
        id: '1',
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        phone: '(31) 98765-4321',
        score: 91.7,
        punctualityScore: 95,
        economyScore: 88,
        safetyScore: 92,
        totalTrips: 156,
        totalEarnings: 8675.15,
        avgRating: 4.8,
        rank: 1,
    },
    {
        id: '2',
        name: 'João Nunes',
        email: 'joao@example.com',
        phone: '(31) 98765-4322',
        score: 91.7,
        punctualityScore: 94,
        economyScore: 90,
        safetyScore: 91,
        totalTrips: 142,
        totalEarnings: 7890.45,
        avgRating: 4.7,
        rank: 2,
    },
    {
        id: '3',
        name: 'Roberto Silva',
        email: 'roberto@example.com',
        phone: '(31) 98765-4323',
        score: 88.7,
        punctualityScore: 92,
        economyScore: 85,
        safetyScore: 89,
        totalTrips: 138,
        totalEarnings: 6960.7,
        avgRating: 4.6,
        rank: 3,
    },
    {
        id: '4',
        name: 'Maria Oliveira',
        email: 'maria@example.com',
        phone: '(31) 98765-4324',
        score: 87.3,
        punctualityScore: 89,
        economyScore: 86,
        safetyScore: 87,
        totalTrips: 108,
        totalEarnings: 5175.4,
        avgRating: 4.5,
        rank: 4,
    },
]

export async function GET() {
    return NextResponse.json({ motoristas: mockDrivers })
}
