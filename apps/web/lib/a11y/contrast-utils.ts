/**
 * Utilitários de Contraste de Cores
 * 
 * Funções para verificar e garantir conformidade WCAG para contraste de cores.
 */

/**
 * Converte hex para RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
  
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Converte RGB para luminância relativa
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calcula a razão de contraste entre duas cores
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format')
  }

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Níveis de conformidade WCAG
 */
export type WCAGLevel = 'AAA' | 'AA' | 'AA-large' | 'fail'

/**
 * Requisitos de contraste por nível
 */
export const WCAG_REQUIREMENTS = {
  'AAA': 7,        // Texto normal AAA
  'AA': 4.5,       // Texto normal AA
  'AA-large': 3,   // Texto grande AA (14pt bold ou 18pt)
}

/**
 * Verifica nível de conformidade WCAG
 */
export function getWCAGLevel(foreground: string, background: string): WCAGLevel {
  try {
    const ratio = getContrastRatio(foreground, background)

    if (ratio >= WCAG_REQUIREMENTS['AAA']) {
      return 'AAA'
    }
    if (ratio >= WCAG_REQUIREMENTS['AA']) {
      return 'AA'
    }
    if (ratio >= WCAG_REQUIREMENTS['AA-large']) {
      return 'AA-large'
    }
    return 'fail'
  } catch {
    return 'fail'
  }
}

/**
 * Verifica se o contraste passa para um nível específico
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: keyof typeof WCAG_REQUIREMENTS = 'AA'
): boolean {
  try {
    const ratio = getContrastRatio(foreground, background)
    return ratio >= WCAG_REQUIREMENTS[level]
  } catch {
    return false
  }
}

/**
 * Sugere uma cor de texto com bom contraste para um background
 */
export function getSuggestedTextColor(background: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(background)
  if (!rgb) return '#000000'

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

/**
 * Ajusta uma cor para melhorar o contraste
 */
export function adjustForContrast(
  foreground: string,
  background: string,
  targetRatio: number = WCAG_REQUIREMENTS['AA']
): string {
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) return foreground

  let currentRatio = getContrastRatio(foreground, background)
  if (currentRatio >= targetRatio) return foreground

  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  const shouldDarken = bgLuminance > 0.5

  let adjustedRgb = { ...fgRgb }
  const step = shouldDarken ? -5 : 5
  const limit = shouldDarken ? 0 : 255

  while (currentRatio < targetRatio) {
    adjustedRgb.r = Math.max(0, Math.min(255, adjustedRgb.r + step))
    adjustedRgb.g = Math.max(0, Math.min(255, adjustedRgb.g + step))
    adjustedRgb.b = Math.max(0, Math.min(255, adjustedRgb.b + step))

    const newColor = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b)
    currentRatio = getContrastRatio(newColor, background)

    // Evitar loop infinito
    if (
      (shouldDarken && adjustedRgb.r === 0 && adjustedRgb.g === 0 && adjustedRgb.b === 0) ||
      (!shouldDarken && adjustedRgb.r === 255 && adjustedRgb.g === 255 && adjustedRgb.b === 255)
    ) {
      break
    }
  }

  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b)
}

/**
 * Converte RGB para hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

/**
 * Resultado da análise de contraste
 */
export interface ContrastAnalysis {
  foreground: string
  background: string
  ratio: number
  level: WCAGLevel
  meetsAA: boolean
  meetsAAA: boolean
  meetsAALarge: boolean
  suggestedForeground?: string
}

/**
 * Analisa o contraste entre duas cores
 */
export function analyzeContrast(foreground: string, background: string): ContrastAnalysis {
  const ratio = getContrastRatio(foreground, background)
  const level = getWCAGLevel(foreground, background)

  const result: ContrastAnalysis = {
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    level,
    meetsAA: ratio >= WCAG_REQUIREMENTS['AA'],
    meetsAAA: ratio >= WCAG_REQUIREMENTS['AAA'],
    meetsAALarge: ratio >= WCAG_REQUIREMENTS['AA-large'],
  }

  if (!result.meetsAA) {
    result.suggestedForeground = adjustForContrast(foreground, background)
  }

  return result
}

/**
 * Cores comuns do design system para referência
 */
export const DESIGN_SYSTEM_COLORS = {
  // Backgrounds
  'bg-white': '#ffffff',
  'bg-black': '#000000',
  'bg-muted': '#f4f4f5',
  'bg-card': '#ffffff',
  
  // Text
  'text-ink-strong': '#0a2540',
  'text-ink-muted': '#425466',
  'text-ink-light': '#6b7280',
  
  // Brand
  'brand': '#f97316',
  'brand-hover': '#ea580c',
  
  // Status
  'success': '#22c55e',
  'error': '#ef4444',
  'warning': '#eab308',
}

/**
 * Verifica todas as combinações de cores do design system
 */
export function auditDesignSystemContrast(): ContrastAnalysis[] {
  const results: ContrastAnalysis[] = []

  const backgrounds = ['bg-white', 'bg-muted', 'bg-card']
  const foregrounds = ['text-ink-strong', 'text-ink-muted', 'text-ink-light', 'brand', 'success', 'error', 'warning']

  for (const bg of backgrounds) {
    for (const fg of foregrounds) {
      const bgColor = DESIGN_SYSTEM_COLORS[bg as keyof typeof DESIGN_SYSTEM_COLORS]
      const fgColor = DESIGN_SYSTEM_COLORS[fg as keyof typeof DESIGN_SYSTEM_COLORS]
      
      if (bgColor && fgColor) {
        const analysis = analyzeContrast(fgColor, bgColor)
        results.push({
          ...analysis,
          foreground: `${fg} (${fgColor})`,
          background: `${bg} (${bgColor})`,
        })
      }
    }
  }

  return results
}

export default {
  getContrastRatio,
  getWCAGLevel,
  meetsContrastRequirement,
  getSuggestedTextColor,
  adjustForContrast,
  analyzeContrast,
  auditDesignSystemContrast,
}

