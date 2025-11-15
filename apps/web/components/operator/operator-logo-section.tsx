"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CompanySelector } from "./company-selector"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

interface OperatorLogoSectionProps {
  panelHomeUrl: string
  panelBranding?: string
}

export function OperatorLogoSection({ panelHomeUrl, panelBranding }: OperatorLogoSectionProps) {
  const pathname = usePathname()
  const isOperatorPanel = pathname?.startsWith('/operator') ?? false
  const isAdminPanel = pathname?.startsWith('/admin') ?? false
  const { companyName, logoUrl } = useOperatorTenant()
  const [imgFailed, setImgFailed] = useState(false)

  if (isOperatorPanel) {
    // ✅ Se há logo e não falhou, exibir; caso contrário, CompanySelector
    if (logoUrl && !imgFailed) {
      return (
        <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img
            src={logoUrl}
            alt={companyName || 'Operador'}
            className="h-8 sm:h-10 w-auto object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
          <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">
            {companyName || 'Operador'}
          </span>
        </a>
      )
    }
    // Se não há logo ou falhou, usar CompanySelector
    return <CompanySelector />
  }

  // Determinar o texto do branding baseado no painel
  let brandingText = panelBranding || 'GOLF FOX'
  
  // Se for admin, usar "Administrativo" ou o branding fornecido
  if (isAdminPanel) {
    brandingText = panelBranding || 'Administrativo'
  }

  return (
    <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md"                                            
      >
        <span className="text-white font-bold text-lg sm:text-xl">G</span>  
      </motion.div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">                                            
          {brandingText}
        </span>
      </div>
    </a>
  )
}
