export default {
    name: 'GolfFox',
    slug: 'golffox',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.svg',
    scheme: 'golffox',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
        image: './assets/icon.svg',
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
        },
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/icon.svg',
            backgroundColor: '#1E3A8A',
        },
        package: 'com.golffox.mobile',
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
        permissions: [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
            'ACCESS_BACKGROUND_LOCATION',
            'CAMERA',
        ],
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/icon.svg',
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
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        router: {
            origin: false,
        },
        eas: {
            projectId: 'golffox-mobile',
        },
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
};
