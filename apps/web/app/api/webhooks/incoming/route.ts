import crypto from 'crypto'

import { NextResponse, NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'

/**
 * Valida assinatura HMAC do webhook
 */
function validateWebhookSignature(
    payload: string,
    signature: string | null,
    secret: string | undefined
): boolean {
    if (!secret) {
        logger.warn('WEBHOOK_SECRET não configurado')
        return false
    }

    if (!signature) {
        return false
    }

    // Calcular assinatura esperada
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

export async function POST(req: NextRequest) {
    try {
        // Aplicar rate limiting agressivo para webhooks
        const rateLimitResponse = await applyRateLimit(req, 'public')
        if (rateLimitResponse) return rateLimitResponse

        // Obter corpo da requisição como string para validação de assinatura
        const bodyText = await req.text()
        const body = JSON.parse(bodyText)
        const headers = Object.fromEntries(req.headers.entries())
        const source = req.nextUrl.searchParams.get('source') || 'unknown'

        // Validar assinatura HMAC
        const signature = req.headers.get('x-webhook-signature')
        const secret = process.env.WEBHOOK_SECRET

        if (!validateWebhookSignature(bodyText, signature, secret)) {
            logger.error('Webhook signature validation failed', {
                source,
                hasSignature: !!signature,
                hasSecret: !!secret
            }, 'WebhookAPI')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        logger.info(`[Webhook Received] Source: ${source}`, { source, bodyKeys: Object.keys(body) }, 'WebhookAPI')

        // Store in gf_alerts for admin visibility
        const { error } = await supabase.from('gf_alerts').insert({
            alert_type: 'webhook',
            type: 'webhook_received',
            severity: 'info',
            status: 'resolved',
            title: `Webhook from ${source}`,
            message: 'External webhook payload received.',
            metadata: { body, headers, source }
        })

        if (error) {
            logger.error('Error saving webhook', { error }, 'WebhookAPI')
        }

        return NextResponse.json({ received: true })
    } catch (error: unknown) {
        logger.error('[Webhook Error]', { error }, 'WebhookAPI')
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 400 }
        )
    }
}

// Optional: Handle GET for webhook verification (some services require this)
export async function GET(req: NextRequest) {
    // Aplicar rate limiting
    const rateLimitResponse = await applyRateLimit(req, 'public')
    if (rateLimitResponse) return rateLimitResponse

    const challenge = req.nextUrl.searchParams.get('challenge')

    if (challenge) {
        return NextResponse.json({ challenge })
    }

    return NextResponse.json({ status: 'Webhook endpoint active' })
}
