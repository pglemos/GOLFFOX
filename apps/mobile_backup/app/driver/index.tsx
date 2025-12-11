import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function DriverDashboard() {
    const { profile, logout } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const handleStartRoute = () => {
        router.push('/driver/checklist');
    };

    const handleScan = () => {
        router.push('/driver/scan');
    };

    const handleHistory = () => {
        router.push('/driver/history');
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header com perfil */}
            <Card style={styles.profileCard}>
                <Card.Content style={styles.profileContent}>
                    <Avatar.Icon size={64} icon="account" style={{ backgroundColor: theme.colors.primary }} />
                    <View style={styles.profileInfo}>
                        <Text variant="titleLarge">{profile?.name || 'Motorista'}</Text>
                        <Text variant="bodyMedium" style={styles.email}>{profile?.email}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Status da Rota Atual */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.cardTitle}>📍 Status Atual</Text>
                    <Divider style={styles.divider} />
                    <Text variant="bodyLarge" style={styles.statusText}>
                        Nenhuma rota ativa
                    </Text>
                    <Text variant="bodySmall" style={styles.statusSubtext}>
                        Inicie uma nova rota para começar
                    </Text>
                </Card.Content>
            </Card>

            {/* Ações Principais */}
            <View style={styles.actionsContainer}>
                <Card style={styles.actionCard}>
                    <Card.Content style={styles.actionContent}>
                        <Avatar.Icon size={48} icon="clipboard-check" style={{ backgroundColor: '#10B981' }} />
                        <Text variant="titleSmall" style={styles.actionTitle}>Iniciar Rota</Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={handleStartRoute} style={styles.actionButton}>
                            Começar
                        </Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.actionCard}>
                    <Card.Content style={styles.actionContent}>
                        <Avatar.Icon size={48} icon="qrcode-scan" style={{ backgroundColor: '#3B82F6' }} />
                        <Text variant="titleSmall" style={styles.actionTitle}>Check-in/out</Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={handleScan} style={styles.actionButton}>
                            Escanear
                        </Button>
                    </Card.Actions>
                </Card>
            </View>

            {/* Histórico */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.cardTitle}>📋 Histórico de Viagens</Text>
                    <Text variant="bodyMedium" style={styles.historyText}>
                        Veja suas viagens anteriores
                    </Text>
                </Card.Content>
                <Card.Actions>
                    <Button mode="text" onPress={handleHistory}>
                        Ver Histórico →
                    </Button>
                </Card.Actions>
            </Card>

            {/* Logout */}
            <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                icon="logout"
            >
                Sair da Conta
            </Button>
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
    cardTitle: {
        marginBottom: 8,
    },
    divider: {
        marginBottom: 12,
    },
    statusText: {
        color: '#64748B',
        textAlign: 'center',
        marginVertical: 16,
    },
    statusSubtext: {
        color: '#94A3B8',
        textAlign: 'center',
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
    },
    actionTitle: {
        textAlign: 'center',
    },
    actionButton: {
        flex: 1,
    },
    historyText: {
        color: '#64748B',
    },
    logoutButton: {
        marginTop: 8,
        marginBottom: 32,
    },
});
