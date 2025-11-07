"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Mail, Phone, Building, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { FuncionariosErrorBoundary } from "./error-boundary"

interface Funcionario {
  id: string
  company_id: string
  name: string
  cpf?: string
  email?: string
  phone?: string
  is_active: boolean
  address?: string
}

// Validação simples para UUID v4
const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function FuncionariosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company')
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Carregar usuário
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('🔐 Verificando sessão do usuário...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError)
          setError('Erro ao carregar sessão')
          setLoading(false)
          return
        }
        
        if (!session) {
          console.warn('⚠️  Sem sessão - redirecionando...')
          router.push("/")
          return
        }
        
        console.log('✅ Usuário autenticado:', session.user.email)
        setUser(session.user)
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
        setLoading(false)
      }
    }
    
    // Timeout de segurança
    const timeout = setTimeout(() => {
      console.warn('⚠️  Timeout ao carregar usuário')
      setLoading(false)
    }, 5000)
    
    getUser().finally(() => clearTimeout(timeout))
  }, [router])

  // Carregar funcionários
  useEffect(() => {
    const loadFuncionarios = async () => {
      if (!companyId) {
        setError('ID da empresa não fornecido')
        setLoading(false)
        return
      }
      
      // Evitar erro de Postgres ao filtrar por UUID inválido
      if (!isValidUUID(companyId)) {
        setError('ID da empresa inválido. Utilize um UUID válido na URL.')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        console.log(`🔍 Carregando funcionários para empresa: ${companyId}`)
        
        // Tentar carregar da tabela diretamente
        const { data, error: queryError } = await supabase
          .from('gf_employee_company')
          .select('id, company_id, name, cpf, email, phone, is_active, address')
          .eq('company_id', companyId)
          .order('name', { ascending: true })

        if (queryError) {
          console.error("❌ Erro na query:", queryError)
          setError(`Erro ao carregar funcionários: ${queryError.message}`)
          setFuncionarios([])
          return
        }
        
        console.log(`✅ ${data?.length || 0} funcionários carregados`)
        setFuncionarios(data || [])
        setError(null)
      } catch (err: any) {
        console.error("❌ Erro ao carregar funcionários:", err)
        setError(err.message || 'Erro ao carregar funcionários')
        toast.error(`Erro: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      loadFuncionarios()
    }
  }, [companyId])

  // Preparar user object com todas as propriedades necessárias (sempre válido)
  const getUserName = () => {
    if (!user) return "Usuário"
    if (user.user_metadata?.name) return user.user_metadata.name
    if (user.email) return user.email.split("@")[0]
    return "Usuário"
  }

  const userObj = {
    id: user?.id || "guest",
    name: getUserName(),
    email: user?.email || "guest@demo.com",
    role: "operator" as const
  }

  // Se ainda está carregando o usuário (primeira vez), mostra loading simples
  if (loading && !user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuário...</p>
          <p className="text-xs text-gray-400 mt-2">Se demorar muito, recarregue a página</p>
        </div>
      </div>
    )
  }

  // Se não tem company ID
  if (!companyId) {
    return (
      <AppShell user={userObj}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Empresa não especificada</h2>
            <p className="text-gray-600 mb-4">
              É necessário especificar uma empresa na URL.
            </p>
            <Button onClick={() => router.push('/operator')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Se tem erro
  if (error && !loading) {
    return (
      <AppShell user={userObj}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                Tentar Novamente
              </Button>
              <Button onClick={() => router.push('/operator')} variant="outline">
                Voltar
              </Button>
            </div>
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
    <AppShell user={userObj}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funcionários</h1>
            <p className="text-gray-600">
              Empresa: {companyId.substring(0, 8)}...
            </p>
          </div>
          <Button onClick={() => router.push('/operator')} variant="outline">
            Voltar
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando funcionários...</p>
          </div>
        )}

        {/* Lista de funcionários */}
        {!loading && (
          <div className="grid gap-4">
            {filteredFuncionarios.length > 0 ? (
              filteredFuncionarios.map((funcionario) => (
                <Card key={funcionario.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="font-bold text-lg truncate">
                          {funcionario.name || "Nome não disponível"}
                        </h3>
                        {funcionario.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            Inativo
                          </Badge>
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
                            <span className="text-xs text-gray-500">{funcionario.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-sm text-gray-500">
                  {searchQuery 
                    ? "Tente ajustar sua busca" 
                    : "Nenhum funcionário cadastrado para esta empresa"}
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function FuncionariosPage() {
  return (
    <FuncionariosErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }>
        <FuncionariosPageContent />
      </Suspense>
    </FuncionariosErrorBoundary>
  )
}
