"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { companyApi, Company } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Building2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function CompanySelector() {
    const { user, companyId, setCompanyId } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");
    const { toast } = useToast();

    const fetchCompanies = async () => {
        try {
            console.log("[CompanySelector] Fetching companies...");
            const data = await companyApi.getAll();
            console.log("[CompanySelector] Companies found:", data);
            setCompanies(data);

            // If only one company exists and none selected, auto-select it
            if (data.length === 1 && !companyId) {
                console.log("[CompanySelector] Auto-selecting only available company:", data[0]);
                setCompanyId(data[0].id!);
            }
        } catch (error) {
            console.error("[CompanySelector] Failed to fetch companies", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCompanies();
        }
    }, [user]);

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;

        try {
            setIsCreating(true);
            const newCompany = await companyApi.create({
                name: newCompanyName,
                description: "Primary Company",
                address: "",
                contactEmail: user?.email || "",
                contactPhone: "",
                isActive: true,
                panNumber: "",
                gstNumber: ""
            });

            toast({
                title: "Success",
                description: `Company "${newCompanyName}" created successfully.`,
            });

            setCompanyId(newCompany.id!);
            setCompanies(prev => [...prev, newCompany]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create company.",
            });
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="font-medium text-gray-600">Setting up your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
            <AnimatePresence mode="wait">
                {companies.length === 0 ? (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="w-full max-w-md shadow-2xl border-indigo-100">
                            <form onSubmit={handleCreateCompany}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 text-indigo-600">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
                                        Create Your Company
                                    </CardTitle>
                                    <CardDescription className="text-base pt-2">
                                        Welcome to MoneyFlow Pro! Let's start by setting up your company profile.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="company-name" className="text-sm font-semibold text-gray-700">Company Name</Label>
                                        <Input
                                            id="company-name"
                                            placeholder="e.g. Acme Corporation Pvt Ltd"
                                            className="h-11 border-gray-200 focus:border-indigo-400 focus:ring-indigo-100 transition-all"
                                            value={newCompanyName}
                                            onChange={(e) => setNewCompanyName(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="pb-8">
                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
                                        disabled={isCreating || !newCompanyName.trim()}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : "Launch Workspace"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="w-full max-w-lg shadow-2xl border-indigo-100 overflow-hidden">
                            <CardHeader className="text-center bg-gray-50/50 border-b pb-6">
                                <CardTitle className="text-2xl font-bold text-gray-900 font-display">Select Workspace</CardTitle>
                                <CardDescription className="text-base px-4">
                                    Choose which company you'd like to manage today.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[400px] overflow-y-auto">
                                    {companies.map((company) => (
                                        <button
                                            key={company.id}
                                            onClick={() => setCompanyId(company.id!)}
                                            className="w-full text-left p-5 flex items-center justify-between hover:bg-indigo-50/50 transition-all border-b last:border-0 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                    <Building2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{company.name}</h3>
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">ID: {company.id}</span>
                                                    </div>
                                                    {company.gstNumber && <p className="text-xs text-muted-foreground font-mono mt-0.5">GST: {company.gstNumber}</p>}
                                                </div>
                                            </div>
                                            {companyId === company.id && (
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <Check className="h-5 w-5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                            {companies.length === 0 && (
                                <CardFooter className="p-4 bg-gray-50/30 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold gap-2"
                                        onClick={() => setCompanies([])}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add New Company
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
