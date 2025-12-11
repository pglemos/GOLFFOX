import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';

export default function Index() {
    const { isAuthenticated, profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            // Usuário não logado -> vai para login
            router.replace('/login');
            return;
        }

        // Redirecionar com base no role
        switch (profile?.role) {
            case 'motorista':
                router.replace('/driver');
                break;
            case 'passageiro':
                router.replace('/passenger');
                break;
            case 'admin':
            case 'empresa':
            case 'operador':
                // Esses roles não deveriam usar o app móvel
                // Mostrar mensagem ou redirecionar para login com aviso
                router.replace('/login');
                break;
            default:
                router.replace('/login');
        }
    }, [isAuthenticated, profile, isLoading]);

    // Tela de loading enquanto verifica autenticação
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
});
