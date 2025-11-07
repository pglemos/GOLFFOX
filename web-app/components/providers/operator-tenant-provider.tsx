'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
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
  error: string | null
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

// Wrapper para usar searchParams dentro de Suspense
function OperatorTenantProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tenantCompanyId, setTenantCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('Operador')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandTokens, setBrandTokens] = useState({ primaryHex: '#F97316', accentHex: '#2E7D32' })
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoizar URL company ID para evitar re-renders desnecessários
  const urlCompanyId = useMemo(() => {
    try {
      return searchParams.get('company')
    } catch (e) {
      return null
    }
  }, [searchParams])

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Carregando empresas do operador...')
      
      const { data, error: queryError } = await supabase
        .from('v_my_companies')
        .select('id, name, logo_url, primary_hex, accent_hex, branding_name')

      if (queryError) {
        console.error('❌ Erro ao buscar empresas:', queryError)
        setError(`Erro ao carregar empresas: ${queryError.message}`)
        setCompanies([])
        return
      }

      const formattedCompanies = (data || []).map(c => ({
        id: c.id,
        name: c.name || c.branding_name || 'Empresa',
        logoUrl: c.logo_url || null
      }))

      console.log(`✅ ${formattedCompanies.length} empresas encontradas:`, formattedCompanies.map(c => c.name))
      setCompanies(formattedCompanies)

      // Buscar brand tokens da primeira empresa ou empresa selecionada
      if (formattedCompanies.length > 0) {
        const storedCompanyId = typeof window !== 'undefined' 
          ? localStorage.getItem('operator_tenant_company_id') 
          : null
        const selectedId = urlCompanyId || storedCompanyId || formattedCompanies[0]?.id

        const selectedCompany = formattedCompanies.find(c => c.id === selectedId) || formattedCompanies[0]
        
        if (selectedCompany) {
          console.log(`✅ Empresa selecionada: ${selectedCompany.name} (${selectedCompany.id})`)
          setTenantCompanyId(selectedCompany.id)
          setCompanyName(selectedCompany.name)
          setLogoUrl(selectedCompany.logoUrl || null)
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('operator_tenant_company_id', selectedCompany.id)
          }

          // Buscar brand tokens
          const { data: brandingData } = await supabase
            .from('gf_company_branding')
            .select('primary_hex, accent_hex')
            .eq('company_id', selectedCompany.id)
            .single()

          if (brandingData) {
            setBrandTokens({
              primaryHex: brandingData.primary_hex || '#F97316',
              accentHex: brandingData.accent_hex || '#2E7D32'
            })
          }

          // Atualizar URL se necessário
          if (urlCompanyId && urlCompanyId !== selectedCompany.id) {
            // URL tem empresa diferente, atualizar para a válida
            const url = new URL(window.location.href)
            url.searchParams.set('company', selectedCompany.id)
            router.replace(url.pathname + url.search, { scroll: false })
          }
        }
      } else {
        console.warn('⚠️ Nenhuma empresa encontrada para o operador')
        setTenantCompanyId(null)
        setError('Nenhuma empresa encontrada. Verifique se você tem acesso a pelo menos uma empresa.')
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar empresas:', err)
      setError(`Erro inesperado: ${err?.message || 'Erro desconhecido'}`)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [urlCompanyId, router])

  const switchTenant = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) {
      console.warn(`⚠️ Empresa ${companyId} não encontrada`)
      return
    }

    setTenantCompanyId(companyId)
    setCompanyName(company.name)
    setLogoUrl(company.logoUrl || null)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('operator_tenant_company_id', companyId)
      
      // Atualizar URL
      const url = new URL(window.location.href)
      url.searchParams.set('company', companyId)
      router.replace(url.pathname + url.search, { scroll: false })
    }

    // Buscar brand tokens
    supabase
      .from('gf_company_branding')
      .select('primary_hex, accent_hex')
      .eq('company_id', companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandTokens({
            primaryHex: data.primary_hex || '#F97316',
            accentHex: data.accent_hex || '#2E7D32'
          })
        }
      })
      .catch((err) => {
        console.warn('Erro ao buscar branding:', err)
      })
  }, [companies, router])

  // Carregar empresas quando o componente monta ou quando URL muda
  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  return (
    <TenantContext.Provider value={{
      tenantCompanyId,
      companyName,
      logoUrl,
      brandTokens,
      companies,
      switchTenant,
      loading,
      error
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export function OperatorTenantProvider({ children }: { children: ReactNode }) {
  return <OperatorTenantProviderInner>{children}</OperatorTenantProviderInner>
}

export function useOperatorTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    console.error('⚠️ useOperatorTenant usado fora do OperatorTenantProvider')
    // Retornar valores padrão em vez de lançar erro para evitar crash
    return {
      tenantCompanyId: null,
      companyName: 'Operador',
      logoUrl: null,
      brandTokens: { primaryHex: '#F97316', accentHex: '#2E7D32' },
      companies: [],
      switchTenant: () => {},
      loading: false,
      error: 'Provider não inicializado'
    }
  }
  return context
}
