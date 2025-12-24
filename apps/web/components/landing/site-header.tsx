"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        { label: "Funcionalidades", href: "/features" },
        { label: "Soluções", href: "/solutions" },
        { label: "Sobre", href: "/about" },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/50 backdrop-blur-md supports-[backdrop-filter]:bg-[#020617]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-tr from-brand to-orange-600 p-[1px] transition-transform duration-300 group-hover:scale-110">
                                <div className="absolute inset-0 bg-[#020617] rounded-lg m-[1px] flex items-center justify-center">
                                    <div className="h-4 w-4 bg-brand rounded-sm rotate-45" />
                                </div>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">GOLFFOX</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="hover:text-white transition-colors relative group"
                                >
                                    {item.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                            <span className="h-4 w-[1px] bg-white/10" />
                            <div className="flex items-center gap-4">
                                <Link href="/support" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                                    Suporte
                                </Link>
                                <Link href="/" className="text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:border-brand/30">
                                    Entrar
                                </Link>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <AnimatePresence mode="wait">
                                {isMobileMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                    >
                                        <X />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                    >
                                        <Menu />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-[#020617] pt-20 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-lg font-medium text-slate-300">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="border-b border-white/5 pb-4"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link href="/support" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/5 pb-4">
                                Suporte
                            </Link>
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-brand">
                                Acessar Plataforma
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
