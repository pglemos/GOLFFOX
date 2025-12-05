"use client"

import * as XLSX from "@e965/xlsx"
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"

export interface ExportData {
  headers: string[]
  rows: any[][]
  title?: string
  description?: string
}

export async function exportOperatorData(
  data: ExportData,
  format: "csv" | "excel" | "pdf",
  filename?: string
) {
  const defaultFilename = `export_${new Date().toISOString().split("T")[0]}`

  switch (format) {
    case "csv":
      exportToCSV(data, filename || `${defaultFilename}.csv`)
      break
    case "excel":
      exportToExcel(data, filename || `${defaultFilename}.xlsx`)
      break
    case "pdf":
      exportToPDF(data, filename || `${defaultFilename}.pdf`)
      break
  }
}

export function prepareEmployeesExport(employees: any[]): ExportData {
  return {
    title: "Funcionários",
    description: "Lista de funcionários da empresa",
    headers: ["Nome", "Email", "Telefone", "CPF", "Endereço", "Status"],
    rows: employees.map((emp) => [
      emp.name || "",
      emp.email || "",
      emp.phone || "",
      emp.cpf || "",
      emp.address || "",
      emp.is_active ? "Ativo" : "Inativo",
    ]),
  }
}

export function prepareAlertsExport(alerts: any[]): ExportData {
  return {
    title: "Alertas",
    description: "Lista de alertas do sistema",
    headers: ["Tipo", "Severidade", "Mensagem", "Data", "Status"],
    rows: alerts.map((alert) => [
      alert.alert_type || "",
      alert.severity || "",
      alert.message || "",
      alert.created_at ? new Date(alert.created_at).toLocaleString("pt-BR") : "",
      alert.is_resolved ? "Resolvido" : "Não Resolvido",
    ]),
  }
}

export function prepareRoutesExport(routes: any[]): ExportData {
  return {
    title: "Rotas",
    description: "Lista de rotas da empresa",
    headers: ["Nome", "Transportadora", "Total de Viagens", "Concluídas", "Atraso Médio"],
    rows: routes.map((route) => [
      route.name || "",
      route.carrier_name || "",
      route.total_trips || 0,
      route.completed_trips || 0,
      route.avg_delay_minutes ? `${Number(route.avg_delay_minutes).toFixed(1)} min` : "0 min",
    ]),
  }
}

