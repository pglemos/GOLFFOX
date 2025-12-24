import Link from "next/link"
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react"

export function SiteFooter() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="relative border-t border-white/5 bg-[#020617] pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative h-6 w-6 overflow-hidden rounded-md bg-gradient-to-tr from-brand to-orange-600 p-[1px]">
                                <div className="absolute inset-0 bg-[#020617] rounded-md m-[1px] flex items-center justify-center">
                                    <div className="h-3 w-3 bg-brand rounded-sm rotate-45" />
                                </div>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">GOLFFOX</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            Sistema especialista em gestão de fretamento corporativo e transporte de passageiros.
                            Tecnologia que conecta ônibus, colaboradores e empresas.
                        </p>

                        <div className="flex items-center gap-4 mt-6">
                            <SocialLink href="#" icon={Linkedin} />
                            <SocialLink href="#" icon={Instagram} />
                            <SocialLink href="#" icon={Twitter} />
                            <SocialLink href="#" icon={Youtube} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm">Plataforma</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/features" className="hover:text-brand transition-colors">Funcionalidades</Link></li>
                            <li><Link href="/solutions" className="hover:text-brand transition-colors">Para Fretamento</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">App do Motorista</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">App do Passageiro</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm">Empresa</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/about" className="hover:text-brand transition-colors">Sobre Nós</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">Carreiras</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">Imprensa</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm">Legal</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link href="/terms" className="hover:text-brand transition-colors">Termos de Uso</Link></li>
                            <li><Link href="/privacy" className="hover:text-brand transition-colors">Privacidade</Link></li>
                            <li><Link href="#" className="hover:text-brand transition-colors">Cookies</Link></li>
                            <li><Link href="/support" className="hover:text-brand transition-colors">Suporte</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs">
                        &copy; {currentYear} GOLFFOX Fretamento Inteligente. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-400 text-xs">Sistemas Operacionais</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function SocialLink({ href, icon: Icon }: { href: string, icon: any }) {
    return (
        <a
            href={href}
            className="p-2 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-110"
        >
            <Icon className="h-4 w-4" />
        </a>
    )
}
