"use client"

import { motion } from "framer-motion"
import { Briefcase, Edit, Users, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Company } from "@/lib/services/company-service"

interface CompanyCardProps {
    company: Company
    onEdit: (company: Company) => void
    onUsers: (company: { id: string; name: string }) => void
    onDelete: (id: string, name: string) => void
    index: number
}

export function CompanyCard({ company, onEdit, onUsers, onDelete, index }: CompanyCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group"
        >
            <Card variant="premium" className="p-4 sm:p-5 overflow-hidden w-full flex flex-col h-full">
                <div className="flex-1 flex flex-col gap-3 w-full">
                    {/* Header com ícone e nome */}
                    <div className="flex items-start gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Briefcase className="h-5 w-5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg break-words leading-tight text-ink group-hover:text-brand transition-colors">
                                {company.name}
                            </h3>
                        </div>
                    </div>

                    {/* Informações da empresa */}
                    <div className="space-y-2 flex-1">
                        {company.address && (
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-ink-muted font-medium min-w-[60px]">Endereço:</span>
                                <p className="text-xs sm:text-sm text-ink-muted break-all flex-1 leading-relaxed">
                                    {company.address}
                                </p>
                            </div>
                        )}
                        {company.phone && (
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-ink-muted font-medium min-w-[60px]">Telefone:</span>
                                <p className="text-xs sm:text-sm text-ink-muted break-all flex-1 leading-relaxed">
                                    {company.phone}
                                </p>
                            </div>
                        )}
                        {company.email && (
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-ink-muted font-medium min-w-[60px]">Email:</span>
                                <p className="text-xs sm:text-sm text-ink-muted break-all flex-1 leading-relaxed">
                                    {company.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botões de ação */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(company)}
                            className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5"
                        >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUsers({ id: company.id, name: company.name })}
                            className="w-full min-h-[44px] h-auto text-xs px-2 py-1.5"
                        >
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Logins
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(company.id, company.name)}
                            className="w-full col-span-2 min-h-[44px] h-auto text-xs px-2 py-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Excluir Empresa
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
