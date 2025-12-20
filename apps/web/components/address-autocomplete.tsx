"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin } from "lucide-react"
import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import { cn } from "@/lib/utils"

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, lat: number | null, lng: number | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
  onGeocodeError?: (error: string) => void
}

const libraries: ("places")[] = ["places"]

export function AddressAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Digite o endereço...",
  required = false,
  disabled = false,
  className,
  error,
  onGeocodeError
}: AddressAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries
  })

  useEffect(() => {
    if (loadError) {
      console.error("Erro ao carregar Google Maps:", loadError)
      onGeocodeError?.("Erro ao carregar serviço de endereços")
    }
  }, [loadError, onGeocodeError])

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (!autocomplete) return

    const place = autocomplete.getPlace()
    
    if (!place.geometry || !place.geometry.location) {
      onGeocodeError?.("Endereço não encontrado. Por favor, selecione um endereço válido da lista.")
      return
    }

    const address = place.formatted_address || value
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    setIsLoading(true)
    
    // Atualizar valor do input
    if (inputRef.current) {
      inputRef.current.value = address
    }

    // Chamar onChange com endereço e coordenadas
    onChange(address, lat, lng)
    
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Se o usuário apagar tudo, limpar coordenadas também
    if (newValue === "") {
      onChange("", null, null)
    } else {
      // Apenas atualizar o texto, coordenadas serão atualizadas quando selecionar da lista
      onChange(newValue, null, null)
    }
  }

  if (!isLoaded) {
    return (
      <div className={cn("grid gap-2", className)}>
        {label && <Label htmlFor="address-autocomplete">{label}</Label>}
        <div className="relative">
          <Input
            id="address-autocomplete"
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            placeholder="Carregando serviço de endereços..."
            disabled={true}
            className={cn(error && "border-error")}
          />
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ink-light" />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={cn("grid gap-2", className)}>
        {label && <Label htmlFor="address-autocomplete">{label}</Label>}
        <div className="relative">
          <Input
            id="address-autocomplete"
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(error && "border-error")}
          />
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
        </div>
        <p className="text-sm text-warning">
          Serviço de autocomplete não disponível. Você pode digitar o endereço manualmente.
        </p>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-2.5", className)}>
      {label && (
        <Label htmlFor="address-autocomplete" className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label}
        </Label>
      )}
      <div className="relative">
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: "br" }, // Restringir ao Brasil
            fields: ["formatted_address", "geometry", "address_components"],
            types: ["address"] // Apenas endereços completos
          }}
        >
          <Input
            id="address-autocomplete"
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            required={required}
            className={cn(
              error && "border-error",
              isLoading && "pr-12",
              "text-base h-11 sm:h-12 px-4 py-3 pr-12"
            )}
          />
        </Autocomplete>
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-ink-light" />
        )}
        {!isLoading && (
          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-light" />
        )}
      </div>
      {error && <p className="text-sm text-error mt-1">{error}</p>}
      {value && !autocomplete && (
        <p className="text-xs text-ink-muted mt-1">
          Selecione um endereço da lista para geocodificação automática
        </p>
      )}
    </div>
  )
}

