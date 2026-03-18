"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { api } from "@/lib/api";

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
    login: (userData: User) => void;
    register: (userData: User) => void;
    logout: () => Promise<void>;
    companyId: number | null;
    setCompanyId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function getUserFromToken(token: string): User | null {
    try {
        const decoded: any = jwtDecode(token);
        const id = decoded.sub || decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        const username = decoded.unique_name || decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        const email = decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
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
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyIdState] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('companyId');

        if (storedCompanyId) {
            setCompanyIdState(parseInt(storedCompanyId, 10));
        }

        // User info is decoded from JWT which is now in HttpOnly cookie
        // No need to retrieve from localStorage
        setLoading(false);
    }, []);

    const login = React.useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const register = React.useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const setCompanyId = React.useCallback((id: number | null) => {
        setCompanyIdState(id);
        if (id) {
            localStorage.setItem('companyId', id.toString());
        } else {
            localStorage.removeItem('companyId');
        }
    }, []);

    const logout = React.useCallback(async () => {
        try {
            await api.post('/auth/logout', {});
        } catch (error) {
            console.error('Failed to logout from server', error);
        }
        // Cookies are cleared by the backend via Set-Cookie headers
        localStorage.removeItem('companyId');
        setUser(null);
        setCompanyIdState(null);
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
