"use client"

import React from "react"
import { PageShell } from "@/components/landing/page-shell"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageCircle, Phone } from "lucide-react"

export default function SupportPage() {
    return (
        <PageShell
            title="Como podemos ajudar?"
            subtitle="Nossa equipe de especialistas está pronta para resolver qualquer desafio técnico ou operacional."
            badge="SUPORTE DEDICADO"
        >
            <div className="grid lg:grid-cols-2 gap-16">
                {/* Form de Contato */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">Envie uma mensagem</h3>
                    <form className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nome</label>
                                <Input placeholder="Seu nome" className="bg-slate-950/50 border-white/10 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <Input type="email" placeholder="seu@email.com" className="bg-slate-950/50 border-white/10 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Assunto</label>
                            <Input placeholder="Como podemos ajudar?" className="bg-slate-950/50 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Mensagem</label>
                            <Textarea placeholder="Detalhe sua dúvida ou problema..." className="bg-slate-950/50 border-white/10 text-white min-h-[150px]" />
                        </div>
                        <Button className="w-full bg-brand hover:bg-brand-hover text-white font-semibold h-12 text-lg">
                            Enviar Solicitação
                        </Button>
                    </form>

                    <div className="mt-8 grid grid-cols-3 gap-4 pt-8 border-t border-white/5">
                        <ContactMethod icon={Mail} label="Email" value="help@golffox.com" />
                        <ContactMethod icon={Phone} label="Telefone" value="0800 123 4567" />
                        <ContactMethod icon={MessageCircle} label="Chat" value="Ao vivo" />
                    </div>
                </div>

                {/* FAQ */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Perguntas Frequentes</h3>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        <FAQItem
                            value="item-1"
                            question="Como faço para redefinir minha senha?"
                            answer="Você pode redefinir sua senha clicando em 'Esqueceu a senha?' na tela de login. Um link seguro será enviado para seu email cadastrado."
                        />
                        <FAQItem
                            value="item-2"
                            question="O sistema funciona offline?"
                            answer="Sim! Nosso aplicativo móvel possui modo offline first, permitindo que motoristas registrem atividades mesmo sem sinal. Os dados são sincronizados automaticamente quando a conexão retorna."
                        />
                        <FAQItem
                            value="item-3"
                            question="Como exportar relatórios financeiros?"
                            answer="No painel administrativo, acesse a aba 'Relatórios' > 'Financeiro'. Você pode exportar em PDF, Excel ou CSV com filtros personalizados por data e categoria."
                        />
                        <FAQItem
                            value="item-4"
                            question="Posso integrar com meu ERP?"
                            answer="Sim, possuímos API REST completa e webhooks para integração com SAP, Totvs, Oracle e outros sistemas de gestão."
                        />
                    </Accordion>
                </div>
            </div>
        </PageShell>
    )
}

function ContactMethod({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>, label: string, value: string }) {
    return (
        <div className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
            <Icon className="h-6 w-6 text-slate-400 group-hover:text-brand mb-2 transition-colors" />
            <span className="text-xs text-slate-500 font-medium uppercase">{label}</span>
            <span className="text-sm text-white font-semibold">{value}</span>
        </div>
    )
}

function FAQItem({ value, question, answer }: { value: string, question: string, answer: string }) {
    return (
        <AccordionItem value={value} className="border border-white/10 bg-white/5 rounded-xl px-4 overflow-hidden data-[state=open]:border-brand/30 transition-colors">
            <AccordionTrigger className="text-white hover:text-brand hover:no-underline py-4 text-left font-medium">
                {question}
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 pb-4 leading-relaxed">
                {answer}
            </AccordionContent>
        </AccordionItem>
    )
}
