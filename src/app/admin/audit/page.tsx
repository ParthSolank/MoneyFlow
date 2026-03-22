"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Loader2, Calendar, FileText, User } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { auditApi, AuditLog } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions";

export default function SystemAuditPage() {
    const { user: currentUserProfile } = useAuth();
    const { canView } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUserProfile && !canView("ADMIN", "SYSTEM_AUDIT")) {
            router.replace("/");
        } else if (currentUserProfile) {
            loadAuditLogs();
        }
    }, [currentUserProfile, router, canView]);

    const loadAuditLogs = async () => {
        try {
            setIsLoading(true);
            const data = await auditApi.getAll();
            setLogs(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load audit logs" });
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    if (!currentUserProfile || !canView("ADMIN", "SYSTEM_AUDIT")) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-900 to-rose-600 dark:from-rose-400 dark:to-rose-200">
                        System Audit
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm/6">
                        Monitor user actions and track system changes securely over time.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md ring-1 ring-gray-100 dark:bg-gray-900/80 dark:ring-gray-800 overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-20 flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-16 text-center text-gray-500 rounded-lg">
                            <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p>No audit logs found. Future system activities will appear here.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                                <TableRow>
                                    <TableHead className="font-semibold w-[180px]">Timestamp</TableHead>
                                    <TableHead className="font-semibold">User</TableHead>
                                    <TableHead className="font-semibold">Action</TableHead>
                                    <TableHead className="font-semibold">Module</TableHead>
                                    <TableHead className="font-semibold w-[400px]">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log, i) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(i, 20) * 0.05 }}
                                        className="group hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors"
                                    >
                                        <TableCell className="text-muted-foreground text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {log.username}
                                                <span className="text-xs text-gray-400">(#{log.userId})</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`font-semibold rounded-md border text-xs px-2 py-0.5 ${getActionColor(log.action)}`}>
                                                {log.action.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                                {log.module}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-sm truncate" title={log.details}>
                                            {log.details}
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
