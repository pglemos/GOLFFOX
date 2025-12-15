import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text, Surface, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteStop {
    id: string;
    name: string;
    time: string;
    isMyStop: boolean;
    isPassed: boolean;
}

const mockStops: RouteStop[] = [
    { id: '1', name: 'Terminal Central', time: '07:30', isMyStop: true, isPassed: false },
    { id: '2', name: 'Ponto Shopping', time: '07:42', isMyStop: false, isPassed: false },
    { id: '3', name: 'Av. Brasil', time: '07:50', isMyStop: false, isPassed: false },
    { id: '4', name: 'Empresa ABC', time: '08:15', isMyStop: false, isPassed: false },
];

export default function PassengerMapScreen() {
    const [busEta, setBusEta] = useState(8);
    const [distance, setDistance] = useState(1.2);
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            setBusEta(prev => Math.max(0, prev - 1));
            setDistance(prev => Math.max(0, prev - 0.15));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            {/* Mapa Placeholder */}
            <View style={styles.mapArea}>
                <View style={styles.mapBox}>
                    {/* Rota visual */}
                    <View style={styles.routePath} />

                    {/* Marcadores das paradas */}
                    {mockStops.map((stop, idx) => (
                        <View
                            key={stop.id}
                            style={[
                                styles.marker,
                                { top: 40 + idx * 40, left: 40 + idx * 50 },
                                stop.isMyStop && styles.markerHighlight,
                                stop.isPassed && styles.markerPassed,
                            ]}
                        >
                            <Text style={styles.markerNum}>{idx + 1}</Text>
                        </View>
                    ))}

                    {/* Posição do ônibus */}
                    <View style={styles.busMarker}>
                        <Ionicons name="bus" size={20} color="#FFF" />
                    </View>

                    {/* Posição do usuário */}
                    <View style={styles.userMarker}>
                        <View style={styles.userMarkerInner} />
                    </View>
                </View>

                {/* Controles do mapa */}
                <Pressable style={styles.centerBusBtn}>
                    <Ionicons name="bus" size={20} color="#0D9488" />
                </Pressable>
                <Pressable style={styles.centerUserBtn}>
                    <Ionicons name="locate" size={20} color="#3B82F6" />
                </Pressable>
            </View>

            {/* Card de Status */}
            <Surface style={styles.statusCard} elevation={3}>
                <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusValue}>A caminho</Text>
                        </View>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Distância</Text>
                        <Text style={styles.statusNumber}>{distance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Chegada</Text>
                        <Text style={styles.statusEta}>~{busEta} min</Text>
                    </View>
                </View>
            </Surface>

            {/* Menu arrastável */}
            <Surface style={styles.bottomSheet} elevation={4}>
                <View style={styles.handle} />

                {/* Tabs */}
                <View style={styles.tabs}>
                    <Chip mode="flat" selected style={styles.tab}>Itinerário</Chip>
                    <Chip mode="outlined" style={styles.tab} onPress={() => router.push('/passenger/checkin')}>Check-in</Chip>
                </View>

                {/* Lista de paradas */}
                <ScrollView style={styles.stopsList} showsVerticalScrollIndicator={false}>
                    {mockStops.map((stop, idx) => (
                        <View key={stop.id} style={styles.stopRow}>
                            <View style={styles.stopTimeline}>
                                <View style={[
                                    styles.stopDot,
                                    stop.isMyStop && styles.stopDotMyStop,
                                    stop.isPassed && styles.stopDotPassed,
                                ]}>
                                    {stop.isPassed && <Ionicons name="checkmark" size={10} color="#FFF" />}
                                </View>
                                {idx < mockStops.length - 1 && (
                                    <View style={[styles.stopLine, stop.isPassed && styles.stopLinePassed]} />
                                )}
                            </View>
                            <View style={[styles.stopInfo, stop.isMyStop && styles.stopInfoMyStop]}>
                                <View style={styles.stopHeader}>
                                    <Text style={[styles.stopName, stop.isMyStop && styles.stopNameMyStop]}>
                                        {stop.name}
                                    </Text>
                                    {stop.isMyStop && (
                                        <Chip compact style={styles.myStopChip}>
                                            <Text style={styles.myStopText}>Meu ponto</Text>
                                        </Chip>
                                    )}
                                </View>
                                <Text style={styles.stopTime}>🕐 {stop.time}</Text>
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 20 }} />
                </ScrollView>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    mapArea: { height: 280, backgroundColor: '#E5E7EB', position: 'relative' },
    mapBox: { flex: 1, backgroundColor: '#F3F4F6', margin: 8, borderRadius: 12, position: 'relative', overflow: 'hidden' },
    routePath: { position: 'absolute', top: 50, left: 50, width: 200, height: 120, borderWidth: 3, borderColor: '#0D9488', borderRadius: 16, borderStyle: 'solid' },

    marker: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#64748B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    markerHighlight: { backgroundColor: '#0D9488', width: 30, height: 30, borderRadius: 15 },
    markerPassed: { backgroundColor: '#10B981' },
    markerNum: { color: '#FFF', fontWeight: '700', fontSize: 11 },

    busMarker: { position: 'absolute', top: 80, left: 90, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF', elevation: 4 },

    userMarker: { position: 'absolute', top: 45, left: 45, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.3)', alignItems: 'center', justifyContent: 'center' },
    userMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF' },

    centerBusBtn: { position: 'absolute', right: 16, top: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },
    centerUserBtn: { position: 'absolute', right: 16, top: 68, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },

    statusCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: -20, borderRadius: 14, padding: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusItem: { flex: 1, alignItems: 'center' },
    statusDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
    statusLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    statusValue: { fontSize: 13, fontWeight: '600', color: '#10B981' },
    statusNumber: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    statusEta: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },

    bottomSheet: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 12, paddingTop: 8 },
    handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },

    tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    tab: { flex: 1 },

    stopsList: { flex: 1, paddingHorizontal: 16 },
    stopRow: { flexDirection: 'row', marginBottom: 4 },
    stopTimeline: { width: 24, alignItems: 'center' },
    stopDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    stopDotMyStop: { backgroundColor: '#0D9488', width: 20, height: 20, borderRadius: 10 },
    stopDotPassed: { backgroundColor: '#10B981' },
    stopLine: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginVertical: 4 },
    stopLinePassed: { backgroundColor: '#10B981' },

    stopInfo: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginLeft: 8, marginBottom: 8 },
    stopInfoMyStop: { backgroundColor: '#CCFBF1', borderWidth: 1, borderColor: '#0D9488' },
    stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    stopName: { fontSize: 14, fontWeight: '500', color: '#0F172A' },
    stopNameMyStop: { fontWeight: '600', color: '#0D9488' },
    myStopChip: { backgroundColor: '#0D9488', height: 20 },
    myStopText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
    stopTime: { fontSize: 12, color: '#64748B' },
});
