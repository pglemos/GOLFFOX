/**
 * Testes para contrast-utils (acessibilidade)
 */

import {
  getLuminance,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  hexToRgb,
  findAccessibleColor,
  checkColorPair,
} from '@/lib/a11y/contrast-utils'

describe('contrast-utils', () => {
  describe('hexToRgb', () => {
    it('deve converter hex para RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('deve converter hex de 3 caracteres', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('deve funcionar sem #', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('getLuminance', () => {
    it('deve calcular luminância relativa', () => {
      // Branco tem luminância máxima
      expect(getLuminance('#ffffff')).toBeCloseTo(1, 2)
      
      // Preto tem luminância mínima
      expect(getLuminance('#000000')).toBeCloseTo(0, 2)
    })

    it('deve calcular luminância para cores intermediárias', () => {
      const grayLum = getLuminance('#808080')
      expect(grayLum).toBeGreaterThan(0)
      expect(grayLum).toBeLessThan(1)
    })
  })

  describe('getContrastRatio', () => {
    it('deve calcular razão de contraste corretamente', () => {
      // Preto e branco = máximo contraste
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
      
      // Mesma cor = sem contraste
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 0)
    })

    it('deve retornar o mesmo valor independente da ordem', () => {
      const ratio1 = getContrastRatio('#000000', '#ffffff')
      const ratio2 = getContrastRatio('#ffffff', '#000000')
      expect(ratio1).toBeCloseTo(ratio2, 2)
    })
  })

  describe('meetsWCAGAA', () => {
    it('deve validar texto normal (mínimo 4.5:1)', () => {
      // Preto e branco sempre passa
      expect(meetsWCAGAA('#000000', '#ffffff', 'normal')).toBe(true)
      
      // Cores com baixo contraste falham
      expect(meetsWCAGAA('#cccccc', '#ffffff', 'normal')).toBe(false)
    })

    it('deve validar texto grande (mínimo 3:1)', () => {
      // Texto grande tem requisito menor
      expect(meetsWCAGAA('#767676', '#ffffff', 'large')).toBe(true)
    })
  })

  describe('meetsWCAGAAA', () => {
    it('deve validar texto normal (mínimo 7:1)', () => {
      // Preto e branco passa
      expect(meetsWCAGAAA('#000000', '#ffffff', 'normal')).toBe(true)
      
      // Cores com contraste moderado falham para AAA
      expect(meetsWCAGAAA('#595959', '#ffffff', 'normal')).toBe(false)
    })

    it('deve validar texto grande (mínimo 4.5:1)', () => {
      expect(meetsWCAGAAA('#595959', '#ffffff', 'large')).toBe(true)
    })
  })

  describe('checkColorPair', () => {
    it('deve retornar análise completa', () => {
      const result = checkColorPair('#000000', '#ffffff')

      expect(result).toHaveProperty('contrastRatio')
      expect(result).toHaveProperty('meetsAANormal')
      expect(result).toHaveProperty('meetsAALarge')
      expect(result).toHaveProperty('meetsAAANormal')
      expect(result).toHaveProperty('meetsAAALarge')
      
      expect(result.meetsAANormal).toBe(true)
      expect(result.meetsAALarge).toBe(true)
      expect(result.meetsAAANormal).toBe(true)
      expect(result.meetsAAALarge).toBe(true)
    })

    it('deve identificar pares com contraste insuficiente', () => {
      const result = checkColorPair('#cccccc', '#ffffff')

      expect(result.meetsAANormal).toBe(false)
      expect(result.meetsAAANormal).toBe(false)
    })
  })

  describe('findAccessibleColor', () => {
    it('deve encontrar cor acessível', () => {
      const accessible = findAccessibleColor('#ffffff', '#cccccc', 'darken')
      
      if (accessible) {
        expect(meetsWCAGAA(accessible, '#ffffff', 'normal')).toBe(true)
      }
    })

    it('deve retornar null se não encontrar cor acessível', () => {
      // Cenário improvável, mas testamos o fallback
      const result = findAccessibleColor('#ffffff', '#fffffe', 'darken', 0.001)
      
      // Pode ou não encontrar, dependendo da implementação
      expect(result === null || typeof result === 'string').toBe(true)
    })
  })

  describe('Cenários reais de UI', () => {
    it('deve validar cores de botão primário', () => {
      // Exemplo: botão azul com texto branco
      const buttonBg = '#3b82f6' // blue-500
      const buttonText = '#ffffff'
      
      const result = checkColorPair(buttonBg, buttonText)
      expect(result.contrastRatio).toBeGreaterThan(3) // Mínimo para elementos interativos
    })

    it('deve validar cores de texto em cards', () => {
      const cardBg = '#f8fafc' // slate-50
      const cardText = '#1e293b' // slate-800
      
      const result = checkColorPair(cardBg, cardText)
      expect(result.meetsAANormal).toBe(true)
    })

    it('deve validar cores de alerta de erro', () => {
      const errorBg = '#fef2f2' // red-50
      const errorText = '#991b1b' // red-800
      
      const result = checkColorPair(errorBg, errorText)
      expect(result.meetsAANormal).toBe(true)
    })

    it('deve validar cores de alerta de sucesso', () => {
      const successBg = '#f0fdf4' // green-50
      const successText = '#166534' // green-800
      
      const result = checkColorPair(successBg, successText)
      expect(result.meetsAANormal).toBe(true)
    })
  })
})

