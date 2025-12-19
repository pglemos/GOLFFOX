/**
 * Domain Layer
 * 
 * Exporta todas as entidades, value objects e eventos de domínio
 */

// Entities
export * from './entities/company.entity'
export * from './entities/vehicle.entity'

// Value Objects
export * from './value-objects/email.vo'
export * from './value-objects/uuid.vo'

// Domain Events
export * from './domain-events/company-created.event'
export * from './domain-events/vehicle-updated.event'
