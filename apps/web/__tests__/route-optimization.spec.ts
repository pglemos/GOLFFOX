import { describe, it, expect } from "vitest"

describe("Route Optimization Utils", () => {
  it("should calculate hash correctly", () => {
    const payload = {
      companyId: "123",
      origin: { lat: -23.5505, lng: -46.6333 },
      destination: { lat: -23.5631, lng: -46.6544 },
      waypoints: [
        { id: "1", lat: -23.551, lng: -46.634 },
        { id: "2", lat: -23.552, lng: -46.635 },
      ],
    }

    const hash1 = calculateHash(payload)
    const hash2 = calculateHash({ ...payload })
    const hash3 = calculateHash({
      ...payload,
      waypoints: [
        { id: "2", lat: -23.552, lng: -46.635 },
        { id: "1", lat: -23.551, lng: -46.634 },
      ],
    })

    expect(hash1).toBe(hash2)
    expect(hash1).toBe(hash3) // Deve ser igual mesmo com ordem diferente (sorted)
  })
})

function calculateHash(payload: any): string {
  const str = JSON.stringify({
    companyId: payload.companyId,
    origin: payload.origin,
    destination: payload.destination,
    waypoints: payload.waypoints.sort((a: any, b: any) => a.id.localeCompare(b.id)),
  })

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

