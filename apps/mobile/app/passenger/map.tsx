import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';

interface BusLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
}

export default function PassengerMapScreen() {
    const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const theme = useTheme();

    const myStop = {
        latitude: -23.56,
        longitude: -46.65,
        name: 'Meu Ponto - Centro',
    };

    useEffect(() => {
        setBusLocation({
            latitude: -23.55,
            longitude: -46.64,
            timestamp: new Date().toISOString(),
        });
        setIsLoading(false);

        const interval = setInterval(() => {
            setBusLocation((prev) => {
                if (!prev) return null;
                return {
                    latitude: prev.latitude + (myStop.latitude - prev.latitude) * 0.1,
                    longitude: prev.longitude + (myStop.longitude - prev.longitude) * 0.1,
                    timestamp: new Date().toISOString(),
                };
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text>Carregando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapPlaceholder}>
                <Text variant="headlineMedium">🗺️</Text>
                <Text variant="titleMedium" style={styles.mapText}>Mapa de Rastreamento</Text>
                <Text variant="bodySmall" style={styles.mapNote}>
                    O mapa estará disponível na versão de produção.
                </Text>
                <Text variant="bodySmall" style={styles.mapNote}>
                    (react-native-maps requer EAS Build)
                </Text>
            </View>

            <Card style={styles.statusCard}>
                <Card.Content>
                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <Text variant="labelSmall" style={styles.statusLabel}>Status</Text>
                            <Text variant="titleSmall" style={styles.statusActive}>🟢 A caminho</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Text variant="labelSmall" style={styles.statusLabel}>Distância</Text>
                            <Text variant="titleSmall">1.2 km</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <Text variant="labelSmall" style={styles.statusLabel}>Chegada</Text>
                            <Text variant="titleSmall" style={styles.etaText}>~5 min</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.infoCard}>
                <Card.Content>
                    <Text variant="titleMedium">📍 {myStop.name}</Text>
                    <Text variant="bodySmall" style={styles.coordsText}>
                        Lat: {busLocation?.latitude.toFixed(4)} | Lon: {busLocation?.longitude.toFixed(4)}
                    </Text>
                    <Text variant="bodySmall" style={styles.timestampText}>
                        Atualização: {busLocation?.timestamp ? new Date(busLocation.timestamp).toLocaleTimeString('pt-BR') : '--'}
                    </Text>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E2E8F0',
        margin: 16,
        borderRadius: 16,
    },
    mapText: {
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    mapNote: {
        color: '#94A3B8',
        textAlign: 'center',
    },
    statusCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statusItem: {
        alignItems: 'center',
        flex: 1,
    },
    statusDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E2E8F0',
    },
    statusLabel: {
        color: '#64748B',
        marginBottom: 4,
    },
    statusActive: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    etaText: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    infoCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    coordsText: {
        color: '#64748B',
        marginTop: 8,
    },
    timestampText: {
        color: '#94A3B8',
        marginTop: 4,
    },
});
