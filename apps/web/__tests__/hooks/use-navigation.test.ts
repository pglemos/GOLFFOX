import { renderHook } from '@testing-library/react'
import { useNavigation, useNavigationEvents } from '@/hooks/use-navigation'

// Mock next/navigation
const mockPathname = jest.fn(() => '/admin')
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('useNavigation hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/admin')
  })

  it('deve retornar path atual', () => {
    const { result } = renderHook(() => useNavigation())
    expect(result.current.currentPath).toBe('/admin')
  })

  it('deve verificar se path está ativo (exato)', () => {
    mockPathname.mockReturnValue('/admin')
    const { result } = renderHook(() => useNavigation())

    expect(result.current.isActive('/admin', true)).toBe(true)
    expect(result.current.isActive('/operador', true)).toBe(false)
  })

  it('deve verificar se path está ativo (parcial)', () => {
    mockPathname.mockReturnValue('/admin/users')
    const { result } = renderHook(() => useNavigation())

    expect(result.current.isActive('/admin')).toBe(true)
    expect(result.current.isActive('/operador')).toBe(false)
  })

  it('deve verificar se dashboard está ativo', () => {
    mockPathname.mockReturnValue('/admin')
    const { result } = renderHook(() => useNavigation())

    expect(result.current.isDashboardActive).toBe(true)
  })

  it('deve verificar se item do sidebar está ativo', () => {
    mockPathname.mockReturnValue('/admin/users')
    const { result } = renderHook(() => useNavigation())

    expect(result.current.isSidebarItemActive('/admin/users')).toBe(true)
    expect(result.current.isSidebarItemActive('/admin')).toBe(false) // Dashboard só ativo na rota exata
  })

  it('deve verificar se item do topbar está ativo', () => {
    mockPathname.mockReturnValue('/admin/users')
    const { result } = renderHook(() => useNavigation())

    expect(result.current.isTopbarItemActive('/admin')).toBe(true)
    expect(result.current.isTopbarItemActive('/operador')).toBe(false)
  })
})

describe('useNavigationEvents hook', () => {
  it('deve chamar callback quando path muda', () => {
    const onNavigationChange = jest.fn()
    mockPathname.mockReturnValue('/admin')

    const { rerender } = renderHook(() => useNavigationEvents(onNavigationChange))

    mockPathname.mockReturnValue('/admin/users')
    rerender()

    // O callback será chamado quando o pathname mudar
    expect(onNavigationChange).toHaveBeenCalled()
  })

  it('deve retornar path atual e anterior', () => {
    mockPathname.mockReturnValue('/admin')
    const { result } = renderHook(() => useNavigationEvents())

    expect(result.current.currentPath).toBe('/admin')
  })
})

