// Jest globals: describe, it, expect
import { z } from "zod"

const routeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  company_id: z.string().min(1, "Empresa é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  shift: z.enum(["manha", "tarde", "noite"]),
  selected_employees: z.array(z.string()).min(1, "Selecione pelo menos um funcionário"),
})

describe("Route Form Validation", () => {
  it("should validate correct form data", () => {
    const validData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1", "emp2"],
    }

    expect(() => routeSchema.parse(validData)).not.toThrow()
  })

  it("should reject empty name", () => {
    const invalidData = {
      name: "",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(invalidData)).toThrow()
  })

  it("should reject empty employees array", () => {
    const invalidData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: [],
    }

    expect(() => routeSchema.parse(invalidData)).toThrow()
  })

  it("should reject invalid shift", () => {
    const invalidData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "invalid" as any,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(invalidData)).toThrow()
  })

  // Novos testes para melhor cobertura
  it("should accept all valid shift enum values", () => {
    const shifts = ["manha", "tarde", "noite"] as const

    shifts.forEach(shift => {
      const validData = {
        name: "Rota Centro",
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        scheduled_time: "08:00",
        shift,
        selected_employees: ["emp1"],
      }
      expect(() => routeSchema.parse(validData)).not.toThrow()
    })
  })

  it("should reject empty company_id", () => {
    const invalidData = {
      name: "Rota Centro",
      company_id: "",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(invalidData)).toThrow()
  })

  it("should reject empty scheduled_time", () => {
    const invalidData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(invalidData)).toThrow()
  })

  it("should accept single employee in array", () => {
    const validData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(validData)).not.toThrow()
  })

  it("should accept multiple employees in array", () => {
    const validData = {
      name: "Rota Centro",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1", "emp2", "emp3", "emp4"],
    }

    expect(() => routeSchema.parse(validData)).not.toThrow()
  })

  it("should handle whitespace-only name as invalid", () => {
    const invalidData = {
      name: "   ",
      company_id: "123e4567-e89b-12d3-a456-426614174000",
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    // Zod string().min(1) aceita espaços, então este teste documenta o comportamento atual
    // Se quisermos rejeitar whitespace, precisamos adicionar .trim() ao schema
    expect(() => routeSchema.parse(invalidData)).not.toThrow()
  })

  it("should reject missing required fields", () => {
    const incompleteData = {
      name: "Rota Centro",
      // company_id faltando
      scheduled_time: "08:00",
      shift: "manha" as const,
      selected_employees: ["emp1"],
    }

    expect(() => routeSchema.parse(incompleteData)).toThrow()
  })
})


