'use client'

import { TransportadoraTenantProvider } from "@/components/providers/transportadora-tenant-provider"
import { TransportadoraErrorBoundary } from "./error-boundary"

export default function TransportadoraLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TransportadoraErrorBoundary>
            <TransportadoraTenantProvider>
                {children}
            </TransportadoraTenantProvider>
        </TransportadoraErrorBoundary>
    )
}
