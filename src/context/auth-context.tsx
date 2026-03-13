"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    rights: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string) => void;
    register: (token: string, refreshToken: string) => void;
    logout: () => void;
    companyId: number | null;
    setCompanyId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper function to decode JWT and get user data
function getUserFromToken(token: string): User | null {
    try {
        const decoded: any = jwtDecode(token);

        // ASP.NET Core often uses long URIs for claim types
        const id = decoded.sub ||
            decoded.nameid ||
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

        const username = decoded.unique_name ||
            decoded.name ||
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];

        const email = decoded.email ||
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

        const role = decoded.role ||
            decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        const rights = decoded.Right || decoded.rights || [];
        const rightsArray = Array.isArray(rights) ? rights : [rights];

        if (!id) return null;

        return {
            id: typeof id === 'string' ? parseInt(id) : id,
            username: username || 'User',
            email: email || '',
            role: role || 'User',
            rights: rightsArray
        };
    } catch (error) {
        console.error("Failed to decode token", error);
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const storedCompanyId = localStorage.getItem('companyId');

        if (storedCompanyId) {
            setCompanyIdState(parseInt(storedCompanyId));
        }

        if (token) {
            const userData = getUserFromToken(token);
            if (userData) {
                setUser(userData);
            } else {
                // Invalid token? Try to refresh or logout
                // For simplicity, just logout if decoding fails
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = React.useCallback((token: string, refreshToken: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
 
        const userData = getUserFromToken(token);
        setUser(userData);
 
        router.push('/');
    }, [router]);
 
    const register = React.useCallback((token: string, refreshToken: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
 
        const userData = getUserFromToken(token);
        setUser(userData);
 
        router.push('/');
    }, [router]);

    const [companyId, setCompanyIdState] = useState<number | null>(null);

    const setCompanyId = React.useCallback((id: number | null) => {
        setCompanyIdState(id);
        if (id) {
            localStorage.setItem('companyId', id.toString());
        } else {
            localStorage.removeItem('companyId');
        }
    }, []);

    const logout = React.useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('companyId');
        setUser(null);
        setCompanyIdState(null);
        router.push('/login');
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
