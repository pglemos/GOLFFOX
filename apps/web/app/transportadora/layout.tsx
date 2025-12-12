import { TransportadoraTenantProvider } from "@/components/providers/transportadora-tenant-provider"

export default function TransportadoraLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TransportadoraTenantProvider>
            {children}
        </TransportadoraTenantProvider>
    )
}
