import { Suspense } from 'react'
import { OperatorTenantProvider } from '@/components/providers/operator-tenant-provider'

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OperatorTenantProvider>
      <Suspense fallback={<div>Carregando...</div>}>
        {children}
      </Suspense>
    </OperatorTenantProvider>
  )
}
