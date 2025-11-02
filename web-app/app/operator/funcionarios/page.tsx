"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Plus, Search, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { geocodeAddress } from "@/lib/google-maps"

export default function FuncionariosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    address: "",
    company_id: "",
    phone: "",
    email: ""
  })
  const [showForm, setShowForm] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadData()
    }
    getUser()
  }, [router])

  const loadData = async () => {
    try {
      const [funcResult, empResult] = await Promise.all([
        supabase.from("gf_employee_company").select("*, companies(name)").eq("is_active", true),
        supabase.from("companies").select("*").eq("is_active", true)
      ])

      if (funcResult.error) throw funcResult.error
      if (empResult.error) throw empResult.error

      setFuncionarios(funcResult.data || [])
      setEmpresas(empResult.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeocoding(true)

    try {
      // Geocodificar endereço
      const location = await geocodeAddress(formData.address)

      // Gerar senha automática (por enquanto simples, pode melhorar)
      const generatedPassword = `${formData.cpf.slice(-6)}${Math.random().toString(36).slice(-4)}`

      const { data, error } = await supabase
        .from("gf_employee_company")
        .insert({
          name: formData.name,
          cpf: formData.cpf,
          address: formData.address,
          company_id: formData.company_id,
          phone: formData.phone,
          email: formData.email,
          login_cpf: formData.cpf,
          password_hash: generatedPassword, // Em produção, hash adequado
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      alert(`Funcionário cadastrado!\nLogin: ${formData.cpf}\nSenha: ${generatedPassword}`)
      setFormData({ name: "", cpf: "", address: "", company_id: "", phone: "", email: "" })
      setShowForm(false)
      loadData()
    } catch (error: any) {
      alert(`Erro ao cadastrar: ${error.message}`)
    } finally {
      setGeocoding(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Funcionários</h1>
            <p className="text-[var(--muted)]">Cadastre funcionários para automação de passageiros</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancelar" : "Cadastrar Funcionário"}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CPF</label>
                  <Input
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Endereço Completo</label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Empresa</label>
                  <select
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--muted)]/20 bg-[var(--bg-soft)]"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>
              <Button type="submit" disabled={geocoding} className="w-full">
                {geocoding ? "Geocodificando endereço..." : "Cadastrar Funcionário"}
              </Button>
            </form>
          </Card>
        )}

        <div className="grid gap-4">
          {funcionarios.map((func) => (
            <Card key={func.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{func.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-1">CPF: {func.cpf}</p>
                  <p className="text-sm text-[var(--muted)] mb-1">Login: {func.login_cpf}</p>
                  <p className="text-sm text-[var(--muted)] mb-1">Endereço: {func.address}</p>
                  <p className="text-sm text-[var(--muted)]">Empresa: {func.companies?.name || "N/A"}</p>
                  {func.latitude && func.longitude && (
                    <p className="text-xs text-[var(--muted)] mt-2">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {func.latitude.toFixed(6)}, {func.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

