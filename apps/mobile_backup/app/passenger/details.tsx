import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Divider, List, useTheme } from 'react-native-paper';

interface RouteStop {
    id: string;
    name: string;
    address: string;
    time: string;
    isMyStop: boolean;
    isPassed: boolean;
}

const mockStops: RouteStop[] = [
    { id: '1', name: 'Ponto A - Garagem', address: 'Rua das Flores, 100', time: '07:00', isMyStop: false, isPassed: true },
    { id: '2', name: 'Ponto B - Shopping', address: 'Av. Paulista, 500', time: '07:15', isMyStop: false, isPassed: true },
    { id: '3', name: 'Ponto C - Centro', address: 'Praça da Sé, 1', time: '07:30', isMyStop: true, isPassed: false },
    { id: '4', name: 'Ponto D - Terminal', address: 'Terminal Rodoviário', time: '07:45', isMyStop: false, isPassed: false },
    { id: '5', name: 'Destino - Empresa', address: 'Av. Industrial, 1000', time: '08:00', isMyStop: false, isPassed: false },
];

export default function RouteDetailsScreen() {
    const theme = useTheme();

    const routeInfo = {
        name: 'Rota Centro-Shopping',
        vehicle: 'Ônibus Mercedes-Benz 1721',
        plate: 'ABC-1234',
        driver: 'João Silva',
        totalStops: mockStops.length,
        duration: '~1 hora',
    };

    return (
        <ScrollView style={styles.container}>
            {/* Informações da Rota */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge">{routeInfo.name}</Text>
                    <Divider style={styles.divider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text variant="labelSmall" style={styles.label}>Veículo</Text>
                            <Text variant="bodyMedium">{routeInfo.vehicle}</Text>
                            <Text variant="bodySmall" style={styles.plateText}>🚐 {routeInfo.plate}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text variant="labelSmall" style={styles.label}>Motorista</Text>
                            <Text variant="bodyMedium">{routeInfo.driver}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text variant="titleMedium">{routeInfo.totalStops}</Text>
                            <Text variant="labelSmall" style={styles.label}>Paradas</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text variant="titleMedium">{routeInfo.duration}</Text>
                            <Text variant="labelSmall" style={styles.label}>Duração</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Lista de Paradas */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>📍 Paradas da Rota</Text>

                    {mockStops.map((stop, index) => (
                        <View key={stop.id}>
                            <List.Item
                                title={stop.name}
                                description={`${stop.address}\n⏰ ${stop.time}`}
                                titleStyle={[
                                    styles.stopTitle,
                                    stop.isPassed && styles.passedText,
                                    stop.isMyStop && styles.myStopTitle,
                                ]}
                                descriptionStyle={stop.isPassed && styles.passedText}
                                descriptionNumberOfLines={2}
                                left={() => (
                                    <View style={[
                                        styles.stopIndicator,
                                        stop.isPassed && styles.passedIndicator,
                                        stop.isMyStop && styles.myStopIndicator,
                                    ]}>
                                        <Text style={styles.stopNumber}>
                                            {stop.isPassed ? '✓' : index + 1}
                                        </Text>
                                    </View>
                                )}
                                right={() => stop.isMyStop && (
                                    <View style={styles.myStopBadge}>
                                        <Text style={styles.myStopBadgeText}>Seu Ponto</Text>
                                    </View>
                                )}
                                style={[
                                    styles.stopItem,
                                    stop.isMyStop && styles.myStopItem,
                                ]}
                            />
                            {index < mockStops.length - 1 && (
                                <View style={styles.connector} />
                            )}
                        </View>
                    ))}
                </Card.Content>
            </Card>
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
    divider: {
        marginVertical: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    infoItem: {
        flex: 1,
    },
    label: {
        color: '#94A3B8',
        marginBottom: 4,
    },
    plateText: {
        color: '#64748B',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 8,
    },
    stat: {
        alignItems: 'center',
    },
    sectionTitle: {
        marginBottom: 16,
    },
    stopItem: {
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    myStopItem: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        marginHorizontal: -8,
        paddingHorizontal: 8,
    },
    stopTitle: {
        fontWeight: '500',
    },
    passedText: {
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    myStopTitle: {
        color: '#1D4ED8',
        fontWeight: 'bold',
    },
    stopIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passedIndicator: {
        backgroundColor: '#D1FAE5',
    },
    myStopIndicator: {
        backgroundColor: '#3B82F6',
    },
    stopNumber: {
        fontWeight: 'bold',
        color: '#64748B',
    },
    connector: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginLeft: 31,
    },
    myStopBadge: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'center',
    },
    myStopBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
