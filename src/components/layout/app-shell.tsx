"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/context/auth-context";
import { CompanySelector } from "@/components/company-selector";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, companyId, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    
    const isAuthPage = pathname === "/login" || pathname === "/register";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && mounted) {
            if (!user && !isAuthPage) {
                router.replace("/login");
            } else if (user && isAuthPage) {
                router.replace("/");
            }
        }
    }, [user, loading, isAuthPage, router, mounted]);

    // 1. First-pass: Prevent hydration mismatch by rendering a minimal shell until mounted
    if (!mounted) {
        return <div className="h-screen w-full bg-background" />;
    }

    // 2. Auth Loading: Show a subtle, themed loader
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="h-16 w-16 border-4 border-indigo-100 rounded-full"></div>
                        <div className="absolute top-0 h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="text-lg font-bold tracking-tight text-indigo-950">MoneyFlow Pro</p>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 animate-pulse">Initializing Security...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Auth Redirects: Handled by useEffect, but we return nothing during the split second of transition
    if (!user && !isAuthPage) {
        return <div className="h-screen w-full bg-background" />;
    }

    // 4. Auth Pages: Login/Register
    if (isAuthPage) {
        // If we have a user on an auth page, we're about to redirect - show loader to prevent flicker
        if (user) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-background">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            );
        }
        return <main className="h-screen w-full overflow-hidden">{children}</main>;
    }

    // 5. Protected Route check: If no user, useEffect will redirect to login
    if (!user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    // 6. Missing Company: Show Selector
    if (!companyId) {
        return (
            <div className="h-screen w-full bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
                <CompanySelector />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-body">
            <AppSidebar 
                isExpanded={isSidebarExpanded} 
                toggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
            />
            <div className="flex flex-col flex-1 min-w-0 h-full">
                <header className="flex h-16 shrink-0 items-center justify-between px-8 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">MoneyFlow Pro</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-gray-50/30">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="max-w-[1600px] mx-auto w-full min-h-full"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
