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

    const toggleItem = (id: string, currentStatus: boolean) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, checked: !currentStatus } : item
            )
        );
    };

    const toggleAll = () => {
        const anyUnchecked = items.some(i => !i.checked);
        setItems(prev => prev.map(i => ({ ...i, checked: anyUnchecked })));
    };

    const allChecked = items.every(item => item.checked);
    const checkedCount = items.filter(item => item.checked).length;

    // Grouping
    const groups = {
        'Veículo e Mecânica': ['freios', 'farois', 'pneus', 'oleo', 'combustivel'],
        'Segurança': ['extintores', 'cintos', 'saidas'],
        'Geral': ['documentos', 'limpeza']
    };

    const renderGroup = (title: string, itemIds: string[]) => (
        <View key={title} style={styles.groupContainer}>
            <Text variant="titleSmall" style={styles.groupTitle}>{title}</Text>
            {itemIds.map(id => {
                const item = items.find(i => i.id === id);
                if (!item) return null;
                return (
                    <Checkbox.Item
                        key={item.id}
                        label={item.label}
                        status={item.checked ? 'checked' : 'unchecked'}
                        onPress={() => toggleItem(item.id, item.checked)}
                        style={styles.checkboxItem}
                        labelStyle={item.checked ? styles.checkedLabel : undefined}
                    />
                );
            })}
        </View>
    );

    const handleSubmit = async () => {
        // ... (existing submit logic)
        if (!allChecked) return;

        setIsSubmitting(true);
        try {
            const checklistData = items.reduce((acc, item) => ({
                ...acc,
                [item.id]: item.checked,
            }), {});

            const { error } = await supabase.from('vehicle_checklist').insert({
                driver_id: profile?.id,
                ...checklistData,
                timestamp: new Date().toISOString(),
            });

            if (error) {
                console.error('Error saving checklist:', error);
            }
            router.push('/driver/route');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.card} elevation={1}>
                {/* Header and Progress */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text variant="titleMedium" style={styles.title}>
                            Verificação Pré-Rota
                        </Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            {checkedCount}/{items.length} itens verificados
                        </Text>
                    </View>
                    <Button mode="text" onPress={toggleAll} compact>
                        {allChecked ? 'Desmarcar' : 'Marcar Todos'}
                    </Button>
                </View>

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
                <Divider style={styles.divider} />

                {/* Groups */}
                <View style={styles.checklistContainer}>
                    {Object.entries(groups).map(([title, ids]) => renderGroup(title, ids))}
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
    groupContainer: {
        marginBottom: 16,
    },
    groupTitle: {
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 8,
    },
});
