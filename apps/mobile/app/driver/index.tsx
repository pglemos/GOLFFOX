import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Card, Text, Avatar, Chip, useTheme, IconButton, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';

interface Trip {
    id: string;
    code: string;
    type: 'entrada' | 'saida';
    shift: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    destination: string;
    originCity: string;
    destinationCity: string;
    isNext: boolean;
}

// Mock data - em produção viria do Supabase
const mockTrips: Trip[] = [
    {
        id: '1',
        code: 'GF-ESF-013',
        type: 'entrada',
        shift: 'Turno Manhã',
        departureTime: '06:30',
        arrivalTime: '07:45',
        origin: 'Terminal Central',
        destination: 'Empresa ABC',
        originCity: 'Centro',
        destinationCity: 'Distrito Industrial',
        isNext: true,
    },
    {
        id: '2',
        code: 'GF-ST2-019',
        type: 'saida',
        shift: 'Turno Tarde',
        departureTime: '17:00',
        arrivalTime: '18:15',
        origin: 'Empresa ABC',
        destination: 'Terminal Central',
        originCity: 'Distrito Industrial',
        destinationCity: 'Centro',
        isNext: false,
    },
    {
        id: '3',
        code: 'GF-ET6-001',
        type: 'entrada',
        shift: 'Turno Extra',
        departureTime: '20:00',
        arrivalTime: '21:00',
        origin: 'Shopping',
        destination: 'Condomínio Park',
        originCity: 'Centro',
        destinationCity: 'Zona Sul',
        isNext: false,
    },
];

