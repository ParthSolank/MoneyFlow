"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/context/auth-context";
import { CompanySelector } from "@/components/company-selector";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, companyId, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    
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

    // Prevent hydration mismatch and flickering during initial load
    if (!mounted || loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Establishing secure connection...</p>
                </div>
            </div>
        );
    }

    if (isAuthPage) {
        return <main className="flex-1 h-screen w-full">{children}</main>;
    }

    if (!user) {
        return null;
    }

    if (!companyId) {
        return <CompanySelector />;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                        <SidebarTrigger />
                        <div className="flex-1" />
                        <div className="flex items-center gap-4">
                            <UserNav />
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
