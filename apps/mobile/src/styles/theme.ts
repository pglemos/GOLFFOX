/**
 * GolfFox Mobile Theme
 * Alinhado com GOLF FOX DESIGN SYSTEM - Premium UI (Web)
 */

export const theme = {
    colors: {
        // Brand Colors (Orange)
        primary: '#F97316', // Orange-500
        primaryForeground: '#FAFAFA',
        primaryLight: '#FFF7ED', // Orange-50
        primaryDark: '#C2410C', // Orange-700

        // Neutral Colors (Zinc)
        background: '#FFFFFF',
        backgroundSoft: '#F8FAFC', // Slate-50
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',

        // Text Colors
        text: '#09090B', // Zinc-950
        textSecondary: '#71717A', // Zinc-500
        textMuted: '#A1A1AA', // Zinc-400
        textInverted: '#FFFFFF',

        // Borders
        border: '#E4E4E7', // Zinc-200
        borderFocus: '#F97316',

        // Semantic
        success: '#10B981', // Emerald-500
        error: '#EF4444', // Red-500
        warning: '#F59E0B', // Amber-500
        info: '#3B82F6', // Blue-500

        // Components
        card: '#FFFFFF',
        inputBackground: '#F4F4F5', // Zinc-100
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    fonts: {
        regular: 'Roboto',
        medium: 'Roboto-Medium',
        bold: 'Roboto-Bold',
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
    }
};
