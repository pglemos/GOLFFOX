import { NextResponse } from 'next/server';
import { debug } from '@/lib/logger';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { to, subject, html, text } = await request.json();

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        debug('Simulando envio de e-mail', { to: to.replace(/^(.{2}).+(@.*)$/, '$1***$2'), subject }, 'SendEmailAPI');

        // TODO: Descomentar quando configurar RESEND_API_KEY
        /*
        const { data, error } = await resend.emails.send({
          from: 'GolfFox <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
          text: text
        });
    
        if (error) {
          return NextResponse.json({ error }, { status: 500 });
        }
        */

        // Simulação de sucesso
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({ message: 'Email queued successfully (simulation)' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
