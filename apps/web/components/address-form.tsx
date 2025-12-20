"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { formatCEP, unformatNumber } from "@/lib/format-utils"
import { cn } from "@/lib/utils"

export interface AddressData {
  cep: string
  street: string
  number: string
  neighborhood: string
  complement: string
  city: string
  state: string
}

interface AddressFormProps {
  value: AddressData
  onChange: (address: AddressData) => void
  required?: boolean
  disabled?: boolean
  className?: string
  showTitle?: boolean
}

export function AddressForm({
  value,
  onChange,
  required = false,
  disabled = false,
  className,
  showTitle = true,
}: AddressFormProps) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCepSearch = async (cepToSearch?: string) => {
    const cepToUse = cepToSearch || value.cep
    const cepNumbers = unformatNumber(cepToUse)
    
    if (cepNumbers.length !== 8) {
      setCepError("CEP deve conter 8 dígitos")
      return
    }

    setLoadingCep(true)
    setCepError(null)

    try {
      const response = await fetch(`/api/cep?cep=${cepNumbers}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        setCepError(result.error || "CEP não encontrado")
        setLoadingCep(false)
        return
      }

      onChange({
        ...value,
        cep: cepToUse,
        street: result.address.logradouro || "",
        neighborhood: result.address.bairro || "",
        city: result.address.localidade || "",
        state: result.address.uf || "",
      })
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setCepError("Erro ao buscar CEP. Tente novamente.")
    } finally {
      setLoadingCep(false)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    const newValue = { ...value, cep: formatted }
    onChange(newValue)
    setCepError(null)
    
    // Limpar timeout anterior se existir
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Buscar automaticamente quando CEP estiver completo (após 500ms sem digitação)
    const cepNumbers = unformatNumber(formatted)
    if (cepNumbers.length === 8) {
      searchTimeoutRef.current = setTimeout(() => {
        handleCepSearch(formatted)
      }, 500)
    }
  }

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleCepKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCepSearch()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div className="border-t pt-4 mt-2">
          <h3 className="font-semibold mb-3">Endereço</h3>
        </div>
      )}

      <div>
        <Label
          htmlFor="cep"
          className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
        >
          CEP {required && "*"}
        </Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            placeholder="00000-000"
            required={required}
            maxLength={9}
            value={value.cep}
            onChange={handleCepChange}
            onKeyPress={handleCepKeyPress}
            disabled={disabled || loadingCep}
            className={cn(
              "flex w-full rounded-lg-custom border border-border bg-bg-soft px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11",
              cepError && "border-red-500"
            )}
          />
          <Button
            type="button"
            onClick={() => handleCepSearch()}
            disabled={disabled || loadingCep || unformatNumber(value.cep).length !== 8}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg-custom text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border bg-transparent hover:bg-bg-hover hover:border-text-brand py-2 h-11 px-4"
          >
            {loadingCep ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {cepError && <p className="text-sm text-red-500 mt-1">{cepError}</p>}
      </div>

      <div>
        <Label
          htmlFor="street"
          className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
        >
          Rua/Avenida {required && "*"}
        </Label>
        <Input
          id="street"
          placeholder="Rua Exemplo"
          required={required}
          value={value.street}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          disabled={disabled}
          className="flex w-full rounded-lg-custom border border-border bg-bg-soft px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="number"
            className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
          >
            Número {required && "*"}
          </Label>
          <Input
            id="number"
            placeholder="123"
            required={required}
            value={value.number}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
            disabled={disabled}
            className="flex w-full rounded-lg-custom border border-border bg-bg-soft px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11"
          />
        </div>

        <div>
          <Label
            htmlFor="neighborhood"
            className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
          >
            Bairro {required && "*"}
          </Label>
          <Input
            id="neighborhood"
            placeholder="Centro"
            required={required}
            value={value.neighborhood}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            disabled={disabled}
            className="flex w-full rounded-lg-custom border border-border bg-bg-soft px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="complement"
          className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
        >
          Complemento
        </Label>
        <Input
          id="complement"
          placeholder="Apto 101"
          value={value.complement}
          onChange={(e) => onChange({ ...value, complement: e.target.value })}
          disabled={disabled}
          className="flex w-full rounded-lg-custom border border-border bg-bg-soft px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="city"
            className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
          >
            Cidade
          </Label>
          <Input
            id="city"
            value={value.city}
            readOnly
            disabled
            className="flex w-full rounded-lg-custom border border-border px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11 bg-gray-50"
          />
        </div>

        <div>
          <Label
            htmlFor="state"
            className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium"
          >
            Estado
          </Label>
          <Input
            id="state"
            value={value.state}
            readOnly
            disabled
            className="flex w-full rounded-lg-custom border border-border px-4 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-brand focus-visible:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50 h-11 bg-gray-50"
          />
        </div>
      </div>
    </div>
  )
}

