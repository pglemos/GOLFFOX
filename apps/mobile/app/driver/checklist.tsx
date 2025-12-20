import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { Text, Button, Surface, Divider, TextInput, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChecklistItem {
    id: string;
    label: string;
    category: string;
    value: 'yes' | 'no' | null;
}

interface PhotoItem {
    id: string;
    label: string;
    uri: string | null;
    required: boolean;
}

const initialChecklist: ChecklistItem[] = [
    // Veículo e Mecânica
    { id: 'freios', label: 'Freios funcionando corretamente', category: 'veiculo', value: null },
    { id: 'farois', label: 'Faróis e luzes operacionais', category: 'veiculo', value: null },
    { id: 'pneus', label: 'Pneus em bom estado', category: 'veiculo', value: null },
    { id: 'oleo', label: 'Nível de óleo verificado', category: 'veiculo', value: null },
    { id: 'combustivel', label: 'Combustível suficiente', category: 'veiculo', value: null },
    { id: 'agua', label: 'Nível de água do radiador', category: 'veiculo', value: null },
    // Segurança
    { id: 'extintores', label: 'Extintores verificados e lacrados', category: 'safety', value: null },
    { id: 'cintos', label: 'Cintos de segurança funcionando', category: 'safety', value: null },
    { id: 'saidas', label: 'Saídas de emergência liberadas', category: 'safety', value: null },
    { id: 'kit_primeiros', label: 'Kit de primeiros socorros', category: 'safety', value: null },
    // Documentação e Geral
    { id: 'documentos', label: 'Documentos do veículo em dia', category: 'general', value: null },
    { id: 'limpeza', label: 'Veículo limpo internamente', category: 'general', value: null },
    { id: 'ar_condicionado', label: 'Ar condicionado funcionando', category: 'general', value: null },
];

const initialPhotos: PhotoItem[] = [
    { id: 'odometro', label: 'Odômetro', uri: null, required: true },
    { id: 'pneus_foto', label: 'Pneus', uri: null, required: true },
    { id: 'interior', label: 'Interior', uri: null, required: true },
    { id: 'exterior', label: 'Exterior (opcional)', uri: null, required: false },
];

const categories = {
    veiculo: { title: '🚌 Veículo e Mecânica', color: '#0D9488' },
    safety: { title: '🛡️ Segurança', color: '#F59E0B' },
    general: { title: '📋 Documentação e Geral', color: '#3B82F6' },
};

export default function ChecklistScreen() {
    const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
    const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
    const [observations, setObservations] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { profile } = useAuth();
    const router = useRouter();

    const setItemValue = (id: string, value: 'yes' | 'no') => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, value } : item
            )
        );
    };

    const pickImage = async (photoId: string) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotos(prev =>
                prev.map(photo =>
                    photo.id === photoId ? { ...photo, uri: result.assets[0].uri } : photo
                )
            );
        }
    };

    const removePhoto = (photoId: string) => {
        setPhotos(prev =>
            prev.map(photo =>
                photo.id === photoId ? { ...photo, uri: null } : photo
            )
        );
    };

    const allRequiredPhotosComplete = photos
        .filter(p => p.required)
        .every(p => p.uri !== null);

    const allItemsComplete = items.every(item => item.value !== null);
    const hasNegativeItems = items.some(item => item.value === 'no');

    const completedCount = items.filter(item => item.value !== null).length;
    const requiredPhotosCount = photos.filter(p => p.required).length;
    const completedPhotosCount = photos.filter(p => p.required && p.uri !== null).length;

    const canSubmit = allItemsComplete && allRequiredPhotosComplete;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            // Salvar localmente (evita erro de tabela inexistente)
            const checklistData = {
                driver_id: profile?.id,
                items: items.reduce((acc, item) => ({ ...acc, [item.id]: item.value }), {}),
                photos: photos.reduce((acc, photo) => ({ ...acc, [photo.id]: photo.uri }), {}),
                observations,
                timestamp: new Date().toISOString(),
                hasIssues: hasNegativeItems,
            };

            await AsyncStorage.setItem('last_checklist', JSON.stringify(checklistData));

            if (hasNegativeItems) {
                Alert.alert(
                    'Atenção',
                    'Você marcou alguns itens como "NÃO". Deseja continuar mesmo assim?',
                    [
                        { text: 'Revisar', style: 'cancel' },
                        { text: 'Continuar', onPress: () => router.push('/motorista/route') }
                    ]
                );
            } else {
                router.push('/motorista/route');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCategoryItems = (categoryKey: string) => {
        const category = categories[categoryKey as keyof typeof categories];
        const categoryItems = items.filter(item => item.category === categoryKey);

        return (
            <View key={categoryKey} style={styles.categoryContainer}>
                <Text style={[styles.categoryTitle, { color: category.color }]}>
                    {category.title}
                </Text>

                {categoryItems.map((item, index) => (
                    <View key={item.id}>
                        <View style={styles.checklistRow}>
                            <Text style={styles.itemLabel}>{item.label}</Text>
                            <View style={styles.radioGroup}>
                                <Pressable
                                    onPress={() => setItemValue(item.id, 'yes')}
                                    style={[
                                        styles.radioButton,
                                        styles.radioYes,
                                        item.value === 'yes' && styles.radioYesActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        item.value === 'yes' && styles.radioTextActive
                                    ]}>
                                        SIM
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setItemValue(item.id, 'no')}
                                    style={[
                                        styles.radioButton,
                                        styles.radioNo,
                                        item.value === 'no' && styles.radioNoActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        item.value === 'no' && styles.radioTextActive
                                    ]}>
                                        NÃO
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                        {index < categoryItems.length - 1 && <Divider style={styles.divider} />}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Card */}
            <Surface style={styles.headerCard} elevation={2}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Checklist Pré-Viagem</Text>
                        <Text style={styles.headerSubtitle}>
                            Veículo: ABC-1234 • {new Date().toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>
                            {completedCount}/{items.length}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${(completedCount / items.length) * 100}%` }
                            ]}
                        />
                    </View>
                </View>
            </Surface>

            {/* Photos Section */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>📸 Fotos Obrigatórias</Text>
                <Text style={styles.sectionSubtitle}>
                    {completedPhotosCount}/{requiredPhotosCount} fotos registradas
                </Text>

                <View style={styles.photosGrid}>
                    {photos.map(photo => (
                        <View key={photo.id} style={styles.photoContainer}>
                            {photo.uri ? (
                                <View style={styles.photoWrapper}>
                                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                                    <IconButton
                                        icon="close-circle"
                                        iconColor="#EF4444"
                                        size={24}
                                        style={styles.removePhotoButton}
                                        onPress={() => removePhoto(photo.id)}
                                    />
                                </View>
                            ) : (
                                <Pressable
                                    onPress={() => pickImage(photo.id)}
                                    style={[
                                        styles.photoPlaceholder,
                                        photo.required && styles.photoRequired
                                    ]}
                                >
                                    <Text style={styles.photoIcon}>📷</Text>
                                    <Text style={styles.photoLabel}>{photo.label}</Text>
                                    {photo.required && (
                                        <Text style={styles.requiredBadge}>Obrigatório</Text>
                                    )}
                                </Pressable>
                            )}
                            {photo.uri && (
                                <Text style={styles.photoLabelSmall}>{photo.label}</Text>
                            )}
                        </View>
                    ))}
                </View>
            </Surface>

            {/* Checklist Items */}
            <Surface style={styles.section} elevation={1}>
                <View style={styles.columnHeaders}>
                    <Text style={styles.columnHeaderItem}>Item de Verificação</Text>
                    <View style={styles.columnHeaderValues}>
                        <Text style={styles.columnHeaderYes}>SIM</Text>
                        <Text style={styles.columnHeaderNo}>NÃO</Text>
                    </View>
                </View>
                <Divider style={styles.headerDivider} />

                {Object.keys(categories).map(renderCategoryItems)}
            </Surface>

            {/* Observations */}
            <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>💬 Observações</Text>
                <TextInput
                    mode="outlined"
                    placeholder="Adicione observações importantes (opcional)"
                    value={observations}
                    onChangeText={setObservations}
                    multiline
                    numberOfLines={3}
                    style={styles.observationsInput}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#0D9488"
                />
            </Surface>

            {/* Warning for negative items */}
            {hasNegativeItems && (
                <Surface style={styles.warningCard} elevation={1}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>
                        Existem itens marcados como "NÃO". Verifique se é seguro prosseguir.
                    </Text>
                </Surface>
            )}

            {/* Submit Button */}
            <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                loading={isSubmitting}
                style={[
                    styles.submitButton,
                    canSubmit && !hasNegativeItems && styles.submitButtonActive
                ]}
                contentStyle={styles.submitButtonContent}
                labelStyle={styles.submitButtonLabel}
            >
                {canSubmit ? '✓ Iniciar Viagem' : `Preencha todos os campos`}
            </Button>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 16,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    progressBadge: {
        backgroundColor: '#0D9488',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    progressBarContainer: {
        marginTop: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0D9488',
        borderRadius: 3,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoContainer: {
        width: '47%',
        alignItems: 'center',
    },
    photoWrapper: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFFFFF',
        margin: 0,
    },
    photoPlaceholder: {
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    photoRequired: {
        borderColor: '#0D9488',
    },
    photoIcon: {
        fontSize: 28,
    },
    photoLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    photoLabelSmall: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 6,
        textAlign: 'center',
    },
    requiredBadge: {
        fontSize: 9,
        color: '#0D9488',
        fontWeight: '600',
        marginTop: 2,
    },
    columnHeaders: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
    },
    columnHeaderItem: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        flex: 1,
    },
    columnHeaderValues: {
        flexDirection: 'row',
        gap: 8,
    },
    columnHeaderYes: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '600',
        width: 50,
        textAlign: 'center',
    },
    columnHeaderNo: {
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '600',
        width: 50,
        textAlign: 'center',
    },
    headerDivider: {
        marginBottom: 8,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 8,
    },
    checklistRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    itemLabel: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        paddingRight: 12,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    radioButton: {
        width: 50,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    radioYes: {
        borderColor: '#10B981',
        backgroundColor: '#FFFFFF',
    },
    radioYesActive: {
        backgroundColor: '#10B981',
    },
    radioNo: {
        borderColor: '#EF4444',
        backgroundColor: '#FFFFFF',
    },
    radioNoActive: {
        backgroundColor: '#EF4444',
    },
    radioText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    radioTextActive: {
        color: '#FFFFFF',
    },
    divider: {
        backgroundColor: '#F1F5F9',
    },
    observationsInput: {
        backgroundColor: '#FFFFFF',
    },
    warningCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    warningIcon: {
        fontSize: 24,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
    },
    submitButton: {
        borderRadius: 12,
        backgroundColor: '#94A3B8',
    },
    submitButtonActive: {
        backgroundColor: '#0D9488',
    },
    submitButtonContent: {
        paddingVertical: 8,
    },
    submitButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});
