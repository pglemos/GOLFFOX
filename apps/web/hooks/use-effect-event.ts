/**
 * useEffectEvent Hook
 * 
 * Polyfill/implementation do useEffectEvent do React 19.2
 * Permite criar event handlers estáveis que não precisam estar nas dependências do useEffect
 * 
 * @example
 * const handleClick = useEffectEvent((id: string) => {
 *   // Este handler não precisa estar nas dependências do useEffect
 *   console.log('Clicked:', id)
 * })
 * 
 * useEffect(() => {
 *   // handleClick não precisa estar em deps
 *   window.addEventListener('click', () => handleClick('123'))
 * }, []) // deps vazias são seguras
 */

import { useRef, useCallback } from 'react'

/**
 * Hook que cria um event handler estável
 * O handler pode acessar o estado mais recente sem estar nas dependências
 * 
 * @param handler - Função que será chamada como event handler
 * @returns Função estável que sempre chama o handler mais recente
 */
export function useEffectEvent<T extends (...args: any[]) => any>(
  handler: T
): T {
  const handlerRef = useRef<T>(handler)

  // Atualizar ref sempre que handler mudar
  handlerRef.current = handler

  // Retornar função estável que sempre chama o handler mais recente
  return useCallback(
    ((...args: Parameters<T>) => {
      return handlerRef.current(...args)
    }) as T,
    [] // Sem dependências - função sempre estável
  )
}

