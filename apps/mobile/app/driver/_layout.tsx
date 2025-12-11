import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function DriverLayout() {
    const theme = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Motorista',
                    headerLeft: () => null, // Prevent back to login
                }}
            />
            <Stack.Screen
                name="checklist"
                options={{ title: 'Checklist Pré-Rota' }}
            />
            <Stack.Screen
                name="route"
                options={{ title: 'Rota em Andamento' }}
            />
            <Stack.Screen
                name="scan"
                options={{ title: 'Check-in/out' }}
            />
            <Stack.Screen
                name="history"
                options={{ title: 'Histórico' }}
            />
        </Stack>
    );
}
