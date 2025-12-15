import { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Text, Surface, Chip, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Trip {
    id: string;
    date: string;
    routeName: string;
    startTime: string;
    endTime: string;
    passengers: number;
    status: 'completed' | 'cancelled';
    distance: number;
}

const mockTrips: Trip[] = [
    { id: '1', date: '2025-12-15', routeName: 'Linha 01 - Centro', startTime: '07:00', endTime: '08:30', passengers: 25, status: 'completed', distance: 18.5 },
    { id: '2', date: '2025-12-14', routeName: 'Linha 01 - Centro', startTime: '07:15', endTime: '08:45', passengers: 22, status: 'completed', distance: 17.2 },
    { id: '3', date: '2025-12-13', routeName: 'Linha 02 - Industrial', startTime: '06:30', endTime: '07:45', passengers: 30, status: 'completed', distance: 22.0 },
    { id: '4', date: '2025-12-12', routeName: 'Linha 01 - Centro', startTime: '07:00', endTime: '08:30', passengers: 0, status: 'cancelled', distance: 0 },
    { id: '5', date: '2025-12-11', routeName: 'Linha 02 - Industrial', startTime: '06:30', endTime: '08:00', passengers: 28, status: 'completed', distance: 23.5 },
    { id: '6', date: '2025-12-10', routeName: 'Linha 01 - Centro', startTime: '07:00', endTime: '08:30', passengers: 24, status: 'completed', distance: 18.0 },
];

export default function HistoryScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    // Calcular estatísticas
    const completedTrips = mockTrips.filter(t => t.status === 'completed');
    const totalTrips = completedTrips.length;
    const totalPassengers = completedTrips.reduce((acc, t) => acc + t.passengers, 0);
    const totalDistance = completedTrips.reduce((acc, t) => acc + t.distance, 0);
    const avgRating = 4.8; // Mock rating

    const filteredTrips = mockTrips.filter(trip =>
        trip.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.date.includes(searchQuery)
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) return 'Hoje';
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';

        return date.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const renderHeader = () => (
        <View>
            {/* Stats Cards */}
            <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.statsCard}>
                <Text style={styles.statsTitle}>📊 Estatísticas do Mês</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Ionicons name="bus" size={24} color="#FFF" />
                        <Text style={styles.statNumber}>{totalTrips}</Text>
                        <Text style={styles.statLabel}>Viagens</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="people" size={24} color="#FFF" />
                        <Text style={styles.statNumber}>{totalPassengers}</Text>
                        <Text style={styles.statLabel}>Passageiros</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="navigate" size={24} color="#FFF" />
                        <Text style={styles.statNumber}>{totalDistance.toFixed(0)}</Text>
                        <Text style={styles.statLabel}>Km rodados</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={24} color="#F59E0B" />
                        <Text style={styles.statNumber}>{avgRating}</Text>
                        <Text style={styles.statLabel}>Avaliação</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Search */}
            <Searchbar
                placeholder="Buscar por rota ou data..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
            />

            <Text style={styles.sectionTitle}>Histórico de Viagens</Text>
        </View>
    );

    const renderTrip = ({ item }: { item: Trip }) => (
        <Surface style={styles.tripCard} elevation={1}>
            <View style={styles.tripHeader}>
                <View style={styles.tripDate}>
                    <Text style={styles.tripDateText}>{formatDate(item.date)}</Text>
                </View>
                <Chip
                    compact
                    style={[
                        styles.statusChip,
                        { backgroundColor: item.status === 'completed' ? '#D1FAE5' : '#FEE2E2' }
                    ]}
                    textStyle={[
                        styles.statusChipText,
                        { color: item.status === 'completed' ? '#059669' : '#DC2626' }
                    ]}
                >
                    {item.status === 'completed' ? '✓ Concluída' : '✕ Cancelada'}
                </Chip>
            </View>

            <Text style={styles.tripRoute}>{item.routeName}</Text>

            <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{item.startTime} - {item.endTime}</Text>
                </View>
                {item.status === 'completed' && (
                    <>
                        <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={14} color="#64748B" />
                            <Text style={styles.metaText}>{item.passengers}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="navigate-outline" size={14} color="#64748B" />
                            <Text style={styles.metaText}>{item.distance} km</Text>
                        </View>
                    </>
                )}
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredTrips}
                renderItem={renderTrip}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhuma viagem encontrada</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    list: { paddingBottom: 20 },

    statsCard: { margin: 16, borderRadius: 16, padding: 18 },
    statsTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
    statNumber: { color: '#FFF', fontSize: 22, fontWeight: '700', marginTop: 6 },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

    searchBar: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF', borderRadius: 12, elevation: 1 },
    searchInput: { fontSize: 14 },

    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginHorizontal: 16, marginBottom: 12 },

    tripCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tripDate: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tripDateText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    statusChip: { height: 24 },
    statusChipText: { fontSize: 11, fontWeight: '600' },
    tripRoute: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 10 },
    tripMeta: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#64748B' },

    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 32 },
});
