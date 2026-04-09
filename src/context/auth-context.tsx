"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
    username: string;
    role: string;
    rights: string[];
    company_id?: string;
}

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    rights: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    companyId: string | null;
    setCompanyId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyIdState] = useState<string | null>(null);
    const router = useRouter();

    // Fetch user profile data
    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('username, role, rights, company_id')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    // Load session on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    const profile = await fetchUserProfile(session.user.id);
                    setUser({
                        id: session.user.id,
                        username: profile?.username || session.user.email?.split('@')[0] || 'User',
                        email: session.user.email || '',
                        role: profile?.role || 'User',
                        rights: profile?.rights || [],
                    });

                    if (profile?.company_id) {
                        setCompanyIdState(profile.company_id);
                        localStorage.setItem('companyId', profile.company_id);
                    }
                }
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                setUser({
                    id: session.user.id,
                    username: profile?.username || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email || '',
                    role: profile?.role || 'User',
                    rights: profile?.rights || [],
                });

                if (profile?.company_id) {
                    setCompanyIdState(profile.company_id);
                    localStorage.setItem('companyId', profile.company_id);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setCompanyIdState(null);
                localStorage.removeItem('companyId');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = React.useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.user) {
            const profile = await fetchUserProfile(data.user.id);
            setUser({
                id: data.user.id,
                username: profile?.username || data.user.email?.split('@')[0] || 'User',
                email: data.user.email || '',
                role: profile?.role || 'User',
                rights: profile?.rights || [],
            });

            if (profile?.company_id) {
                setCompanyIdState(profile.company_id);
                localStorage.setItem('companyId', profile.company_id);
            }
        }
    }, []);

    const register = React.useCallback(async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            const profile = await fetchUserProfile(data.user.id);
            setUser({
                id: data.user.id,
                username: profile?.username || username || data.user.email?.split('@')[0] || 'User',
                email: data.user.email || '',
                role: profile?.role || 'User',
                rights: profile?.rights || [],
            });
        }
    }, []);

    const setCompanyId = React.useCallback((id: string | null) => {
        setCompanyIdState(id);
        if (id) {
            localStorage.setItem('companyId', id);
        } else {
            localStorage.removeItem('companyId');
        }
    }, []);

    const logout = React.useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCompanyIdState(null);
        localStorage.removeItem('companyId');
        router.replace('/login');
    }, [router]);

    const contextValue = React.useMemo(() => ({
        user,
        loading,
        login,
        register,
        logout,
        companyId,
        setCompanyId
    }), [user, loading, login, register, logout, companyId, setCompanyId]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
