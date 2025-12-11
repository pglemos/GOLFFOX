import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Vibration } from 'react-native';
import { Button, Text, Surface, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
    const [mode, setMode] = useState<ScanMode>('qr');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [passengers, setPassengers] = useState<Passenger[]>(mockPassengers);
    const [lastScan, setLastScan] = useState<string | null>(null);
    const { profile } = useAuth();
    const theme = useTheme();

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;

        setScanned(true);
        Vibration.vibrate(100);
        setLastScan(data);

        // Processar o QR code
        try {
            // O QR pode conter o ID do passageiro
            const passengerId = data;

            // Registrar check-in no Supabase
            const { error } = await supabase.from('checkins').insert({
                // route_id: currentRoute?.id,
                passenger_id: passengerId,
                driver_id: profile?.id,
                type: 'boarding',
                method: 'qr',
                timestamp: new Date().toISOString(),
            });

            if (error) {
                console.error('Check-in error:', error);
            }

            // Atualizar UI
            setPassengers(prev =>
                prev.map(p => (p.id === passengerId ? { ...p, checkedIn: true } : p))
            );

            Alert.alert(
                '✅ Check-in Realizado',
                `Passageiro registrado com sucesso`,
                [{ text: 'OK', onPress: () => setScanned(false) }]
            );
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Erro', 'Não foi possível processar o QR code', [
                { text: 'Tentar Novamente', onPress: () => setScanned(false) },
            ]);
        }
    };

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

    const renderQRScanner = () => {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Text variant="bodyLarge" style={styles.permissionText}>
                        Precisamos de acesso à câmera para escanear QR codes
                    </Text>
                    <Button mode="contained" onPress={requestPermission}>
                        Permitir Câmera
                    </Button>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'pdf417'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                <View style={styles.scanOverlay}>
                    <View style={styles.scanFrame} />
                </View>
                {lastScan && (
                    <Text style={styles.lastScanText}>Último scan: {lastScan}</Text>
                )}
            </View>
        );
    };

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
    // QR Scanner
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    permissionText: {
        textAlign: 'center',
        color: '#64748B',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: '#10B981',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    lastScanText: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
    },
    // NFC
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
    // Manual
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
    // Stats
    statsContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
    },
});
