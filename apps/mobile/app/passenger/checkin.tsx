import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Text, Surface, Button, RadioButton, TextInput, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

type CheckinMode = 'select' | 'qrcode' | 'nfc' | 'manual';
type NotEmbarkReason = 'home_office' | 'folga' | 'ferias' | 'medico' | 'outro';

const mockTrip = {
    linha: 'Linha 01 - Centro',
    ponto: 'Terminal Central',
    horario: '07:30',
    veiculo: 'ABC-1234',
    motorista: 'João Silva',
};

export default function CheckinScreen() {
    const [mode, setMode] = useState<CheckinMode>('select');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [notEmbarkVisible, setNotEmbarkVisible] = useState(false);
    const [reason, setReason] = useState<NotEmbarkReason>('home_office');
    const [pauseNotifications, setPauseNotifications] = useState(false);
    const [pauseDays, setPauseDays] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();

    const handleQRScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        Alert.alert(
            '✅ Check-in Confirmado!',
            `Embarque registrado com sucesso.\nCódigo: ${data}`,
            [{ text: 'OK', onPress: () => setMode('select') }]
        );
    };

    const handleManualCheckin = () => {
        Alert.alert(
            '✅ Check-in Confirmado!',
            'Seu embarque foi registrado manualmente.',
            [{ text: 'OK' }]
        );
        setMode('select');
    };

    const handleNotEmbark = async () => {
        setIsSubmitting(true);
        try {
            // Salvar motivo localmente ou enviar para API
            console.log('Não embarcou:', { reason, pauseNotifications, pauseDays });
            Alert.alert(
                'Registrado',
                pauseNotifications
                    ? `Suas notificações foram pausadas por ${pauseDays} dias.`
                    : 'Seu motivo foi registrado.',
            );
            setNotEmbarkVisible(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModeSelect = () => (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Info da viagem */}
            <Surface style={styles.tripCard} elevation={2}>
                <Text style={styles.tripTitle}>📍 Próximo Embarque</Text>
                <View style={styles.tripRow}>
                    <Text style={styles.tripLabel}>Linha:</Text>
                    <Text style={styles.tripValue}>{mockTrip.linha}</Text>
                </View>
                <View style={styles.tripRow}>
                    <Text style={styles.tripLabel}>Ponto:</Text>
                    <Text style={styles.tripValue}>{mockTrip.ponto}</Text>
                </View>
                <View style={styles.tripRow}>
                    <Text style={styles.tripLabel}>Horário:</Text>
                    <Text style={styles.tripValueHighlight}>{mockTrip.horario}</Text>
                </View>
            </Surface>

            {/* Opções de Check-in */}
            <Text style={styles.sectionTitle}>Escolha como fazer Check-in:</Text>

            <Pressable style={styles.optionCard} onPress={() => setMode('qrcode')}>
                <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.optionGradient}>
                    <Text style={styles.optionIcon}>📱</Text>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>QR Code</Text>
                        <Text style={styles.optionDesc}>Escaneie o código no veículo</Text>
                    </View>
                </LinearGradient>
            </Pressable>

            <Pressable style={styles.optionCard} onPress={() => setMode('nfc')}>
                <View style={styles.optionContent}>
                    <Text style={styles.optionIcon}>📡</Text>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionTitleDark}>NFC</Text>
                        <Text style={styles.optionDescDark}>Aproxime o celular do leitor</Text>
                    </View>
                </View>
            </Pressable>

            <Pressable style={styles.optionCard} onPress={() => setMode('manual')}>
                <View style={styles.optionContent}>
                    <Text style={styles.optionIcon}>✋</Text>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionTitleDark}>Manual</Text>
                        <Text style={styles.optionDescDark}>Confirmar embarque manualmente</Text>
                    </View>
                </View>
            </Pressable>

            {/* Botão "Não embarquei" */}
            <Pressable
                style={styles.notEmbarkBtn}
                onPress={() => setNotEmbarkVisible(true)}
            >
                <Text style={styles.notEmbarkText}>🚫 Não embarquei no fretado</Text>
            </Pressable>
        </ScrollView>
    );

    const renderQRScanner = () => {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        Precisamos de permissão para acessar a câmera.
                    </Text>
                    <Button mode="contained" onPress={requestPermission}>
                        Permitir Câmera
                    </Button>
                    <Button mode="text" onPress={() => setMode('select')}>
                        Voltar
                    </Button>
                </View>
            );
        }

        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleQRScanned}
                />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.scannerText}>Posicione o QR Code no quadro</Text>
                </View>
                <Button
                    mode="contained"
                    onPress={() => { setMode('select'); setScanned(false); }}
                    style={styles.cancelScanBtn}
                >
                    Cancelar
                </Button>
            </View>
        );
    };

    const renderNFC = () => (
        <View style={styles.nfcContainer}>
            <Text style={styles.nfcIcon}>📡</Text>
            <Text style={styles.nfcTitle}>Aproxime o celular</Text>
            <Text style={styles.nfcDesc}>
                Encoste o celular no leitor NFC dentro do veículo
            </Text>
            <View style={styles.nfcAnimation}>
                <View style={styles.nfcRing} />
                <View style={[styles.nfcRing, styles.nfcRing2]} />
                <View style={[styles.nfcRing, styles.nfcRing3]} />
            </View>
            <Button mode="outlined" onPress={() => setMode('select')} style={styles.backBtn}>
                Voltar
            </Button>
        </View>
    );

    const renderManual = () => (
        <View style={styles.manualContainer}>
            <Surface style={styles.manualCard} elevation={2}>
                <Text style={styles.manualTitle}>Confirmar Embarque</Text>
                <View style={styles.manualInfo}>
                    <Text style={styles.manualLabel}>Linha</Text>
                    <Text style={styles.manualValue}>{mockTrip.linha}</Text>
                </View>
                <View style={styles.manualInfo}>
                    <Text style={styles.manualLabel}>Ponto de Embarque</Text>
                    <Text style={styles.manualValue}>{mockTrip.ponto}</Text>
                </View>
                <View style={styles.manualInfo}>
                    <Text style={styles.manualLabel}>Veículo</Text>
                    <Text style={styles.manualValue}>{mockTrip.veiculo}</Text>
                </View>
            </Surface>

            <Button
                mode="contained"
                onPress={handleManualCheckin}
                style={styles.confirmBtn}
                contentStyle={styles.confirmBtnContent}
                buttonColor="#10B981"
            >
                ✓ Confirmar Embarque
            </Button>
            <Button mode="outlined" onPress={() => setMode('select')}>
                Cancelar
            </Button>
        </View>
    );

    return (
        <View style={styles.container}>
            {mode === 'select' && renderModeSelect()}
            {mode === 'qrcode' && renderQRScanner()}
            {mode === 'nfc' && renderNFC()}
            {mode === 'manual' && renderManual()}

            {/* Dialog "Não embarquei" */}
            <Portal>
                <Dialog visible={notEmbarkVisible} onDismiss={() => setNotEmbarkVisible(false)}>
                    <Dialog.Title>Não embarquei no fretado</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>Qual o motivo?</Text>
                        <RadioButton.Group onValueChange={v => setReason(v as NotEmbarkReason)} value={reason}>
                            <RadioButton.Item label="Home Office" value="home_office" />
                            <RadioButton.Item label="Folga" value="folga" />
                            <RadioButton.Item label="Férias" value="ferias" />
                            <RadioButton.Item label="Atestado Médico" value="medico" />
                            <RadioButton.Item label="Outro" value="outro" />
                        </RadioButton.Group>

                        <View style={styles.pauseSection}>
                            <Pressable
                                style={styles.pauseRow}
                                onPress={() => setPauseNotifications(!pauseNotifications)}
                            >
                                <View style={[styles.checkbox, pauseNotifications && styles.checkboxActive]}>
                                    {pauseNotifications && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.pauseLabel}>Pausar notificações</Text>
                            </Pressable>
                            {pauseNotifications && (
                                <TextInput
                                    label="Por quantos dias?"
                                    value={pauseDays}
                                    onChangeText={setPauseDays}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.pauseInput}
                                />
                            )}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setNotEmbarkVisible(false)}>Cancelar</Button>
                        <Button onPress={handleNotEmbark} loading={isSubmitting}>Confirmar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 16 },

    tripCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20 },
    tripTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
    tripRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    tripLabel: { color: '#64748B', fontSize: 14 },
    tripValue: { color: '#0F172A', fontSize: 14, fontWeight: '500' },
    tripValueHighlight: { color: '#0D9488', fontSize: 16, fontWeight: '700' },

    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },

    optionCard: { borderRadius: 14, marginBottom: 12, overflow: 'hidden', elevation: 2, backgroundColor: '#FFF' },
    optionGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    optionContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    optionIcon: { fontSize: 32, marginRight: 16 },
    optionInfo: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
    optionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    optionTitleDark: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    optionDescDark: { fontSize: 13, color: '#64748B' },

    notEmbarkBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center' },
    notEmbarkText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },

    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    permissionText: { textAlign: 'center', color: '#64748B', marginBottom: 16 },

    scannerContainer: { flex: 1 },
    camera: { flex: 1 },
    scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    scannerFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#0D9488', borderRadius: 20 },
    scannerText: { color: '#FFF', marginTop: 20, fontSize: 14 },
    cancelScanBtn: { position: 'absolute', bottom: 40, left: 16, right: 16 },

    nfcContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    nfcIcon: { fontSize: 64, marginBottom: 20 },
    nfcTitle: { fontSize: 22, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
    nfcDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 40 },
    nfcAnimation: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    nfcRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#0D9488' },
    nfcRing2: { width: 100, height: 100, borderRadius: 50, borderColor: 'rgba(13,148,136,0.5)' },
    nfcRing3: { width: 140, height: 140, borderRadius: 70, borderColor: 'rgba(13,148,136,0.25)' },
    backBtn: { marginTop: 20 },

    manualContainer: { flex: 1, padding: 16 },
    manualCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 24 },
    manualTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
    manualInfo: { marginBottom: 12 },
    manualLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
    manualValue: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
    confirmBtn: { marginBottom: 12, borderRadius: 12 },
    confirmBtnContent: { paddingVertical: 6 },

    dialogLabel: { fontSize: 14, color: '#64748B', marginBottom: 8 },
    pauseSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    pauseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
    checkmark: { color: '#FFF', fontWeight: '700' },
    pauseLabel: { color: '#0F172A', fontSize: 14 },
    pauseInput: { marginTop: 12, backgroundColor: '#FFF' },
});
