"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"

interface OperatorLogoSectionProps {
  panelHomeUrl: string
  panelBranding?: string
}

export function OperatorLogoSection({ panelHomeUrl, panelBranding }: OperatorLogoSectionProps) {
  const pathname = usePathname()
  const isOperatorPanel = (pathname?.startsWith('/operador') || pathname?.startsWith('/operator')) ?? false
  const isAdminPanel = pathname?.startsWith('/admin') ?? false
  const { companyName, logoUrl } = useOperatorTenant()
  const [imgFailed, setImgFailed] = useState(false)

  if (isOperatorPanel) {
    // Se há logo e não falhou, exibir
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
    // Se não há logo ou falhou, mostrar apenas o nome da empresa
    return (
      <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)]">
          {companyName || 'Operador'}
        </span>
      </a>
    )
  }

  // Determinar o texto do branding baseado no painel
  let brandingText = panelBranding || 'GOLF FOX'
  
  // Se for admin, usar "Administrativo" ou o branding fornecido
  if (isAdminPanel) {
    brandingText = panelBranding || 'Administrativo'
  }

  return (
    <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">                                            
          {brandingText}
        </span>
      </div>
    </a>
  )
}
