"use client"

/**
 * Componente de seleção de categoria com sugestões inteligentes
 * Features:
 * - Autocomplete baseado em keywords
 * - Agrupamento por tipo
 * - Ícones e cores por categoria
 * - Criação de nova categoria inline (admin)
 */

import { useState, useEffect, useMemo, useCallback } from "react"

import { Check, ChevronsUpDown, Plus, Search, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { CostCategory, ProfileType } from "@/types/financial"

interface SmartCategorySelectProps {
    value?: string
    onValueChange: (categoryId: string, category?: CostCategory) => void
    profileType: ProfileType
    placeholder?: string
    disabled?: boolean
    className?: string
    isAdmin?: boolean
    onCreateNew?: (name: string) => Promise<CostCategory | null>
}

// Mapeamento de ícones lucide-react
const iconMap: Record<string, React.ReactNode> = {
    users: <span className="text-info">👥</span>,
    gift: <span className="text-purple-600">🎁</span>,
    monitor: <span className="text-cyan-600">🖥️</span>,
    megaphone: <span className="text-brand">📢</span>,
    building: <span className="text-ink-muted">🏢</span>,
    shield: <span className="text-success">🛡️</span>,
    scale: <span className="text-error">⚖️</span>,
    search: <span className="text-indigo-600">🔍</span>,
    truck: <span className="text-brand">🚚</span>,
    "file-text": <span className="text-brand">📄</span>,
    briefcase: <span className="text-info">💼</span>,
    mail: <span className="text-purple-600">✉️</span>,
    calendar: <span className="text-success">📅</span>,
    fuel: <span className="text-brand">⛽</span>,
    wrench: <span className="text-info">🔧</span>,
    tool: <span className="text-error">🔨</span>,
    circle: <span className="text-ink-strong">⚫</span>,
    "credit-card": <span className="text-ink-muted">💳</span>,
    "file-badge": <span className="text-cyan-600">📋</span>,
    "alert-circle": <span className="text-error">⚠️</span>,
    sparkles: <span className="text-indigo-600">✨</span>,
    "trending-down": <span className="text-ink-muted">📉</span>,
    "more-horizontal": <span className="text-ink-muted">•••</span>,
}

export function SmartCategorySelect({
    value,
    onValueChange,
    profileType,
    placeholder = "Selecione uma categoria...",
    disabled = false,
    className,
    isAdmin = false,
    onCreateNew,
}: SmartCategorySelectProps) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<CostCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [creating, setCreating] = useState(false)

    // Carregar categorias
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/costs/categories?profile_type=${profileType}`)
                const result = await response.json()

                if (result.success && result.data) {
                    setCategories(result.data)
                } else if (Array.isArray(result)) {
                    // Compatibilidade com estrutura legada
                    setCategories(result.map((cat: any) => ({
                        id: cat.id,
                        name: cat.category || cat.name || cat.group_name,
                        profileType: 'all',
                        keywords: [],
                        isOperational: false,
                        isActive: true,
                        displayOrder: 0,
                        createdAt: cat.created_at,
                        updatedAt: cat.updated_at,
                    })))
                }
            } catch (error) {
                console.error('Erro ao carregar categorias:', error)
            } finally {
                setLoading(false)
            }
        }

        loadCategories()
    }, [profileType])

    // Categoria selecionada
    const selectedCategory = useMemo(() => {
        return categories.find(cat => cat.id === value)
    }, [categories, value])

    // Filtrar categorias por busca (inclui keywords)
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories

        const query = searchQuery.toLowerCase()
        return categories.filter(cat => {
            // Buscar no nome
            if (cat.name.toLowerCase().includes(query)) return true
            // Buscar nas keywords
            if (cat.keywords?.some(kw => kw.toLowerCase().includes(query))) return true
            return false
        })
    }, [categories, searchQuery])

    // Agrupar por tipo (operacional vs geral)
    const groupedCategories = useMemo(() => {
        const operational = filteredCategories.filter(cat => cat.isOperational)
        const general = filteredCategories.filter(cat => !cat.isOperational)
        return { operational, general }
    }, [filteredCategories])

    // Criar nova categoria
    const handleCreateNew = useCallback(async () => {
        if (!onCreateNew || !searchQuery.trim()) return

        setCreating(true)
        try {
            const newCategory = await onCreateNew(searchQuery.trim())
            if (newCategory) {
                setCategories(prev => [...prev, newCategory])
                onValueChange(newCategory.id, newCategory)
                setOpen(false)
                setSearchQuery("")
            }
        } finally {
            setCreating(false)
        }
    }, [onCreateNew, searchQuery, onValueChange])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || loading}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando...
                        </span>
                    ) : selectedCategory ? (
                        <span className="flex items-center gap-2">
                            {selectedCategory.icon && iconMap[selectedCategory.icon]}
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: selectedCategory.color || '#94A3B8' }}
                            />
                            {selectedCategory.name}
                        </span>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar categoria..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isAdmin && onCreateNew && searchQuery.trim() ? (
                                <div className="p-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2"
                                        onClick={handleCreateNew}
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        Criar "{searchQuery.trim()}"
                                    </Button>
                                </div>
                            ) : (
                                <p className="p-4 text-sm text-muted-foreground">
                                    Nenhuma categoria encontrada.
                                </p>
                            )}
                        </CommandEmpty>

                        {/* Categorias Operacionais */}
                        {groupedCategories.operational.length > 0 && (
                            <CommandGroup heading="Operacionais">
                                {groupedCategories.operational.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.id}
                                        onSelect={() => {
                                            onValueChange(category.id, category)
                                            setOpen(false)
                                            setSearchQuery("")
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.icon && iconMap[category.icon]}
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: category.color || '#94A3B8' }}
                                        />
                                        <span className="flex-1">{category.name}</span>
                                        {category.keywords?.length > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {category.keywords.slice(0, 2).join(', ')}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {groupedCategories.operational.length > 0 && groupedCategories.general.length > 0 && (
                            <CommandSeparator />
                        )}

                        {/* Categorias Gerais */}
                        {groupedCategories.general.length > 0 && (
                            <CommandGroup heading="Gerais">
                                {groupedCategories.general.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.id}
                                        onSelect={() => {
                                            onValueChange(category.id, category)
                                            setOpen(false)
                                            setSearchQuery("")
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.icon && iconMap[category.icon]}
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: category.color || '#94A3B8' }}
                                        />
                                        <span className="flex-1">{category.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
