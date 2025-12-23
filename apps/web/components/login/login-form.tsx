/**
 * LoginForm
 * 
 * Formulário de login com validação, estados de loading e animações.
 * Usa o hook useLogin para toda a lógica de autenticação.
 */

"use client"

import { memo } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { sanitizeInput, type UseLoginReturn } from '@/hooks/use-login'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { debug } from '@/lib/logger'

interface LoginFormProps {
  loginState: UseLoginReturn
  variant: 'mobile' | 'desktop'
}

/**
 * Loading Overlay (mobile only)
 */
const LoadingOverlay = memo(({ loading, transitioning }: { loading: boolean; transitioning: boolean }) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="lg:hidden absolute inset-0 z-50 flex items-center justify-center rounded-3xl"
        >
          <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="relative w-6 h-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-[1.5px] border-border-light/60 border-t-[#F97316]"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-normal text-ink-muted tracking-tight"
            >
              {transitioning ? 'Entrando...' : 'Autenticando'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
LoadingOverlay.displayName = 'LoadingOverlay'

/**
 * Error/Success Messages
 */
const MessageBanner = memo(({ error, success }: { error: string | null; success: boolean }) => {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="p-4 bg-linear-to-r from-error-light to-error-light/80 border-2 border-error/20 rounded-2xl text-sm text-error shadow-sm backdrop-blur-sm lg:bg-error-light/10 lg:border lg:rounded-xl"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="flex-1 font-medium">{error}</p>
          </div>
        </motion.div>
      )}

      {success && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="p-4 bg-linear-to-r from-success-light to-success-light/80 border-2 border-success/20 rounded-2xl text-sm text-success shadow-sm backdrop-blur-sm flex items-center gap-3 lg:bg-success-light/10 lg:border lg:rounded-xl"
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="font-medium">Login realizado com sucesso!</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
MessageBanner.displayName = 'MessageBanner'

/**
 * Email Input Field
 */
const EmailField = memo(({
  value,
  onChange,
  onKeyDown,
  inputRef,
  fieldError,
  variant,
}: {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement>
  fieldError?: string
  variant: 'mobile' | 'desktop'
}) => {
  const id = variant === 'mobile' ? 'login-email' : 'desktop-login-email'
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-ink-strong mb-2 lg:mb-1" htmlFor={id}>
        E-mail
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
          <Mail className="h-5 w-5" />
        </div>
        <Input
          id={id}
          ref={inputRef}
          name="email"
          type="email"
          required
          placeholder="golffox@admin.com"
          value={value}
          onChange={(e) => onChange(sanitizeInput(e.target.value))}
          onKeyDown={onKeyDown}
          autoComplete="email"
          className={`w-full ${variant === 'mobile' ? 'h-14 rounded-2xl' : 'h-12 rounded-xl'} pl-12 pr-4 bg-linear-to-br from-bg-soft to-bg border-2 lg:border ${fieldError
            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
            : 'border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong lg:hover:border-border-hover'
          } text-base focus:bg-white placeholder:text-ink-muted font-medium lg:font-normal transition-all duration-200`}
        />
        {fieldError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 lg:mt-1 text-xs text-error font-medium flex items-center gap-1"
            aria-live="assertive"
          >
            <span>⚠</span> {fieldError}
          </motion.p>
        )}
      </div>
    </div>
  )
})
EmailField.displayName = 'EmailField'

/**
 * Password Input Field
 */
const PasswordField = memo(({
  value,
  onChange,
  onKeyDown,
  inputRef,
  showPassword,
  onToggleShowPassword,
  fieldError,
  variant,
}: {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement>
  showPassword: boolean
  onToggleShowPassword: () => void
  fieldError?: string
  variant: 'mobile' | 'desktop'
}) => {
  const id = variant === 'mobile' ? 'login-password' : 'desktop-login-password'
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-ink-strong mb-2 lg:mb-1" htmlFor={id}>
          Senha
        </label>
        {variant === 'desktop' && (
          <button
            type="button"
            onClick={() => debug('Forgot password clicked', {}, 'LoginForm')}
            className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            Esqueceu?
          </button>
        )}
      </div>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-ink-muted">
          <Lock className="h-5 w-5" />
        </div>
        <Input
          id={id}
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Digite sua senha"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          ref={inputRef}
          autoComplete="current-password"
          className={`w-full ${variant === 'mobile' ? 'h-14 rounded-2xl pr-14' : 'h-12 rounded-xl pr-12'} pl-12 bg-linear-to-br from-bg-soft to-bg border-2 lg:border ${fieldError
            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
            : 'border-border focus:border-brand focus:ring-2 focus:ring-brand/20 hover:border-strong lg:hover:border-border-hover'
          } text-base focus:bg-white placeholder:text-ink-muted font-medium lg:font-normal transition-all duration-200`}
        />
        <motion.button
          type="button"
          onClick={onToggleShowPassword}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand transition-colors ${
            variant === 'mobile' ? 'h-9 w-9 rounded-xl' : 'h-8 w-8 rounded-lg'
          } flex items-center justify-center hover:bg-bg-hover z-10 touch-manipulation`}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOff className={variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} /> : <Eye className={variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} />}
        </motion.button>
        {fieldError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 lg:mt-1 text-xs text-error font-medium flex items-center gap-1"
            aria-live="assertive"
          >
            <span>⚠</span> {fieldError}
          </motion.p>
        )}
      </div>
    </div>
  )
})
PasswordField.displayName = 'PasswordField'

/**
 * Submit Button
 */
const SubmitButton = memo(({
  loading,
  transitioning,
  canSubmit,
  variant,
}: {
  loading: boolean
  transitioning: boolean
  canSubmit: boolean
  variant: 'mobile' | 'desktop'
}) => {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.5 }}
      whileHover={canSubmit && !shouldReduceMotion ? { scale: 1.02 } : {}}
      whileTap={canSubmit && !shouldReduceMotion ? { scale: 0.98 } : {}}
      className={variant === 'desktop' ? 'pt-4' : ''}
    >
      <Button
        type="submit"
        disabled={!canSubmit}
        className={`w-full ${variant === 'mobile' 
          ? 'h-14 bg-linear-to-r from-brand via-brand-hover to-brand bg-size-[200%_100%] hover:bg-position-[100%_0] shadow-brand-lg hover:shadow-brand-lg rounded-2xl' 
          : 'h-12 bg-brand hover:bg-brand-hover shadow-brand/20 shadow-lg hover:shadow-brand/40 rounded-xl'
        } text-white font-bold text-base transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden group touch-manipulation will-change-transform`}
      >
        {/* Shimmer effect (mobile) */}
        {variant === 'mobile' && !shouldReduceMotion && !loading && !transitioning && (
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent will-change-transform"
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'easeInOut',
            }}
          />
        )}
        {loading || transitioning ? (
          <span className="flex items-center justify-center gap-3 lg:gap-2 relative z-10">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: variant === 'mobile' ? 0.8 : 1, repeat: Infinity, ease: 'linear' }}
              className={`rounded-full ${variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} border-2 border-white/30 border-t-white`}
            />
            <span className="font-semibold">{transitioning ? 'Entrando...' : 'Autenticando'}</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3 lg:gap-2 relative z-10">
            <span className="font-bold">{variant === 'mobile' ? 'Entrar' : 'Entrar'}</span>
            {variant === 'mobile' && !shouldReduceMotion ? (
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            ) : (
              <ArrowRight className={`${variant === 'mobile' ? 'w-5 h-5' : 'w-4 h-4'} group-hover:translate-x-1 transition-transform`} />
            )}
          </span>
        )}
      </Button>
    </motion.div>
  )
})
SubmitButton.displayName = 'SubmitButton'

/**
 * Main LoginForm Component
 */
const LoginForm = memo(({ loginState, variant }: LoginFormProps) => {
  const {
    email,
    password,
    loading,
    error,
    fieldErrors,
    success,
    showPassword,
    rememberMe,
    transitioning,
    setEmail,
    setPassword,
    setShowPassword,
    setRememberMe,
    handleLogin,
    canSubmit,
    resolvedAuthEndpoint,
    emailInputRef,
    passwordInputRef,
  } = loginState

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && !transitioning) {
      handleLogin()
    }
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !transitioning && password.trim().length > 0) {
      e.preventDefault()
      passwordInputRef.current?.focus()
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !transitioning) {
      e.preventDefault()
      handleLogin()
    }
  }

  if (variant === 'mobile') {
    return (
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="lg:hidden bg-linear-to-br from-white via-white to-bg-soft rounded-3xl shadow-2xl border border-border p-6 sm:p-8 mb-8 relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-size-[24px_24px]" />

        <div className="relative w-full min-w-0 z-10">
          {/* Loading Overlay */}
          <LoadingOverlay loading={loading} transitioning={transitioning} />

          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center justify-center gap-3 mb-4"
            >
              <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-ink-strong to-brand bg-clip-text text-transparent">
                GOLF FOX
              </h2>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-strong mb-3 tracking-tight">
              Entre em sua conta
            </h1>
            <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-light">
              Acesse sua frota com inteligência e controle total.
            </p>
          </motion.div>

          {/* Messages */}
          <div className="mb-6">
            <MessageBanner error={error} success={success} />
          </div>

          {/* Form */}
          <form
            action={resolvedAuthEndpoint}
            method="post"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <EmailField
              value={email}
              onChange={setEmail}
              onKeyDown={handleEmailKeyDown}
              inputRef={emailInputRef}
              fieldError={fieldErrors.email}
              variant="mobile"
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              onKeyDown={handlePasswordKeyDown}
              inputRef={passwordInputRef}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              fieldError={fieldErrors.password}
              variant="mobile"
            />

            {/* Remember me & Forgot password */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center justify-between text-sm w-full"
            >
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 cursor-pointer group touch-manipulation flex-nowrap"
              >
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="h-5 w-5 rounded-lg border-2 border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand transition-all duration-200"
                />
                <span className="whitespace-nowrap text-ink-muted group-hover:text-ink-strong transition-colors font-medium">
                  Manter conectado
                </span>
              </motion.label>
              <motion.button
                type="button"
                onClick={() => debug('Forgot password clicked', {}, 'LoginForm')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-brand hover:text-brand-hover font-semibold transition-colors touch-manipulation text-sm whitespace-nowrap"
              >
                Esqueceu sua senha?
              </motion.button>
            </motion.div>

            <SubmitButton
              loading={loading}
              transitioning={transitioning}
              canSubmit={canSubmit}
              variant="mobile"
            />
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-8 sm:mt-10 md:mt-12 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-ink-muted">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-brand" />
              <p>
                Protegido por{' '}
                <span className="text-brand font-semibold">Golf Fox Security</span>
              </p>
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-brand opacity-60" />
            </div>
          </motion.div>

          <noscript>
            <p className="mt-6 text-xs text-center text-ink-muted">
              Ative o JavaScript para utilizar o login.
            </p>
          </noscript>
        </div>
      </motion.div>
    )
  }

  // Desktop variant
  return (
    <>
      {/* Messages */}
      <div className="mb-6">
        <MessageBanner error={error} success={success} />
      </div>

      {/* Form */}
      <form
        action={resolvedAuthEndpoint}
        method="post"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.h1 className="text-4xl font-bold text-ink-strong mb-2 tracking-tight">
            Bem-vindo
          </motion.h1>
          <p className="text-lg text-ink-muted">
            Entre com suas credenciais para continuar.
          </p>
        </motion.div>

        <EmailField
          value={email}
          onChange={setEmail}
          onKeyDown={handleEmailKeyDown}
          inputRef={emailInputRef}
          fieldError={fieldErrors.email}
          variant="desktop"
        />

        <PasswordField
          value={password}
          onChange={setPassword}
          onKeyDown={handlePasswordKeyDown}
          inputRef={passwordInputRef}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          fieldError={fieldErrors.password}
          variant="desktop"
        />

        {/* Remember me */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="desktop-remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="rounded border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand"
          />
          <label
            htmlFor="desktop-remember-me"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink-muted cursor-pointer"
          >
            Manter conectado
          </label>
        </div>

        <SubmitButton
          loading={loading}
          transitioning={transitioning}
          canSubmit={canSubmit}
          variant="desktop"
        />
      </form>

      {/* Footer */}
      <div className="mt-12 flex items-center justify-center text-xs text-ink-muted/60 gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <Shield className="h-3 w-3" />
        <span>Golf Fox Security</span>
      </div>
    </>
  )
})

LoginForm.displayName = 'LoginForm'

export { LoginForm }
export default LoginForm

