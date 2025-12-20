"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { MessageSquare, Send, User, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
    id: string
    sender_id: string
    sender_name: string
    sender_type: 'operador' | 'motorista'
    content: string
    created_at: string
}

interface Driver {
    id: string
    name: string
    is_online: boolean
    last_message?: string
}

export default function MensagensPage() {
    const { user } = useAuth()
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Mock drivers list
        const mockDrivers: Driver[] = [
            { id: '1', name: 'João Silva', is_online: true, last_message: 'Ok, entendido!' },
            { id: '2', name: 'Maria Santos', is_online: true, last_message: 'Chegando em 5 min' },
            { id: '3', name: 'Pedro Costa', is_online: false, last_message: 'Rota finalizada' },
            { id: '4', name: 'Ana Oliveira', is_online: true },
        ]
        setDrivers(mockDrivers)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (selectedDriver) {
            // Mock messages for selected motorista
            const mockMessages: Message[] = [
                { id: '1', sender_id: selectedDriver.id, sender_name: selectedDriver.name, sender_type: 'motorista', content: 'Bom dia! Iniciando rota.', created_at: '2024-12-12T08:00:00' },
                { id: '2', sender_id: 'op1', sender_name: 'Central', sender_type: 'operador', content: 'Bom dia! Tudo certo, boa viagem!', created_at: '2024-12-12T08:01:00' },
                { id: '3', sender_id: selectedDriver.id, sender_name: selectedDriver.name, sender_type: 'motorista', content: 'Houve um pequeno atraso no ponto 3.', created_at: '2024-12-12T08:30:00' },
                { id: '4', sender_id: 'op1', sender_name: 'Central', sender_type: 'operador', content: 'Entendido, obrigado por informar.', created_at: '2024-12-12T08:31:00' },
            ]
            setMessages(mockMessages)
        }
    }, [selectedDriver])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedDriver) return

        const msg: Message = {
            id: Date.now().toString(),
            sender_id: 'op1',
            sender_name: 'Central',
            sender_type: 'operador',
            content: newMessage,
            created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, msg])
        setNewMessage("")

        // In production: save to Supabase chat_messages table
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <AppShell panel="transportadora" user={user ? { id: user.id, name: user.name || 'Operador', email: user.email || '', role: user.role || 'operador' } : { id: 'mock', name: 'Operador', email: 'op@golffox.com', role: 'operador' }}>
            <div className="flex h-[calc(100vh-120px)]">
                {/* motorista List */}
                <div className="w-80 border-r">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Mensagens
                        </h2>
                    </div>
                    <ScrollArea className="h-full">
                        {drivers.map(driver => (
                            <div
                                key={driver.id}
                                className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedDriver?.id === motorista.id ? 'bg-muted' : ''}`}
                                onClick={() => setSelectedDriver(driver)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{driver.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {driver.is_online && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{motorista.name}</p>
                                        {driver.last_message && (
                                            <p className="text-sm text-muted-foreground truncate">{motorista.last_message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedDriver ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{selectedDriver.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedDriver.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedDriver.is_online ? '🟢 Online' : '⚫ Offline'}
                                    </p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'operador' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_type === 'operador' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p>{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.sender_type === 'operador' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Digite sua mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <Button onClick={sendMessage}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Selecione um motorista para iniciar a conversa</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    )
}
