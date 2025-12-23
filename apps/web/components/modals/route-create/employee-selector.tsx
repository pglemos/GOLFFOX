import React from "react"

import { Search, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { maskCPF } from "@/lib/geocoding"
import type { EmployeeLite } from "@/types/routes"

interface EmployeeSelectorProps {
    employees: EmployeeLite[]
    selectedEmployees: string[]
    loading: boolean
    searchQuery: string
    onSearchChange: (query: string) => void
    onToggleEmployee: (employeeId: string) => void
}

export function EmployeeSelector({
    employees,
    selectedEmployees,
    loading,
    searchQuery,
    onSearchChange,
    onToggleEmployee,
}: EmployeeSelectorProps) {

    const filteredEmployees = React.useMemo(() => {
        if (!searchQuery) return employees
        const lower = searchQuery.toLowerCase()
        return employees.filter(
            (e) =>
                e.first_name.toLowerCase().includes(lower) ||
                e.last_name.toLowerCase().includes(lower) ||
                (e.cpf && e.cpf.includes(lower))
        )
    }, [employees, searchQuery])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <Label className="text-base font-medium">Funcionários *</Label>
                <Badge variant="outline" className="text-sm px-3 py-1">
                    Selecionados: {selectedEmployees.length} / {employees.length}
                </Badge>
            </div>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-light" />
                <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-12 text-base h-11 sm:h-12 px-4 py-3"
                    aria-label="Buscar funcionários por nome ou CPF"
                />
            </div>
            <ScrollArea className="h-[250px] sm:h-[350px] border rounded-lg p-4">
                {loading ? (
                    <div className="text-center py-8 text-ink-muted">Carregando...</div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-8 text-ink-muted">Nenhum funcionário encontrado</div>
                ) : (
                    <div className="space-y-2">
                        {filteredEmployees.map((emp) => {
                            const isSelected = selectedEmployees.includes(emp.employee_id)
                            return (
                                <div
                                    key={emp.employee_id}
                                    className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? "bg-brand-light border-brand-soft" : "hover:bg-bg-soft"
                                        }`}
                                    onClick={() => onToggleEmployee(emp.employee_id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            onToggleEmployee(emp.employee_id)
                                        }
                                    }}
                                    aria-label={`${isSelected ? "Desmarcar" : "Selecionar"} funcionário ${emp.first_name} ${emp.last_name}`}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleEmployee(emp.employee_id)}
                                        aria-label={`${isSelected ? "Desmarcar" : "Selecionar"} ${emp.first_name} ${emp.last_name}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">
                                            {emp.first_name} {emp.last_name}
                                        </div>
                                        <div className="text-sm text-ink-muted truncate">{emp.address}</div>
                                        {emp.cpf && (
                                            <div className="text-xs text-ink-light">{maskCPF(emp.cpf)}</div>
                                        )}
                                        {(!emp.lat || !emp.lng) && (
                                            <Badge variant="destructive" className="mt-1 text-xs">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Sem coordenadas
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
