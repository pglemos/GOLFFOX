"use client"

import { PageShell } from "@/components/landing/page-shell"

export default function PrivacyPage() {
    return (
        <PageShell
            title="Política de Privacidade"
            subtitle="Sua privacidade é nossa prioridade absoluta. Saiba como protegemos seus dados."
        >
            <div className="max-w-4xl mx-auto bg-slate-950/50 border border-white/5 rounded-3xl p-8 md:p-12">
                <article className="prose prose-invert prose-slate max-w-none text-slate-400">
                    <p className="lead text-xl text-white">
                        Esta política descreve como a GOLFFOX coleta, usa e protege as informações de sua empresa e de seus colaboradores.
                    </p>

                    <h3>1. Dados que Coletamos</h3>
                    <p>
                        Para fornecer nossos serviços, coletamos os seguintes tipos de dados:
                    </p>
                    <ul>
                        <li>**Dados Cadastrais:** Nome, email, telefone e dados da empresa.</li>
                        <li>**Dados de Telemetria:** Localização GPS, velocidade e status do veículo.</li>
                        <li>**Dados Operacionais:** Rotas, cargas e documentos fiscais.</li>
                    </ul>

                    <h3>2. Como Usamos seus Dados</h3>
                    <p>
                        Utilizamos os dados estritamente para:
                    </p>
                    <ul>
                        <li>Fornecer e melhorar nossos serviços de rastreamento e gestão.</li>
                        <li>Processar pagamentos e faturas.</li>
                        <li>Enviar alertas de segurança críticos.</li>
                        <li>Cumprir obrigações legais e regulatórias.</li>
                    </ul>

                    <h3>3. Compartilhamento de Dados</h3>
                    <p>
                        **NUNCA vendemos seus dados.** Compartilhamos informações apenas com:
                    </p>
                    <ul>
                        <li>Provedores de infraestrutura (ex: AWS, Google Cloud) sob contratos de confidencialidade rigorosos.</li>
                        <li>Autoridades legais, quando exigido por ordem judicial.</li>
                    </ul>

                    <h3>4. Seus Direitos (LGPD)</h3>
                    <p>
                        Você tem o direito de solicitar:
                    </p>
                    <ul>
                        <li>Acesso aos dados que mantemos sobre você.</li>
                        <li>Correção de dados incompletos ou imprecisos.</li>
                        <li>Exclusão de dados (quando não necessários para fins legais).</li>
                    </ul>

                    <hr className="border-white/10 my-12" />

                    <p className="text-sm">
                        O Encarregado de Dados (DPO) pode ser contatado em dpo@golffox.com.
                    </p>
                </article>
            </div>
        </PageShell>
    )
}
