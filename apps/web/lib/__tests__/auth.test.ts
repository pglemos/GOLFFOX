import { AuthManager } from '../auth'

describe('AuthManager Integrity', () => {
    beforeEach(() => {
        // Limpar storage entre testes
        localStorage.clear()
        sessionStorage.clear()
        document.cookie = ""
    })

    it('should format storage keys correctly', () => {
        // @ts-ignore - access private for test
        expect(AuthManager.STORAGE_KEY).toBe('golffox-auth')
    })

    it('should handle different redirect rules correctly', () => {
        expect(AuthManager.getRedirectUrl('admin')).toBe('/admin')
        expect(AuthManager.getRedirectUrl('operador')).toBe('/transportadora')
        expect(AuthManager.getRedirectUrl('empresa')).toBe('/empresa')
        // Fallback
        expect(AuthManager.getRedirectUrl('unknown')).toBe('/empresa')
    })
})
