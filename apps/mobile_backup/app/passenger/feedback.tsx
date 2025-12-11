import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Card, Text, Button, TextInput, useTheme, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/auth/AuthProvider';

export default function FeedbackScreen() {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('trip_ratings').insert({
                passenger_id: profile?.id,
                // route_id: currentRoute?.id,
                // driver_id: driver?.id,
                rating,
                comment: comment.trim() || null,
                created_at: new Date().toISOString(),
            });

            if (error) {
                console.error('Error submitting feedback:', error);
            }

            setShowSuccess(true);

            // Voltar após 2 segundos
            setTimeout(() => {
                router.back();
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarButton = ({ value }: { value: number }) => (
        <Pressable onPress={() => setRating(value)} style={styles.starButton}>
            <Text style={[styles.star, value <= rating && styles.starActive]}>
                {value <= rating ? '★' : '☆'}
            </Text>
        </Pressable>
    );

    const quickFeedback = [
        { label: '👍 Pontual', value: 'pontual' },
        { label: '🧹 Limpo', value: 'limpo' },
        { label: '😊 Motorista educado', value: 'educado' },
        { label: '🚌 Confortável', value: 'confortavel' },
    ];

    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const toggleTag = (value: string) => {
        setSelectedTags(prev =>
            prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
        );
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.title}>
                        Como foi sua viagem?
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Sua avaliação ajuda a melhorar o serviço
                    </Text>

                    {/* Rating Stars */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(value => (
                            <StarButton key={value} value={value} />
                        ))}
                    </View>

                    <Text variant="bodySmall" style={styles.ratingLabel}>
                        {rating === 0 && 'Toque para avaliar'}
                        {rating === 1 && '😞 Muito ruim'}
                        {rating === 2 && '😕 Ruim'}
                        {rating === 3 && '😐 Regular'}
                        {rating === 4 && '🙂 Bom'}
                        {rating === 5 && '😄 Excelente!'}
                    </Text>
                </Card.Content>
            </Card>

            {/* Quick Tags */}
            {rating > 0 && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            O que você mais gostou?
                        </Text>
                        <View style={styles.tagsContainer}>
                            {quickFeedback.map(tag => (
                                <Pressable
                                    key={tag.value}
                                    onPress={() => toggleTag(tag.value)}
                                    style={[
                                        styles.tag,
                                        selectedTags.includes(tag.value) && styles.tagSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tagText,
                                            selectedTags.includes(tag.value) && styles.tagTextSelected,
                                        ]}
                                    >
                                        {tag.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* Comment */}
            {rating > 0 && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Comentário (opcional)
                        </Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Conte-nos mais sobre sua experiência..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            style={styles.textInput}
                        />
                    </Card.Content>
                </Card>
            )}

            {/* Submit Button */}
            <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                loading={isSubmitting}
                style={styles.submitButton}
                contentStyle={styles.submitContent}
            >
                Enviar Avaliação
            </Button>

            {/* Skip button */}
            <Button
                mode="text"
                onPress={() => router.back()}
                style={styles.skipButton}
            >
                Pular por agora
            </Button>

            {/* Success Snackbar */}
            <Snackbar
                visible={showSuccess}
                onDismiss={() => setShowSuccess(false)}
                duration={2000}
                style={styles.snackbar}
            >
                ✅ Obrigado pelo seu feedback!
            </Snackbar>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F8FAFC',
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    title: {
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        textAlign: 'center',
        color: '#64748B',
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    starButton: {
        padding: 8,
    },
    star: {
        fontSize: 40,
        color: '#E2E8F0',
    },
    starActive: {
        color: '#F59E0B',
    },
    ratingLabel: {
        textAlign: 'center',
        marginTop: 16,
        color: '#64748B',
    },
    sectionTitle: {
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tagSelected: {
        backgroundColor: '#3B82F6',
    },
    tagText: {
        color: '#64748B',
    },
    tagTextSelected: {
        color: '#FFFFFF',
    },
    textInput: {
        backgroundColor: '#FFFFFF',
    },
    submitButton: {
        marginTop: 8,
        borderRadius: 8,
    },
    submitContent: {
        paddingVertical: 8,
    },
    skipButton: {
        marginTop: 8,
        marginBottom: 32,
    },
    snackbar: {
        backgroundColor: '#10B981',
    },
});
