"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Settings2, 
  User, 
  Mail, 
  Lock, 
  Palette, 
  Bell, 
  Camera,
  Save,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Shield,
  Download
} from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { ThemeToggle } from "@/components/theme-toggle"

export default function OperatorConfiguracoesPage() {
  const { user, loading } = useAuthFast()
  const [saving, setSaving] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
    theme: "auto",
    notifications: {
      email: true,
      push: true,
      alerts: true,
      reports: false
    },
    language: "pt-BR",
    timezone: "America/Sao_Paulo"
  })

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }))
      loadProfileImage()
    }
  }, [user])

  const loadProfileImage = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Erro ao carregar foto:', error)
        return
      }
      
      if (data?.avatar_url) {
        setProfileImage(data.avatar_url)
      }
    } catch (error) {
      console.error('Erro ao carregar foto de perfil:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      notifyError('Por favor, selecione uma imagem válida')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('A imagem deve ter no máximo 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }

      setProfileImage(result.url)
      notifySuccess('Foto de perfil atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      notifyError(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      notifyError('Usuário não encontrado. Por favor, faça login novamente.')
      return
    }

    setSaving(true)
    try {
      // Validar senhas se fornecidas
      if (formData.newPassword && formData.newPassword.length >= 6) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem')
        }
      }

      // Preparar dados para atualização
      const updateData: {
        name?: string
        email?: string
        newPassword?: string
      } = {}

      if (formData.name !== user.name) {
        updateData.name = formData.name
      }

      if (formData.email !== user.email) {
        updateData.email = formData.email
      }

      if (formData.newPassword && formData.newPassword.length >= 6) {
        updateData.newPassword = formData.newPassword
      }

      // Se não há nada para atualizar
      if (Object.keys(updateData).length === 0) {
        notifySuccess('Nenhuma alteração para salvar')
        setSaving(false)
        return
      }

      // Usar API route que valida via cookie
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar configurações')
      }

      notifySuccess('Configurações salvas com sucesso!')
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }))

      // Recarregar dados do usuário se necessário
      if (updateData.name || updateData.email) {
        // Forçar reload da página para atualizar dados do usuário
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      notifyError(error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--ink-muted)]">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Operador", email: user.email, role: user.role || "operator" }} panel="operator">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-2">
              <Settings2 className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500" />
              Configurações
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)]">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto flex items-center gap-2"
            size="lg"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-orange-500 flex items-center justify-center shadow-lg overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-5xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || "O"}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 rounded-full cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <h2 className="text-lg font-semibold mb-1">Foto de Perfil</h2>
                <p className="text-sm text-[var(--ink-muted)] mb-3">
                  Formatos: JPG, PNG (máx. 5MB)
                </p>
                {uploadingImage && (
                  <p className="text-sm text-orange-500 font-medium">Fazendo upload...</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <Download className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h2 className="text-lg font-semibold mb-1">Exportar Dados</h2>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Baixe uma cópia dos seus dados pessoais
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Informações Pessoais</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Login)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Segurança</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-strong)]"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                    <Input
                      id="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Digite a senha novamente"
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-[var(--ink-muted)]">
                  Deixe em branco se não deseja alterar a senha
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Aparência</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Tema</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={formData.theme === "light" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, theme: "light" }))}
                      className="flex-1"
                    >
                      Claro
                    </Button>
                    <Button
                      variant={formData.theme === "dark" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, theme: "dark" }))}
                      className="flex-1"
                    >
                      Escuro
                    </Button>
                    <Button
                      variant={formData.theme === "auto" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, theme: "auto" }))}
                      className="flex-1"
                    >
                      Automático
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="font-medium">Alternância Rápida</p>
                    <p className="text-sm text-[var(--ink-muted)]">Alterne o tema rapidamente</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Notificações</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Notificações por Email', desc: 'Receba alertas importantes por email' },
                  { key: 'push', label: 'Notificações Push', desc: 'Receba notificações no navegador' },
                  { key: 'alerts', label: 'Alertas Críticos', desc: 'Alertas urgentes do sistema' },
                  { key: 'reports', label: 'Relatórios Semanais', desc: 'Resumo semanal de atividades' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-soft)] transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{label}</p>
                      <p className="text-sm text-[var(--ink-muted)]">{desc}</p>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [key]: !prev.notifications[key as keyof typeof prev.notifications]
                        }
                      }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ml-4 ${
                        formData.notifications[key as keyof typeof formData.notifications]
                          ? 'bg-orange-500' 
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                          formData.notifications[key as keyof typeof formData.notifications]
                            ? 'translate-x-6' 
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Preferências Gerais</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                    <select
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
