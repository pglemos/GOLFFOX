import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Text, Surface, Chip, Divider, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Aviso {
    id: string;
    titulo: string;
    mensagem: string;
    data: string;
    tipo: 'info' | 'alerta' | 'urgente';
    lido: boolean;
}

const mockAvisos: Aviso[] = [
    {
        id: '1',
        titulo: 'Alteração de horário',
        mensagem: 'Informamos que a partir de segunda-feira (16/12), os horários da Linha 01 serão ajustados. O embarque às 7:30 passará para 7:45. Por favor, planeje-se com antecedência.',
        data: '2025-12-15',
        tipo: 'alerta',
        lido: false,
    },
    {
        id: '2',
        titulo: 'Recesso de Fim de Ano',
        mensagem: 'A operação será suspensa entre os dias 23/12 e 02/01. Retornamos normalmente no dia 03/01/2026.',
        data: '2025-12-14',
        tipo: 'info',
        lido: true,
    },
    {
        id: '3',
        titulo: 'Manutenção de veículo',
        mensagem: 'O veículo ABC-1234 passará por manutenção hoje. Um veículo reserva (DEF-5678) realizará a rota.',
        data: '2025-12-13',
        tipo: 'urgente',
        lido: true,
    },
];

const faqItems = [
    { q: 'Como fazer check-in?', a: 'Use o QR Code, NFC ou confirme manualmente pelo app.' },
    { q: 'O que fazer se perder o ônibus?', a: 'Acesse o app e informe no check-in que não embarcou.' },
    { q: 'Como alterar meu endereço?', a: 'Acesse Perfil > Meu Endereço e atualize sua localização.' },
];

export default function MuralScreen() {
    const [avisos, setAvisos] = useState<Aviso[]>(mockAvisos);
    const router = useRouter();

    const openWhatsApp = () => {
        Linking.openURL('https://wa.me/5511999999999?text=Olá, preciso de ajuda com o GolfFox');
    };

    const openEmail = () => {
        Linking.openURL('mailto:suporte@golffox.com.br?subject=Dúvida sobre o app');
    };

    const getTipoStyle = (tipo: Aviso['tipo']) => {
        switch (tipo) {
            case 'urgente': return { bg: '#FEE2E2', text: '#DC2626', icon: '🔴' };
            case 'alerta': return { bg: '#FEF3C7', text: '#D97706', icon: '🟡' };
            default: return { bg: '#DBEAFE', text: '#2563EB', icon: '🔵' };
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avisos */}
                <Text style={styles.sectionTitle}>📢 Avisos Recentes</Text>

                {avisos.map((aviso) => {
                    const tipoStyle = getTipoStyle(aviso.tipo);
                    return (
                        <Surface key={aviso.id} style={[styles.avisoCard, !aviso.lido && styles.avisoUnread]} elevation={1}>
                            <View style={styles.avisoHeader}>
                                <View style={[styles.tipoTag, { backgroundColor: tipoStyle.bg }]}>
                                    <Text style={{ color: tipoStyle.text, fontSize: 12, fontWeight: '600' }}>
                                        {tipoStyle.icon} {aviso.tipo.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.avisoData}>{new Date(aviso.data).toLocaleDateString('pt-BR')}</Text>
                            </View>
                            <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
                            <Text style={styles.avisoMensagem}>{aviso.mensagem}</Text>
                        </Surface>
                    );
                })}

                <Divider style={styles.divider} />

                {/* FAQ Rápido */}
                <Text style={styles.sectionTitle}>❓ Dúvidas Frequentes</Text>

                {faqItems.map((item, idx) => (
                    <Surface key={idx} style={styles.faqCard} elevation={1}>
                        <Text style={styles.faqQuestion}>{item.q}</Text>
                        <Text style={styles.faqAnswer}>{item.a}</Text>
                    </Surface>
                ))}

                <Pressable style={styles.verMaisBtn} onPress={() => router.push('/passenger/ajuda')}>
                    <Text style={styles.verMaisText}>Ver todas as dúvidas →</Text>
                </Pressable>

                <Divider style={styles.divider} />

                {/* Suporte */}
                <Text style={styles.sectionTitle}>💬 Precisa de Ajuda?</Text>

                <View style={styles.supportRow}>
                    <Pressable style={styles.supportBtn} onPress={openWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                        <Text style={styles.supportText}>WhatsApp</Text>
                    </Pressable>
                    <Pressable style={styles.supportBtn} onPress={openEmail}>
                        <Ionicons name="mail" size={28} color="#3B82F6" />
                        <Text style={styles.supportText}>E-mail</Text>
                    </Pressable>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, padding: 16 },

    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 },

    avisoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12 },
    avisoUnread: { borderLeftWidth: 4, borderLeftColor: '#0D9488' },
    avisoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tipoTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    avisoData: { fontSize: 12, color: '#94A3B8' },
    avisoTitulo: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
    avisoMensagem: { fontSize: 13, color: '#64748B', lineHeight: 20 },

    divider: { marginVertical: 20 },

    faqCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10 },
    faqQuestion: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
    faqAnswer: { fontSize: 13, color: '#64748B' },

    verMaisBtn: { alignItems: 'center', paddingVertical: 12 },
    verMaisText: { color: '#0D9488', fontWeight: '600' },

    supportRow: { flexDirection: 'row', gap: 12 },
    supportBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, elevation: 1 },
    supportText: { fontSize: 13, fontWeight: '500', color: '#0F172A' },
});
