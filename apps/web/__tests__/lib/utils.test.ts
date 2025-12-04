import { cn } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('deve combinar classes', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('deve mesclar classes do Tailwind', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('deve lidar com valores condicionais', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('deve lidar com arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('deve lidar com objetos', () => {
      expect(cn({ class1: true, class2: false })).toBe('class1')
    })
  })
})