export default function DriverDashboard() {
    const { profile, logout } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const handleStartTrip = (tripId: string) => {
        router.push('/driver/checklist');
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const renderTripCard = (trip: Trip) => (
        <Pressable
            key={trip.id}
            onPress={() => handleStartTrip(trip.id)}
            style={({ pressed }) => [
                styles.tripCardWrapper,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
        >
            {trip.isNext ? (
                <LinearGradient
                    colors={['#F97316', '#FB923C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tripCardNext}
                >
                    <View style={styles.tripHeader}>
                        <Text style={styles.tripShiftWhite}>
                            {trip.shift} | {trip.type === 'entrada' ? 'Entrada' : 'Saída'} | {trip.code}
                        </Text>
                        <Chip
                            mode="flat"
                            compact
                            style={styles.nextChip}
                            textStyle={styles.nextChipText}
                        >
                            Próxima
                        </Chip>
                    </View>

                    <View style={styles.tripContent}>
                        <View style={styles.tripTimeBlock}>
                            <Text style={styles.tripTimeWhite}>{trip.departureTime}</Text>
                            <Text style={styles.tripLocationWhite}>{trip.origin}</Text>
                            <Text style={styles.tripCityWhite}>{trip.originCity}</Text>
                        </View>

                        <View style={styles.tripArrowContainer}>
                            <View style={styles.tripArrowCircle}>
                                <Text style={styles.tripArrowText}>›</Text>
                            </View>
                        </View>

                        <View style={[styles.tripTimeBlock, { alignItems: 'flex-end' }]}>
                            <Text style={styles.tripTimeWhite}>{trip.arrivalTime}</Text>
                            <Text style={styles.tripLocationWhite}>{trip.destination}</Text>
                            <Text style={styles.tripCityWhite}>{trip.destinationCity}</Text>
                        </View>
                    </View>
                </LinearGradient>
            ) : (
                <Card style={styles.tripCard}>
                    <Card.Content>
                        <View style={styles.tripHeader}>
                            <Text style={styles.tripShift}>
                                {trip.shift} | {trip.type === 'entrada' ? 'Entrada' : 'Saída'} | {trip.code}
                            </Text>
                        </View>

                        <View style={styles.tripContent}>
                            <View style={styles.tripTimeBlock}>
                                <Text style={styles.tripTime}>{trip.departureTime}</Text>
                                <Text style={styles.tripLocation}>{trip.origin}</Text>
                                <Text style={styles.tripCity}>{trip.originCity}</Text>
                            </View>

                            <View style={styles.tripArrowContainer}>
                                <View style={styles.tripArrowCircleLight}>
                                    <Text style={styles.tripArrowTextLight}>›</Text>
                                </View>
                            </View>

                            <View style={[styles.tripTimeBlock, { alignItems: 'flex-end' }]}>
                                <Text style={styles.tripTime}>{trip.arrivalTime}</Text>
                                <Text style={styles.tripLocation}>{trip.destination}</Text>
                                <Text style={styles.tripCity}>{trip.destinationCity}</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            )}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Avatar.Icon
                        size={48}
                        icon="bus"
                        style={styles.avatar}
                        color="#F97316"
                    />
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.driverName}>{profile?.name || 'Motorista'}</Text>
                    </View>
                </View>
                <IconButton
                    icon="logout"
                    iconColor="#64748B"
                    size={24}
                    onPress={handleLogout}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <Pressable
                    onPress={() => setActiveTab('pending')}
                    style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                        Suas Viagens
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('completed')}
                    style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                        Realizadas
                    </Text>
                </Pressable>
            </View>

            {/* Date indicator */}
            <Text style={styles.dateLabel}>Hoje</Text>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Pressable style={styles.quickActionBtn} onPress={() => router.push('/driver/chat')}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Text style={styles.quickActionEmoji}>💬</Text>
                    </View>
                    <Text style={styles.quickActionLabel}>Central</Text>
                </Pressable>
                <Pressable style={styles.quickActionBtn} onPress={() => router.push('/driver/history')}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={styles.quickActionEmoji}>📊</Text>
                    </View>
                    <Text style={styles.quickActionLabel}>Histórico</Text>
                </Pressable>
                <Pressable style={styles.quickActionBtn} onPress={() => router.push('/driver/scan')}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#FFF7ED' }]}>
                        <Text style={styles.quickActionEmoji}>📱</Text>
                    </View>
                    <Text style={styles.quickActionLabel}>Check-in</Text>
                </Pressable>
            </View>

            {/* Trips List */}
            <ScrollView style={styles.tripsList} showsVerticalScrollIndicator={false}>
                {mockTrips.map(renderTripCard)}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        backgroundColor: '#FFF7ED',
    },
    headerText: {
        gap: 2,
    },
    greeting: {
        fontSize: 14,
        color: '#64748B',
    },
    driverName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 24,
        backgroundColor: '#FFFFFF',
    },
    tab: {
        paddingBottom: 12,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#F97316',
    },
    tabText: {
        fontSize: 16,
        color: '#94A3B8',
    },
    tabTextActive: {
        color: '#0F172A',
        fontWeight: '600',
    },
    dateLabel: {
        fontSize: 14,
        color: '#F97316',
        textAlign: 'center',
        paddingVertical: 16,
        fontWeight: '500',
    },
    tripsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tripCardWrapper: {
        marginBottom: 12,
    },
    tripCardNext: {
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    tripCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tripShift: {
        fontSize: 12,
        color: '#64748B',
    },
    tripShiftWhite: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    nextChip: {
        backgroundColor: '#10B981',
        height: 24,
    },
    nextChipText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    tripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tripTimeBlock: {
        flex: 1,
    },
    tripTime: {
        fontSize: 28,
        fontWeight: '300',
        color: '#F97316',
        marginBottom: 4,
    },
    tripTimeWhite: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    tripLocation: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0F172A',
        marginBottom: 2,
    },
    tripLocationWhite: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    tripCity: {
        fontSize: 12,
        color: '#94A3B8',
    },
    tripCityWhite: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    tripArrowContainer: {
        paddingHorizontal: 16,
    },
    tripArrowCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tripArrowCircleLight: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tripArrowText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tripArrowTextLight: {
        fontSize: 24,
        color: '#F97316',
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    quickActionBtn: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 1,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    quickActionEmoji: {
        fontSize: 22,
    },
    quickActionLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
});
