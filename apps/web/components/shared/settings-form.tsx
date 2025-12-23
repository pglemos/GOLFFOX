"use client"

import { useState } from "react"

import { Shield, User, Bell, Settings as SettingsIcon, Loader2 } from "lucide-react"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserService } from "@/lib/services/user-service"
import { notifySuccess, notifyError } from "@/lib/toast"


interface SettingsFormProps {
    panel: "admin" | "empresa" | "transportadora"
}

export function SettingsForm({ panel }: SettingsFormProps) {
    const { user, refresh } = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            notifyError("As senhas não coincidem")
            return
        }

        setLoading(true)
        try {
            const success = await UserService.updateProfile({
                name: formData.name,
                email: formData.email,
                newPassword: formData.newPassword || undefined
            })

            if (success) {
                notifySuccess("Perfil atualizado com sucesso!")
                if (refresh) await refresh()
            } else {
                throw new Error("Não foi possível atualizar o perfil")
            }
        } catch (err) {
            notifyError(err, "Erro ao atualizar perfil")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-8 p-1 bg-slate-100 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg gap-2">
                    <User className="h-4 w-4" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg gap-2">
                    <Shield className="h-4 w-4" /> Segurança
                </TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg gap-2">
                    <Bell className="h-4 w-4" /> Notificações
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Dados Pessoais</CardTitle>
                        <CardDescription>Atualize suas informações de contato.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail Corporativo</Label>
                                    <Input
                                        id="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-slate-50"
                                    />
                                </div>
                            </div>
                            <Button disabled={loading} className="bg-brand hover:bg-brand-hover">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security">
                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Senha e Acesso</CardTitle>
                        <CardDescription>Mantenha sua conta protegida com uma senha forte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="current">Senha Atual</Label>
                                <Input
                                    id="current"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">Nova Senha</Label>
                                <Input
                                    id="new"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <Button disabled={loading} variant="outline" type="submit">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Redefinir Senha
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
