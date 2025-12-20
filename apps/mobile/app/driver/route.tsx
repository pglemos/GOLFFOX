import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, SafeAreaView } from 'react-native';
import { Text, FAB, useTheme, Portal, Dialog, Button, Surface, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteStop {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    type: 'pickup' | 'dropoff';
    completed: boolean;
    scheduledTime: string;
    estimatedMinutes: number;
    passengersCount: number;
}

const mockStops: RouteStop[] = [
    {
        id: '1',
        name: 'Terminal Central',
        address: 'Av. Principal, 100 - Centro',
        latitude: -23.55,
        longitude: -46.64,
        type: 'pickup',
        completed: true,
        scheduledTime: '06:30',
        estimatedMinutes: 0,
        passengersCount: 8,
    },
    {
        id: '2',
        name: 'Ponto Shopping',
        address: 'Rua Comercial, 500',
        latitude: -23.56,
        longitude: -46.65,
        type: 'pickup',
        completed: false,
        scheduledTime: '06:45',
        estimatedMinutes: 5,
        passengersCount: 4,
    },
    {
        id: '3',
        name: 'Empresa ABC',
        address: 'Distrito Industrial, 1000',
        latitude: -23.57,
        longitude: -46.66,
        type: 'dropoff',
        completed: false,
        scheduledTime: '07:15',
        estimatedMinutes: 25,
        passengersCount: 0,
    },
];

export default function RouteScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [stops, setStops] = useState<RouteStop[]>(mockStops);
    const [fabOpen, setFabOpen] = useState(false);
    const [sosDialogVisible, setSosDialogVisible] = useState(false);
    const [boardingDialogVisible, setBoardingDialogVisible] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<{ name: string; id: string } | null>(null);
    const [sendingSos, setSendingSos] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const mockPassenger = { name: 'João Silva', id: '123456' };

    useEffect(() => {
        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        };
        startTracking();
    }, []);

    // Memoizar cálculos pesados
    const completedStops = useMemo(
        () => stops.filter(s => s.completed).length,
        [stops]
    );
    const embarkedPassengers = useMemo(
        () => stops.filter(s => s.completed).reduce((acc, s) => acc + s.passengersCount, 0),
        [stops]
    );
    const nextStop = useMemo(
        () => stops.find(s => !s.completed),
        [stops]
    );

    const handleScan = useCallback(() => {
        setSelectedPassenger(mockPassenger);
        setBoardingDialogVisible(true);
    }, []);

    const handleConfirmBoarding = useCallback(() => {
        setBoardingDialogVisible(false);
        setSelectedPassenger(null);
    }, []);

    const handleFinishRoute = useCallback(async () => {
        router.replace('/motorista');
    }, [router]);

    const handleSOS = useCallback(async () => {
        setSendingSos(true);
        try {
            console.log('SOS enviado:', { motorista: profile?.name, location: location?.coords });
            setSosDialogVisible(false);
        } finally {
            setSendingSos(false);
        }
    };

    const toggleStopCompleted = (id: string) => {
        setStops(prev => prev.map(stop =>
            stop.id === id ? { ...stop, completed: !stop.completed } : stop
        ));
    };

    const getStopColor = (stop: RouteStop) => {
        if (stop.completed) return '#10B981';
        if (stop === nextStop) return '#F59E0B';
        return '#CBD5E1';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{completedStops + 1}</Text>
                    </View>
                    <View style={styles.headerTime}>
                        <Text style={styles.headerTimeText}>{nextStop?.scheduledTime || '--:--'}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {nextStop?.name || 'Finalizado'}
                        </Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {nextStop?.address || 'Rota concluída'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Mapa Simples */}
            <View style={styles.mapArea}>
                <View style={styles.mapBox}>
                    {/* Linha da rota */}
                    <View style={styles.routePath} />

                    {/* Marcadores */}
                    <View style={[styles.marker, styles.marker1, { backgroundColor: getStopColor(stops[0]) }]}>
                        {stops[0].completed ? <Text style={styles.markerCheck}>✓</Text> : <Text style={styles.markerNum}>1</Text>}
                    </View>
                    <View style={[styles.marker, styles.marker2, { backgroundColor: getStopColor(stops[1]) }]}>
                        {stops[1].completed ? <Text style={styles.markerCheck}>✓</Text> : <Text style={styles.markerNum}>2</Text>}
                    </View>
                    <View style={[styles.marker, styles.marker3, { backgroundColor: getStopColor(stops[2]) }]}>
                        {stops[2].completed ? <Text style={styles.markerCheck}>✓</Text> : <Text style={styles.markerNum}>3</Text>}
                    </View>

                    {/* Posição atual */}
                    <View style={styles.currentPos}>
                        <View style={styles.currentPosInner} />
                    </View>
                </View>

                {/* Botões do mapa */}
                <Pressable style={styles.centerBtn}>
                    <Text style={styles.centerBtnText}>CENTRALIZAR</Text>
                </Pressable>
                <Pressable style={styles.gpsBtn}>
                    <Text style={styles.gpsBtnIcon}>📍</Text>
                </Pressable>
            </View>

            {/* Barra de Ações */}
            <View style={styles.actionBar}>
                <View style={styles.passengerCount}>
                    <Text style={styles.passengerNumber}>{embarkedPassengers}</Text>
                    <Text style={styles.passengerLabel}>Passageiros{'\n'}Embarcados</Text>
                </View>
                <Pressable style={styles.boardBtn} onPress={handleScan}>
                    <Text style={styles.boardBtnText}>🚶 Embarcar</Text>
                </Pressable>
            </View>

            {/* Lista de Paradas */}
            <View style={styles.stopsContainer}>
                <View style={styles.stopsHeader}>
                    <Text style={styles.stopsTitle}>Pontos de Paradas</Text>
                    <Pressable onPress={handleFinishRoute}>
                        <Text style={styles.finishBtn}>✓ Finalizar</Text>
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {stops.map((stop, idx) => (
                        <Pressable
                            key={stop.id}
                            style={styles.stopRow}
                            onPress={() => toggleStopCompleted(stop.id)}
                        >
                            {/* Timeline */}
                            <View style={styles.timeline}>
                                <View style={[styles.dot, { backgroundColor: getStopColor(stop) }]}>
                                    {stop.completed && <Text style={styles.dotCheck}>✓</Text>}
                                </View>
                                {idx < stops.length - 1 && (
                                    <View style={[styles.line, stop.completed && styles.lineActive]} />
                                )}
                            </View>

                            {/* Card */}
                            <View style={styles.stopCard}>
                                <View style={styles.stopCardHeader}>
                                    <Text style={[styles.stopName, stop.completed && styles.stopNameDone]}>
                                        {stop.name}
                                    </Text>
                                    <View style={[
                                        styles.typeTag,
                                        { backgroundColor: stop.type === 'pickup' ? '#DBEAFE' : '#FEE2E2' }
                                    ]}>
                                        <Text style={[
                                            styles.typeTagText,
                                            { color: stop.type === 'pickup' ? '#1D4ED8' : '#DC2626' }
                                        ]}>
                                            {stop.type === 'pickup' ? 'Embarque' : 'Desembarque'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.stopAddr}>{stop.address}</Text>
                                <View style={styles.stopMeta}>
                                    <Text style={styles.metaItem}>🕐 {stop.scheduledTime}</Text>
                                    {!stop.completed && stop.estimatedMinutes > 0 && (
                                        <Text style={styles.metaEta}>⏱ ~{stop.estimatedMinutes}min</Text>
                                    )}
                                    {stop.type === 'pickup' && (
                                        <Text style={styles.metaPass}>👥 {stop.passengersCount}</Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    ))}
                    <View style={{ height: 120 }} />
                </ScrollView>
            </View>

            {/* FAB */}
            <Portal>
                <FAB.Group
                    open={fabOpen}
                    visible
                    icon={fabOpen ? 'close' : 'menu'}
                    actions={[
                        { icon: 'alert', label: 'SOS', onPress: () => setSosDialogVisible(true), style: { backgroundColor: '#EF4444' } },
                        { icon: 'qrcode-scan', label: 'Escanear', onPress: handleScan, style: { backgroundColor: '#3B82F6' } },
                        { icon: 'flag-checkered', label: 'Finalizar', onPress: handleFinishRoute, style: { backgroundColor: '#10B981' } },
                    ]}
                    onStateChange={({ open }) => setFabOpen(open)}
                    fabStyle={styles.fab}
                />

                {/* SOS Dialog */}
                <Dialog visible={sosDialogVisible} onDismiss={() => setSosDialogVisible(false)}>
                    <Dialog.Title>⚠️ Emergência SOS</Dialog.Title>
                    <Dialog.Content>
                        <Text>Enviar pedido de socorro? Sua localização será compartilhada.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSosDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleSOS} loading={sendingSos} textColor="#EF4444">ENVIAR SOS</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Boarding Dialog */}
                <Dialog visible={boardingDialogVisible} onDismiss={() => setBoardingDialogVisible(false)}>
                    <View style={styles.boardingBox}>
                        <Text style={styles.boardingLabel}>Novo Passageiro</Text>
                        <Text style={styles.boardingName}>{selectedPassenger?.name}</Text>
                        <View style={styles.boardingIdBox}>
                            <Text style={styles.boardingIdLabel}>ID</Text>
                            <Text style={styles.boardingId}>{selectedPassenger?.id}</Text>
                        </View>
                        <Button
                            mode="contained"
                            onPress={handleConfirmBoarding}
                            style={styles.confirmBtn}
                            buttonColor="#FFFFFF"
                            textColor="#10B981"
                        >
                            ✓ Confirmar
                        </Button>
                        <Button
                            onPress={() => setBoardingDialogVisible(false)}
                            textColor="#FFFFFF"
                        >
                            ✕ Ignorar
                        </Button>
                    </View>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    header: { paddingHorizontal: 16, paddingVertical: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    headerBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    headerTime: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    headerTimeText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    headerInfo: { flex: 1 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

    // Mapa
    mapArea: { height: 220, backgroundColor: '#E5E7EB', position: 'relative' },
    mapBox: { flex: 1, backgroundColor: '#F3F4F6', margin: 8, borderRadius: 12, position: 'relative', overflow: 'hidden' },
    routePath: { position: 'absolute', top: 40, left: 30, width: 180, height: 120, borderWidth: 3, borderColor: '#0D9488', borderRadius: 16 },
    marker: { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    marker1: { top: 35, left: 25 },
    marker2: { top: 90, left: 100 },
    marker3: { top: 140, left: 180 },
    markerCheck: { color: '#FFF', fontWeight: '700', fontSize: 12 },
    markerNum: { color: '#FFF', fontWeight: '700', fontSize: 12 },
    currentPos: { position: 'absolute', top: 60, left: 60, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.3)', alignItems: 'center', justifyContent: 'center' },
    currentPosInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF' },
    centerBtn: { position: 'absolute', right: 12, top: '40%', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, elevation: 2 },
    centerBtnText: { color: '#64748B', fontSize: 10, fontWeight: '600' },
    gpsBtn: { position: 'absolute', right: 12, bottom: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', elevation: 3 },
    gpsBtnIcon: { fontSize: 20 },

    // Action Bar
    actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    passengerCount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    passengerNumber: { fontSize: 32, fontWeight: '700', color: '#0F172A' },
    passengerLabel: { fontSize: 11, color: '#64748B', lineHeight: 14 },
    boardBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#10B981' },
    boardBtnText: { color: '#10B981', fontWeight: '600', fontSize: 14 },

    // Stops
    stopsContainer: { flex: 1, paddingTop: 12 },
    stopsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    stopsTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
    finishBtn: { color: '#10B981', fontWeight: '600', fontSize: 13 },
    stopRow: { flexDirection: 'row', paddingHorizontal: 16 },
    timeline: { width: 28, alignItems: 'center' },
    dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    dotCheck: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    line: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginVertical: 4 },
    lineActive: { backgroundColor: '#10B981' },
    stopCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginLeft: 8, marginBottom: 10, elevation: 1 },
    stopCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    stopName: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1, marginRight: 8 },
    stopNameDone: { color: '#10B981' },
    typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeTagText: { fontSize: 10, fontWeight: '600' },
    stopAddr: { fontSize: 12, color: '#64748B', marginBottom: 6 },
    stopMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    metaItem: { fontSize: 11, color: '#64748B' },
    metaEta: { fontSize: 11, color: '#F59E0B', fontWeight: '500' },
    metaPass: { fontSize: 11, color: '#3B82F6' },

    // FAB
    fab: { backgroundColor: '#0D9488' },

    // Boarding Dialog
    boardingBox: { backgroundColor: '#10B981', borderRadius: 16, padding: 24, margin: 16, alignItems: 'center' },
    boardingLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    boardingName: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 16 },
    boardingIdBox: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 16, width: '100%', alignItems: 'center', marginBottom: 16 },
    boardingIdLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    boardingId: { color: '#FFF', fontSize: 28, fontWeight: '700', letterSpacing: 3 },
    confirmBtn: { borderRadius: 10, width: '100%', marginBottom: 8 },
});
