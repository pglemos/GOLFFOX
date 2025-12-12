import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const headers = Object.fromEntries(req.headers.entries())
        const source = req.nextUrl.searchParams.get('source') || 'unknown'

        // Log to console for server-side visibility
        console.log(`[Webhook Received] Source: ${source}`, body)

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

        if (error) console.error('Error saving webhook:', error)

        return NextResponse.json({ received: true })
    } catch (error: unknown) {
        console.error('[Webhook Error]', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 })
    }
}

// Optional: Handle GET for webhook verification (some services require this)
export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get('challenge')

    if (challenge) {
        return NextResponse.json({ challenge })
    }

    return NextResponse.json({ status: 'Webhook endpoint active' })
}
