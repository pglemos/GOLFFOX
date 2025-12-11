import { useState } from 'react';
import { View, StyleSheet, Alert, Vibration } from 'react-native';
import { Button, Text, Surface, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/auth/AuthProvider';

type ScanMode = 'qr' | 'nfc' | 'manual';

interface Passenger {
    id: string;
    name: string;
    checkedIn: boolean;
}

// Mock de passageiros - em produção viria do Supabase
const mockPassengers: Passenger[] = [
    { id: '1', name: 'João Silva', checkedIn: false },
    { id: '2', name: 'Maria Santos', checkedIn: false },
    { id: '3', name: 'Pedro Costa', checkedIn: true },
];

export default function ScanScreen() {
    const [mode, setMode] = useState<ScanMode>('manual');
    const [passengers, setPassengers] = useState<Passenger[]>(mockPassengers);
    const { profile } = useAuth();
    const theme = useTheme();

    const handleManualCheckIn = async (passengerId: string, passenger: Passenger) => {
        Vibration.vibrate(50);

        try {
            const { error } = await supabase.from('checkins').insert({
                passenger_id: passengerId,
                driver_id: profile?.id,
                type: passenger.checkedIn ? 'dropoff' : 'boarding',
                method: 'manual',
                timestamp: new Date().toISOString(),
            });

            if (error) console.error('Manual check-in error:', error);

            setPassengers(prev =>
                prev.map(p => (p.id === passengerId ? { ...p, checkedIn: !p.checkedIn } : p))
            );
        } catch (error) {
            console.error('Manual check-in error:', error);
        }
    };

    const renderQRScanner = () => (
        <View style={styles.permissionContainer}>
            <IconButton icon="qrcode-scan" size={80} iconColor={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.nfcTitle}>
                Modo QR Code
            </Text>
            <Text variant="bodyMedium" style={styles.nfcText}>
                Scanner de QR Code será ativado via câmera
            </Text>
            <Text variant="bodySmall" style={styles.nfcNote}>
                ⚠️ Disponível apenas em dispositivos móveis
            </Text>
        </View>
    );

    const renderNFCMode = () => (
        <View style={styles.nfcContainer}>
            <IconButton icon="nfc" size={80} iconColor={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.nfcTitle}>
                Modo NFC
            </Text>
            <Text variant="bodyMedium" style={styles.nfcText}>
                Aproxime o cartão NFC do passageiro ao dispositivo
            </Text>
            <Text variant="bodySmall" style={styles.nfcNote}>
                ⚠️ Requer build com EAS Dev Client
            </Text>
        </View>
    );

    const renderManualMode = () => (
        <View style={styles.manualContainer}>
            <Text variant="titleMedium" style={styles.manualTitle}>
                Lista de Passageiros
            </Text>
            {passengers.map(passenger => (
                <Surface key={passenger.id} style={styles.passengerCard} elevation={1}>
                    <View style={styles.passengerInfo}>
                        <Text variant="bodyLarge">{passenger.name}</Text>
                        <Text
                            variant="bodySmall"
                            style={{ color: passenger.checkedIn ? '#10B981' : '#94A3B8' }}
                        >
                            {passenger.checkedIn ? '✓ Embarcado' : 'Aguardando'}
                        </Text>
                    </View>
                    <Button
                        mode={passenger.checkedIn ? 'outlined' : 'contained'}
                        compact
                        onPress={() => handleManualCheckIn(passenger.id, passenger)}
                    >
                        {passenger.checkedIn ? 'Desembarcar' : 'Embarcar'}
                    </Button>
                </Surface>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <SegmentedButtons
                value={mode}
                onValueChange={(value) => setMode(value as ScanMode)}
                buttons={[
                    { value: 'qr', label: '📷 QR Code', icon: 'qrcode-scan' },
                    { value: 'nfc', label: '📳 NFC', icon: 'nfc' },
                    { value: 'manual', label: '✋ Manual', icon: 'hand-pointing-right' },
                ]}
                style={styles.segmentedButtons}
            />

            <View style={styles.content}>
                {mode === 'qr' && renderQRScanner()}
                {mode === 'nfc' && renderNFCMode()}
                {mode === 'manual' && renderManualMode()}
            </View>

            <View style={styles.statsContainer}>
                <Text variant="bodyMedium">
                    Embarcados: {passengers.filter(p => p.checkedIn).length} / {passengers.length}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    segmentedButtons: {
        margin: 16,
    },
    content: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    nfcContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    nfcTitle: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    nfcText: {
        textAlign: 'center',
        color: '#64748B',
        marginTop: 8,
    },
    nfcNote: {
        textAlign: 'center',
        color: '#F59E0B',
        marginTop: 24,
    },
    manualContainer: {
        flex: 1,
        padding: 16,
    },
    manualTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    passengerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    passengerInfo: {
        flex: 1,
    },
    statsContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
    },
});
