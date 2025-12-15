import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Text, Surface, Button, TextInput, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const npsLabels: { [key: number]: string } = {
    0: 'Péssimo', 1: 'Muito ruim', 2: 'Ruim', 3: 'Regular', 4: 'Abaixo da média',
    5: 'Razoável', 6: 'Bom', 7: 'Muito bom', 8: 'Ótimo', 9: 'Excelente', 10: 'Perfeito!',
};

const quickTags = [
    { id: 'pontual', label: '⏰ Pontual', positive: true },
    { id: 'limpo', label: '✨ Limpo', positive: true },
    { id: 'motorista', label: '👍 Ótimo motorista', positive: true },
    { id: 'conforto', label: '🛋️ Confortável', positive: true },
    { id: 'atraso', label: '⏳ Atrasou', positive: false },
    { id: 'sujo', label: '🧹 Precisava limpeza', positive: false },
    { id: 'lotado', label: '👥 Muito lotado', positive: false },
];

export default function FeedbackScreen() {
    const [npsScore, setNpsScore] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    const getNpsColor = (score: number) => {
        if (score <= 4) return '#EF4444';
        if (score <= 6) return '#F59E0B';
        return '#10B981';
    };

    const handleSubmit = async () => {
        if (npsScore === null) {
            Alert.alert('Atenção', 'Por favor, selecione uma nota de 0 a 10.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Simular envio
            console.log('Avaliação:', { npsScore, selectedTags, comment, userId: profile?.id });
            await new Promise(r => setTimeout(r, 1000));

            Alert.alert(
                '🎉 Obrigado!',
                'Sua avaliação foi enviada com sucesso.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* NPS Score */}
            <Surface style={styles.npsCard} elevation={2}>
                <Text style={styles.npsQuestion}>
                    De 0 a 10, como você avalia sua experiência com o transporte fretado?
                </Text>

                <View style={styles.npsScoreRow}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <Pressable
                            key={score}
                            style={[
                                styles.npsBtn,
                                npsScore === score && { backgroundColor: getNpsColor(score) },
                            ]}
                            onPress={() => setNpsScore(score)}
                        >
                            <Text style={[
                                styles.npsBtnText,
                                npsScore === score && styles.npsBtnTextActive,
                            ]}>
                                {score}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.npsLabels}>
                    <Text style={styles.npsLabelLeft}>😞 Nada provável</Text>
                    <Text style={styles.npsLabelRight}>😍 Muito provável</Text>
                </View>

                {npsScore !== null && (
                    <View style={[styles.npsResult, { backgroundColor: `${getNpsColor(npsScore)}15` }]}>
                        <Text style={[styles.npsResultText, { color: getNpsColor(npsScore) }]}>
                            {npsLabels[npsScore]}
                        </Text>
                    </View>
                )}
            </Surface>

            {/* Quick Tags */}
            <Text style={styles.sectionTitle}>O que você mais gostou ou poderia melhorar?</Text>
            <View style={styles.tagsContainer}>
                {quickTags.map((tag) => (
                    <Pressable
                        key={tag.id}
                        onPress={() => toggleTag(tag.id)}
                    >
                        <Chip
                            selected={selectedTags.includes(tag.id)}
                            style={[
                                styles.tagChip,
                                selectedTags.includes(tag.id) && {
                                    backgroundColor: tag.positive ? '#CCFBF1' : '#FEE2E2',
                                },
                            ]}
                            textStyle={[
                                styles.tagText,
                                selectedTags.includes(tag.id) && {
                                    color: tag.positive ? '#0D9488' : '#DC2626',
                                },
                            ]}
                        >
                            {tag.label}
                        </Chip>
                    </Pressable>
                ))}
            </View>

            {/* Comment */}
            <Text style={styles.sectionTitle}>Quer adicionar um comentário? (opcional)</Text>
            <TextInput
                mode="outlined"
                placeholder="Conte-nos mais sobre sua experiência..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                style={styles.commentInput}
                outlineColor="#E2E8F0"
                activeOutlineColor="#0D9488"
            />

            {/* Submit */}
            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || npsScore === null}
                style={styles.submitBtn}
                contentStyle={styles.submitBtnContent}
                buttonColor="#0D9488"
            >
                Enviar Avaliação
            </Button>

            {/* Info */}
            <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>
                    Sua avaliação é confidencial e nos ajuda a melhorar o serviço.
                </Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 16 },

    npsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20 },
    npsQuestion: { fontSize: 16, fontWeight: '600', color: '#0F172A', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
    npsScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    npsBtn: { width: 28, height: 36, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    npsBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    npsBtnTextActive: { color: '#FFF' },
    npsLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    npsLabelLeft: { fontSize: 11, color: '#94A3B8' },
    npsLabelRight: { fontSize: 11, color: '#94A3B8' },
    npsResult: { marginTop: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    npsResultText: { fontSize: 16, fontWeight: '700' },

    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    tagChip: { backgroundColor: '#F1F5F9', marginBottom: 4 },
    tagText: { color: '#64748B' },

    commentInput: { backgroundColor: '#FFF', marginBottom: 20 },

    submitBtn: { borderRadius: 12, marginBottom: 16 },
    submitBtnContent: { paddingVertical: 6 },

    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#F1F5F9', borderRadius: 10 },
    infoText: { flex: 1, fontSize: 12, color: '#64748B' },
});
