"use client"

import { useState } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginFormProps {
    onLogin: (email: string, pass: string, remember: boolean) => Promise<void>
    loading: boolean
    error: string | null
    onForgotPassword: () => void
}

export function LoginForm({ onLogin, loading, error, onForgotPassword }: LoginFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    // Efeito para simular preenchimento automático
    const hasValue = (val: string) => val.length > 0

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onLogin(email, password, rememberMe)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <div className="space-y-4">
                {/* Email Field */}
                <div className="group relative">
                    <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand transition-colors duration-300">
                        <Mail className="h-5 w-5" />
                    </div>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-brand/50 focus:ring-brand/20 transition-all duration-300 rounded-xl"
                        placeholder="seu@email.com"
                        required
                        disabled={loading}
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="group relative">
                        <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-brand transition-colors duration-300">
                            <Lock className="h-5 w-5" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-brand/50 focus:ring-brand/20 transition-all duration-300 rounded-xl"
                            placeholder="Sua senha segura"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-xs text-slate-400 hover:text-brand transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-white/20 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                />
                <Label htmlFor="remember" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                    Manter conectado
                </Label>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand to-orange-600 hover:from-brand/90 hover:to-orange-600/90 text-white font-semibold h-12 rounded-xl text-base shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:scale-[1.02] transition-all duration-300"
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <div className="flex items-center gap-2">
                        <span>Acessar Plataforma</span>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                )}
            </Button>
        </form>
    )
}
