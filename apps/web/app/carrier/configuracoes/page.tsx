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

export default function CarrierConfiguracoesPage() {
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
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      
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
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfileImage(publicUrl)
      notifySuccess('Foto de perfil atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      notifyError('Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      if (formData.name !== user.name) {
        const { error: nameError } = await supabase
          .from('users')
          .update({ name: formData.name })
          .eq('id', user.id)

        if (nameError) throw nameError
      }

      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

      if (formData.newPassword && formData.newPassword.length >= 6) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem')
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
      }

      notifySuccess('Configurações salvas com sucesso!')
      
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: ""
      }))
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
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
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
    <AppShell user={{ id: user.id, name: user.name || "Transportadora", email: user.email, role: user.role || "carrier" }} panel="carrier">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Settings2 className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--brand)]" />
              Configurações
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)] mt-1">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
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

        {/* Foto de Perfil */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full gradient-brand flex items-center justify-center shadow-lg overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl sm:text-4xl font-bold">
                    {user.name?.charAt(0).toUpperCase() || "T"}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[var(--brand)] text-white p-2 rounded-full cursor-pointer hover:bg-[var(--brand-dark)] transition-colors shadow-lg">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Foto de Perfil</h2>
              <p className="text-sm text-[var(--ink-muted)] mb-3">
                Clique no ícone da câmera para alterar sua foto de perfil. Formatos aceitos: JPG, PNG (máx. 5MB)
              </p>
              {uploadingImage && (
                <p className="text-sm text-[var(--brand)]">Fazendo upload...</p>
              )}
            </div>
          </div>
        </Card>

        {/* Informações Pessoais */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Informações Pessoais</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
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
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Segurança</h2>
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
                  className="pl-10 pr-10"
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
                  className="pl-10"
                />
              </div>
            </div>
            
            <p className="text-xs text-[var(--ink-muted)]">
              Deixe em branco se não deseja alterar a senha
            </p>
          </div>
        </Card>

        {/* Aparência */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Aparência</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Tema</Label>
              <div className="flex gap-2 mt-2">
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
            
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div>
                <p className="font-medium">Alternância Rápida</p>
                <p className="text-sm text-[var(--ink-muted)]">Alterne o tema rapidamente</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Notificações</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Notificações por Email', desc: 'Receba alertas importantes por email' },
              { key: 'push', label: 'Notificações Push', desc: 'Receba notificações no navegador' },
              { key: 'alerts', label: 'Alertas Críticos', desc: 'Alertas urgentes do sistema' },
              { key: 'reports', label: 'Relatórios Semanais', desc: 'Resumo semanal de atividades' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                <div>
                  <p className="font-medium">{label}</p>
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
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.notifications[key as keyof typeof formData.notifications]
                      ? 'bg-[var(--brand)]' 
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
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
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Preferências Gerais</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)]"
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
                  className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)]"
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
    </AppShell>
  )
}

