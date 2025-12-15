import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Text, Divider, useTheme, Chip, Avatar } from 'react-native-paper';
import { useAuth } from '../../src/auth/AuthProvider';
import { supabase } from '../../src/services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface TripHistory {
    id: string;
    date: string;
    route_name: string;
    origin: string;
    destination: string;
    status: 'completed' | 'cancelled' | 'no_show';
    driver_name?: string;
}

export default function HistoricoScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const [trips, setTrips] = useState<TripHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data
        const mockTrips: TripHistory[] = [
            { id: '1', date: '2024-12-11', route_name: 'Rota Centro-Shopping', origin: 'Ponto A', destination: 'Shopping Center', status: 'completed', driver_name: 'João Silva' },
            { id: '2', date: '2024-12-10', route_name: 'Rota Centro-Shopping', origin: 'Ponto A', destination: 'Shopping Center', status: 'completed', driver_name: 'João Silva' },
            { id: '3', date: '2024-12-09', route_name: 'Rota Centro-Shopping', origin: 'Ponto A', destination: 'Shopping Center', status: 'cancelled', driver_name: 'Maria Santos' },
            { id: '4', date: '2024-12-06', route_name: 'Rota Centro-Shopping', origin: 'Ponto A', destination: 'Shopping Center', status: 'completed', driver_name: 'João Silva' },
            { id: '5', date: '2024-12-05', route_name: 'Rota Centro-Shopping', origin: 'Ponto A', destination: 'Shopping Center', status: 'no_show', driver_name: 'João Silva' },
        ];
        setTrips(mockTrips);
        setLoading(false);
    }, [profile]);

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'completed':
                return <Chip mode="flat" compact style={{ backgroundColor: '#D1FAE5' }} textStyle={{ color: '#059669', fontSize: 10 }}>✓ Concluída</Chip>;
            case 'cancelled':
                return <Chip mode="flat" compact style={{ backgroundColor: '#FEE2E2' }} textStyle={{ color: '#EF4444', fontSize: 10 }}>Cancelada</Chip>;
            case 'no_show':
                return <Chip mode="flat" compact style={{ backgroundColor: '#FEF3C7' }} textStyle={{ color: '#D97706', fontSize: 10 }}>Não compareceu</Chip>;
            default:
                return null;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, "EEE, dd 'de' MMM", { locale: ptBR });
    };

    const renderTrip = ({ item }: { item: TripHistory }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.tripHeader}>
                    <Text variant="bodySmall" style={styles.date}>{formatDate(item.date)}</Text>
                    {getStatusChip(item.status)}
                </View>
                <Text variant="titleMedium" style={styles.routeName}>🚌 {item.route_name}</Text>
                <Divider style={styles.divider} />
                <View style={styles.routeDetails}>
                    <View style={styles.point}>
                        <Text variant="labelSmall" style={styles.label}>Origem</Text>
                        <Text variant="bodyMedium">{item.origin}</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                    <View style={styles.point}>
                        <Text variant="labelSmall" style={styles.label}>Destino</Text>
                        <Text variant="bodyMedium">{item.destination}</Text>
                    </View>
                </View>
                {item.driver_name && (
                    <View style={styles.driverInfo}>
                        <Avatar.Icon size={24} icon="account" style={{ backgroundColor: theme.colors.primary }} />
                        <Text variant="bodySmall" style={styles.driverName}>{item.driver_name}</Text>
                    </View>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>📅 Histórico de Viagens</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>Suas últimas viagens</Text>
            </View>

            <FlatList
                data={trips}
                renderItem={renderTrip}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text variant="bodyLarge">Nenhuma viagem encontrada</Text>
                    </View>
                }
            />
        </View>
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
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    date: {
        color: '#64748B',
    },
    routeName: {
        fontWeight: '600',
    },
    divider: {
        marginVertical: 12,
    },
    routeDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    point: {
        flex: 1,
    },
    label: {
        color: '#94A3B8',
        marginBottom: 2,
    },
    arrow: {
        fontSize: 18,
        color: '#94A3B8',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    driverName: {
        color: '#64748B',
    },
    empty: {
        alignItems: 'center',
        padding: 32,
    },
});
