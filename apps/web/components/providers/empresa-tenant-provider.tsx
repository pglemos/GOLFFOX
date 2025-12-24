'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'

import { useRouter, useSearchParams, usePathname } from '@/lib/next-navigation'
import { supabase } from '@/lib/supabase'
import { ensureSupabaseSession } from '@/lib/supabase-session'
import { debug, warn } from '@/lib/logger'
import type { Database } from '@/types/supabase'

type UserRow = Database['public']['Tables']['users']['Row']
type EmpresasRow = Database['public']['Tables']['empresas']['Row']
type GfCompanyBrandingRow = Database['public']['Tables']['gf_company_branding']['Row']

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
      await ensureSupabaseSession()
      debug('Carregando empresas do operador', {}, 'EmpresaTenantProvider')

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
        warn('Erro ao buscar da view v_my_companies, tentando método alternativo', { error: viewErr }, 'EmpresaTenantProvider')
        queryError = viewErr
      }

      // ✅ FALLBACK: Se a view falhar, buscar empresas via tabela gf_user_company_map
      if (queryError || !data || data.length === 0) {
        debug('Tentando método alternativo: buscar via gf_user_company_map', {}, 'EmpresaTenantProvider')

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

            debug(`${data.length} empresas encontradas via gf_user_company_map`, { count: data.length }, 'EmpresaTenantProvider')
            queryError = null
          } else if (mapError) {
            warn('Erro ao buscar via gf_user_company_map', { error: mapError }, 'EmpresaTenantProvider')
          }
        } catch (fallbackErr: any) {
          warn('Erro no método alternativo', { error: fallbackErr }, 'EmpresaTenantProvider')
        }

        // ✅ FALLBACK 2: Se ainda não encontrou, tentar buscar via users.company_id
        if (!data || data.length === 0) {
          debug('Tentando método alternativo 2: buscar via users.company_id', {}, 'EmpresaTenantProvider')

          try {
            // Obter ID do usuário atual
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', authUser.id)
                .maybeSingle()

              if (!userError && userData && (userData as UserRow).empresa_id) {
                // Buscar dados da empresa
                const { data: companyData, error: companyError } = await supabase
                  .from('empresas')
                  .select('id, name, logo_url')
                  .eq('id', (userData as UserRow).empresa_id)
                  .maybeSingle()

                if (!companyError && companyData) {
                  const empresa = companyData as EmpresasRow
                  data = [{
                    id: empresa.id,
                    name: empresa.name || 'Empresa',
                    logo_url: empresa.logo_url || null
                  }]
                  debug(`Empresa encontrada via users.empresa_id: ${empresa.name}`, { companyName: empresa.name }, 'EmpresaTenantProvider')
                  queryError = null
                }
              }
            }
          } catch (userErr: any) {
            warn('Erro ao buscar via users.company_id', { error: userErr }, 'EmpresaTenantProvider')
          }
        }
      }

      if (queryError && (!data || data.length === 0)) {
        logError('Erro ao buscar empresas', { error: queryError }, 'EmpresaTenantProvider')
        setError(`Erro ao carregar empresas: ${queryError.message || 'View v_my_companies não disponível ou sem permissão'}`)
        setCompanies([])
        return
      }

      const formattedCompanies = ((data || []) as Array<{ id: string; name?: string; branding_name?: string; logo_url?: string | null }>).map((c) => ({
        id: c.id,
        name: c.name || c.branding_name || 'Empresa',
        logoUrl: c.logo_url || null
      }))

      debug(`${formattedCompanies.length} empresas encontradas`, { companies: formattedCompanies.map(c => c.name) }, 'EmpresaTenantProvider')
      setCompanies(formattedCompanies)

      // Buscar brand tokens da primeira empresa ou empresa selecionada
      if (formattedCompanies.length > 0) {
        const storedCompanyId = typeof window !== 'undefined'
          ? localStorage.getItem('operator_tenant_company_id')
          : null
        const selectedId = urlCompanyId || storedCompanyId || formattedCompanies[0]?.id

        const selectedCompany = formattedCompanies.find((c: { id: string }) => c.id === selectedId) || formattedCompanies[0]

        if (selectedCompany) {
          debug(`Empresa selecionada: ${selectedCompany.name}`, { companyId: selectedCompany.id, companyName: selectedCompany.name }, 'EmpresaTenantProvider')
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
            const branding = brandingData as GfCompanyBrandingRow
            setBrandTokens({
              primaryHex: branding.primary_hex || '#F97316',
              accentHex: branding.accent_hex || '#2E7D32'
            })
          }

          // Não adicionar/atualizar o parâmetro `company` na URL.
          // A seleção de tenant é persistida apenas em localStorage.
        }
      } else {
        warn('Nenhuma empresa encontrada para o operador, tentando fallback', {}, 'EmpresaTenantProvider')

        // FALLBACK: Tentar buscar qualquer empresa disponível (para usuários de teste)
        try {
          const { data: anyCompany } = await supabase
            .from('empresas')
            .select('id, name, logo_url')
            .limit(1)
            .maybeSingle()

          if (anyCompany) {
            const empresa = anyCompany as EmpresasRow
            debug(`Usando empresa fallback: ${empresa.name}`, { companyName: empresa.name }, 'EmpresaTenantProvider')
            const fallbackCompany = {
              id: empresa.id,
              name: empresa.name || 'Empresa',
              logoUrl: empresa.logo_url || null
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
          logError('Erro no fallback de empresa', { error: fallbackErr }, 'EmpresaTenantProvider')
          setTenantCompanyId(null)
          setError('Nenhuma empresa encontrada. Entre em contato com o administrador para associar seu usuário a uma empresa cadastrada.')
        }
      }
    } catch (err: any) {
      logError('Erro ao carregar empresas', { error: err }, 'EmpresaTenantProvider')
      setError(`Erro inesperado: ${err?.message || 'Erro desconhecido'}`)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [urlCompanyId, router])

  const switchTenant = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) {
      warn(`Empresa ${companyId} não encontrada`, { companyId }, 'EmpresaTenantProvider')
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

export interface OperatorTenantProviderProps {
  children: ReactNode
}

export function OperatorTenantProvider({ children }: OperatorTenantProviderProps) {
  return <OperatorTenantProviderInner>{children}</OperatorTenantProviderInner>
}

// Alias PT-BR
export const EmpresaTenantProvider = OperatorTenantProvider

export function useOperatorTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    logError('useOperatorTenant usado fora do OperatorTenantProvider', {}, 'EmpresaTenantProvider')
    // Retornar valores padrão em vez de lançar erro para evitar crash
    return {
      tenantCompanyId: null,
      companyName: 'Empresa',
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

// Alias PT-BR
export const useEmpresaTenant = useOperatorTenant

