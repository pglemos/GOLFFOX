import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/utils/env';

// Validar variáveis de ambiente antes de criar cliente
let supabaseUrl: string;
let supabaseAnonKey: string;

try {
  supabaseUrl = getSupabaseUrl();
  supabaseAnonKey = getSupabaseAnonKey();
} catch (error) {
  // Em desenvolvimento, permitir valores vazios com warning
  if (__DEV__) {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas:', error instanceof Error ? error.message : String(error));
    supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  } else {
    // Em produção, lançar erro
    throw new Error(`Configuração inválida: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Adaptador de storage híbrido: SecureStore (Native) / AsyncStorage (Web)
const StorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return await AsyncStorage.getItem(key);
            }
            return await SecureStore.getItemAsync(key);
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                await AsyncStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (error) {
            console.error('Storage setItem error:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            if (Platform.OS === 'web') {
                await AsyncStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error('Storage removeItem error:', error);
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: StorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Roles em PT-BR (mobile) e EN (schema)
export type UserRole = 'admin' | 'empresa' | 'operador' | 'motorista' | 'passageiro';
type SchemaRole = 'admin' | 'operador' | 'transportadora' | 'motorista' | 'passageiro';

// Mapeamento PT-BR ↔ EN
const roleToSchema: Record<UserRole, SchemaRole> = {
    admin: 'admin',
    empresa: 'operador',
    operador: 'transportadora',
    motorista: 'motorista',
    passageiro: 'passageiro',
};

const schemaToRole: Record<SchemaRole, UserRole> = {
    admin: 'admin',
    operador: 'empresa',
    transportadora: 'operador',
    motorista: 'motorista',
    passageiro: 'passageiro',
};

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    company_id?: string;
    transportadora_id?: string;
    phone?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🔍 Buscando perfil para:', userId);

    try {
        // Primeiro tenta via API do backend (bypassa RLS)
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://golffox.vercel.app';
        const response = await fetch(`${API_URL}/api/mobile/profile?userId=${userId}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Perfil encontrado via API:', data.name);

            // Converter role do schema para PT-BR se necessário
            const rawRole = data.role as string;
            const normalizedRole = schemaToRole[rawRole as SchemaRole] || rawRole as UserRole;

            return {
                ...data,
                role: normalizedRole,
            } as UserProfile;
        }

        // Fallback para query direta (se RLS permitir)
        console.log('⚠️ API falhou, tentando query direta...');
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, name, company_id, transportadora_id, phone')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }

        if (!data) {
            console.warn('Perfil não encontrado para userId:', userId);
            return null;
        }

        // Converter role do schema para PT-BR se necessário
        const rawRole = data.role as string;
        const normalizedRole = schemaToRole[rawRole as SchemaRole] || rawRole as UserRole;

        return {
            ...data,
            role: normalizedRole,
        } as UserProfile;
    } catch (err) {
        console.error('Exception in getUserProfile:', err);
        return null;
    }
}

export async function signIn(loginInput: string, password: string) {
    // Limpar apenas números do input (pode ser CPF ou email)
    const cleanInput = loginInput.replace(/\D/g, '');

    // Se parece ser um CPF (11 dígitos), converter para formato de email
    let email: string;
    if (cleanInput.length === 11) {
        // É um CPF - tentar primeiro como motorista, depois como passageiro/funcionário
        // O Auth retornará erro se não existir, então tentamos os dois
        email = `${cleanInput}@motorista.golffox.app`;
    } else if (loginInput.includes('@')) {
        // É um email normal
        email = loginInput.toLowerCase().trim();
    } else {
        // Tentar como CPF mesmo assim (pode ter menos dígitos por erro de digitação)
        email = `${cleanInput}@motorista.golffox.app`;
    }

    // Primeira tentativa: como motorista
    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    // Se falhou e parece ser CPF, tentar como passageiro
    if (error && cleanInput.length >= 11) {
        const passageiroEmail = `${cleanInput}@passageiro.golffox.app`;
        const result = await supabase.auth.signInWithPassword({
            email: passageiroEmail,
            password,
        });

        if (!result.error) {
            return result.data;
        }

        // Tentar também como funcionário
        const funcionarioEmail = `${cleanInput}@funcionario.golffox.app`;
        const funcResult = await supabase.auth.signInWithPassword({
            email: funcionarioEmail,
            password,
        });

        if (!funcResult.error) {
            return funcResult.data;
        }
    }

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error && !error.message?.includes('session')) {
            throw error;
        }
    } catch (error: any) {
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

// ====================================================
// motorista SERVICES
// ====================================================

export interface Trip {
    id: string;
    route_id: string;
    motorista_id: string;
    veiculo_id: string;
    status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled';
    scheduled_date: string;
    scheduled_start_time: string;
    start_time?: string;
    end_time?: string;
    route?: Route;
    veiculo?: veiculo;
}

export interface Route {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance?: number;
    estimated_duration?: number;
}

export interface veiculo {
    id: string;
    plate: string;
    model?: string;
    manufacturer?: string;
    capacity?: number;
}

export async function getDriverTrips(driverId: string, date?: string) {
    const today = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('trips')
        .select(`
            *,
            route:routes(*),
            veiculo:veiculos(*)
        `)
        .eq('motorista_id', driverId)
        .gte('scheduled_date', today)
        .order('scheduled_start_time', { ascending: true });

    if (error) {
        console.error('Error fetching motorista trips:', error);
        return [];
    }

    return data as Trip[];
}

export async function updateTripStatus(tripId: string, status: Trip['status']) {
    const updates: any = { status };

    if (status === 'inProgress') {
        updates.actual_start_time = new Date().toISOString();
    } else if (status === 'completed') {
        updates.actual_end_time = new Date().toISOString();
    }

    const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId);

    return !error;
}

