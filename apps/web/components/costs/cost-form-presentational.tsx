/**
 * Componente Presentational para formulário de custo
 * Apenas renderiza UI, sem lógica de negócio
 */

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    DollarSign,
    Calendar,
    FileText,
    Truck,
    MapPin,
    RotateCw,
    Upload,
    X,
    Loader2,
    Save,
    Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ProfileType, CostCategory } from "@/types/financial"

import { SmartCategorySelect } from "./smart-category-select"

import type { UseFormReturn } from "react-hook-form"

export interface CostFormValues {
    categoryId?: string
    description: string
    amount: string
    costDate: Date
    isRecurring: boolean
    recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurringEndDate?: Date
    vehicleId?: string
    routeId?: string
    notes?: string
}

export interface CostFormPresentationalProps {
    form: UseFormReturn<CostFormValues>
    profileType: ProfileType
    veiculos?: { id: string; plate: string; model?: string }[]
    routes?: { id: string; name: string }[]
    selectedCategory: CostCategory | null
    attachment: File | null
    loading: boolean
    uploadProgress: number
    onCategoryChange: (id: string, category: CostCategory | null) => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveFile: () => void
    onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: React.FormEvent) => void
    onSaveAndAdd: () => void
    onCancel?: () => void
}

export function CostFormPresentational({
    form,
    profileType,
    veiculos = [],
    routes = [],
    selectedCategory,
    attachment,
    loading,
    uploadProgress,
    onCategoryChange,
    onFileChange,
    onRemoveFile,
    onAmountChange,
    onSubmit,
    onSaveAndAdd,
    onCancel,
}: CostFormPresentationalProps) {
    const isRecurring = form.watch("isRecurring")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-brand" />
                    Novo Custo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Categoria */}
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <SmartCategorySelect
                            value={form.watch("categoryId")}
                            onValueChange={(id, category) => onCategoryChange(id, category || null)}
                            profileType={profileType}
                            placeholder="Selecione uma categoria..."
                        />
                        {selectedCategory?.is_operational && (
                            <p className="text-xs text-muted-foreground">
                                💡 Categoria operacional - pode vincular a veículo/rota
                            </p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Input
                            id="description"
                            placeholder="Ex: Troca de óleo do veículo ABC-1234"
                            {...form.register("description")}
                        />
                        {form.formState.errors.description && (
                            <p className="text-xs text-error">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    {/* Valor e Data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$) *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    R$
                                </span>
                                <Input
                                    id="amount"
                                    placeholder="0,00"
                                    className="pl-10"
                                    value={form.watch("amount")}
                                    onChange={onAmountChange}
                                />
                            </div>
                            {form.formState.errors.amount && (
                                <p className="text-xs text-error">{form.formState.errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {form.watch("costDate") ? (
                                            format(form.watch("costDate"), "dd/MM/yyyy", { locale: ptBR })
                                        ) : (
                                            <span className="text-muted-foreground">Selecione...</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={form.watch("costDate")}
                                        onSelect={(date) => date && form.setValue("costDate", date)}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Veículo e Rota (se operacional) */}
                    {(selectedCategory?.is_operational || veiculos.length > 0 || routes.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {veiculos.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Veículo
                                    </Label>
                                    <Select
                                        value={form.watch("vehicleId") || ""}
                                        onValueChange={(value) => form.setValue("vehicleId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {veiculos.map((v) => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.plate} {v.model && `- ${v.model}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {routes.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Rota
                                    </Label>
                                    <Select
                                        value={form.watch("routeId") || ""}
                                        onValueChange={(value) => form.setValue("routeId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {routes.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recorrência */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCw className="h-4 w-4 text-info" />
                                <Label htmlFor="isRecurring">Custo recorrente</Label>
                            </div>
                            <Switch
                                id="isRecurring"
                                checked={isRecurring}
                                onCheckedChange={(checked) => form.setValue("isRecurring", checked)}
                            />
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Intervalo</Label>
                                    <Select
                                        value={form.watch("recurringInterval") || ""}
                                        onValueChange={(value: string) => form.setValue("recurringInterval", value as 'daily' | 'weekly' | 'monthly' | 'yearly' | null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Diário</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Até (opcional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {form.watch("recurringEndDate") ? (
                                                    format(form.watch("recurringEndDate")!, "dd/MM/yyyy", { locale: ptBR })
                                                ) : (
                                                    <span className="text-muted-foreground">Sem data fim</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent
                                                mode="single"
                                                selected={form.watch("recurringEndDate")}
                                                onSelect={(date: Date | undefined) => form.setValue("recurringEndDate", date)}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Anexo */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Anexo (opcional)
                        </Label>
                        {attachment ? (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="h-4 w-4 text-info" />
                                    <span className="text-sm truncate">{attachment.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({(attachment.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onRemoveFile}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={onFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary/50 transition-colors">
                                    <Upload className="h-5 w-5" />
                                    <span className="text-sm">Clique ou arraste um arquivo</span>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                        </p>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            placeholder="Informações adicionais..."
                            rows={3}
                            {...form.register("notes")}
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                                Cancelar
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} className="w-full sm:flex-1">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {uploadProgress > 0 ? `Enviando... ${uploadProgress}%` : 'Salvando...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Custo
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={loading}
                            onClick={onSaveAndAdd}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Salvar e Adicionar Outro
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

