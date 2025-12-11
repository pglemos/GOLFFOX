import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../src/services/supabase';

interface BusLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
}

export default function PassengerMapScreen() {
    const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const theme = useTheme();

    // Mock da localização do ponto do passageiro
    const myStop = {
        latitude: -23.56,
        longitude: -46.65,
        name: 'Meu Ponto - Centro',
    };

    useEffect(() => {
        // Simular localização inicial do ônibus
        setBusLocation({
            latitude: -23.55,
            longitude: -46.64,
            timestamp: new Date().toISOString(),
        });
        setIsLoading(false);

        // Inscrever para atualizações em tempo real
        const channel = supabase
            .channel('bus-location')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'vehicle_locations',
                    // filter: `route_id=eq.${selectedRouteId}`,
                },
                (payload) => {
                    if (payload.new) {
                        const loc = payload.new as any;
                        setBusLocation({
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            timestamp: loc.timestamp,
                        });
                    }
                }
            )
            .subscribe();

        // Simular atualizações a cada 5 segundos para demo
        const interval = setInterval(() => {
            setBusLocation((prev) => {
                if (!prev) return null;
                // Mover ônibus ligeiramente em direção ao ponto do passageiro
                return {
                    latitude: prev.latitude + (myStop.latitude - prev.latitude) * 0.1,
                    longitude: prev.longitude + (myStop.longitude - prev.longitude) * 0.1,
                    timestamp: new Date().toISOString(),
                };
            });
        }, 5000);

        return () => {
            channel.unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const initialRegion = {
        latitude: myStop.latitude,
        longitude: myStop.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text>Carregando mapa...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton
            >
                {/* Marcador do ponto do passageiro */}
                <Marker
                    coordinate={{ latitude: myStop.latitude, longitude: myStop.longitude }}
                    title={myStop.name}
                    description="Seu ponto de embarque"
                    pinColor="#10B981"
                />

                {/* Marcador do ônibus */}
                {busLocation && (
                    <Marker
                        coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}
                        title="🚌 Ônibus"
                        description="Posição em tempo real"
                        pinColor={theme.colors.primary}
                    />
                )}
            </MapView>

            {/* Card de status */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    map: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    statusCard: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
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
});
