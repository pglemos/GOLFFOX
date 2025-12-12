import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, FAB, useTheme, Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/auth/AuthProvider';

interface RouteStop {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type: 'pickup' | 'dropoff';
    completed: boolean;
}

// Mock de paradas - em produção viria do Supabase
const mockStops: RouteStop[] = [
    { id: '1', name: 'Ponto A - Shopping', latitude: -23.55, longitude: -46.64, type: 'pickup', completed: true },
    { id: '2', name: 'Ponto B - Centro', latitude: -23.56, longitude: -46.65, type: 'pickup', completed: false },
    { id: '3', name: 'Ponto C - Terminal', latitude: -23.57, longitude: -46.66, type: 'dropoff', completed: false },
];

export default function RouteScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [stops, setStops] = useState<RouteStop[]>(mockStops);
    const [routeStatus, setRouteStatus] = useState<'active' | 'paused' | 'completed'>('active');
    const [fabOpen, setFabOpen] = useState(false);
    const [sosDialogVisible, setSosDialogVisible] = useState(false);
    const [sendingSos, setSendingSos] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission denied');
                return;
            }

            // Obter localização inicial
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // Monitorar mudanças
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (newLocation) => {
                    setLocation(newLocation);

                    // Enviar localização para Supabase (realtime)
                    supabase.from('vehicle_locations').upsert({
                        driver_id: profile?.id,
                        // route_id: currentRoute?.id,
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        timestamp: new Date().toISOString(),
                    }).then(({ error }) => {
                        if (error) console.error('Error sending location:', error);
                    });
                }
            );
        };

        startTracking();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    const initialRegion = {
        latitude: location?.coords.latitude || -23.55,
        longitude: location?.coords.longitude || -46.64,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const completedStops = stops.filter(s => s.completed).length;

    const handleScan = () => {
        router.push('/driver/scan');
    };

    const handleFinishRoute = async () => {
        setRouteStatus('completed');
        // Registrar fim da rota
        await supabase.from('routes').update({
            status: 'completed',
            end_time: new Date().toISOString(),
        });
        // Voltar para dashboard
        router.replace('/driver');
    };

    const handleSOS = async () => {
        setSendingSos(true);
        try {
            const { error } = await supabase.from('alertsv2').insert({
                company_id: profile?.current_company_id, // Assumindo que profile tem current_company_id ou similar
                type: 'SOS',
                severity: 'critical',
                status: 'open',
                title: 'SOS MOTORISTA',
                message: `Pedido de socorro de ${profile?.name || 'Motorista'} na rota.`,
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
                metadata: { driver_id: profile?.id, phone: profile?.phone }
            });

            if (error) throw error;
            setSosDialogVisible(false);
            // Poderia mostrar um feedback visual de sucesso ou instrução
        } catch (err) {
            console.error('Erro ao enviar SOS', err);
        } finally {
            setSendingSos(false);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton
                followsUserLocation
                showsTraffic
            >
                {/* Marcadores das paradas */}
                {stops.map(stop => (
                    <Marker
                        key={stop.id}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        title={stop.name}
                        description={stop.completed ? '✅ Concluído' : '⏳ Pendente'}
                        pinColor={stop.completed ? '#10B981' : stop.type === 'pickup' ? '#3B82F6' : '#EF4444'}
                    />
                ))}

                {/* Polyline conectando os pontos */}
                <Polyline
                    coordinates={stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
                    strokeColor={theme.colors.primary}
                    strokeWidth={3}
                />
            </MapView>

            {/* Status bar */}
            <View style={styles.statusBar}>
                <View style={styles.statusItem}>
                    <Text variant="labelSmall" style={styles.statusLabel}>Status</Text>
                    <Text variant="titleSmall" style={styles.statusValue}>
                        {routeStatus === 'active' ? '🟢 Em Andamento' : '⏸️ Pausada'}
                    </Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                    <Text variant="labelSmall" style={styles.statusLabel}>Paradas</Text>
                    <Text variant="titleSmall" style={styles.statusValue}>
                        {completedStops}/{stops.length}
                    </Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                    <Text variant="labelSmall" style={styles.statusLabel}>Embarcados</Text>
                    <Text variant="titleSmall" style={styles.statusValue}>12</Text>
                </View>
            </View>

            {/* FAB com ações */}
            <Portal>
                <FAB.Group
                    open={fabOpen}
                    visible
                    icon={fabOpen ? 'close' : 'menu'}
                    actions={[
                        {
                            icon: 'alert-octagon',
                            label: 'SOS',
                            onPress: () => setSosDialogVisible(true),
                            color: '#EF4444',
                            style: { backgroundColor: '#EF4444' }, // Red background
                            containerStyle: { backgroundColor: '#FEE2E2' },
                            labelStyle: { color: '#EF4444', fontWeight: 'bold' }
                        },
                        {
                            icon: 'qrcode-scan',
                            label: 'Check-in/out',
                            onPress: handleScan,
                        },
                        {
                            icon: 'flag-checkered',
                            label: 'Finalizar Rota',
                            onPress: handleFinishRoute,
                        },
                    ]}
                    onStateChange={({ open }) => setFabOpen(open)}
                    fabStyle={styles.fab}
                />

                <Dialog visible={sosDialogVisible} onDismiss={() => setSosDialogVisible(false)}>
                    <Dialog.Title style={{ color: '#EF4444' }}>⚠️ EMERGÊNCIA SOS</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>
                            Você está prestes a enviar um pedido de socorro para a central.
                            Sua localização atual será compartilhada imediatamente.
                        </Paragraph>
                        <Paragraph style={{ fontWeight: 'bold', marginTop: 10 }}>Confirmar envio?</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSosDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleSOS} loading={sendingSos} textColor="#EF4444">ENVIAR SOS</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    statusBar: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
    },
    statusDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
    },
    statusLabel: {
        color: '#64748B',
        marginBottom: 2,
    },
    statusValue: {
        fontWeight: 'bold',
    },
    fab: {
        backgroundColor: '#1E3A8A',
    },
});