// ====================================================
// CHECKLIST SERVICES
// ====================================================

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean | null;
    notes?: string;
}

export interface VeiculoChecklist {
    id?: string;
    trip_id: string;
    motorista_id: string;
    veiculo_id: string;
    items: ChecklistItem[];
    photos?: string[];
    odometer_reading?: number;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'incomplete';
}

export async function saveVehicleChecklist(checklist: VeiculoChecklist) {
    const { data, error } = await supabase
        .from('veiculo_checklists')
        .upsert({
            ...checklist,
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving checklist:', error);
        return null;
    }

    return data;
}

// ====================================================
// CHECK-IN SERVICES
// ====================================================

export interface PassengerCheckin {
    trip_id?: string;
    passageiro_id?: string;
    motorista_id: string;
    type: 'boarding' | 'dropoff';
    method: 'qr' | 'nfc' | 'manual';
    passenger_identifier?: string;
    latitude?: number;
    longitude?: number;
    stop_name?: string;
}

export async function createPassengerCheckin(checkin: PassengerCheckin) {
    const { data, error } = await supabase
        .from('passageiro_checkins')
        .insert(checkin)
        .select()
        .single();

    if (error) {
        console.error('Error creating checkin:', error);
        return null;
    }

    return data;
}

export async function getTripCheckins(tripId: string) {
    const { data, error } = await supabase
        .from('passageiro_checkins')
        .select(`
            *,
            passageiro:users!passageiro_id(id, name, email)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching checkins:', error);
        return [];
    }

    return data;
}

// ====================================================
// LOCATION TRACKING
// ====================================================

export async function updateDriverLocation(
    driverId: string,
    tripId: string | null,
    location: {
        latitude: number;
        longitude: number;
        altitude?: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
    }
) {
    const { error } = await supabase
        .from('motorista_locations')
        .insert({
            motorista_id: driverId,
            trip_id: tripId,
            ...location,
        });

    return !error;
}

export async function getDriverLastLocation(driverId: string) {
    const { data, error } = await supabase
        .from('motorista_locations')
        .select('*')
        .eq('motorista_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        return null;
    }

    return data;
}

// ====================================================
// MESSAGES
// ====================================================

export interface DriverMessage {
    motorista_id: string;
    transportadora_id?: string;
    sender: 'motorista' | 'central';
    message: string;
    message_type?: 'text' | 'location' | 'emergency' | 'delay' | 'system';
    is_emergency?: boolean;
    metadata?: any;
}

export async function sendDriverMessage(msg: DriverMessage) {
    const { data, error } = await supabase
        .from('motorista_messages')
        .insert(msg)
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    return data;
}

export async function getDriverMessages(driverId: string, limit = 50) {
    const { data, error } = await supabase
        .from('motorista_messages')
        .select('*')
        .eq('motorista_id', driverId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data.reverse(); // Mensagens mais antigas primeiro
}

// ====================================================
// passageiro SERVICES
// ====================================================

export async function getPassengerTrips(passengerId: string) {
    // Buscar viagens onde o passageiro tem checkin ou está na rota
    const { data, error } = await supabase
        .from('trips')
        .select(`
            *,
            route:routes(*),
            veiculo:veiculos(*),
            motorista:users!motorista_id(id, name, phone)
        `)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_start_time', { ascending: true })
        .limit(10);

    if (error) {
        console.error('Error fetching passageiro trips:', error);
        return [];
    }

    return data;
}

export async function getAnnouncements(companyId?: string) {
    let query = supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('published_at', { ascending: false });

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.limit(20);

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }

    return data;
}

export async function createPassengerCancellation(cancellation: {
    passageiro_id: string;
    trip_id?: string;
    scheduled_date: string;
    reason: 'home_office' | 'folga' | 'ferias' | 'medico' | 'outro';
    reason_details?: string;
    pause_notifications?: boolean;
    pause_until?: string;
}) {
    const { data, error } = await supabase
        .from('passageiro_cancellations')
        .insert(cancellation)
        .select()
        .single();

    if (error) {
        console.error('Error creating cancellation:', error);
        return null;
    }

    return data;
}

export async function createTripEvaluation(evaluation: {
    trip_id?: string;
    passageiro_id: string;
    motorista_id?: string;
    nps_score: number;
    tags?: string[];
    comment?: string;
}) {
    const { data, error } = await supabase
        .from('trip_evaluations')
        .insert(evaluation)
        .select()
        .single();

    if (error) {
        console.error('Error creating evaluation:', error);
        return null;
    }

    return data;
}
