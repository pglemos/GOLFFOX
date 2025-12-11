import { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Chip, Searchbar, useTheme } from 'react-native-paper';

interface Trip {
    id: string;
    date: string;
    routeName: string;
    startTime: string;
    endTime: string;
    passengers: number;
    status: 'completed' | 'cancelled';
}

const mockTrips: Trip[] = [
    { id: '1', date: '2025-12-10', routeName: 'Rota Centro-Shopping', startTime: '07:00', endTime: '08:30', passengers: 25, status: 'completed' },
    { id: '2', date: '2025-12-09', routeName: 'Rota Centro-Shopping', startTime: '07:15', endTime: '08:45', passengers: 22, status: 'completed' },
    { id: '3', date: '2025-12-08', routeName: 'Rota Terminal-Industrial', startTime: '06:30', endTime: '07:45', passengers: 30, status: 'completed' },
    { id: '4', date: '2025-12-07', routeName: 'Rota Centro-Shopping', startTime: '07:00', endTime: '08:30', passengers: 0, status: 'cancelled' },
    { id: '5', date: '2025-12-06', routeName: 'Rota Terminal-Industrial', startTime: '06:30', endTime: '08:00', passengers: 28, status: 'completed' },
];

export default function HistoryScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();

    const filteredTrips = mockTrips.filter(trip =>
        trip.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.date.includes(searchQuery)
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const renderTrip = ({ item }: { item: Trip }) => (
        <Card style={styles.tripCard}>
            <Card.Content>
                <View style={styles.tripHeader}>
                    <Text variant="titleMedium">{item.routeName}</Text>
                    <Chip
                        mode="flat"
                        compact
                        style={{
                            backgroundColor: item.status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                        }}
                        textStyle={{
                            color: item.status === 'completed' ? '#059669' : '#DC2626',
                            fontSize: 12,
                        }}
                    >
                        {item.status === 'completed' ? '✓ Concluída' : '✕ Cancelada'}
                    </Chip>
                </View>

                <Text variant="bodySmall" style={styles.dateText}>
                    📅 {formatDate(item.date)}
                </Text>

                <View style={styles.tripDetails}>
                    <View style={styles.detailItem}>
                        <Text variant="labelSmall" style={styles.detailLabel}>Início</Text>
                        <Text variant="bodyMedium">{item.startTime}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text variant="labelSmall" style={styles.detailLabel}>Fim</Text>
                        <Text variant="bodyMedium">{item.endTime}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text variant="labelSmall" style={styles.detailLabel}>Passageiros</Text>
                        <Text variant="bodyMedium">{item.passengers}</Text>
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Buscar por rota ou data..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <FlatList
                data={filteredTrips}
                renderItem={renderTrip}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhuma viagem encontrada</Text>
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
    searchBar: {
        margin: 16,
        elevation: 0,
        backgroundColor: '#FFFFFF',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tripCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateText: {
        color: '#64748B',
        marginBottom: 12,
    },
    tripDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        color: '#94A3B8',
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        marginTop: 32,
    },
});
