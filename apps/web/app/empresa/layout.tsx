'use client'

import { Suspense } from 'react'
export const dynamic = 'force-dynamic'
import { EmpresaTenantProvider } from '@/components/providers/empresa-tenant-provider'
import { RealtimeProvider } from '@/components/providers/realtime-provider'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmpresaTenantProvider>
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </EmpresaTenantProvider>
    </Suspense>
  )
}
