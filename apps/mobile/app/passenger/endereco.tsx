import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { useAuth } from '../../src/auth/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

interface Endereco {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    latitude: number | null;
    longitude: number | null;
}

export default function EnderecoScreen() {
    const [endereco, setEndereco] = useState<Endereco>({
        rua: 'Av. Brasil',
        numero: '1500',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        latitude: null,
        longitude: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { profile } = useAuth();

    const handleGetLocation = async () => {
        setIsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de acesso à sua localização.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Geocodificação reversa
            const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (geocode) {
                setEndereco(prev => ({
                    ...prev,
                    rua: geocode.street || prev.rua,
                    bairro: geocode.district || geocode.subregion || prev.bairro,
                    cidade: geocode.city || prev.cidade,
                    estado: geocode.region || prev.estado,
                    cep: geocode.postalCode || prev.cep,
                    latitude,
                    longitude,
                }));
                Alert.alert('Localização atualizada', 'Confira os dados e atualize o número se necessário.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível obter sua localização.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!endereco.numero.trim()) {
            Alert.alert('Atenção', 'Informe o número da residência.');
            return;
        }

        setIsSaving(true);
        try {
            // Simular salvamento - integrar com Supabase
            console.log('Salvando endereço:', endereco);
            await new Promise(resolve => setTimeout(resolve, 1000));
            Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Card localização */}
            <Surface style={styles.locationCard} elevation={2}>
                <View style={styles.locationHeader}>
                    <Ionicons name="location" size={32} color="#0D9488" />
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationTitle}>Compartilhar Localização</Text>
                        <Text style={styles.locationDesc}>
                            Use o GPS para atualizar seu endereço automaticamente
                        </Text>
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={handleGetLocation}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.gpsBtn}
                    buttonColor="#0D9488"
                    icon="crosshairs-gps"
                >
                    {isLoading ? 'Obtendo...' : 'Usar minha localização'}
                </Button>
                {endereco.latitude && (
                    <Text style={styles.coordsText}>
                        📍 Coordenadas: {endereco.latitude.toFixed(6)}, {endereco.longitude?.toFixed(6)}
                    </Text>
                )}
            </Surface>

            {/* Formulário */}
            <Surface style={styles.formCard} elevation={1}>
                <Text style={styles.formTitle}>Endereço de Embarque</Text>

                <TextInput
                    label="Rua / Avenida"
                    value={endereco.rua}
                    onChangeText={(v) => setEndereco(prev => ({ ...prev, rua: v }))}
                    mode="outlined"
                    style={styles.input}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#0D9488"
                />

                <View style={styles.row}>
                    <TextInput
                        label="Número *"
                        value={endereco.numero}
                        onChangeText={(v) => setEndereco(prev => ({ ...prev, numero: v }))}
                        mode="outlined"
                        style={[styles.input, styles.inputHalf]}
                        keyboardType="numeric"
                        outlineColor="#E2E8F0"
                        activeOutlineColor="#0D9488"
                    />
                    <TextInput
                        label="CEP"
                        value={endereco.cep}
                        onChangeText={(v) => setEndereco(prev => ({ ...prev, cep: v }))}
                        mode="outlined"
                        style={[styles.input, styles.inputHalf]}
                        keyboardType="numeric"
                        outlineColor="#E2E8F0"
                        activeOutlineColor="#0D9488"
                    />
                </View>

                <TextInput
                    label="Bairro"
                    value={endereco.bairro}
                    onChangeText={(v) => setEndereco(prev => ({ ...prev, bairro: v }))}
                    mode="outlined"
                    style={styles.input}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#0D9488"
                />

                <View style={styles.row}>
                    <TextInput
                        label="Cidade"
                        value={endereco.cidade}
                        onChangeText={(v) => setEndereco(prev => ({ ...prev, cidade: v }))}
                        mode="outlined"
                        style={[styles.input, styles.inputLarge]}
                        outlineColor="#E2E8F0"
                        activeOutlineColor="#0D9488"
                    />
                    <TextInput
                        label="UF"
                        value={endereco.estado}
                        onChangeText={(v) => setEndereco(prev => ({ ...prev, estado: v }))}
                        mode="outlined"
                        style={[styles.input, styles.inputSmall]}
                        maxLength={2}
                        outlineColor="#E2E8F0"
                        activeOutlineColor="#0D9488"
                    />
                </View>
            </Surface>

            {/* Botão salvar */}
            <Button
                mode="contained"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
                style={styles.saveBtn}
                contentStyle={styles.saveBtnContent}
                buttonColor="#0D9488"
            >
                Salvar Endereço
            </Button>

            {/* Info */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                <Text style={styles.infoText}>
                    Mantenha seu endereço atualizado para que o motorista saiba onde buscá-lo.
                </Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 16 },

    locationCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16 },
    locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    locationInfo: { flex: 1 },
    locationTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    locationDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
    gpsBtn: { borderRadius: 12 },
    coordsText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 12 },

    formCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16 },
    formTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
    input: { marginBottom: 12, backgroundColor: '#FFF' },
    row: { flexDirection: 'row', gap: 12 },
    inputHalf: { flex: 1 },
    inputLarge: { flex: 2 },
    inputSmall: { flex: 1 },

    saveBtn: { borderRadius: 12, marginBottom: 16 },
    saveBtnContent: { paddingVertical: 6 },

    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, backgroundColor: '#F1F5F9', borderRadius: 12 },
    infoText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 18 },
});
