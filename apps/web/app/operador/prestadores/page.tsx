"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function PrestadoresOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [prestadores, setPrestadores] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { 
          router.push("/"); 
          return 
        }
        const currentUser = { ...session.user }
        setUser(currentUser)
        
        // Carregar prestadores após definir o usuário
        if (currentUser?.id) {
          await loadPrestadores(currentUser.id)
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router])

  const loadPrestadores = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error("Erro ao buscar usuário:", userError)
        return
      }

      if (userData?.company_id) {
        const { data, error } = await (((supabase
          .from('v_operator_assigned_carriers')
          .select('*')
          .eq('empresa_id', userData.company_id)) as any) as any)
        
        if (error) {
          console.error("Erro ao buscar prestadores:", error)
          return
        }
        setPrestadores(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar prestadores:", error)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Prestadores Alocados</h1>
          <p className="text-sm sm:text-base text-[var(--ink-muted)] break-words">Lista read-only de transportadoras alocadas</p>
        </div>

        <div className="grid gap-3 sm:gap-4 w-full">
          {prestadores.map((p, i) => (
            <Card key={i} className="p-3 sm:p-4 overflow-hidden w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                <Building2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-semibold text-sm sm:text-base break-words">{p.carrier_name || 'Transportadora'}</p>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 break-words">Período: {p.period_start} — {p.period_end || 'atual'}</p>
                </div>
                <div className="text-xs sm:text-sm text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                  <p className="break-words">SLA (Pontualidade): {(p.avg_punctuality || 0).toFixed(1)}%</p>
                  <p className="break-words">Disponibilidade: {(p.avg_availability || 0).toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          ))}
          {prestadores.length === 0 && (
            <Card className="p-6 sm:p-12 text-center text-sm text-[var(--ink-muted)] w-full">
              <p className="break-words">Nenhum prestador alocado.</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

