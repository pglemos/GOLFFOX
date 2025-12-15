import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Text, Surface, Searchbar, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface FaqItem {
    id: string;
    categoria: string;
    pergunta: string;
    resposta: string;
}

const faqData: FaqItem[] = [
    // Check-in
    { id: '1', categoria: 'Check-in', pergunta: 'Como fazer check-in no ônibus?', resposta: 'Você pode fazer check-in de 3 formas: 1) Escaneando o QR Code dentro do veículo, 2) Aproximando o celular no leitor NFC, ou 3) Confirmando manualmente pelo app.' },
    { id: '2', categoria: 'Check-in', pergunta: 'O que acontece se eu não fizer check-in?', resposta: 'Se não houver check-in após 5 minutos do horário de embarque, você receberá uma notificação de lembrete. É importante registrar para que a empresa saiba que você embarcou.' },
    { id: '3', categoria: 'Check-in', pergunta: 'Posso fazer check-in se perdi o ônibus?', resposta: 'Sim! Acesse a tela de Check-in e clique em "Não embarquei no fretado". Você poderá informar o motivo e, se necessário, pausar as notificações.' },

    // Rotas
    { id: '4', categoria: 'Rotas', pergunta: 'Como localizar meu ônibus?', resposta: 'Na aba Mapa, você pode ver a localização do veículo em tempo real, o tempo estimado de chegada e todos os pontos da rota.' },
    { id: '5', categoria: 'Rotas', pergunta: 'Os horários podem mudar?', resposta: 'Sim. Alterações de horário são comunicadas pelo Mural de Avisos. Sempre verifique o app antes de se deslocar até o ponto.' },

    // Perfil
    { id: '6', categoria: 'Perfil', pergunta: 'Como alterar meu endereço?', resposta: 'Acesse Perfil > Meu Endereço. Você pode compartilhar sua localização atual via GPS e atualizar o número da casa.' },
    { id: '7', categoria: 'Perfil', pergunta: 'Posso alterar meu nome ou CPF?', resposta: 'Nome, CPF e RG só podem ser alterados pelo suporte. Entre em contato via WhatsApp ou email.' },

    // Notificações
    { id: '8', categoria: 'Notificações', pergunta: 'Posso pausar as notificações?', resposta: 'Sim! Se estiver de férias ou afastado, acesse Check-in > Não embarquei e marque a opção "Pausar notificações" informando o período.' },

    // Avaliação
    { id: '9', categoria: 'Avaliação', pergunta: 'Como avaliar minha viagem?', resposta: 'Você pode avaliar a qualquer momento em Perfil > Avaliar Viagem. Também enviamos notificações durante e após o trajeto solicitando sua avaliação.' },
];

const categorias = ['Todos', 'Check-in', 'Rotas', 'Perfil', 'Notificações', 'Avaliação'];

export default function AjudaScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoria, setCategoria] = useState('Todos');
    const [expanded, setExpanded] = useState<string | null>(null);

    const filteredFaq = faqData.filter(item => {
        const matchSearch = item.pergunta.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.resposta.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategoria = categoria === 'Todos' || item.categoria === categoria;
        return matchSearch && matchCategoria;
    });

    const openWhatsApp = () => {
        Linking.openURL('https://wa.me/5511999999999?text=Olá, preciso de ajuda');
    };

    return (
        <View style={styles.container}>
            {/* Busca */}
            <Searchbar
                placeholder="Buscar dúvida..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />

            {/* Categorias */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasContainer}>
                {categorias.map((cat) => (
                    <Pressable
                        key={cat}
                        style={[styles.categoriaChip, categoria === cat && styles.categoriaChipActive]}
                        onPress={() => setCategoria(cat)}
                    >
                        <Text style={[styles.categoriaText, categoria === cat && styles.categoriaTextActive]}>
                            {cat}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {filteredFaq.map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                        <Surface style={styles.faqCard} elevation={1}>
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{item.pergunta}</Text>
                                <Ionicons
                                    name={expanded === item.id ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#64748B"
                                />
                            </View>
                            {expanded === item.id && (
                                <>
                                    <Divider style={styles.faqDivider} />
                                    <Text style={styles.faqAnswer}>{item.resposta}</Text>
                                </>
                            )}
                        </Surface>
                    </Pressable>
                ))}

                {filteredFaq.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nenhuma dúvida encontrada</Text>
                    </View>
                )}

                {/* Contato Suporte */}
                <Surface style={styles.supportCard} elevation={1}>
                    <Text style={styles.supportTitle}>Não encontrou sua dúvida?</Text>
                    <Text style={styles.supportDesc}>Fale com nosso suporte</Text>
                    <Pressable style={styles.whatsappBtn} onPress={openWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
                        <Text style={styles.whatsappText}>Abrir WhatsApp</Text>
                    </Pressable>
                </Surface>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    searchbar: { margin: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 12 },
    searchInput: { fontSize: 14 },

    categoriasContainer: { paddingHorizontal: 16, paddingBottom: 12 },
    categoriaChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2E8F0', marginRight: 8 },
    categoriaChipActive: { backgroundColor: '#0D9488' },
    categoriaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    categoriaTextActive: { color: '#FFF' },

    content: { flex: 1, padding: 16, paddingTop: 0 },

    faqCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A', marginRight: 12 },
    faqDivider: { marginVertical: 12 },
    faqAnswer: { fontSize: 13, color: '#64748B', lineHeight: 20 },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: '#94A3B8', fontSize: 14 },

    supportCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 16 },
    supportTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
    supportDesc: { fontSize: 13, color: '#64748B', marginBottom: 16 },
    whatsappBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#25D366', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    whatsappText: { color: '#FFF', fontWeight: '600' },
});
