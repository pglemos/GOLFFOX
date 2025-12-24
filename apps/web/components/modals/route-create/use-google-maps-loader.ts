import { useState, useEffect } from "react"

import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { logError } from "@/lib/logger"

export function useGoogleMapsLoader(shouldLoad: boolean) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (shouldLoad) {
            loadGoogleMaps()
                .then(() => setIsLoaded(true))
                .catch((err) => {
                    setError("Erro ao carregar Google Maps")
                    logError('Erro ao carregar Google Maps', { error: err }, 'useGoogleMapsLoader')
                })
        }
    }, [shouldLoad])

    return { isLoaded, error }
}
