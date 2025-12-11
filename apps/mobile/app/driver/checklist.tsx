import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Checkbox, Button, Text, Surface, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/auth/AuthProvider';

interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
    { id: 'freios', label: '🛞 Freios funcionando', checked: false },
    { id: 'farois', label: '💡 Faróis e luzes operacionais', checked: false },
    { id: 'pneus', label: '🚗 Pneus em bom estado', checked: false },
    { id: 'oleo', label: '🛢️ Nível de óleo verificado', checked: false },
    { id: 'combustivel', label: '⛽ Combustível suficiente', checked: false },
    { id: 'limpeza', label: '🧹 Veículo limpo internamente', checked: false },
    { id: 'documentos', label: '📄 Documentos em dia', checked: false },
    { id: 'extintores', label: '🧯 Extintores verificados', checked: false },
    { id: 'cintos', label: '🪢 Cintos de segurança funcionando', checked: false },
    { id: 'saidas', label: '🚪 Saídas de emergência liberadas', checked: false },
];

export default function ChecklistScreen() {
    const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const toggleItem = (id: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const allChecked = items.every(item => item.checked);
    const checkedCount = items.filter(item => item.checked).length;

    const handleSubmit = async () => {
        if (!allChecked) return;

        setIsSubmitting(true);
        try {
            // Salvar checklist no Supabase
            const checklistData = items.reduce((acc, item) => ({
                ...acc,
                [item.id]: item.checked,
            }), {});

            const { error } = await supabase.from('vehicle_checklist').insert({
                driver_id: profile?.id,
                // route_id: currentRoute?.id, // TODO: vincular à rota atual
                ...checklistData,
                timestamp: new Date().toISOString(),
            });

            if (error) {
                console.error('Error saving checklist:', error);
                // Continuar mesmo com erro para não bloquear o motorista
            }

            // Navegar para a tela de rota
            router.push('/driver/route');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.card} elevation={1}>
                <Text variant="titleMedium" style={styles.title}>
                    Verificação Pré-Rota
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                    Complete todos os itens antes de iniciar
                </Text>
                <Divider style={styles.divider} />

                <View style={styles.progressContainer}>
                    <Text variant="bodyMedium">
                        {checkedCount} de {items.length} itens verificados
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${(checkedCount / items.length) * 100}%`,
                                    backgroundColor: allChecked ? '#10B981' : theme.colors.primary,
                                }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.checklistContainer}>
                    {items.map(item => (
                        <Checkbox.Item
                            key={item.id}
                            label={item.label}
                            status={item.checked ? 'checked' : 'unchecked'}
                            onPress={() => toggleItem(item.id)}
                            style={styles.checkboxItem}
                            labelStyle={item.checked ? styles.checkedLabel : undefined}
                        />
                    ))}
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    disabled={!allChecked || isSubmitting}
                    loading={isSubmitting}
                    style={[
                        styles.submitButton,
                        allChecked && { backgroundColor: '#10B981' }
                    ]}
                    contentStyle={styles.buttonContent}
                >
                    {allChecked ? '✓ Iniciar Rota' : `Faltam ${items.length - checkedCount} itens`}
                </Button>
            </Surface>
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
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#64748B',
    },
    divider: {
        marginVertical: 16,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    checklistContainer: {
        gap: 4,
    },
    checkboxItem: {
        borderRadius: 8,
        marginHorizontal: -8,
    },
    checkedLabel: {
        color: '#10B981',
        textDecorationLine: 'line-through',
    },
    submitButton: {
        marginTop: 24,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});
