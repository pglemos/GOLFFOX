import { Stack } from 'expo-router';

export default function DriverLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0D9488',
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
                    headerLeft: () => null,
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
            <Stack.Screen
                name="chat"
                options={{ title: 'Central de Operações' }}
            />
        </Stack>
    );
}
