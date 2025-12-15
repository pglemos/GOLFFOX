import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, signIn, signOut, getSession, getUserProfile, UserProfile, UserRole } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        if (session?.user?.id) {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
        } else {
            setProfile(null);
        }
    }, [session]);

    useEffect(() => {
        // Carregar sessão inicial
        const initSession = async () => {
            try {
                const currentSession = await getSession();
                setSession(currentSession);

                if (currentSession?.user?.id) {
                    const userProfile = await getUserProfile(currentSession.user.id);
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error('Error initializing session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth event:', event);
                setSession(newSession);

                if (newSession?.user?.id) {
                    const userProfile = await getUserProfile(newSession.user.id);
                    setProfile(userProfile);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { session: newSession } = await signIn(email, password);
            setSession(newSession);

            if (newSession?.user?.id) {
                const userProfile = await getUserProfile(newSession.user.id);
                setProfile(userProfile);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await signOut();
        } catch (error) {
            console.log('Logout completed with info:', error);
        } finally {
            // Sempre limpar estado local, mesmo se signOut falhar
            setSession(null);
            setProfile(null);
            setIsLoading(false);
        }
    };

    const value = {
        session,
        profile,
        isLoading,
        isAuthenticated: !!session,
        login,
        logout,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
    const { isAuthenticated, profile, isLoading } = useAuth();

    const isAllowed = !allowedRoles || (profile && allowedRoles.includes(profile.role));

    return {
        isAuthenticated,
        isAllowed,
        isLoading,
        role: profile?.role,
    };
}
