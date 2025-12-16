import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../src/auth/AuthProvider';

// Tema customizado GolfFox - Cores alinhadas com a Web
const golfFoxColors = {
    primary: '#F97316', // Laranja (Brand - igual ao Web)
    secondary: '#FB923C', // Laranja claro
    tertiary: '#10B981', // Verde (sucesso)
    error: '#EF4444', // Vermelho
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    outline: '#E2E8F0',
};

const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...golfFoxColors,
    },
};

const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#FB923C', // Laranja claro no dark
        secondary: '#FDBA74',
        tertiary: '#34D399',
        background: '#0B1220',
        surface: '#1E293B',
        surfaceVariant: '#334155',
        onPrimary: '#FFFFFF',
        onSecondary: '#000000',
    },
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <AuthProvider>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    <Stack
                        screenOptions={{
                            headerStyle: {
                                backgroundColor: theme.colors.primary,
                            },
                            headerTintColor: '#FFFFFF',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                            contentStyle: {
                                backgroundColor: theme.colors.background,
                            },
                        }}
                    >
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
                        <Stack.Screen name="driver" options={{ headerShown: false }} />
                        <Stack.Screen name="passenger" options={{ headerShown: false }} />
                    </Stack>
                </AuthProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
