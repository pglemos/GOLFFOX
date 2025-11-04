'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface TenantContextType {
  tenantCompanyId: string | null
  companyName: string
  logoUrl: string | null
  brandTokens: { primaryHex: string; accentHex: string }
  companies: Array<{ id: string; name: string; logoUrl: string | null }>
  switchTenant: (companyId: string) => void
  loading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function OperatorTenantProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tenantCompanyId, setTenantCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('Operador')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandTokens, setBrandTokens] = useState({ primaryHex: '#F97316', accentHex: '#2E7D32' })
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([])
  const [loading, setLoading] = useState(true)

  const loadCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_my_companies')
        .select('id, name, logo_url, primary_hex, accent_hex')

      if (error) throw error

      const formattedCompanies = (data || []).map(c => ({
        id: c.id,
        name: c.name || c.branding_name || 'Empresa',
        logoUrl: c.logo_url || null
      }))

      setCompanies(formattedCompanies)

      // Determinar tenant: ?company= > localStorage > primeira empresa
      const urlCompanyId = searchParams.get('company')
      const storedCompanyId = typeof window !== 'undefined' 
        ? localStorage.getItem('operator_tenant_company_id') 
        : null
      const selectedId = urlCompanyId || storedCompanyId || formattedCompanies[0]?.id

      if (selectedId && formattedCompanies.length > 0) {
        const selectedCompany = formattedCompanies.find(c => c.id === selectedId) || formattedCompanies[0]
        switchTenantInternal(selectedCompany.id, selectedCompany)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  const switchTenantInternal = useCallback((
    companyId: string,
    company?: { id: string; name: string; logoUrl: string | null }
  ) => {
    const companyData = company || companies.find(c => c.id === companyId)
    if (!companyData) return

    setTenantCompanyId(companyId)
    setCompanyName(companyData.name)
    setLogoUrl(companyData.logoUrl || null)
    
    // Persistir em localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('operator_tenant_company_id', companyId)
    }
    
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href)
    url.searchParams.set('company', companyId)
    router.replace(url.pathname + url.search, { scroll: false })
  }, [companies, router])

  const switchTenant = useCallback((companyId: string) => {
    switchTenantInternal(companyId)
  }, [switchTenantInternal])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Atualizar brand tokens quando company muda
  useEffect(() => {
    if (tenantCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === tenantCompanyId)
      if (company) {
        // Buscar brand tokens da empresa
        supabase
          .from('gf_company_branding')
          .select('primary_hex, accent_hex')
          .eq('company_id', tenantCompanyId)
          .single()
          .then(({ data }) => {
            if (data) {
              setBrandTokens({
                primaryHex: data.primary_hex || '#F97316',
                accentHex: data.accent_hex || '#2E7D32'
              })
            }
          })
      }
    }
  }, [tenantCompanyId, companies])

  return (
    <TenantContext.Provider value={{
      tenantCompanyId,
      companyName,
      logoUrl,
      brandTokens,
      companies,
      switchTenant,
      loading
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useOperatorTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useOperatorTenant must be used within OperatorTenantProvider')
  }
  return context
}
