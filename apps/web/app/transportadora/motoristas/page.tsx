"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MotoristasRedirectPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace("/transportadora/motoristas/ranking")
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        </div>
    )
}
