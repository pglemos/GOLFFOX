import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function PassengerLayout() {
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
                    title: 'Passageiro',
                    headerLeft: () => null,
                }}
            />
            <Stack.Screen
                name="map"
                options={{ title: 'Acompanhar Ônibus' }}
            />
            <Stack.Screen
                name="details"
                options={{ title: 'Detalhes da Rota' }}
            />
            <Stack.Screen
                name="feedback"
                options={{ title: 'Avaliar Viagem' }}
            />
        </Stack>
    );
}
