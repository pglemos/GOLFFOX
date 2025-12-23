"use client"

import { useState } from "react"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bell, Check, Trash2, Mail, Info, AlertTriangle, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    user_id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
}

export function UserNotifications() {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()

    // Buscar notificações
    const { data: notifications = [] } = useQuery({
        queryKey: ['user-notifications'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            const { data, error } = await (supabase as any)
                .from('gf_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error
            return (data as unknown as Notification[]) || []
        },
        // Refetch a cada 30s ou realtime
        refetchInterval: 30000
    })

    // Mutation para marcar como lido
    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            await (supabase as any).from('gf_notifications').update({ is_read: true }).eq('id', id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    })

    // Mutation para marcar todas como lidas
    const markAllRead = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await (supabase as any).from('gf_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    })

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    data-slot="button"
                    type="button"
                    className={cn(
                        "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 relative",
                        "size-9"
                    )}
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="bg-destructive absolute top-2 right-2.5 size-2 rounded-full animate-pulse"></span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => markAllRead.mutate()}>
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <Mail className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read && "bg-muted/30"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                            notification.type === 'error' ? "bg-error-light0" :
                                                notification.type === 'warning' ? "bg-warning-light0" :
                                                    notification.type === 'success' ? "bg-success-light0" : "bg-info-light0"
                                        )} />
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-semibold")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                                                onClick={() => markAsRead.mutate(notification.id)}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
