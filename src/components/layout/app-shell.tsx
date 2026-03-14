"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/context/auth-context";
import { CompanySelector } from "@/components/company-selector";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, companyId, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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

    // 1. First-pass: Prevent hydration mismatch
    if (!mounted) {
        return <div className="h-screen w-full bg-background" />;
    }

    // 2. Auth Loading
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

    // Auth Redirects
    if (!user && !isAuthPage) {
        return <div className="h-screen w-full bg-background" />;
    }

    // Auth Pages: Login/Register
    if (isAuthPage) {
        if (user) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-background">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            );
        }
        return <main className="h-screen w-full overflow-hidden">{children}</main>;
    }

    // Missing Company: Show Selector
    if (!companyId) {
        return (
            <div className="h-screen w-full bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
                <CompanySelector />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-body relative">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <AppSidebar 
                isExpanded={isSidebarExpanded} 
                isMobileOpen={isMobileMenuOpen}
                toggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
                closeMobile={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex flex-col flex-1 min-w-0 h-full relative">
                <header className="flex h-16 shrink-0 items-center justify-between px-4 lg:px-10 border-b border-gray-100 bg-white/80 backdrop-blur-md z-30">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 lg:hidden text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                        </button>
                        <h2 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-[0.25em] lg:tracking-[0.4em] truncate">MoneyFlow Pro</h2>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-6">
                        <UserNav />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-12 bg-gray-50/30">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="max-w-[2000px] mx-auto w-full min-h-full"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Floating Watermark */}
            <div className="fixed bottom-4 right-4 pointer-events-none z-50 opacity-15 hover:opacity-100 transition-opacity duration-500 hidden sm:block">
                <div className="bg-white/40 shadow-sm backdrop-blur-[2px] border border-gray-200/50 px-3 py-1.5 rounded-full flex items-center gap-2 ring-1 ring-black/5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] text-white font-black shadow-sm">
                        P
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                        Design & Dev by <span className="text-indigo-600/50">Parth</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
