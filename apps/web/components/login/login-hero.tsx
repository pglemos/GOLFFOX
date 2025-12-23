/**
 * LoginHero
 * 
 * Componente hero para o lado esquerdo da página de login (desktop).
 * Exibe logo, título, subtítulo e estatísticas.
 */

"use client"

import { memo } from 'react'

import { motion } from 'framer-motion'

import { useReducedMotion } from '@/hooks/use-reduced-motion'

import { FloatingOrbs } from './floating-orbs'

/**
 * Componente de estatística
 */
const StatItem = memo(({ value, label }: { value: string; label: string }) => {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-linear-to-br from-white via-white to-white/70 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-sm md:text-base text-white/60 font-light tracking-wide">
        {label}
      </div>
    </div>
  )
})
StatItem.displayName = 'StatItem'

/**
 * Hero Component
 */
const LoginHero = memo(() => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-black"
    >
      {/* Background Effects */}
      <div className="absolute inset-0" aria-hidden="true">
        <FloatingOrbs />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"
          style={{ willChange: 'auto' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            transition={{ duration: 0.6 }}
            className="relative inline-block"
          >
            {/* Glow effect */}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 rounded-[40px] blur-3xl will-change-transform"
                animate={{
                  background: [
                    'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(249,115,22,0.6) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)',
                  ],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Logo Container */}
            <div className="relative w-32 h-32 rounded-[40px] bg-linear-to-br from-[#F97316] via-[#FB923C] to-[#EA580C] p-[3px] shadow-2xl shadow-brand/50">
              <div className="w-full h-full rounded-[37px] bg-black flex items-center justify-center relative overflow-hidden">
                {/* Shine effect */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent will-change-transform"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Logo Image */}
                <motion.img
                  src="/icons/golf_fox_logo.svg"
                  alt="Golf Fox"
                  className="w-20 h-20 relative z-10 drop-shadow-2xl"
                  loading="eager"
                  fetchPriority="high"
                  animate={shouldReduceMotion ? {} : {
                    filter: [
                      'drop-shadow(0 0 20px rgba(249,115,22,0.5))',
                      'drop-shadow(0 0 30px rgba(249,115,22,0.7))',
                      'drop-shadow(0 0 20px rgba(249,115,22,0.5))',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </div>

            {/* Pulse ring */}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 rounded-[40px] border-2 border-brand/30 will-change-transform"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl xl:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
        >
          <span className="text-white">O futuro do</span>
          <br />
          <span className={`bg-linear-to-r from-[#F97316] via-[#FB923C] to-[#FDBA74] bg-clip-text text-transparent ${!shouldReduceMotion ? 'bg-size-[200%_100%] animate-[gradient-shift_3s_ease_infinite]' : ''}`}>
            transporte corporativo
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-white/70 mb-16 font-light leading-relaxed max-w-xl mx-auto"
        >
          Gerencie frotas, otimize rotas e monitore operações em tempo real com inteligência artificial.
        </motion.p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-12">
          <StatItem value="24/7" label="Monitoramento" />
          <StatItem value="100%" label="Rastreável" />
          <StatItem value="< 1s" label="Tempo Real" />
        </div>
      </div>
    </motion.div>
  )
})

LoginHero.displayName = 'LoginHero'

export { LoginHero }
export default LoginHero

