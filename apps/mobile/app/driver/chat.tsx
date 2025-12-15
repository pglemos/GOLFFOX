import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { Text, TextInput, Surface, FAB, Portal, Dialog, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../../src/auth/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
    id: string;
    text: string;
    sender: 'driver' | 'central';
    timestamp: string;
    read: boolean;
}

const mockMessages: Message[] = [
    { id: '1', text: 'Bom dia! Sua rota de hoje foi atualizada.', sender: 'central', timestamp: '07:00', read: true },
    { id: '2', text: 'Ok, recebi. Vou iniciar em 10 minutos.', sender: 'driver', timestamp: '07:05', read: true },
    { id: '3', text: 'Perfeito! Tenha uma boa viagem.', sender: 'central', timestamp: '07:06', read: true },
];

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [inputText, setInputText] = useState('');
    const [sosVisible, setSosVisible] = useState(false);
    const [sendingSos, setSendingSos] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const { profile } = useAuth();

    useEffect(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'driver',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simular resposta automática
        setTimeout(() => {
            const autoReply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Mensagem recebida! Um operador responderá em breve.',
                sender: 'central',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                read: false,
            };
            setMessages(prev => [...prev, autoReply]);
        }, 2000);
    };

    const handleSOS = async () => {
        setSendingSos(true);
        try {
            // Simular envio de SOS
            console.log('SOS enviado:', { driver: profile?.name, time: new Date().toISOString() });
            await new Promise(r => setTimeout(r, 1500));

            setSosVisible(false);
            Alert.alert(
                '🆘 SOS Enviado',
                'A central foi notificada e entrará em contato imediatamente.',
                [{ text: 'OK' }]
            );

            // Adicionar mensagem de emergência
            const sosMessage: Message = {
                id: Date.now().toString(),
                text: '🆘 ALERTA DE EMERGÊNCIA ENVIADO',
                sender: 'driver',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                read: true,
            };
            setMessages(prev => [...prev, sosMessage]);
        } finally {
            setSendingSos(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Header Info */}
            <Surface style={styles.header} elevation={1}>
                <Avatar.Icon size={40} icon="headset" style={styles.avatar} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>Central de Operações</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusText}>Online</Text>
                    </View>
                </View>
                <Pressable style={styles.sosBtn} onPress={() => setSosVisible(true)}>
                    <Ionicons name="warning" size={22} color="#FFF" />
                </Pressable>
            </Surface>

            {/* Messages */}
            <ScrollView
                ref={scrollRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBubble,
                            message.sender === 'driver' ? styles.driverBubble : styles.centralBubble,
                        ]}
                    >
                        <Text style={[
                            styles.messageText,
                            message.sender === 'driver' && styles.driverText,
                        ]}>
                            {message.text}
                        </Text>
                        <Text style={[
                            styles.messageTime,
                            message.sender === 'driver' && styles.driverTime,
                        ]}>
                            {message.timestamp}
                            {message.sender === 'driver' && (
                                <Text> {message.read ? '✓✓' : '✓'}</Text>
                            )}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Pressable style={styles.quickBtn}>
                    <Text style={styles.quickBtnText}>📍 Enviar localização</Text>
                </Pressable>
                <Pressable style={styles.quickBtn}>
                    <Text style={styles.quickBtnText}>⏰ Informar atraso</Text>
                </Pressable>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    mode="outlined"
                    placeholder="Digite sua mensagem..."
                    value={inputText}
                    onChangeText={setInputText}
                    style={styles.input}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#0D9488"
                    right={
                        <TextInput.Icon
                            icon="send"
                            color={inputText.trim() ? '#0D9488' : '#CBD5E1'}
                            onPress={handleSend}
                        />
                    }
                    onSubmitEditing={handleSend}
                />
            </View>

            {/* SOS Dialog */}
            <Portal>
                <Dialog visible={sosVisible} onDismiss={() => setSosVisible(false)}>
                    <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.sosDialog}>
                        <Ionicons name="warning" size={48} color="#FFF" />
                        <Text style={styles.sosTitle}>Emergência SOS</Text>
                        <Text style={styles.sosDesc}>
                            Isso enviará um alerta imediato para a central com sua localização atual.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={handleSOS}
                            loading={sendingSos}
                            disabled={sendingSos}
                            style={styles.sosConfirmBtn}
                            buttonColor="#FFF"
                            textColor="#DC2626"
                        >
                            ENVIAR SOS AGORA
                        </Button>
                        <Button
                            mode="text"
                            onPress={() => setSosVisible(false)}
                            textColor="#FFF"
                        >
                            Cancelar
                        </Button>
                    </LinearGradient>
                </Dialog>
            </Portal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FFF', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    avatar: { backgroundColor: '#0D9488' },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    statusText: { fontSize: 12, color: '#10B981' },
    sosBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },

    messagesContainer: { flex: 1 },
    messagesContent: { padding: 16, gap: 12 },
    messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
    driverBubble: { alignSelf: 'flex-end', backgroundColor: '#0D9488', borderBottomRightRadius: 4 },
    centralBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4, elevation: 1 },
    messageText: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
    driverText: { color: '#FFF' },
    messageTime: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'right' },
    driverTime: { color: 'rgba(255,255,255,0.7)' },

    quickActions: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    quickBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    quickBtnText: { fontSize: 12, color: '#64748B' },

    inputContainer: { padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    input: { backgroundColor: '#FFF' },

    sosDialog: { borderRadius: 16, padding: 24, margin: -24, alignItems: 'center' },
    sosTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    sosDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    sosConfirmBtn: { borderRadius: 12, width: '100%', marginBottom: 8 },
});
