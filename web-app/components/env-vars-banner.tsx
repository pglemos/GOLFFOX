"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MissingEnvVar {
  name: string
  description: string
}

export function EnvVarsBanner() {
  const [missingVars, setMissingVars] = useState<MissingEnvVar[]>([])
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Verificar variáveis de ambiente críticas
    const requiredVars: MissingEnvVar[] = []
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      requiredVars.push({
        name: "NEXT_PUBLIC_SUPABASE_URL",
        description: "URL do projeto Supabase"
      })
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      requiredVars.push({
        name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        description: "Chave anônima do Supabase"
      })
    }
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      requiredVars.push({
        name: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
        description: "Chave da API do Google Maps"
      })
    }
    
    // Verificar se foi fechado anteriormente
    const dismissed = sessionStorage.getItem('env_vars_banner_dismissed') === 'true'
    setIsDismissed(dismissed)
    
    setMissingVars(requiredVars)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('env_vars_banner_dismissed', 'true')
  }

  if (missingVars.length === 0 || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-16 sm:top-18 left-0 right-0 z-[calc(var(--z-fixed)+1)] bg-gradient-to-r from-[var(--warning)] to-[var(--error)] text-white shadow-lg"
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base">
                  Variáveis de Ambiente Faltantes
                </p>
                <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                  {missingVars.length === 1 
                    ? `Falta configurar: ${missingVars[0].name}`
                    : `Faltam ${missingVars.length} variáveis de ambiente críticas`
                  }
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {missingVars.map((v) => (
                    <code 
                      key={v.name}
                      className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono"
                    >
                      {v.name}
                    </code>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

