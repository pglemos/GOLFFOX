"use client"

import { useState } from "react"

import Image from "next/image"

import { useOperatorTenant, useEmpresaTenant } from "@/components/providers/empresa-tenant-provider"
import { usePathname } from "@/lib/next-navigation"

interface EmpresaLogoSectionProps {
    panelHomeUrl: string
    panelBranding?: string
}

/**
 * EmpresaLogoSection - Seção de logo para o painel da Empresa Contratante
 */
export function EmpresaLogoSection({ panelHomeUrl, panelBranding }: EmpresaLogoSectionProps) {
    const pathname = usePathname()
    // Suportar tanto /empresa (nova rota) quanto /operador (compatibilidade)
    const isEmpresaPanel = (pathname?.startsWith('/empresa') || pathname?.startsWith('/operador') || pathname?.startsWith('/operador')) ?? false
    const isAdminPanel = pathname?.startsWith('/admin') ?? false
    const { companyName, logoUrl } = useEmpresaTenant()
    const [imgFailed, setImgFailed] = useState(false)

    if (isEmpresaPanel) {
        // Se há logo e não falhou, exibir
        if (logoUrl && !imgFailed) {
            return (
                <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Image
                        src={logoUrl}
                        alt={companyName || 'Empresa'}
                        width={40}
                        height={40}
                        className="h-8 sm:h-10 w-auto object-contain"
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                    />
                    <span className="font-bold text-lg sm:text-2xl tracking-tight text-ink-strong hidden xs:block">
                        {companyName || 'Empresa'}
                    </span>
                </a>
            )
        }
        // Se não há logo ou falhou, mostrar apenas o nome da empresa
        return (
            <a href={panelHomeUrl} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="font-bold text-lg sm:text-2xl tracking-tight text-ink-strong">
                    {companyName || 'Empresa'}
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
                <span className="font-bold text-lg sm:text-2xl tracking-tight text-ink-strong hidden xs:block">
                    {brandingText}
                </span>
            </div>
        </a>
    )
}

// Alias para compatibilidade com código legado
export const OperatorLogoSection = EmpresaLogoSection
