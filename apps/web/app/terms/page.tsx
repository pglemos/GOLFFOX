"use client"

import { PageShell } from "@/components/landing/page-shell"

export default function TermsPage() {
    return (
        <PageShell
            title="Termos de Uso"
            subtitle="Última atualização: 24 de Dezembro de 2024"
        >
            <div className="max-w-4xl mx-auto bg-slate-950/50 border border-white/5 rounded-3xl p-8 md:p-12">
                <article className="prose prose-invert prose-slate max-w-none text-slate-400">
                    <p className="lead text-xl text-white">
                        Ao acessar e usar a plataforma GOLFFOX, você concorda com os seguintes termos e condições. Por favor, leia atentamente.
                    </p>

                    <h3>1. Aceitação dos Termos</h3>
                    <p>
                        A GOLFFOX fornece serviços de gestão logística através de nossa plataforma SaaS. O uso destes serviços está condicionado à aceitação destes termos. Se você não concorda com algum aspecto, não deve utilizar a plataforma.
                    </p>

                    <h3>2. Licença de Uso</h3>
                    <p>
                        Concedemos a você uma licença limitada, não exclusiva e intransferível para usar nosso software internamente em sua organização. É estritamente proibido:
                    </p>
                    <ul>
                        <li>Revender ou redistribuir o software a terceiros.</li>
                        <li>Realizar engenharia reversa de qualquer parte do sistema.</li>
                        <li>Usar a plataforma para atividades ilegais.</li>
                    </ul>

                    <h3>3. Segurança de Dados</h3>
                    <p>
                        Empregamos medidas de segurança de nível bancário para proteger seus dados. No entanto, você é responsável por manter a confidencialidade de suas credenciais de acesso.
                    </p>

                    <h3>4. Disponibilidade do Serviço (SLA)</h3>
                    <p>
                        Garantimos 99.9% de disponibilidade mensal. Em caso de paradas programadas para manutenção, notificaremos com 48h de antecedência.
                    </p>

                    <h3>5. Limitação de Responsabilidade</h3>
                    <p>
                        A GOLFFOX não se responsabiliza por lucros cessantes ou danos indiretos decorrentes do uso da plataforma, exceto em casos de dolo comprovado.
                    </p>

                    <hr className="border-white/10 my-12" />

                    <p className="text-sm">
                        Para questões legais, entre em contato através de legal@golffox.com.
                    </p>
                </article>
            </div>
        </PageShell>
    )
}
