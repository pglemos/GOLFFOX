import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar, Divider, useTheme, Chip, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { supabase } from '../../src/services/supabase';

export default function PassengerDashboard() {
    const { profile, logout } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('remote_work');
    const [submittingCancel, setSubmittingCancel] = useState(false);
    const [cancelledToday, setCancelledToday] = useState(false);

    const handleTrackBus = () => {
        router.push('/passenger/map');
    };

    const handleRouteDetails = () => {
        router.push('/passenger/details');
    };

    const handleFeedback = () => {
        router.push('/passenger/feedback');
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleSubmitCancel = async () => {
        setSubmittingCancel(true);
        try {
            // Registrar cancelamento no Supabase
            // Utilizando alertsv2 como log operacional por enquanto
            await supabase.from('alertsv2').insert({
                company_id: profile?.current_company_id,
                type: 'passenger_cancellation',
                severity: 'info',
                status: 'resolved',
                title: 'Passageiro não utilizará transporte',
                message: `Passageiro ${profile?.name} informou que não utilizará o transporte hoje. Motivo: ${cancelReason}`,
                metadata: {
                    passenger_id: profile?.id,
                    reason: cancelReason,
                    date: new Date().toISOString().split('T')[0]
                }
            });

            setCancelledToday(true);
            setCancelDialogVisible(false);
        } catch (error) {
            console.error('Erro ao cancelar', error);
        } finally {
            setSubmittingCancel(false);
        }
    };

    // Mock data - em produção viria do Supabase
    const routeInfo = {
        name: 'Rota Centro-Shopping',
        busStatus: cancelledToday ? 'Cancelado por você' : 'Em andamento',
        nextStop: 'Ponto B - Centro',
        eta: cancelledToday ? '--' : '5 min',
        busPlate: 'ABC-1234',
        driverName: 'João Silva',
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header com perfil */}
            <Card style={styles.profileCard}>
                <Card.Content style={styles.profileContent}>
                    <Avatar.Icon size={64} icon="account" style={{ backgroundColor: theme.colors.secondary }} />
                    <View style={styles.profileInfo}>
                        <Text variant="titleLarge">{profile?.name || 'Passageiro'}</Text>
                        <Text variant="bodyMedium" style={styles.email}>{profile?.email}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Status da Rota */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.routeHeader}>
                        <Text variant="titleMedium">🚌 {routeInfo.name}</Text>
                        <Chip
                            mode="flat"
                            compact
                            style={{ backgroundColor: cancelledToday ? '#FEE2E2' : '#D1FAE5' }}
                            textStyle={{ color: cancelledToday ? '#EF4444' : '#059669', fontSize: 12 }}
                        >
                            {routeInfo.busStatus}
                        </Chip>
                    </View>
                    <Divider style={styles.divider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text variant="labelSmall" style={styles.infoLabel}>Próxima Parada</Text>
                            <Text variant="bodyMedium">{routeInfo.nextStop}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text variant="labelSmall" style={styles.infoLabel}>Chegada Estimada</Text>
                            <Text variant="titleMedium" style={styles.etaText}>
                                {cancelledToday ? '🚫' : '⏱️'} {routeInfo.eta}
                            </Text>
                        </View>
                    </View>

                    {!cancelledToday && (
                        <View style={styles.driverInfo}>
                            <Avatar.Icon size={32} icon="steering" style={{ backgroundColor: theme.colors.primary }} />
                            <View>
                                <Text variant="bodySmall" style={styles.driverLabel}>Motorista</Text>
                                <Text variant="bodyMedium">{routeInfo.driverName}</Text>
                            </View>
                            <Text variant="bodySmall" style={styles.plateText}>🚐 {routeInfo.busPlate}</Text>
                        </View>
                    )}
                </Card.Content>
                <Card.Actions>
                    <Button
                        mode="contained"
                        onPress={handleTrackBus}
                        icon="map-marker"
                        disabled={cancelledToday}
                    >
                        Acompanhar no Mapa
                    </Button>
                </Card.Actions>
            </Card>

            {/* Ações Rápidas */}
            <View style={styles.actionsContainer}>
                <Card style={styles.actionCard} onPress={handleRouteDetails}>
                    <Card.Content style={styles.actionContent}>
                        <Avatar.Icon size={40} icon="format-list-bulleted" style={{ backgroundColor: '#3B82F6' }} />
                        <Text variant="bodySmall" style={styles.actionTitle}>Ver Rota</Text>
                    </Card.Content>
                </Card>

                <Card
                    style={[styles.actionCard, cancelledToday && { opacity: 0.5 }]}
                    onPress={() => !cancelledToday && setCancelDialogVisible(true)}
                >
                    <Card.Content style={styles.actionContent}>
                        <Avatar.Icon
                            size={40}
                            icon={cancelledToday ? "check" : "close-circle"}
                            style={{ backgroundColor: cancelledToday ? '#94A3B8' : '#EF4444' }}
                        />
                        <Text variant="bodySmall" style={styles.actionTitle}>
                            {cancelledToday ? 'Não Utilizarei' : 'Não vou hoje'}
                        </Text>
                    </Card.Content>
                </Card>

                <Card style={styles.actionCard} onPress={handleFeedback}>
                    <Card.Content style={styles.actionContent}>
                        <Avatar.Icon size={40} icon="star" style={{ backgroundColor: '#F59E0B' }} />
                        <Text variant="bodySmall" style={styles.actionTitle}>Avaliar</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Check-in Manual */}
            {!cancelledToday && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>📍 Check-in</Text>
                        <Text variant="bodyMedium" style={styles.checkinText}>
                            Confirme seu embarque quando entrar no ônibus
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="outlined" icon="qrcode-scan">
                            Escanear QR
                        </Button>
                        <Button mode="contained">
                            Confirmar Embarque
                        </Button>
                    </Card.Actions>
                </Card>
            )}

            {/* Logout */}
            <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                icon="logout"
            >
                Sair da Conta
            </Button>

            <Portal>
                <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
                    <Dialog.Title>Não vou utilizar hoje</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10 }}>Por favor, informe o motivo:</Text>
                        <RadioButton.Group onValueChange={value => setCancelReason(value)} value={cancelReason}>
                            <RadioButton.Item label="Trabalho Remoto (Home Office)" value="remote_work" />
                            <RadioButton.Item label="Dia de Folga / Férias" value="vacation" />
                            <RadioButton.Item label="Doença / Médico" value="sick" />
                            <RadioButton.Item label="Veículo Próprio / Outro" value="own_transport" />
                        </RadioButton.Group>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setCancelDialogVisible(false)}>Voltar</Button>
                        <Button onPress={handleSubmitCancel} loading={submittingCancel}>Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F8FAFC',
    },
    profileCard: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    profileInfo: {
        flex: 1,
    },
    email: {
        color: '#64748B',
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    divider: {
        marginVertical: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        color: '#94A3B8',
        marginBottom: 4,
    },
    etaText: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
    },
    driverLabel: {
        color: '#64748B',
    },
    plateText: {
        marginLeft: 'auto',
        color: '#64748B',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    actionContent: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    actionTitle: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 12,
    },
    cardTitle: {
        marginBottom: 8,
    },
    checkinText: {
        color: '#64748B',
    },
    logoutButton: {
        marginTop: 8,
        marginBottom: 32,
    },
});
