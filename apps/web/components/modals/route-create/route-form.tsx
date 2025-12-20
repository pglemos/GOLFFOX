import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, Calendar, User, Truck, X, AlertTriangle } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { RouteFormData } from "@/types/routes"

interface Company {
    id: string
    name: string
}

interface RouteFormProps {
    formData: RouteFormData
    setFormData: React.Dispatch<React.SetStateAction<RouteFormData>>
    companies: Company[]
    loadingCompanies: boolean
    selectedMotorista: { id: string; name: string; documents_valid: boolean } | null
    selectedVeiculo: { id: string; plate: string; capacity: number } | null
    onOpenMotoristaModal: () => void
    onOpenVeiculoModal: () => void
    newException: string
    setNewException: (val: string) => void
    addException: () => void
    removeException: (date: string) => void
    warnings: string[]
    children?: React.ReactNode // Para injetar o EmployeeSelector
}

const DAYS_OF_WEEK = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
]

export function RouteForm({
    formData,
    setFormData,
    companies,
    loadingCompanies,
    selectedMotorista,
    selectedVeiculo,
    onOpenMotoristaModal,
    onOpenVeiculoModal,
    newException,
    setNewException,
    addException,
    removeException,
    warnings,
    children
}: RouteFormProps) {
    return (
        <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2.5">
                    <Label htmlFor="name" className="text-base font-medium">Nome da Rota *</Label>
                    <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Linha 101 - Rota Centro"
                        className="text-base h-11 sm:h-12 px-4 py-3"
                    />
                </div>

                <div className="grid gap-2.5">
                    <Label htmlFor="company" className="text-base font-medium">Empresa *</Label>
                    <Select
                        key={`company-select-${companies.length}-${loadingCompanies ? 'loading' : 'loaded'}`}
                        value={formData.company_id || ""}
                        onValueChange={(value) => {
                            setFormData((prev) => ({
                                ...prev,
                                company_id: value,
                                selected_employees: [],
                            }))
                        }}
                        disabled={loadingCompanies}
                    >
                        <SelectTrigger
                            id="company"
                            className="text-base h-11 sm:h-12 px-4 py-3"
                            aria-label="Selecione a empresa"
                        >
                            <SelectValue placeholder={loadingCompanies ? "Carregando empresas..." : "Selecione a empresa"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {loadingCompanies ? (
                                <div className="px-4 py-3 text-base text-ink-muted flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin"></div>
                                    Carregando empresas...
                                </div>
                            ) : companies.length === 0 ? (
                                <div className="px-4 py-3 text-base text-ink-muted">
                                    <div>Nenhuma empresa encontrada</div>
                                    <div className="text-xs text-ink-light mt-1">
                                        Verifique se há empresas cadastradas no sistema
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {companies.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={c.id}
                                            className="text-base px-4 py-3 cursor-pointer"
                                        >
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.company_id && (
                <>
                    {/* Employee Selector Injected Here */}
                    {children}

                    <div className="grid gap-2.5">
                        <Label htmlFor="description" className="text-base font-medium">Descrição</Label>
                        <Input
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Descrição opcional da rota (ex: Rota principal do centro)"
                            className="text-base h-11 sm:h-12 px-4 py-3"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AddressAutocomplete
                            value={formData.origin_address || ""}
                            onChange={(address, lat, lng) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    origin_address: address,
                                    origin_lat: lat || 0,
                                    origin_lng: lng || 0,
                                }))
                            }}
                            label="Origem (Garagem)"
                            placeholder="Digite o endereço completo da garagem"
                            onGeocodeError={(error) => {
                                console.error("Geocode error:", error)
                            }}
                            className="w-full"
                        />
                        <AddressAutocomplete
                            value={formData.destination_address || ""}
                            onChange={(address, lat, lng) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    destination_address: address,
                                    destination_lat: lat || 0,
                                    destination_lng: lng || 0,
                                }))
                            }}
                            label="Destino (Empresa)"
                            placeholder="Digite o endereço completo da empresa"
                            onGeocodeError={(error) => {
                                console.error("Geocode error:", error)
                            }}
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2.5">
                            <Label htmlFor="time" className="text-base font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Horário *
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.scheduled_time || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                                className="text-base h-11 sm:h-12 px-4 py-3"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label htmlFor="shift" className="text-base font-medium">Turno *</Label>
                            <Select
                                value={formData.shift || "manha"}
                                onValueChange={(value: "manha" | "tarde" | "noite") =>
                                    setFormData((prev) => ({ ...prev, shift: value }))
                                }
                            >
                                <SelectTrigger id="shift" className="text-base h-11 sm:h-12 px-4 py-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manha" className="text-base px-4 py-3">Manhã</SelectItem>
                                    <SelectItem value="tarde" className="text-base px-4 py-3">Tarde</SelectItem>
                                    <SelectItem value="noite" className="text-base px-4 py-3">Noite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Dias da Semana
                        </Label>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {DAYS_OF_WEEK.map((day) => {
                                const isSelected = formData.days_of_week?.includes(day.value)
                                return (
                                    <Badge
                                        key={day.value}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer text-sm px-4 py-2 h-auto font-medium hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                            setFormData((prev) => {
                                                const days = prev.days_of_week || []
                                                return {
                                                    ...prev,
                                                    days_of_week: isSelected
                                                        ? days.filter((d) => d !== day.value)
                                                        : [...days, day.value],
                                                }
                                            })
                                        }}
                                    >
                                        {day.label}
                                    </Badge>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="flex items-center gap-2 text-base font-medium">
                            <Calendar className="h-5 w-5" />
                            Exceções (Datas sem rota)
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="text"
                                value={newException}
                                onChange={(e) => setNewException(e.target.value)}
                                placeholder="dd/mm/aaaa"
                                className="flex-1 text-base h-11 sm:h-12 px-4 py-3"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addException()
                                    }
                                }}
                            />
                            <Button type="button" onClick={addException} className="w-full sm:w-auto h-11 sm:h-12 text-base font-medium">
                                Adicionar
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(formData.exceptions || []).map((date) => (
                                <Badge key={date} variant="secondary" className="flex items-center gap-2 text-sm px-3 py-1.5">
                                    {new Date(date).toLocaleDateString('pt-BR')}
                                    <X
                                        className="h-4 w-4 cursor-pointer hover:text-error"
                                        onClick={() => removeException(date)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2.5">
                            <Label className="text-base font-medium flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Motorista
                            </Label>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-base h-11 sm:h-12 px-4 py-3"
                                onClick={onOpenMotoristaModal}
                                aria-label="Selecionar motorista"
                            >
                                <User className="h-5 w-5 mr-3" />
                                <span className="truncate">{selectedMotorista ? selectedMotorista.name : "Selecionar Motorista"}</span>
                            </Button>
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-base font-medium flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Veículo
                            </Label>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-base h-11 sm:h-12 px-4 py-3"
                                onClick={onOpenVeiculoModal}
                                aria-label="Selecionar veículo"
                            >
                                <Truck className="h-5 w-5 mr-3" />
                                <span className="truncate">{selectedVeiculo ? `${selectedVeiculo.plate} (Cap: ${selectedVeiculo.capacity})` : "Selecionar Veículo"}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                        <Checkbox
                            id="is_active"
                            checked={formData.is_active ?? true}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, is_active: checked as boolean }))
                            }
                            className="w-5 h-5 cursor-pointer"
                        />
                        <Label htmlFor="is_active" className="text-base font-medium cursor-pointer">Rota ativa</Label>
                    </div>

                    {warnings.length > 0 && (
                        <div className="p-3 bg-warning-light border border-warning-light rounded-lg">
                            {warnings.map((w, i) => (
                                <div key={i} className="text-sm text-warning flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    {w}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
