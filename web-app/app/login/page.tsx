"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Pega o parâmetro 'next' se existir
    const nextUrl = searchParams.get('next')
    
    // Redireciona para a página principal (que contém o formulário de login)
    // preservando o parâmetro 'next' se existir
    if (nextUrl) {
      router.replace(`/?next=${encodeURIComponent(nextUrl)}`)
    } else {
      router.replace('/')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  )
}

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginRedirectContent />
    </Suspense>
  )
}