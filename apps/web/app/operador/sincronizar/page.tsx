"use client"

import { useEffect, useState } from "react"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { AppShell } from "@/components/app-shell"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { Button } from "@/components/ui/button"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { Card } from "@/components/ui/card"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
// @ts-expect-error Legacy: valid em ambiente sem tipagem
import { geocodeAddress, optimizeRoute } from "@/lib/google-maps"

export default function SincronizarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  const reprocessarPontos = async () => {
    setSincronizando(true)
    setResultado(null)

    try {
      // Buscar todas as rotas
      const { data: rotas, error: rotasError } = await supabase
        .from("routes")
        .select("*")
        .eq("is_active", true)

      if (rotasError) throw rotasError

      let processadas = 0
      let erros = 0

      for (const rota of rotas || []) {
        try {
          // Buscar funcionÃ¡rios da empresa da rota
          const { data: funcionarios, error: funcError } = await supabase
            .from("gf_employee_company")
            .select("*")
            .eq("company_id", rota.company_id)
            .eq("is_active", true)

          if (funcError) throw funcError

          // Geocodificar endereÃ§os sem lat/lng
          const pontos: Array<{ lat: number; lng: number; address?: string }> = []
          
          for (const func of funcionarios || []) {
            let lat = func.latitude
            let lng = func.longitude

            if (!lat || !lng) {
              const location = await geocodeAddress(func.address)
              if (location) {
                lat = location.lat
                lng = location.lng

                // Atualizar funcionÃ¡rio com coordenadas
                await supabase
                  .from("gf_employee_company")
                  .update({ latitude: lat, longitude: lng })
                  .eq("id", func.id)
              } else {
                console.warn(`NÃ£o foi possÃ­vel geocodificar: ${func.address}`)
                continue
              }
            }

            pontos.push({ lat, lng, address: func.address })
          }

          // Otimizar rota usando Google Directions API
          if (pontos.length >= 2) {
            const optimized = await optimizeRoute(pontos)
            
            if (optimized) {
              // Limpar pontos antigos
              await supabase
                .from("gf_route_plan")
                .delete()
                .eq("route_id", rota.id)

              // Inserir pontos otimizados
              for (let i = 0; i < optimized.optimized.length; i++) {
                const ponto = optimized.optimized[i]
                if (ponto && ponto.lat && ponto.lng) {
                  await supabase
                    .from("gf_route_plan")
                    .insert({
                      route_id: rota.id,
                      stop_order: i + 1,
                      latitude: ponto.lat,
                      longitude: ponto.lng,
                      address: ponto.address
                    })
                }
              }

              processadas++
            } else {
              erros++
            }
          }
        } catch (error) {
          console.error(`Erro ao processar rota ${rota.id}:`, error)
          erros++
        }
      }

      setResultado({
        sucesso: true,
        processadas,
        erros,
        mensagem: `Processadas ${processadas} rotas. ${erros} erros.`
      })
    } catch (error: any) {
      setResultado({
        sucesso: false,
        mensagem: `Erro: ${error.message}`
      })
    } finally {
      setSincronizando(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sincronizar Pontos de Parada</h1>
          <p className="text-[var(--muted)]">Reprocessar e otimizar pontos de parada de todas as rotas</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Este processo irÃ¡:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--muted)]">
              <li>Buscar todos os funcionÃ¡rios cadastrados</li>
              <li>Geocodificar endereÃ§os que nÃ£o possuem coordenadas</li>
              <li>Otimizar a ordem dos pontos usando Google Directions API</li>
              <li>Atualizar os planos de rota no sistema</li>
            </ul>

            <Button 
              onClick={reprocessarPontos} 
              disabled={sincronizando}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? "Reprocessando..." : "Reprocessar Pontos de Parada"}
            </Button>

            {resultado && (
              <div className={`p-4 rounded-xl ${resultado.sucesso ? 'bg-[var(--ok)]/10 border border-[var(--ok)]' : 'bg-[var(--err)]/10 border border-[var(--err)]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {resultado.sucesso ? (
                    <CheckCircle className="h-5 w-5 text-[var(--ok)]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[var(--err)]" />
                  )}
                  <p className={`font-medium ${resultado.sucesso ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`}>
                    {resultado.sucesso ? "Sucesso" : "Erro"}
                  </p>
                </div>
                <p className="text-sm text-[var(--muted)]">{resultado.mensagem}</p>
                {resultado.processadas !== undefined && (
                  <p className="text-sm text-[var(--muted)] mt-1">
                    Rotas processadas: {resultado.processadas} | Erros: {resultado.erros}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}


