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

      // ✅ PRIMEIRO: Tentar buscar da view v_my_companies
      let data: any[] | null = null
      let queryError: any = null

      try {
        const result = await supabase
          .from('v_my_companies')
          .select('id, name, logo_url, primary_hex, accent_hex, branding_name')
        data = result.data
        queryError = result.error
      } catch (viewErr: any) {
        console.warn('⚠️ Erro ao buscar da view v_my_companies, tentando método alternativo:', viewErr)
        queryError = viewErr
      }

      // ✅ FALLBACK: Se a view falhar, buscar empresas via tabela gf_user_company_map
      if (queryError || !data || data.length === 0) {
        console.log('🔄 Tentando método alternativo: buscar via gf_user_company_map...')

        try {
          // Buscar empresas associadas ao usuário via gf_user_company_map
          const { data: mapData, error: mapError } = await supabase
            .from('gf_user_company_map')
            .select(`
              company_id,
              companies:company_id (
                id,
                name,
                logo_url
              )
            `)

          if (!mapError && mapData && mapData.length > 0) {
            data = mapData
              .map((item: any) => {
                const company = item.companies
                if (company && typeof company === 'object' && !Array.isArray(company)) {
                  return {
                    id: company.id,
                    name: company.name || 'Empresa',
                    logo_url: company.logo_url || null
                  }
                }
                return null
              })
              .filter((c: any) => c !== null)

            console.log(`✅ ${data.length} empresas encontradas via gf_user_company_map`)
            queryError = null
          } else if (mapError) {
            console.warn('⚠️ Erro ao buscar via gf_user_company_map:', mapError)
          }
        } catch (fallbackErr: any) {
          console.warn('⚠️ Erro no método alternativo:', fallbackErr)
        }

        // ✅ FALLBACK 2: Se ainda não encontrou, tentar buscar via users.company_id
        if (!data || data.length === 0) {
          console.log('🔄 Tentando método alternativo 2: buscar via users.company_id...')

          try {
            // Obter ID do usuário atual
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', authUser.id)
                .maybeSingle()

              if (!userError && userData && (userData as any).company_id) {
                // Buscar dados da empresa
                const { data: companyData, error: companyError } = await supabase
                  .from('companies')
                  .select('id, name, logo_url')
                  .eq('id', (userData as any).company_id)
                  .maybeSingle()

                if (!companyError && companyData) {
                  data = [{
                    id: (companyData as any).id,
                    name: (companyData as any).name || 'Empresa',
                    logo_url: (companyData as any).logo_url || null
                  }]
                  console.log(`✅ Empresa encontrada via users.company_id: ${(companyData as any).name}`)
                  queryError = null
                }
              }
            }
          } catch (userErr: any) {
            console.warn('⚠️ Erro ao buscar via users.company_id:', userErr)
          }
        }
      }

      if (queryError && (!data || data.length === 0)) {
        console.error('❌ Erro ao buscar empresas:', queryError)
        setError(`Erro ao carregar empresas: ${queryError.message || 'View v_my_companies não disponível ou sem permissão'}`)
        setCompanies([])
        return
      }

      const formattedCompanies = ((data || []) as Array<any>).map((c: any) => ({
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

        const selectedCompany = formattedCompanies.find((c: { id: string }) => c.id === selectedId) || formattedCompanies[0]

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
            .maybeSingle()

          if (brandingData) {
            setBrandTokens({
              primaryHex: (brandingData as any).primary_hex || '#F97316',
              accentHex: (brandingData as any).accent_hex || '#2E7D32'
            })
          }

          // Não adicionar/atualizar o parâmetro `company` na URL.
          // A seleção de tenant é persistida apenas em localStorage.
        }
      } else {
        console.warn('⚠️ Nenhuma empresa encontrada para o operador, tentando fallback...')

        // FALLBACK: Tentar buscar qualquer empresa disponível (para usuários de teste)
        try {
          const { data: anyCompany } = await supabase
            .from('companies')
            .select('id, name, logo_url')
            .limit(1)
            .maybeSingle()

          if (anyCompany) {
            console.log(`✅ Usando empresa fallback: ${(anyCompany as any).name}`)
            const fallbackCompany = {
              id: (anyCompany as any).id,
              name: (anyCompany as any).name || 'Empresa',
              logoUrl: (anyCompany as any).logo_url || null
            }
            setCompanies([fallbackCompany])
            setTenantCompanyId(fallbackCompany.id)
            setCompanyName(fallbackCompany.name)
            setLogoUrl(fallbackCompany.logoUrl)

            if (typeof window !== 'undefined') {
              localStorage.setItem('operator_tenant_company_id', fallbackCompany.id)
            }
          } else {
            setTenantCompanyId(null)
            setError('Nenhuma empresa encontrada. Entre em contato com o administrador para associar seu usuário a uma empresa cadastrada.')
          }
        } catch (fallbackErr) {
          console.error('❌ Erro no fallback de empresa:', fallbackErr)
          setTenantCompanyId(null)
          setError('Nenhuma empresa encontrada. Entre em contato com o administrador para associar seu usuário a uma empresa cadastrada.')
        }
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
      // Não alterar a URL com `company`. Middleware já normaliza acessos legados.
    }

    // Buscar brand tokens
    supabase
      .from('gf_company_branding')
      .select('primary_hex, accent_hex')
      .eq('company_id', companyId)
      .maybeSingle()
      .then((result: { data: any; error: any }) => {
        if (result.data) {
          setBrandTokens({
            primaryHex: result.data.primary_hex || '#F97316',
            accentHex: result.data.accent_hex || '#2E7D32'
          })
        }
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
      switchTenant: () => { },
      loading: false,
      error: 'Provider não inicializado'
    }
  }
  return context
}
