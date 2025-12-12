import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Divider, useTheme, Chip, Avatar, ProgressBar } from 'react-native-paper';
import { useAuth } from '../../src/auth/AuthProvider';
import { supabase } from '../../src/services/supabase';

interface Stats {
    total_trips: number;
    total_km: number;
    on_time_percent: number;
    co2_saved: number;
    money_saved: number;
}

export default function EstatisticasScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock stats data
        const mockStats: Stats = {
            total_trips: 142,
            total_km: 2840,
            on_time_percent: 94,
            co2_saved: 425,
            money_saved: 3200
        };
        setStats(mockStats);
        setLoading(false);
    }, [profile]);

    if (loading || !stats) {
        return (
            <View style={styles.container}>
                <Text>Carregando...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>📊 Suas Estatísticas</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>Resumo de uso do transporte</Text>
            </View>

            {/* Main Stats */}
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Text variant="displaySmall" style={styles.statNumber}>{stats.total_trips}</Text>
                        <Text variant="bodySmall" style={styles.statLabel}>Viagens</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.statCard}>
                    <Card.Content style={styles.statContent}>
                        <Text variant="displaySmall" style={styles.statNumber}>{stats.total_km}</Text>
                        <Text variant="bodySmall" style={styles.statLabel}>KM Percorridos</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* On-time Rate */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium">⏱️ Taxa de Pontualidade</Text>
                    <View style={styles.progressRow}>
                        <ProgressBar progress={stats.on_time_percent / 100} color={theme.colors.primary} style={styles.progressBar} />
                        <Text variant="titleLarge" style={styles.progressText}>{stats.on_time_percent}%</Text>
                    </View>
                    <Text variant="bodySmall" style={styles.hint}>Chegadas no horário previsto</Text>
                </Card.Content>
            </Card>

            {/* Environmental Impact */}
            <Card style={[styles.card, { backgroundColor: '#ECFDF5' }]}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ color: '#059669' }}>🌱 Impacto Ambiental</Text>
                    <Divider style={styles.divider} />
                    <View style={styles.impactRow}>
                        <View style={styles.impactItem}>
                            <Text variant="headlineMedium" style={{ color: '#059669' }}>{stats.co2_saved}</Text>
                            <Text variant="bodySmall">kg CO₂ evitados</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Text variant="headlineMedium" style={{ color: '#059669' }}>🌳 {Math.round(stats.co2_saved / 20)}</Text>
                            <Text variant="bodySmall">Árvores equivalentes</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Money Saved */}
            <Card style={[styles.card, { backgroundColor: '#EFF6FF' }]}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ color: '#2563EB' }}>💰 Economia Estimada</Text>
                    <Divider style={styles.divider} />
                    <Text variant="displaySmall" style={{ color: '#2563EB', textAlign: 'center' }}>
                        R$ {stats.money_saved.toLocaleString('pt-BR')}
                    </Text>
                    <Text variant="bodySmall" style={[styles.hint, { textAlign: 'center' }]}>
                        Comparado a transporte particular
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#64748B',
    },
    statsGrid: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    statNumber: {
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    statLabel: {
        color: '#64748B',
        marginTop: 4,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
    },
    progressText: {
        fontWeight: 'bold',
    },
    hint: {
        color: '#64748B',
        marginTop: 8,
    },
    divider: {
        marginVertical: 12,
    },
    impactRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    impactItem: {
        alignItems: 'center',
    },
});
