"use client"

import { useEffect, useState, useCallback } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Input } from "@/components/ui/input"
// @ts-ignore
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Mail, Phone, Building, Upload, AlertCircle } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
// @ts-ignore
import { FuncionarioModal } from "@/components/operator/funcionario-modal"
// @ts-ignore
import { CSVImportModal } from "@/components/operator/csv-import-modal"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

interface Funcionario {
  id: string
  company_id: string
  name: string
  cpf?: string
  email?: string
  phone?: string
  is_active: boolean
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export default function FuncionariosPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)     
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError)
          setError('Erro ao verificar autenticação')
          return
        }
        if (!session) {
          router.push("/")
          return
        }
        setUser({ ...session.user })
      } catch (err: any) {
        console.error('Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const loadFuncionarios = useCallback(async () => {
    if (!tenantCompanyId) {
      console.log("⚠️ tenantCompanyId não disponível ainda")
      setFuncionarios([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      console.log(`🔍 Carregando funcionários para empresa: ${tenantCompanyId}`)
      
      // Tenta primeiro a view segura, depois view padrão, depois tabela
      let data: any[] | null = null
      let queryError: any = null
      
      // 1. Tenta view segura v_operator_employees_secure
      let result = await supabase
        .from('v_operator_employees_secure')
        .select('id, company_id, name, cpf, email, phone, is_active, address, latitude, longitude')
        .eq('company_id', tenantCompanyId)
        .order('name', { ascending: true })
      
      if (!result.error && result.data) {
        data = result.data
      } else {
        queryError = result.error
        
        // 2. Tenta view v_operator_employees (pode ter empresa_id)
        console.log("⚠️ View segura não disponível, tentando v_operator_employees")
        result = await supabase
          .from('v_operator_employees')
          .select('id, empresa_id, name, cpf, email, phone, is_active, address, latitude, longitude')
          .eq('empresa_id', tenantCompanyId)
          .order('name', { ascending: true })
        
        if (!result.error && result.data) {
          data = result.data
          queryError = null
        } else {
          queryError = result.error
          
          // 3. Tenta tabela diretamente
          console.log("⚠️ Views não disponíveis, tentando tabela diretamente")
          result = await supabase
            .from('gf_employee_company')
            .select('id, company_id, name, cpf, email, phone, is_active, address, latitude, longitude')
            .eq('company_id', tenantCompanyId)
            .order('name', { ascending: true })
          
          if (!result.error && result.data) {
            data = result.data
            queryError = null
          } else {
            queryError = result.error
          }
        }
      }

      if (queryError) {
        console.error("❌ Erro na query:", queryError)
        
        // Se erro de permissão, tenta campos mínimos
        if (queryError.code === '42501' || queryError.message.includes('permission') || queryError.message.includes('row-level security')) {
          console.log("⚠️ Erro de permissão, tentando campos mínimos")
          const { data: altData, error: altError } = await supabase
            .from('gf_employee_company')
            .select('id, company_id, name, cpf, is_active')
            .eq('company_id', tenantCompanyId)
            .order('name', { ascending: true })
          
          if (altError) {
            console.error("❌ Erro mesmo com campos mínimos:", altError)
            throw new Error(`Sem permissão para acessar funcionários: ${altError.message}`)
          }
          
          // Mapear para estrutura completa
          const mappedData = (altData || []).map((item: any) => ({
            id: item.id,
            company_id: item.company_id || item.empresa_id,
            name: item.name || 'Nome não disponível',
            cpf: item.cpf || '',
            email: null,
            phone: null,
            is_active: item.is_active ?? true,
            address: null,
            latitude: null,
            longitude: null
          }))
          
          setFuncionarios(mappedData as Funcionario[])
          console.log(`✅ ${mappedData.length} funcionários carregados (modo alternativo)`)
          return
        }
        
        throw queryError
      }
      
      // Normalizar dados (pode vir de view com empresa_id ou tabela com company_id)
      const normalizedData = (data || []).map((item: any) => ({
        id: item.id,
        company_id: item.company_id || item.empresa_id,
        name: item.name || 'Nome não disponível',
        cpf: item.cpf || '',
        email: item.email || null,
        phone: item.phone || null,
        is_active: item.is_active ?? true,
        address: item.address || null,
        latitude: item.latitude || null,
        longitude: item.longitude || null
      }))
      
      console.log(`✅ ${normalizedData.length} funcionários carregados`)
      setFuncionarios(normalizedData as Funcionario[])
    } catch (err: any) {
      console.error("❌ Erro ao carregar funcionários:", err)
      const errorMessage = err?.message || 'Erro desconhecido ao carregar funcionários'
      setError(errorMessage)
      toast.error(`Erro: ${errorMessage}`)
      setFuncionarios([])
    } finally {
      setLoading(false)
    }
  }, [tenantCompanyId])
  // Aguarda tenant carregar antes de tentar carregar funcionários
  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadFuncionarios()
    }
  }, [tenantCompanyId, tenantLoading, loadFuncionarios])

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{tenantError || error}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!tenantCompanyId) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-[var(--ink-muted)] mb-4">Selecione uma empresa para continuar</p>
            <Button onClick={() => router.push('/operator')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  const filteredFuncionarios = funcionarios.filter(f => {
    const query = searchQuery.toLowerCase()
    return !query || 
      f.name?.toLowerCase().includes(query) ||
      f.email?.toLowerCase().includes(query) ||
      f.cpf?.toLowerCase().includes(query)
  })

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funcionários</h1>
            <p className="text-[var(--ink-muted)]">Gerencie os funcionários da sua empresa</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCSVModalOpen(true)}
              disabled={!tenantCompanyId}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button 
              onClick={() => {
                setSelectedFuncionario(null)
                setIsModalOpen(true)
              }}
              disabled={!tenantCompanyId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar funcionários por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de funcionários */}
        <div className="grid gap-4">
          {filteredFuncionarios.map((funcionario, index) => {
            return (
              <motion.div
                key={funcionario.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="font-bold text-lg truncate">{funcionario.name || "Nome não disponível"}</h3>
                        {funcionario.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">Inativo</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {funcionario.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{funcionario.email}</span>
                          </div>
                        )}
                        {funcionario.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{funcionario.phone}</span>
                          </div>
                        )}
                        {funcionario.cpf && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">CPF: {funcionario.cpf}</span>
                          </div>
                        )}
                        {funcionario.address && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-500 truncate">{funcionario.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFuncionario(funcionario)
                        setIsModalOpen(true)
                      }}
                      className="flex-shrink-0"
                    >
                      Editar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
          {filteredFuncionarios.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery ? "Tente ajustar sua busca" : "Comece adicionando funcionários à sua empresa"}
              </p>
              {!searchQuery && (
                <Button onClick={() => {
                  setSelectedFuncionario(null)
                  setIsModalOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Funcionário
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Modais */}
        {tenantCompanyId && (
          <>
            <FuncionarioModal
              funcionario={selectedFuncionario}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedFuncionario(null)
              }}
              onSave={() => {
                loadFuncionarios()
                setIsModalOpen(false)
                setSelectedFuncionario(null)
              }}
              empresaId={tenantCompanyId}
            />

            <CSVImportModal
              isOpen={isCSVModalOpen}
              onClose={() => setIsCSVModalOpen(false)}
              onSave={() => {
                loadFuncionarios()
                setIsCSVModalOpen(false)
              }}
              empresaId={tenantCompanyId}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}
