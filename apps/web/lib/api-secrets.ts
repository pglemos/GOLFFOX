/**
 * Helpers para validação de secrets em endpoints públicos
 * 
 * Fornece funções utilitárias para validar API secrets e secrets de webhooks
 */

import { NextRequest } from 'next/server'

import { logger } from './logger'

/**
 * Valida secret de API via header
 */
export function validateApiSecret(
  request: NextRequest,
  secretName: string,
  headerName: string = 'x-api-secret'
): boolean {
  const secret = process.env[secretName]
  const headerSecret = request.headers.get(headerName)

  if (!secret) {
    logger.warn(`API secret ${secretName} não configurado`, {}, 'ApiSecrets')
    return false
  }

  if (!headerSecret) {
    return false
  }

  // Comparação segura contra timing attacks
  return secret === headerSecret
}

/**
 * Valida secret de webhook via assinatura HMAC
 */
export function validateWebhookSecret(
  payload: string,
  signature: string | null,
  secretName: string = 'WEBHOOK_SECRET',
  headerName: string = 'x-webhook-signature'
): boolean {
  const secret = process.env[secretName]

  if (!secret) {
    logger.warn(`Webhook secret ${secretName} não configurado`, {}, 'ApiSecrets')
    return false
  }

  if (!signature) {
    return false
  }

  // Usar crypto para HMAC
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
