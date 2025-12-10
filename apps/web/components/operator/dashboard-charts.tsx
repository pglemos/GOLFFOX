"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign } from "lucide-react"

// Lazy load dos gráficos
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart) as any, { ssr: false })
const Line = dynamic(() => import("recharts").then((mod) => mod.Line) as any, { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis) as any, { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis) as any, { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid) as any, { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip) as any, { ssr: false })
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend) as any, { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart) as any, { ssr: false })
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar) as any, { ssr: false })
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart) as any, { ssr: false })
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie) as any, { ssr: false })
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false })

interface DashboardChartsProps {
  kpis: {
    trips_today: number
    trips_in_progress: number
    trips_completed: number
    delays_over_5min: number
    avg_occupancy: number
    daily_cost: number
    sla_d0: number
  }
  period?: "today" | "week" | "month"
}

export function DashboardCharts({ kpis, period = "today" }: DashboardChartsProps) {
  // Dados mockados para demonstração - em produção viriam de uma query
  const tripsData = useMemo(() => {
    const days = period === "today" ? 24 : period === "week" ? 7 : 30
    return Array.from({ length: days }, (_, i) => ({
      name: period === "today" ? `${i}h` : `Dia ${i + 1}`,
      viagens: Math.floor(Math.random() * 50) + 20,
      concluidas: Math.floor(Math.random() * 45) + 15,
    }))
  }, [period])

  const occupancyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hora: `${i.toString().padStart(2, "0")}:00`,
      ocupacao: Math.floor(Math.random() * 40) + 50,
    }))
    return hours
  }, [])

  const costComparison = useMemo(() => {
    return [
      { name: "Hoje", valor: kpis.daily_cost },
      { name: "Ontem", valor: kpis.daily_cost * 0.95 },
    ]
  }, [kpis.daily_cost])

  const tripsStatusData = useMemo(() => {
    return [
      { name: "Concluídas", value: kpis.trips_completed, color: "#10b981" },
      { name: "Em Andamento", value: kpis.trips_in_progress, color: "#f59e0b" },
      { name: "Atrasadas", value: kpis.delays_over_5min, color: "#ef4444" },
    ]
  }, [kpis])

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Viagens ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <CardTitle>Viagens ao Longo do Tempo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* @ts-ignore - Recharts type incompatibility */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore - Recharts type incompatibility */}
              <LineChart data={tripsData as any}>
                {/* @ts-ignore - Recharts type incompatibility */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <XAxis dataKey="name" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <YAxis />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Tooltip />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Legend />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Line type="monotone" dataKey="viagens" stroke="#3b82f6" strokeWidth={2} />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Line type="monotone" dataKey="concluidas" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Ocupação por Horário */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>Ocupação por Horário</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* @ts-ignore - Recharts type incompatibility */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore - Recharts type incompatibility */}
              <BarChart data={occupancyData as any}>
                {/* @ts-ignore - Recharts type incompatibility */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <XAxis dataKey="hora" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <YAxis />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Tooltip />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Bar dataKey="ocupacao" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo de Custos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <CardTitle>Comparativo de Custos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* @ts-ignore - Recharts type incompatibility */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore - Recharts type incompatibility */}
              <BarChart data={costComparison as any}>
                {/* @ts-ignore - Recharts type incompatibility */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <XAxis dataKey="name" />
                {/* @ts-ignore - Recharts type incompatibility */}
                <YAxis />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Tooltip formatter={(value: unknown, name: unknown) => {
                  if (typeof value === 'number') {
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  }
                  return value
                }} />
                {/* @ts-ignore - Recharts type incompatibility */}
                <Bar dataKey="valor" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Viagens por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* @ts-ignore - Recharts type incompatibility */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore - Recharts type incompatibility */}
              <PieChart>
                {/* @ts-ignore - Recharts type incompatibility */}
                <Pie
                  data={tripsStatusData as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent?: number }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tripsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* @ts-ignore - Recharts type incompatibility */}
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

