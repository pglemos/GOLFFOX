import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    name: 'GolfFox',
    slug: 'golffox',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'golffox',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#1E3A8A',
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.golffox.mobile',
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
        infoPlist: {
            NSLocationWhenInUseUsageDescription: 'Precisamos da sua localização para rastrear a rota do ônibus.',
            NSLocationAlwaysUsageDescription: 'Precisamos da sua localização em background para enviar atualizações.',
            NSCameraUsageDescription: 'Precisamos da câmera para escanear QR codes de check-in.',
            NFCReaderUsageDescription: 'Precisamos do NFC para check-in via cartão.',
        },
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#1E3A8A',
        },
        package: 'com.golffox.mobile',
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
        permissions: [
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.ACCESS_BACKGROUND_LOCATION',
            'android.permission.CAMERA',
            'android.permission.NFC',
            'android.permission.RECEIVE_BOOT_COMPLETED',
            'android.permission.VIBRATE',
        ],
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/favicon.png',
    },
    plugins: [
        'expo-router',
        'expo-secure-store',
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission: 'Permitir que $(PRODUCT_NAME) use sua localização.',
            },
        ],
        [
            'expo-camera',
            {
                cameraPermission: 'Permitir que $(PRODUCT_NAME) acesse sua câmera para escanear QR codes.',
            },
        ],
        [
            'expo-notifications',
            {
                icon: './assets/notification-icon.png',
                color: '#1E3A8A',
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        router: {
            origin: false,
        },
        eas: {
            projectId: 'your-eas-project-id',
        },
    },
});
