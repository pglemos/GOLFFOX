import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Adaptador de storage para Expo SecureStore
const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('SecureStore setItem error:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('SecureStore removeItem error:', error);
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export type UserRole = 'admin' | 'empresa' | 'operador' | 'motorista' | 'passageiro';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    company_id?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🔍 Buscando perfil para:', userId);
    const { data, error } = await supabase
        .from('users')
        .select('id, email, role, name, company_id')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data as UserProfile;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        // Ignorar erro de sessão não existente - usuário já está deslogado
        if (error && !error.message?.includes('session')) {
            throw error;
        }
    } catch (error: any) {
        // Ignorar AuthSessionMissingError - significa que não há sessão
        if (!error?.message?.includes('Auth session missing')) {
            console.error('Logout error:', error);
        }
    }
}

export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}
