"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Save, XCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { userApi, User } from "@/lib/api-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

const SECTIONS = [
    {
        id: "CORE",
        title: "Core Features",
        pages: [
            { id: "DASHBOARD", name: "Dashboard & Analytics" },
            { id: "TRANSACTIONS", name: "Transactions" },
            { id: "LEDGERS", name: "Ledgers & Accounts" },
            { id: "CATEGORIES", name: "Categories" },
            { id: "BUDGETS", name: "Budgets" },
        ]
    },
    {
        id: "ADMIN",
        title: "Administration",
        pages: [
            { id: "USER_MANAGEMENT", name: "User Management" },
            { id: "ACCESS_CONTROL", name: "Access Control" },
            { id: "MASTERS", name: "System Masters" },
            { id: "SYSTEM_AUDIT", name: "System Audit" },
        ]
    }
];

const ACTIONS = [
    { id: "VIEW", name: "View" },
    { id: "CREATE", name: "Create" },
    { id: "EDIT", name: "Edit" },
    { id: "DELETE", name: "Delete" },
];

export default function AccessControlPage() {
    const { user: currentUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Current set of rights mapped to toggles
    const [rightsMap, setRightsMap] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (currentUserProfile && currentUserProfile.role !== "Admin") {
            router.push("/");
        } else if (currentUserProfile) {
            loadInitialData();
        }
    }, [currentUserProfile, router]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            const data = await userApi.getAll();
            setUsers(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load users" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
        const user = users.find(u => u.id.toString() === userId);
        if (user && user.rights) {
            setRightsMap(new Set(user.rights));
        } else {
            setRightsMap(new Set());
        }
    };

    const handleToggle = (rightString: string, checked: boolean) => {
        setRightsMap(prev => {
            const next = new Set(prev);
            if (checked) next.add(rightString);
            else next.delete(rightString);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedUserId) {
            toast({ variant: "destructive", title: "Please select a user first." });
            return;
        }

        const user = users.find(u => u.id.toString() === selectedUserId);
        if (!user) return;

        try {
            setIsSaving(true);
            const updatedRightsArray = Array.from(rightsMap);
            await userApi.update(parseInt(selectedUserId), {
                username: user.username,
                role: user.role,
                status: user.status,
                rights: updatedRightsArray
            });

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, rights: updatedRightsArray } : u
            ));

            toast({ title: "Access control saved successfully", description: `Updated permissions for ${user.username}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to save permissions" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (selectedUserId) {
            handleUserChange(selectedUserId); // Reset to last fetched state
        }
    };

    if (!currentUserProfile || currentUserProfile.role !== "Admin") return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600 dark:from-indigo-400 dark:to-indigo-200">
                        Access Control
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm/6">
                        Configure granular user permissions and module access.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800 p-6">

                {/* Header Dropdown */}
                <div className="w-full md:w-1/3 mb-8">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">ROLEMASTERID / USER *</label>
                    <Select value={selectedUserId} onValueChange={handleUserChange}>
                        <SelectTrigger className="w-full h-10 border-gray-200 focus:ring-indigo-500">
                            <SelectValue placeholder="Select a User to configure rights" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.username} ({u.role})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="p-20 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : !selectedUserId ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-lg dark:bg-gray-800">
                        <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>Select a user from the dropdown above to load and edit their access controls.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {SECTIONS.map((section) => (
                            <div key={section.id} className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{section.title}</h3>

                                <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                            <TableRow>
                                                <TableHead className="font-semibold w-1/3">Page</TableHead>
                                                {ACTIONS.map(action => (
                                                    <TableHead key={action.id} className="font-semibold text-center w-1/6">{action.name}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {section.pages.map((page) => (
                                                <TableRow key={page.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                    <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                                                        {page.name}
                                                    </TableCell>

                                                    {ACTIONS.map(action => {
                                                        const rightString = `${section.id}_${page.id}_${action.id}`;
                                                        return (
                                                            <TableCell key={rightString} className="text-center">
                                                                <Switch
                                                                    checked={rightsMap.has(rightString)}
                                                                    onCheckedChange={(checked) => handleToggle(rightString, checked)}
                                                                />
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </Card>

            {/* Sticky Action Footer */}
            {selectedUserId && (
                <div className="sticky bottom-4 w-full flex justify-end gap-3 mt-8 pb-4">
                    <Button variant="outline" onClick={handleCancel} className="gap-2 bg-white/80 backdrop-blur-md">
                        <XCircle className="h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
