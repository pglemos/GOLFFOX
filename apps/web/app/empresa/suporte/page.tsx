"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { LifeBuoy, Send } from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function EmpresaSuportePage() {
    const { user, loading } = useAuthFast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        subject: "",
        type: "incident",
        message: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Simulação de envio
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Implementar envio real via API/Banco
            console.log('Ticket enviado:', formData)

            notifySuccess('Mensagem enviada com sucesso! Entraremos em contato em breve.')
            setFormData({ subject: "", type: "incident", message: "" })
        } catch (error) {
            notifyError('Erro ao enviar mensagem', 'Tente novamente mais tarde.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AppShell
            panel="empresa"
            user={user ? {
                id: user.id,
                name: user.name || "Empresa",
                email: user.email,
                role: "empresa",
                avatar_url: user.avatar_url
            } : {
                id: '',
                name: 'Empresa',
                email: '',
                role: 'empresa',
                avatar_url: undefined
            }}
        >
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Suporte e Feedback</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Precisa de ajuda? Entre em contato com nossa equipe.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LifeBuoy className="h-5 w-5 text-primary" />
                            Novo Chamado
                        </CardTitle>
                        <CardDescription>
                            Descreva seu problema ou sugestão abaixo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Solicitação</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="incident">Relatar Incidente Operacional</SelectItem>
                                        <SelectItem value="financial">Dúvida Financeira</SelectItem>
                                        <SelectItem value="feature">Sugestão de Melhoria</SelectItem>
                                        <SelectItem value="other">Outro Assunto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Assunto</Label>
                                <Input
                                    id="subject"
                                    placeholder="Resumo do problema"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem Detalhada</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Descreva o que aconteceu, inclua nomes, placas ou rotas se necessário."
                                    className="min-h-[150px]"
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setFormData({ subject: "", type: "incident", message: "" })}>
                                    Limpar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="animate-pulse">Enviando...</span>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar Solicitação
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center text-sm text-ink-muted">
                    <p>Para emergências operacionais (socorro, acidentes), ligue para nossa Central 24h: <strong>0800 123 4567</strong></p>
                </div>
            </div>
        </AppShell>
    )
}
