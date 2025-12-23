"use client"

import { motion } from "framer-motion"
import { User, Edit, Shield, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserProfile } from "@/lib/services/user-service"

interface UserCardProps {
    user: UserProfile
    onEdit: (user: UserProfile) => void
    onRoleChange: (user: UserProfile) => void
    onDelete: (id: string, name: string) => void
    index: number
}

export function UserCard({ user, onEdit, onRoleChange, onDelete, index }: UserCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
        >
            <Card variant="premium" className="p-2 sm:p-3 group">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex-1 flex gap-2 sm:gap-3 min-w-0">
                        <Avatar className="h-12 w-12 sm:w-14 sm:h-14 flex-shrink-0">
                            <AvatarImage src={user.avatar_url || ''} alt={user.name || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-bg-brand-light to-bg-brand-soft text-brand font-bold text-sm">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <div className="p-0.5 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                                    <User className="h-3 w-3 text-brand" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base group-hover:text-brand transition-colors">
                                    {user.name || "Sem Nome"}
                                </h3>
                                <Badge variant="outline" className="text-xs uppercase">
                                    {(user.role || "user").replace('_', ' ')}
                                </Badge>
                                <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                                    {user.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                            </div>
                            <p className="font-medium mb-0.5 text-xs sm:text-sm text-muted-foreground truncate">
                                {user.email}
                            </p>
                            {user.cpf && (
                                <div className="text-xs text-ink-muted">
                                    <span>CPF: {user.cpf}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(user)}
                            className="flex-1 sm:flex-none min-h-[40px]"
                        >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden md:inline">Editar</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRoleChange(user)}
                            className="flex-1 sm:flex-none min-h-[40px]"
                        >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden md:inline">Papel</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(user.id, user.name || user.email || 'Usuário')}
                            className="flex-none min-h-[40px] text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
