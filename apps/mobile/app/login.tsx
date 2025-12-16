import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, HelperText, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await login(email.trim().toLowerCase(), password);
            // Redirecionamento é feito automaticamente pelo index.tsx
            router.replace('/');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.message?.includes('Invalid login')) {
                setError('Email ou senha inválidos');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('Email não confirmado. Verifique sua caixa de entrada.');
            } else {
                setError('Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.logoContainer}>
                    <Text variant="headlineLarge" style={styles.title}>
                        🚌 GolfFox
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Sistema de Transporte
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setError('');
                        }}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        left={<TextInput.Icon icon="email" />}
                        style={styles.input}
                        disabled={isSubmitting}
                    />

                    <TextInput
                        label="Senha"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setError('');
                        }}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                        style={styles.input}
                        disabled={isSubmitting}
                    />

                    {error ? (
                        <HelperText type="error" visible={!!error}>
                            {error}
                        </HelperText>
                    ) : null}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                </View>

                <Text variant="bodySmall" style={styles.footer}>
                    App exclusivo para motoristas e passageiros
                </Text>
            </Surface>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    card: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        color: '#F97316',
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#64748B',
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    button: {
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: '#F97316',
    },
    buttonContent: {
        paddingVertical: 8,
    },
    footer: {
        textAlign: 'center',
        color: '#94A3B8',
        marginTop: 24,
    },
});
