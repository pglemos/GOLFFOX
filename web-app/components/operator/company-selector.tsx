"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Building2 } from "lucide-react"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import operatorI18n from "@/i18n/operator.json"
import { motion } from "framer-motion"

export function CompanySelector() {
  const { tenantCompanyId, companyName, logoUrl, companies, switchTenant, brandTokens } = useOperatorTenant()

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md"
          style={{ backgroundColor: brandTokens.primaryHex }}
        >
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-sm sm:text-base">{operatorI18n.header_title}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
        />
      ) : (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md"
          style={{ backgroundColor: brandTokens.primaryHex }}
        >
          <Building2 className="h-5 w-5 text-white" />
        </motion.div>
      )}
      <div className="flex flex-col">
        <span className="font-bold text-sm sm:text-base tracking-tight text-[var(--ink-strong)]">
          {operatorI18n.header_title}
        </span>
        {companies.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-strong)] justify-start">
                {companyName} <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => switchTenant(company.id)}
                  className={tenantCompanyId === company.id ? "bg-[var(--bg-hover)]" : ""}
                >
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt={company.name} className="w-6 h-6 rounded mr-2" />
                  )}
                  {company.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-xs text-[var(--ink-muted)]">
            {companyName}
          </span>
        )}
      </div>
    </div>
  )
}
