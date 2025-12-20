"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { validateEnv, isDevelopment } from "@/lib/env"

export function EnvVarsBanner() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [invalidVars, setInvalidVars] = useState<Array<{ key: string; reason: string }>>([])
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Só mostrar banner em desenvolvimento
    if (!isDevelopment()) {
      return
    }

    const validation = validateEnv()
    setMissingVars(validation.missing)
    setInvalidVars(validation.invalid)
    
    // Verificar se foi fechado anteriormente
    const dismissed = sessionStorage.getItem('env_vars_banner_dismissed') === 'true'
    setIsDismissed(dismissed)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('env_vars_banner_dismissed', 'true')
  }

  // Só mostrar em desenvolvimento
  if (!isDevelopment() || (missingVars.length === 0 && invalidVars.length === 0) || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-16 sm:top-18 left-0 right-0 z-[1031] bg-gradient-to-r from-warning to-text-error text-white shadow-lg"
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
                  {missingVars.length > 0 && invalidVars.length > 0
                    ? `${missingVars.length} variáveis faltando e ${invalidVars.length} inválidas`
                    : missingVars.length === 1
                    ? `Falta configurar: ${missingVars[0]}`
                    : missingVars.length > 0
                    ? `Faltam ${missingVars.length} variáveis de ambiente críticas`
                    : `${invalidVars.length} variável(is) inválida(s)`
                  }
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {missingVars.map((key) => (
                    <code 
                      key={key}
                      className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono"
                    >
                      {key}
                    </code>
                  ))}
                  {invalidVars.map(({ key, reason }) => (
                    <code 
                      key={key}
                      className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono"
                      title={reason}
                    >
                      {key} (inválido)
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


