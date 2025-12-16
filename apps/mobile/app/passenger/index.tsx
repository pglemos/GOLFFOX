import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, Chip, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface NextTrip {
    id: string;
    linha: string;
    pontoEmbarque: string;
    pontoDesembarque: string;
    horarioEmbarque: string;
    horarioChegada: string;
    veiculo: string;
    motorista: string;
    status: 'aguardando' | 'a_caminho' | 'no_ponto' | 'em_viagem';
}

const mockTrip: NextTrip = {
    id: '1',
    linha: 'Linha 01 - Centro',
    pontoEmbarque: 'Terminal Central',
    pontoDesembarque: 'Empresa ABC',
    horarioEmbarque: '07:30',
    horarioChegada: '08:15',
    veiculo: 'ABC-1234',
    motorista: 'João Silva',
    status: 'a_caminho',
};

const getStatusInfo = (status: NextTrip['status']) => {
    switch (status) {
        case 'no_ponto': return { label: 'No ponto', color: '#10B981', icon: 'location' };
        case 'a_caminho': return { label: 'A caminho', color: '#F59E0B', icon: 'navigate' };
        case 'em_viagem': return { label: 'Em viagem', color: '#3B82F6', icon: 'bus' };
        default: return { label: 'Aguardando', color: '#94A3B8', icon: 'time' };
    }
};

export default function PassengerDashboard() {
    const { profile } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [trip, setTrip] = useState<NextTrip | null>(mockTrip);
    const [eta, setEta] = useState('~8 min');

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1000));
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const statusInfo = trip ? getStatusInfo(trip.status) : null;

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        >
            {/* Header com saudação */}
            <LinearGradient colors={['#F97316', '#FB923C']} style={styles.header}>
                <View style={styles.headerContent}>
                    <Avatar.Text
                        size={48}
                        label={profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                        style={styles.avatar}
                    />
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{profile?.name || 'Passageiro'}</Text>
                    </View>
                </View>
                {trip && (
                    <View style={styles.etaContainer}>
                        <Text style={styles.etaLabel}>Chegada em</Text>
                        <Text style={styles.etaValue}>{eta}</Text>
                    </View>
                )}
            </LinearGradient>

            {/* Card Próxima Viagem */}
            {trip ? (
                <Surface style={styles.tripCard} elevation={3}>
                    <View style={styles.tripHeader}>
                        <Text style={styles.tripTitle}>📍 Próxima Viagem</Text>
                        <Chip
                            compact
                            style={{ backgroundColor: `${statusInfo?.color}20` }}
                            textStyle={{ color: statusInfo?.color, fontSize: 11, fontWeight: '600' }}
                        >
                            {statusInfo?.label}
                        </Chip>
                    </View>

                    <View style={styles.tripRoute}>
                        <View style={styles.tripPoint}>
                            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                            <View>
                                <Text style={styles.tripTime}>{trip.horarioEmbarque}</Text>
                                <Text style={styles.tripLocation}>{trip.pontoEmbarque}</Text>
                            </View>
                        </View>
                        <View style={styles.tripLine} />
                        <View style={styles.tripPoint}>
                            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                            <View>
                                <Text style={styles.tripTime}>{trip.horarioChegada}</Text>
                                <Text style={styles.tripLocation}>{trip.pontoDesembarque}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.tripMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="bus-outline" size={16} color="#64748B" />
                            <Text style={styles.metaText}>{trip.veiculo}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="person-outline" size={16} color="#64748B" />
                            <Text style={styles.metaText}>{trip.motorista}</Text>
                        </View>
                    </View>

                    <Button
                        mode="contained"
                        onPress={() => router.push('/passenger/map')}
                        style={styles.trackBtn}
                        buttonColor="#F97316"
                        icon="map-marker"
                    >
                        Localizar Transporte
                    </Button>
                </Surface>
            ) : (
                <Surface style={styles.noTripCard} elevation={1}>
                    <Ionicons name="bus" size={48} color="#CBD5E1" />
                    <Text style={styles.noTripText}>Nenhuma viagem programada</Text>
                </Surface>
            )}

            {/* Ações Rápidas */}
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.actionsGrid}>
                <Pressable style={styles.actionCard} onPress={() => router.push('/passenger/checkin')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="qr-code" size={28} color="#F97316" />
                    </View>
                    <Text style={styles.actionLabel}>Check-in</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={() => router.push('/passenger/map')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="location" size={28} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>Localizar</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={() => router.push('/passenger/feedback')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="star" size={28} color="#F59E0B" />
                    </View>
                    <Text style={styles.actionLabel}>Avaliar</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={() => router.push('/passenger/details')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}>
                        <Ionicons name="list" size={28} color="#64748B" />
                    </View>
                    <Text style={styles.actionLabel}>Itinerário</Text>
                </Pressable>
            </View>

            {/* Card informativo */}
            <Surface style={styles.infoCard} elevation={1}>
                <View style={styles.infoRow}>
                    <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Lembrete de Check-in</Text>
                        <Text style={styles.infoDesc}>
                            Não esqueça de registrar seu embarque para confirmar a viagem
                        </Text>
                    </View>
                </View>
            </Surface>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: { padding: 20, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: { backgroundColor: 'rgba(255,255,255,0.3)' },
    headerText: {},
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    userName: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    etaContainer: { alignItems: 'flex-end' },
    etaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    etaValue: { fontSize: 22, fontWeight: '700', color: '#FFF' },

    tripCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginHorizontal: 16, marginTop: -16, marginBottom: 20 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    tripTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    tripRoute: { marginBottom: 16 },
    tripPoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    tripLine: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginLeft: 5.5, marginVertical: 4 },
    tripTime: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    tripLocation: { fontSize: 13, color: '#64748B' },
    tripMeta: { flexDirection: 'row', gap: 20, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: '#64748B' },
    trackBtn: { borderRadius: 10 },

    noTripCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 40, marginHorizontal: 16, marginTop: -16, marginBottom: 20, alignItems: 'center', gap: 12 },
    noTripText: { color: '#94A3B8', fontSize: 14 },

    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginHorizontal: 16, marginBottom: 12 },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 20 },
    actionCard: { width: '23%', backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 1 },
    actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', textAlign: 'center' },

    infoCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginHorizontal: 16 },
    infoRow: { flexDirection: 'row', gap: 14 },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
    infoDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
});
