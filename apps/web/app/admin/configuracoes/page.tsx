"use client"

import { useState, useEffect, useCallback } from "react"
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

export default function AdminConfiguracoesPage() {
  const { user, loading } = useAuthFast()
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
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
      loadProfileImage(false)
    }
  }, [user, loadProfileImage])

  const loadProfileImage = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = forceRefresh ? `?t=${Date.now()}` : ''
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
        // Adicionar timestamp para evitar cache do navegador
        const urlWithCache = `${data.avatar_url}${timestamp || `?t=${Date.now()}`}`
        setProfileImage(urlWithCache)
      } else {
        setProfileImage(null)
      }
    } catch (error) {
      console.error('Erro ao carregar foto de perfil:', error)
    }
  }, [user?.id])

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

      // Atualizar a imagem de perfil com a URL retornada
      const avatarUrl = result.url || result.publicUrl
      if (avatarUrl) {
        // Atualizar estado imediatamente
        setProfileImage(avatarUrl)
        notifySuccess('Foto de perfil atualizada com sucesso!')
        
        // Aguardar um pouco e recarregar a imagem do banco para garantir sincronização
        setTimeout(async () => {
          await loadProfileImage(true)
        }, 500)
      } else {
        throw new Error('URL da foto não foi retornada')
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      notifyError(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSavePersonal = async () => {
    if (!user) {
      notifyError('Usuário não encontrado. Por favor, faça login novamente.')
      return
    }

    setSavingPersonal(true)
    try {
      const updateData: {
        name?: string
        email?: string
      } = {}

      if (formData.name !== user.name && formData.name.trim() !== '') {
        updateData.name = formData.name.trim()
      }

      if (formData.email !== user.email && formData.email.trim() !== '') {
        updateData.email = formData.email.trim()
      }

      if (Object.keys(updateData).length === 0) {
        notifyError('Nenhuma alteração para salvar')
        setSavingPersonal(false)
        return
      }

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

      notifySuccess('Informações pessoais salvas com sucesso!')
      
      // Recarregar dados do usuário
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      notifyError(error.message || 'Erro ao salvar informações pessoais')
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleSaveSecurity = async () => {
    if (!user) {
      notifyError('Usuário não encontrado. Por favor, faça login novamente.')
      return
    }

    if (formData.newPassword && formData.newPassword.length >= 6) {
      if (formData.newPassword !== formData.confirmPassword) {
        notifyError('As senhas não coincidem')
        return
      }
    } else if (formData.newPassword && formData.newPassword.length < 6) {
      notifyError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (!formData.newPassword || formData.newPassword.trim() === '') {
      notifyError('Digite uma nova senha')
      return
    }

    setSavingSecurity(true)
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: formData.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar senha')
      }

      notifySuccess('Senha alterada com sucesso!')
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }))
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      notifyError(error.message || 'Erro ao alterar senha')
    } finally {
      setSavingSecurity(false)
    }
  }

  // Auto-save para tema
  const handleThemeChange = useCallback(async (theme: string) => {
    setFormData(prev => ({ ...prev, theme }))
    // Salvar preferência de tema no localStorage (já é feito pelo ThemeToggle)
    notifySuccess('Tema alterado')
  }, [])

  // Auto-save para notificações
  const handleNotificationChange = useCallback(async (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
    // Salvar no localStorage
    try {
      localStorage.setItem('golffox-notifications', JSON.stringify({
        ...formData.notifications,
        [key]: value
      }))
      notifySuccess('Preferência de notificação salva')
    } catch (error) {
      console.error('Erro ao salvar notificação:', error)
    }
  }, [formData.notifications])

  // Auto-save para preferências gerais
  const handleLanguageChange = useCallback(async (language: string) => {
    setFormData(prev => ({ ...prev, language }))
    try {
      localStorage.setItem('golffox-language', language)
      notifySuccess('Idioma alterado')
    } catch (error) {
      console.error('Erro ao salvar idioma:', error)
    }
  }, [])

  const handleTimezoneChange = useCallback(async (timezone: string) => {
    setFormData(prev => ({ ...prev, timezone }))
    try {
      localStorage.setItem('golffox-timezone', timezone)
      notifySuccess('Fuso horário alterado')
    } catch (error) {
      console.error('Erro ao salvar fuso horário:', error)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-[var(--ink-muted)]">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }} panel="admin">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-2">
              <Settings2 className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--brand)]" />
              Configurações
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)]">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Perfil */}
          <div className="lg:col-span-1 space-y-6">
            {/* Foto de Perfil */}
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full gradient-brand flex items-center justify-center shadow-lg overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-5xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || "A"}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[var(--brand)] text-white p-3 rounded-full cursor-pointer hover:bg-[var(--brand-dark)] transition-colors shadow-lg">
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
                  <p className="text-sm text-[var(--brand)] font-medium">Fazendo upload...</p>
                )}
              </div>
            </Card>

            {/* Exportar Dados */}
            <Card className="p-6">
              <div className="text-center">
                <Download className="h-8 w-8 text-[var(--brand)] mx-auto mb-3" />
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

          {/* Coluna Direita - Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Pessoais */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[var(--brand)]" />
                  <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                </div>
                <Button 
                  onClick={handleSavePersonal} 
                  disabled={savingPersonal}
                  size="sm"
                >
                  {savingPersonal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
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

            {/* Segurança */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--brand)]" />
                  <h2 className="text-xl font-semibold">Segurança</h2>
                </div>
                <Button 
                  onClick={handleSaveSecurity} 
                  disabled={savingSecurity}
                  size="sm"
                >
                  {savingSecurity ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
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
              </div>
            </Card>

            {/* Aparência */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="h-5 w-5 text-[var(--brand)]" />
                <h2 className="text-xl font-semibold">Aparência</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Tema</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={formData.theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                      className="flex-1"
                    >
                      Claro
                    </Button>
                    <Button
                      variant={formData.theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                      className="flex-1"
                    >
                      Escuro
                    </Button>
                    <Button
                      variant={formData.theme === "auto" ? "default" : "outline"}
                      onClick={() => handleThemeChange("auto")}
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

            {/* Notificações */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-[var(--brand)]" />
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
                      onClick={() => handleNotificationChange(key, !formData.notifications[key as keyof typeof formData.notifications])}
                      className={`relative w-12 h-6 rounded-full transition-colors ml-4 ${
                        formData.notifications[key as keyof typeof formData.notifications]
                          ? 'bg-[var(--brand)]' 
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

            {/* Preferências Gerais */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="h-5 w-5 text-[var(--brand)]" />
                <h2 className="text-xl font-semibold">Preferências Gerais</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
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
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
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
