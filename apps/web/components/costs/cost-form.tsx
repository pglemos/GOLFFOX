"use client"

/**
 * Formulário de Custo Manual Avançado
 * Features:
 * - Validação em tempo real (Zod)
 * - Sugestão inteligente de categoria
 * - Upload de anexos
 * - Recorrência configurável
 * - Vínculo opcional a veículo/rota
 */

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SmartCategorySelect } from "./smart-category-select"
import { notifySuccess, notifyError } from "@/lib/toast"
import type { ManualCostInsert, ProfileType, CostCategory } from "@/types/financial"

// Schema de validação
const costFormSchema = z.object({
    categoryId: z.string().optional(),
    description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
    amount: z.string()
        .min(1, "Valor é obrigatório")
        .refine(val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0, {
            message: "Valor deve ser maior que zero"
        }),
    costDate: z.date({ required_error: "Data é obrigatória" }),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    recurringEndDate: z.date().optional(),
    vehicleId: z.string().optional(),
    routeId: z.string().optional(),
    notes: z.string().optional(),
})

type CostFormValues = z.infer<typeof costFormSchema>

interface CostFormProps {
    profileType: ProfileType
    companyId?: string
    carrierId?: string
    veiculos?: { id: string; plate: string; model?: string }[]
    routes?: { id: string; name: string }[]
    onSuccess?: () => void
    onCancel?: () => void
    initialData?: Partial<CostFormValues>
}

export function CostForm({
    profileType,
    companyId,
    carrierId,
    veiculos = [],
    routes = [],
    onSuccess,
    onCancel,
    initialData,
}: CostFormProps) {
    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null)
    const [attachment, setAttachment] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const form = useForm<CostFormValues>({
        resolver: zodResolver(costFormSchema),
        defaultValues: {
            description: initialData?.description || "",
            amount: initialData?.amount || "",
            costDate: initialData?.costDate || new Date(),
            isRecurring: initialData?.isRecurring || false,
            categoryId: initialData?.categoryId,
            vehicleId: initialData?.vehicleId,
            routeId: initialData?.routeId,
            notes: initialData?.notes,
        },
    })

    const isRecurring = form.watch("isRecurring")

    // Upload de anexo
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validar tamanho (máx 5MB)
            if (file.size > 5 * 1024 * 1024) {
                notifyError('Arquivo deve ter no máximo 5MB')
                return
            }
            // Validar tipo
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
            if (!allowedTypes.includes(file.type)) {
                notifyError('Apenas imagens (JPG, PNG) e PDFs são aceitos')
                return
            }
            setAttachment(file)
        }
    }, [])

    // Upload do arquivo para Supabase Storage
    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'costs')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Falha no upload')

            const { url } = await response.json()
            return url
        } catch (error) {
            console.error('Erro no upload:', error)
            return null
        }
    }

    // Submit
    const onSubmit = async (data: CostFormValues) => {
        try {
            setLoading(true)

            // Fazer upload do anexo se houver
            let attachmentUrl = null
            let attachmentName = null
            if (attachment) {
                setUploadProgress(50)
                attachmentUrl = await uploadFile(attachment)
                attachmentName = attachment.name
                setUploadProgress(100)
            }

            // Montar payload
            const payload: ManualCostInsert = {
                companyId,
                carrierId,
                categoryId: data.categoryId,
                description: data.description,
                amount: parseFloat(data.amount.replace(',', '.')),
                costDate: format(data.costDate, 'yyyy-MM-dd'),
                isRecurring: data.isRecurring,
                recurringInterval: data.isRecurring ? data.recurringInterval : undefined,
                recurringEndDate: data.isRecurring && data.recurringEndDate
                    ? format(data.recurringEndDate, 'yyyy-MM-dd')
                    : undefined,
                vehicleId: data.vehicleId || undefined,
                routeId: data.routeId || undefined,
                notes: data.notes,
                attachmentUrl,
                attachmentName,
            }

            const response = await fetch('/api/costs/manual-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro ao salvar custo')
            }

            notifySuccess('Custo cadastrado com sucesso!')
            form.reset()
            setAttachment(null)
            setSelectedCategory(null)
            onSuccess?.()
        } catch (error) {
            console.error('Erro ao salvar custo:', error)
            notifyError(error instanceof Error ? error.message : 'Erro ao salvar custo')
        } finally {
            setLoading(false)
            setUploadProgress(0)
        }
    }

    // Formatação de moeda
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        // Remover caracteres não numéricos exceto vírgula e ponto
        value = value.replace(/[^\d,\.]/g, '')
        form.setValue('amount', value)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-brand" />
                    Novo Custo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Categoria */}
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <SmartCategorySelect
                            value={form.watch("categoryId")}
                            onValueChange={(id, category) => {
                                form.setValue("categoryId", id)
                                setSelectedCategory(category || null)
                            }}
                            profileType={profileType}
                            placeholder="Selecione uma categoria..."
                        />
                        {selectedCategory?.isOperational && (
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
                                    onChange={handleAmountChange}
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
                    {(selectedCategory?.isOperational || veiculos.length > 0 || routes.length > 0) && (
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
                                        onValueChange={(value: any) => form.setValue("recurringInterval", value)}
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
                                    onClick={() => setAttachment(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
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
                            onClick={form.handleSubmit(async (data) => {
                                await onSubmit(data)
                                // Manter formulário aberto para novo lançamento
                            })}
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
