/**
 * Componente Container para formulário de custo
 * Gerencia lógica de negócio e estado
 */

"use client"

import { useState, useCallback } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useCreateCost } from "@/hooks/use-costs"
import { logError } from "@/lib/logger"
import { notifyError } from "@/lib/toast"
import type { ManualCostInsert, ProfileType, CostCategory } from "@/types/financial"

import { CostFormPresentational } from "./cost-form-presentational"


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

export interface CostFormContainerProps {
    profileType: ProfileType
    companyId?: string
    transportadoraId?: string
    veiculos?: { id: string; plate: string; model?: string }[]
    routes?: { id: string; name: string }[]
    onSuccess?: () => void
    onCancel?: () => void
    initialData?: Partial<CostFormValues>
}

export function CostFormContainer({
    profileType,
    companyId,
    transportadoraId,
    veiculos = [],
    routes = [],
    onSuccess,
    onCancel,
    initialData,
}: CostFormContainerProps) {
    const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null)
    const [attachment, setAttachment] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const createCostMutation = useCreateCost()

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

    const handleRemoveFile = useCallback(() => {
        setAttachment(null)
    }, [])

    // Upload do arquivo para Supabase Storage
    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'custos')
            formData.append('folder', 'custos')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Falha no upload')

            const { url } = await response.json()
            return url
        } catch (error) {
            logError('Erro no upload', { error }, 'CostFormContainer')
            return null
        }
    }

    // Submit
    const onSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        const data = form.getValues()

        try {
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
                empresa_id: companyId,
                transportadora_id: transportadoraId,
                category_id: data.categoryId,
                description: data.description,
                amount: parseFloat(data.amount.replace(',', '.')),
                cost_date: format(data.costDate, 'yyyy-MM-dd'),
                is_recurring: data.isRecurring,
                recurring_interval: data.isRecurring ? data.recurringInterval : undefined,
                recurring_end_date: data.isRecurring && data.recurringEndDate
                    ? format(data.recurringEndDate, 'yyyy-MM-dd')
                    : undefined,
                veiculo_id: data.vehicleId || undefined,
                rota_id: data.routeId || undefined,
                notes: data.notes,
                attachment_url: attachmentUrl,
                attachment_name: attachmentName,
            }

            await createCostMutation.mutateAsync(payload)

            form.reset()
            setAttachment(null)
            setSelectedCategory(null)
            setUploadProgress(0)
            onSuccess?.()
        } catch (error) {
            logError('Erro ao salvar custo', { error }, 'CostFormContainer')
            // Erro já é tratado pelo hook
        } finally {
            setUploadProgress(0)
        }
    }, [form, attachment, companyId, transportadoraId, createCostMutation, onSuccess])

    const handleSaveAndAdd = useCallback(async () => {
        await onSubmit(new Event('submit') as any)
        // Manter formulário aberto para novo lançamento
    }, [onSubmit])

    // Formatação de moeda
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        // Remover caracteres não numéricos exceto vírgula e ponto
        value = value.replace(/[^\d,\.]/g, '')
        form.setValue('amount', value)
    }, [form])

    const handleCategoryChange = useCallback((id: string, category: CostCategory | null) => {
        form.setValue("categoryId", id)
        setSelectedCategory(category || null)
    }, [form])

    return (
        <CostFormPresentational
            form={form}
            profileType={profileType}
            veiculos={veiculos}
            routes={routes}
            selectedCategory={selectedCategory}
            attachment={attachment}
            loading={createCostMutation.isPending}
            uploadProgress={uploadProgress}
            onCategoryChange={handleCategoryChange}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onAmountChange={handleAmountChange}
            onSubmit={onSubmit}
            onSaveAndAdd={handleSaveAndAdd}
            onCancel={onCancel}
        />
    )
}

