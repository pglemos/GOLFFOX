import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { debug, error as logError, info } from '@/lib/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
    try {
        const { to, subject, html, text } = await request.json();

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verificar se Resend está configurado
        if (!resend) {
            logError('RESEND_API_KEY não configurada', {}, 'SendEmailAPI');
            return NextResponse.json(
                { error: 'Email service not configured', message: 'RESEND_API_KEY not set' },
                { status: 500 }
            );
        }

        info('Enviando e-mail via Resend', { to: to.replace(/^(.{2}).+(@.*)$/, '$1***$2'), subject }, 'SendEmailAPI');

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'GolfFox <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
          text: text
        });
    
        if (error) {
            logError('Erro ao enviar e-mail via Resend', { error, to: to.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'SendEmailAPI');
            return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
        }

        info('E-mail enviado com sucesso', { messageId: data?.id, to: to.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'SendEmailAPI');

        return NextResponse.json({ 
            message: 'Email sent successfully',
            messageId: data?.id
        });
    } catch (error) {
        logError('Erro interno ao processar envio de e-mail', { error }, 'SendEmailAPI');
        return NextResponse.json(
            { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
