import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Vibration, ScrollView, Pressable } from 'react-native';
import { Text, Surface, Button, Portal, Dialog } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/auth/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ScanMode = 'qr' | 'nfc' | 'manual';

interface passageiro {
    id: string;
    name: string;
    identifier: string;
    checkedIn: boolean;
    checkInTime?: string;
}

const mockPassengers: passageiro[] = [
    { id: '1', name: 'João Silva', identifier: '001234', checkedIn: false },
    { id: '2', name: 'Maria Santos', identifier: '001235', checkedIn: false },
    { id: '3', name: 'Pedro Costa', identifier: '001236', checkedIn: true, checkInTime: '07:32' },
    { id: '4', name: 'Ana Oliveira', identifier: '001237', checkedIn: false },
];

export default function ScanScreen() {
    const [mode, setMode] = useState<ScanMode>('manual');
    const [passengers, setPassengers] = useState<passageiro[]>(mockPassengers);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<passageiro | null>(null);
    const { profile } = useAuth();

    const embarkedCount = passengers.filter(p => p.checkedIn).length;
    const totalCount = passengers.length;

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        Vibration.vibrate(100);

        // Simular busca do passageiro pelo código
        const foundPassenger = passengers.find(p => p.identifier === data) || {
            id: 'new',
            name: 'Passageiro ' + data.substring(0, 4),
            identifier: data,
            checkedIn: false,
        };

        setSelectedPassenger(foundPassenger);
        setConfirmDialogVisible(true);
    };

    const handleConfirmBoarding = async () => {
        if (!selectedPassenger) return;

        try {
            // Usar serviço correto
            const { createPassengerCheckin } = await import('../../src/services/supabase');
            await createPassengerCheckin({
                passenger_id: selectedPassenger.id !== 'new' ? selectedPassenger.id : undefined,
                driver_id: profile?.id || '',
                type: selectedPassenger.checkedIn ? 'dropoff' : 'boarding',
                method: mode,
                passenger_identifier: selectedPassenger.identifier,
            });

            if (selectedPassenger.id !== 'new') {
                setPassengers(prev =>
                    prev.map(p => p.id === selectedPassenger.id
                        ? { ...p, checkedIn: !p.checkedIn, checkInTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
                        : p
                    )
                );
            }

            Vibration.vibrate([0, 100, 50, 100]);
        } catch (error) {
            console.error('Check-in error:', error);
        }

        setConfirmDialogVisible(false);
        setSelectedPassenger(null);
        setTimeout(() => setScanned(false), 2000);
    };

    const handleManualCheckIn = (passageiro: passageiro) => {
        setSelectedPassenger(passageiro);
        setConfirmDialogVisible(true);
    };

    const renderModeSelector = () => (
        <View style={styles.modeSelector}>
            <Pressable
                style={[styles.modeBtn, mode === 'qr' && styles.modeBtnActive]}
                onPress={() => setMode('qr')}
            >
                <Ionicons name="qr-code" size={24} color={mode === 'qr' ? '#FFF' : '#64748B'} />
                <Text style={[styles.modeBtnText, mode === 'qr' && styles.modeBtnTextActive]}>QR Code</Text>
            </Pressable>
            <Pressable
                style={[styles.modeBtn, mode === 'nfc' && styles.modeBtnActive]}
                onPress={() => setMode('nfc')}
            >
                <Ionicons name="radio" size={24} color={mode === 'nfc' ? '#FFF' : '#64748B'} />
                <Text style={[styles.modeBtnText, mode === 'nfc' && styles.modeBtnTextActive]}>NFC</Text>
            </Pressable>
            <Pressable
                style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
                onPress={() => setMode('manual')}
            >
                <Ionicons name="list" size={24} color={mode === 'manual' ? '#FFF' : '#64748B'} />
                <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>Manual</Text>
            </Pressable>
        </View>
    );

    const renderQRScanner = () => {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.permissionText}>Precisamos de acesso à câmera</Text>
                    <Button mode="contained" onPress={requestPermission} buttonColor="#0D9488">
                        Permitir Câmera
                    </Button>
                </View>
            );
        }

        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.scannerText}>
                        {scanned ? '✓ QR Code lido!' : 'Posicione o QR Code do passageiro'}
                    </Text>
                </View>
            </View>
        );
    };

    const renderNFC = () => (
        <View style={styles.nfcContainer}>
            <View style={styles.nfcAnimation}>
                <View style={styles.nfcRing} />
                <View style={[styles.nfcRing, styles.nfcRing2]} />
                <View style={[styles.nfcRing, styles.nfcRing3]} />
                <Ionicons name="radio" size={48} color="#0D9488" style={styles.nfcIcon} />
            </View>
            <Text style={styles.nfcTitle}>Aproxime o cartão NFC</Text>
            <Text style={styles.nfcDesc}>Encoste o cartão do passageiro no celular</Text>
            <Text style={styles.nfcNote}>⚠️ NFC disponível apenas em build nativo</Text>
        </View>
    );

    const renderManual = () => (
        <ScrollView style={styles.manualContainer} showsVerticalScrollIndicator={false}>
            {passengers.map(passageiro => (
                <Surface key={passageiro.id} style={styles.passengerCard} elevation={1}>
                    <View style={styles.passengerInfo}>
                        <View style={[styles.statusDot, { backgroundColor: passageiro.checkedIn ? '#10B981' : '#CBD5E1' }]} />
                        <View style={styles.passengerDetails}>
                            <Text style={styles.passengerName}>{passageiro.name}</Text>
                            <Text style={styles.passengerId}>ID: {passageiro.identifier}</Text>
                            {passageiro.checkedIn && passageiro.checkInTime && (
                                <Text style={styles.checkInTime}>Embarcou às {passageiro.checkInTime}</Text>
                            )}
                        </View>
                    </View>
                    <Pressable
                        style={[styles.actionBtn, passageiro.checkedIn && styles.actionBtnDisembark]}
                        onPress={() => handleManualCheckIn(passageiro)}
                    >
                        <Text style={[styles.actionBtnText, passageiro.checkedIn && styles.actionBtnTextDisembark]}>
                            {passageiro.checkedIn ? 'Desembarcar' : 'Embarcar'}
                        </Text>
                    </Pressable>
                </Surface>
            ))}
            <View style={{ height: 20 }} />
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {renderModeSelector()}

            <View style={styles.content}>
                {mode === 'qr' && renderQRScanner()}
                {mode === 'nfc' && renderNFC()}
                {mode === 'manual' && renderManual()}
            </View>

            {/* Footer com contador */}
            <View style={styles.footer}>
                <View style={styles.counterBox}>
                    <Text style={styles.counterNumber}>{embarkedCount}</Text>
                    <Text style={styles.counterLabel}>Embarcados</Text>
                </View>
                <View style={styles.counterDivider} />
                <View style={styles.counterBox}>
                    <Text style={styles.counterNumber}>{totalCount - embarkedCount}</Text>
                    <Text style={styles.counterLabel}>Aguardando</Text>
                </View>
                <View style={styles.counterDivider} />
                <View style={styles.counterBox}>
                    <Text style={styles.counterNumberTotal}>{totalCount}</Text>
                    <Text style={styles.counterLabel}>Total</Text>
                </View>
            </View>

            {/* Dialog de Confirmação - Estilo Verde */}
            <Portal>
                <Dialog visible={confirmDialogVisible} onDismiss={() => { setConfirmDialogVisible(false); setScanned(false); }}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.confirmDialog}>
                        <Text style={styles.confirmLabel}>
                            {selectedPassenger?.checkedIn ? 'Desembarque' : 'Novo Passageiro'}
                        </Text>
                        <Text style={styles.confirmName}>{selectedPassenger?.name}</Text>

                        <View style={styles.confirmIdBox}>
                            <Text style={styles.confirmIdLabel}>Identificador</Text>
                            <Text style={styles.confirmId}>{selectedPassenger?.identifier}</Text>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleConfirmBoarding}
                            style={styles.confirmBtn}
                            buttonColor="#FFFFFF"
                            textColor="#10B981"
                        >
                            ✓ {selectedPassenger?.checkedIn ? 'Confirmar Desembarque' : 'Confirmar Embarque'}
                        </Button>
                        <Button
                            mode="text"
                            onPress={() => { setConfirmDialogVisible(false); setScanned(false); }}
                            textColor="#FFFFFF"
                        >
                            ✕ Ignorar
                        </Button>
                    </LinearGradient>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    modeSelector: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F1F5F9' },
    modeBtnActive: { backgroundColor: '#0D9488' },
    modeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    modeBtnTextActive: { color: '#FFF' },

    content: { flex: 1 },

    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
    permissionText: { fontSize: 15, color: '#64748B', marginBottom: 8 },

    scannerContainer: { flex: 1 },
    camera: { flex: 1 },
    scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    scannerFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#10B981', borderRadius: 20 },
    scannerText: { color: '#FFF', marginTop: 20, fontSize: 14, fontWeight: '500' },

    nfcContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    nfcAnimation: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    nfcRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#0D9488' },
    nfcRing2: { width: 120, height: 120, borderRadius: 60, borderColor: 'rgba(13,148,136,0.5)' },
    nfcRing3: { width: 160, height: 160, borderRadius: 80, borderColor: 'rgba(13,148,136,0.25)' },
    nfcIcon: { position: 'absolute' },
    nfcTitle: { fontSize: 20, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
    nfcDesc: { fontSize: 14, color: '#64748B', textAlign: 'center' },
    nfcNote: { fontSize: 12, color: '#F59E0B', marginTop: 24 },

    manualContainer: { flex: 1, padding: 16 },
    passengerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10 },
    passengerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    passengerDetails: { flex: 1 },
    passengerName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
    passengerId: { fontSize: 12, color: '#94A3B8' },
    checkInTime: { fontSize: 11, color: '#10B981', marginTop: 2 },
    actionBtn: { backgroundColor: '#0D9488', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    actionBtnDisembark: { backgroundColor: '#FEE2E2' },
    actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    actionBtnTextDisembark: { color: '#DC2626' },

    footer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    counterBox: { flex: 1, alignItems: 'center' },
    counterDivider: { width: 1, backgroundColor: '#E2E8F0' },
    counterNumber: { fontSize: 24, fontWeight: '700', color: '#10B981' },
    counterNumberTotal: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
    counterLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

    confirmDialog: { borderRadius: 16, padding: 24, margin: -24, alignItems: 'center' },
    confirmLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
    confirmName: { color: '#FFF', fontSize: 24, fontWeight: '700', marginBottom: 20 },
    confirmIdBox: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 20 },
    confirmIdLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    confirmId: { color: '#FFF', fontSize: 32, fontWeight: '700', letterSpacing: 4 },
    confirmBtn: { borderRadius: 12, width: '100%', marginBottom: 8 },
});
