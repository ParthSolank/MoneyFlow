"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Shield, Mail, Calendar, MoreVertical, Trash2, Edit2, ShieldCheck, UserX, Activity, Key, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { userApi, User } from "@/lib/api-client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { usePermissions } from "@/hooks/use-permissions";

const AVAILABLE_RIGHTS = [
    { id: "CORE_TRANSACTIONS_VIEW", label: "View Transactions" },
    { id: "CORE_TRANSACTIONS_CREATE", label: "Create Transactions" },
    { id: "CORE_TRANSACTIONS_EDIT", label: "Edit Transactions" },
    { id: "CORE_TRANSACTIONS_DELETE", label: "Delete Transactions" },
    { id: "CORE_LEDGERS_VIEW", label: "View Ledgers" },
    { id: "CORE_LEDGERS_CREATE", label: "Create Ledgers" },
    { id: "CORE_LEDGERS_EDIT", label: "Edit Ledgers" },
    { id: "CORE_LEDGERS_DELETE", label: "Delete Ledgers" },
    { id: "VIEW_REPORTS", label: "View Reports" },
];

export default function UserManagementPage() {
    const { user: currentUserProfile } = useAuth();
    const { canView, canCreate, canEdit, canDelete } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<{ username: string, role: string, status: string, rights: string[] }>({ username: "", role: "", status: "Active", rights: [] });

    // Password Reset Modal State
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    // Create User Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ username: "", email: "", password: "", role: "User" });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUserProfile && !canView("ADMIN", "USER_MANAGEMENT")) {
            router.replace("/");
        } else if (currentUserProfile) {
            loadUsers();
        }
    }, [currentUserProfile, router, canView]);

    const loadUsers = async () => {
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

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({ username: user.username, role: user.role, status: user.status || "Active", rights: user.rights || [] });
        setIsEditOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setIsSubmitting(true);
            await userApi.update(selectedUser.id, editForm);

            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
            toast({ title: "User updated successfully" });
            setIsEditOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update user" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openResetModal = (user: User) => {
        setSelectedUser(user);
        setNewPassword("");
        setIsResetOpen(true);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || newPassword.length < 6) {
            toast({ variant: "destructive", title: "Password must be at least 6 characters" });
            return;
        }

        try {
            setIsSubmitting(true);
            await userApi.resetPassword(selectedUser.id, newPassword);
            toast({ title: "Password reset successfully", description: `Password for ${selectedUser.username} has been updated.` });
            setIsResetOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to reset password" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.username || !createForm.email || createForm.password.length < 6) {
            toast({ variant: "destructive", title: "Please fill all fields. Password must be at least 6 characters." });
            return;
        }

        try {
            setIsSubmitting(true);
            const newUser = await userApi.create(createForm);
            setUsers([...users, newUser]);
            toast({ title: "User created successfully", description: `${newUser.username} has been added.` });
            setIsCreateOpen(false);
            setCreateForm({ username: "", email: "", password: "", role: "User" }); // reset form
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create user", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await userApi.delete(id);
            setUsers(users.filter(u => u.id !== id));
            toast({ title: "User deleted" });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to delete user" });
        }
    };

    if (!currentUserProfile || !canView("ADMIN", "USER_MANAGEMENT")) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 p-1"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-900 to-rose-600 dark:from-rose-400 dark:to-rose-200">
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">Control access and manage system personnel.</p>
                </div>
                {/* Note: In a real app, Add New User would have its own modal/endpoint utilizing Admin privileges, 
                    for now we leave button static or we could easily wire it. */}
                {canCreate("ADMIN", "USER_MANAGEMENT") && (
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/20">
                        <UserPlus className="h-4 w-4" />
                        Invite User
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.role === 'Admin').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.status !== 'Suspended').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                <UserX className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.status === 'Suspended').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md ring-1 ring-gray-100 dark:bg-gray-900/80 dark:ring-gray-800 overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-10 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                                <TableRow>
                                    <TableHead className="font-semibold">User</TableHead>
                                    <TableHead className="font-semibold">Role</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Joined</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/20 flex items-center justify-center text-rose-700 dark:text-rose-400 font-bold">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{u.username}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {u.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={u.role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                                                {u.role === 'Admin' && <Shield className="h-3 w-3 mr-1" />}
                                                {u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${u.status === 'Suspended' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className="text-sm font-medium">{u.status || 'Active'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {u.joined ? new Date(u.joined).toLocaleDateString() : 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <div className="flex justify-end gap-2">
                                                {canEdit("ADMIN", "USER_MANAGEMENT") && (
                                                    <>
                                                        <Button variant="ghost" size="icon" title="Reset Password" onClick={() => openResetModal(u)} className="h-8 w-8 hover:bg-rose-100 hover:text-rose-600 rounded-full">
                                                            <Key className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" title="Edit User" onClick={() => openEditModal(u)} className="h-8 w-8 hover:bg-rose-100 hover:text-rose-600 rounded-full">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {canDelete("ADMIN", "USER_MANAGEMENT") && u.email !== 'admin@demo.com' && (
                                                    <Button variant="ghost" size="icon" title="Delete User" onClick={() => handleDeleteUser(u.id)} className="h-8 w-8 hover:bg-rose-100 hover:text-rose-600 rounded-full">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>
                                Create a new system account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input required value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="johndoe123" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Password <span className="text-xs text-muted-foreground">(min 6 chars)</span></Label>
                                <Input required type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="User">User</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <form onSubmit={handleUpdateUser}>
                        <DialogHeader>
                            <DialogTitle>Edit User Profile</DialogTitle>
                            <DialogDescription>
                                Modify user role and active status.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input disabled value={editForm.username} />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editForm.role === 'Admin' && (
                                <div className="space-y-3 pt-2">
                                    <Label>Admin Rights</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                        {AVAILABLE_RIGHTS.map((right) => (
                                            <div key={right.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={right.id}
                                                    checked={editForm.rights.includes(right.id)}
                                                    onCheckedChange={(checked) => {
                                                        setEditForm(prev => {
                                                            if (checked) {
                                                                return { ...prev, rights: [...prev.rights, right.id] };
                                                            } else {
                                                                return { ...prev, rights: prev.rights.filter(r => r !== right.id) };
                                                            }
                                                        });
                                                    }}
                                                />
                                                <label
                                                    htmlFor={right.id}
                                                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {right.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <form onSubmit={handleResetPassword}>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                                Enter a new password for {selectedUser?.username}. They will be able to log in immediately.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || newPassword.length < 6} className="bg-rose-600 hover:bg-rose-700 text-white">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                                Reset Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </motion.div>
    )
}

/* aria-label */
