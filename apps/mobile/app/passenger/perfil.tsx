import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, Avatar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/styles/theme';

interface MenuItem {
    icon: string;
    label: string;
    desc: string;
    route?: string;
    action?: () => void;
}

export default function PerfilScreen() {
    const { profile, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const menuItems: MenuItem[] = [
        { icon: 'person-outline', label: 'Dados Pessoais', desc: 'Nome, CPF, telefone', route: '/passageiro/perfil' },
        { icon: 'location-outline', label: 'Meu Endereço', desc: 'Atualizar local de embarque', route: '/passageiro/endereco' },
        { icon: 'star-outline', label: 'Avaliar Viagem', desc: 'Enviar feedback', route: '/passageiro/feedback' },
        { icon: 'time-outline', label: 'Histórico', desc: 'Viagens anteriores', route: '/passageiro/historico' },
        { icon: 'bar-chart-outline', label: 'Estatísticas', desc: 'Resumo de uso', route: '/passageiro/estatisticas' },
        { icon: 'help-circle-outline', label: 'Ajuda e FAQ', desc: 'Dúvidas frequentes', route: '/passageiro/ajuda' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Perfil */}
            <Surface style={styles.profileCard} elevation={2}>
                <Avatar.Text
                    size={72}
                    label={profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{profile?.name || 'Usuário'}</Text>
                <Text style={styles.userEmail}>{profile?.email || 'email@exemplo.com'}</Text>
                <View style={styles.roleTag}>
                    <Text style={styles.roleText}>Passageiro</Text>
                </View>
            </Surface>

            {/* Menu */}
            <Surface style={styles.menuCard} elevation={1}>
                {menuItems.map((item, idx) => (
                    <View key={idx}>
                        <Pressable
                            style={styles.menuItem}
                            onPress={() => item.route && router.push(item.route as any)}
                        >
                            <Ionicons name={item.icon as any} size={24} color="#64748B" />
                            <View style={styles.menuInfo}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuDesc}>{item.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </Pressable>
                        {idx < menuItems.length - 1 && <Divider />}
                    </View>
                ))}
            </Surface>

            {/* Logout */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>

            {/* Versão */}
            <Text style={styles.versionText}>GolfFox v1.0.0</Text>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },

    profileCard: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
    avatar: { backgroundColor: theme.colors.primary, marginBottom: 12 },
    userName: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
    userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
    roleTag: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    roleText: { color: theme.colors.primary, fontWeight: '600', fontSize: 12 },

    menuCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    menuInfo: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
    menuDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 8 },
    logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },

    versionText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 },
});
