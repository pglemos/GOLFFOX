"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Calendar, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { notifyError } from "@/lib/toast"

export default function CustosPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    operationalCost: 0,
    profitMargin: 0,
    totalKm: 0,
  })
  const [distribution, setDistribution] = useState({
    fuel: 0,
    maintenance: 0,
    drivers: 0,
    other: 0,
  })

  useEffect(() => {
    // TODO: fetch real data from API
    const mockKpis = {
      totalRevenue: 1250000,
      operationalCost: 820000,
      profitMargin: 43,
      totalKm: 185000,
    }
    const mockDist = {
      fuel: 35,
      maintenance: 25,
      drivers: 30,
      other: 10,
    }
    setKpis(mockKpis)
    setDistribution(mockDist)
    setLoading(false)
  }, [])

  return (
    <AppShell panel="admin">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold">Controle de Custos</h1>
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          Visão geral das finanças da operação
        </p>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-green-900">R$ {kpis.totalRevenue.toLocaleString('pt-BR')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">Custo Operacional</p>
                <p className="text-2xl font-bold text-red-900">R$ {kpis.operationalCost.toLocaleString('pt-BR')}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Margem de Lucro</p>
                <p className="text-2xl font-bold text-blue-900">{kpis.profitMargin}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">Quilometragem Total</p>
                <p className="text-2xl font-bold text-purple-900">{kpis.totalKm.toLocaleString('pt-BR')} km</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Distribuição de Custos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição de Custos (%)</h2>
          <div className="space-y-4">
            {Object.entries(distribution).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <span className="w-32 capitalize text-sm text-gray-600">{key}</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden mx-2">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${value}%` }} />
                </div>
                <span className="w-12 text-sm font-medium text-gray-800">{value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
