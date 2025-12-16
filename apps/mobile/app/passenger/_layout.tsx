import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function PassengerLayout() {
    const theme = useTheme();
    const colors = theme.colors;

    const getTabIcon = (name: IoniconsName, focused: boolean) => (
        <Ionicons
            name={focused ? name : `${name}-outline` as IoniconsName}
            size={24}
            color={focused ? colors.primary : colors.secondary}
        />
    );

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: colors.onPrimary,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.secondary,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.elevation.level5,
                    paddingTop: 4,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginBottom: 6,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    headerTitle: 'GolfFox',
                    tabBarIcon: ({ focused }) => getTabIcon('home', focused),
                    headerLeft: () => null,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Mapa',
                    headerTitle: 'Localize seu Transporte',
                    tabBarIcon: ({ focused }) => getTabIcon('map', focused),
                }}
            />
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Check-in',
                    headerTitle: 'Registrar Check-in',
                    tabBarIcon: ({ focused }) => getTabIcon('qr-code', focused),
                }}
            />
            <Tabs.Screen
                name="mural"
                options={{
                    title: 'Mural',
                    headerTitle: 'Mural de Avisos',
                    tabBarIcon: ({ focused }) => getTabIcon('megaphone', focused),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Mais',
                    headerTitle: 'Meu Perfil',
                    tabBarIcon: ({ focused }) => getTabIcon('person', focused),
                }}
            />
            {/* Telas ocultas na tab bar */}
            <Tabs.Screen
                name="details"
                options={{
                    href: null,
                    headerTitle: 'Detalhes da Rota',
                }}
            />
            <Tabs.Screen
                name="feedback"
                options={{
                    href: null,
                    headerTitle: 'Avaliar Viagem',
                }}
            />
            <Tabs.Screen
                name="ajuda"
                options={{
                    href: null,
                    headerTitle: 'Ajuda e FAQ',
                }}
            />
            <Tabs.Screen
                name="endereco"
                options={{
                    href: null,
                    headerTitle: 'Meu Endereço',
                }}
            />
            <Tabs.Screen
                name="historico"
                options={{
                    href: null,
                    headerTitle: 'Histórico',
                }}
            />
            <Tabs.Screen
                name="estatisticas"
                options={{
                    href: null,
                    headerTitle: 'Estatísticas',
                }}
            />
        </Tabs>
    );
}
