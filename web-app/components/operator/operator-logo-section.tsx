"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CompanySelector } from "./company-selector"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

interface OperatorLogoSectionProps {
  panelHomeUrl: string
}

export function OperatorLogoSection({ panelHomeUrl }: OperatorLogoSectionProps) {
  const pathname = usePathname()
  const isOperatorPanel = pathname?.startsWith('/operator') ?? false
  const { companyName, logoUrl } = useOperatorTenant()

  if (isOperatorPanel) {
    // ✅ Se há logo da empresa, exibir logo customizado
    if (logoUrl) {
      return (
        <Link href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img 
            src={logoUrl} 
            alt={companyName || 'Operador'} 
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">
            {companyName || 'Operador'}
          </span>
        </Link>
      )
    }
    // Se não há logo, usar CompanySelector (já filtra por tenant)
    return <CompanySelector />
  }

  return (
    <Link href={panelHomeUrl} prefetch={false} className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">                                            
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md"                                            
      >
        <span className="text-white font-bold text-lg sm:text-xl">G</span>  
      </motion.div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg sm:text-2xl tracking-tight text-[var(--ink-strong)] hidden xs:block">                                            
          {companyName || 'GOLF FOX'}
        </span>
      </div>
    </Link>
  )
}
