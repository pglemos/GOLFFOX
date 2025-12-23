"use client"

import { Suspense } from "react"

import { RotasPageContent } from "./rotas-content"

export default function RotasPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RotasPageContent />
    </Suspense>
  )
}
