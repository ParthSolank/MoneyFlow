"use client"

import { useState, useEffect } from "react"
import { companyApi, financialYearApi, Company, FinancialYear } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import { usePermissions } from "@/hooks/use-permissions";

export default function MastersPage() {
    const { user } = useAuth();
    const { canCreate, canEdit, canDelete } = usePermissions();
    const { toast } = useToast()

    // Company State
    const [companies, setCompanies] = useState<Company[]>([])
    const [loadingCompany, setLoadingCompany] = useState(true)
    const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false)
    const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null)
    const [companyForm, setCompanyForm] = useState<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>>({
        name: "",
        description: "",
        panNumber: "",
        gstNumber: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        isActive: true
    })

    // FY State
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([])
    const [loadingFY, setLoadingFY] = useState(true)
    const [isFYDialogOpen, setIsFYDialogOpen] = useState(false)
    const [editingFYId, setEditingFYId] = useState<number | null>(null)
    const [fyForm, setFyForm] = useState<Omit<FinancialYear, 'id' | 'createdAt' | 'updatedAt'>>({
        name: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        isActive: true,
        description: ""
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchCompanies()
        fetchFYs()
    }, [])

    const fetchCompanies = async () => {
        try {
            const data = await companyApi.getAll()
            setCompanies(data)
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load companies" })
        } finally {
            setLoadingCompany(false)
        }
    }

    const fetchFYs = async () => {
        try {
            const data = await financialYearApi.getAll()
            setFinancialYears(data)
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load financial years" })
        } finally {
            setLoadingFY(false)
        }
    }

    // Company Handlers
    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (editingCompanyId) {
                await companyApi.update(editingCompanyId, companyForm)
                toast({ title: "Success", description: "Company updated successfully" })
            } else {
                await companyApi.create(companyForm)
                toast({ title: "Success", description: "Company created successfully" })
            }
            setIsCompanyDialogOpen(false)
            fetchCompanies()
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save company" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditCompany = (company: Company) => {
        setEditingCompanyId(company.id!)
        setCompanyForm({
            name: company.name,
            description: company.description,
            panNumber: company.panNumber,
            gstNumber: company.gstNumber,
            address: company.address,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            isActive: company.isActive
        })
        setIsCompanyDialogOpen(true)
    }

    const handleDeleteCompany = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this company?")) return
        try {
            await companyApi.delete(id)
            toast({ title: "Deleted", description: "Company removed successfully" })
            fetchCompanies()
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete company" })
        }
    }

    // FY Handlers
    const handleSaveFY = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (editingFYId) {
                await financialYearApi.update(editingFYId, fyForm)
                toast({ title: "Success", description: "Financial Year updated successfully" })
            } else {
                await financialYearApi.create(fyForm)
                toast({ title: "Success", description: "Financial Year created successfully" })
            }
            setIsFYDialogOpen(false)
            fetchFYs()
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save Financial Year" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditFY = (fy: FinancialYear) => {
        setEditingFYId(fy.id!)
        setFyForm({
            name: fy.name,
            startDate: fy.startDate.split('T')[0],
            endDate: fy.endDate.split('T')[0],
            isActive: fy.isActive,
            description: fy.description
        })
        setIsFYDialogOpen(true)
    }

    const handleDeleteFY = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this Financial Year?")) return
        try {
            await financialYearApi.delete(id)
            toast({ title: "Deleted", description: "Financial Year removed successfully" })
            fetchFYs()
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete Financial Year" })
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Masters Management</h1>
                    <p className="text-muted-foreground">Manage your Companies and Financial Years settings here.</p>
                </div>
            </div>

            <Tabs defaultValue="companies" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="companies" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Companies
                    </TabsTrigger>
                    <TabsTrigger value="fy" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Financial Years
                    </TabsTrigger>
                </TabsList>

                {/* Companies Tab */}
                <TabsContent value="companies" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Company Master</CardTitle>
                                <CardDescription>Register and manage company details.</CardDescription>
                            </div>
                            <Dialog open={isCompanyDialogOpen} onOpenChange={(open) => {
                                setIsCompanyDialogOpen(open)
                                if (!open) {
                                    setEditingCompanyId(null)
                                    setCompanyForm({
                                        name: "", description: "", panNumber: "", gstNumber: "",
                                        address: "", contactEmail: "", contactPhone: "", isActive: true
                                    })
                                    setTimeout(() => { document.body.style.pointerEvents = ""; }, 500);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    {canCreate("ADMIN", "MASTERS") && (
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Company
                                        </Button>
                                    )}
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <form onSubmit={handleSaveCompany}>
                                        <DialogHeader>
                                            <DialogTitle>{editingCompanyId ? "Edit Company" : "Add New Company"}</DialogTitle>
                                            <DialogDescription>Fill in the company details below.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Company Name</Label>
                                                    <Input id="name" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="pan">PAN Number</Label>
                                                    <Input id="pan" value={companyForm.panNumber} onChange={e => setCompanyForm({ ...companyForm, panNumber: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="gst">GST Number</Label>
                                                    <Input id="gst" value={companyForm.gstNumber} onChange={e => setCompanyForm({ ...companyForm, gstNumber: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" type="email" value={companyForm.contactEmail} onChange={e => setCompanyForm({ ...companyForm, contactEmail: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Phone</Label>
                                                    <Input id="phone" value={companyForm.contactPhone} onChange={e => setCompanyForm({ ...companyForm, contactPhone: e.target.value })} />
                                                </div>
                                                <div className="flex items-center space-x-2 pt-8">
                                                    <input type="checkbox" id="companyActive" checked={companyForm.isActive} onChange={e => setCompanyForm({ ...companyForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                    <Label htmlFor="companyActive">Is Active</Label>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Textarea id="address" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Save Company
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company Name</TableHead>
                                        <TableHead>GST/PAN</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingCompany ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                                    ) : companies.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No companies found.</TableCell></TableRow>
                                    ) : companies.map(company => (
                                        <TableRow key={company.id}>
                                            <TableCell className="font-medium">{company.name}</TableCell>
                                            <TableCell>
                                                <div className="text-xs text-muted-foreground">GST: {company.gstNumber || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">PAN: {company.panNumber || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">{company.contactEmail}</div>
                                                <div className="text-xs text-muted-foreground">{company.contactPhone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={company.isActive ? "default" : "secondary"}>{company.isActive ? "Active" : "Inactive"}</Badge>
                                            </TableCell>
                                             <TableCell className="text-right">
                                                 <div className="flex justify-end gap-2">
                                                     {canEdit("ADMIN", "MASTERS") && <Button variant="ghost" size="icon" onClick={() => handleEditCompany(company)}><Pencil className="h-4 w-4" /></Button>}
                                                     {canDelete("ADMIN", "MASTERS") && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCompany(company.id!)}><Trash2 className="h-4 w-4" /></Button>}
                                                 </div>
                                             </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Year Tab */}
                <TabsContent value="fy" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Financial Year Master</CardTitle>
                                <CardDescription>Setup and manage accounting periods.</CardDescription>
                            </div>
                            <Dialog open={isFYDialogOpen} onOpenChange={(open) => {
                                setIsFYDialogOpen(open)
                                if (!open) {
                                    setEditingFYId(null)
                                    setFyForm({
                                        name: "", startDate: new Date().toISOString().split('T')[0],
                                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                                        isActive: true, description: ""
                                    })
                                    setTimeout(() => { document.body.style.pointerEvents = ""; }, 500);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    {canCreate("ADMIN", "MASTERS") && (
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add FY
                                        </Button>
                                    )}
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <form onSubmit={handleSaveFY}>
                                        <DialogHeader>
                                            <DialogTitle>{editingFYId ? "Edit FY" : "Add New FY"}</DialogTitle>
                                            <DialogDescription>Define the start and end dates.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="fyName">FY Name (e.g. 2024-25)</Label>
                                                <Input id="fyName" value={fyForm.name} onChange={e => setFyForm({ ...fyForm, name: e.target.value })} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="startDate">Start Date</Label>
                                                    <Input id="startDate" type="date" value={fyForm.startDate} onChange={e => setFyForm({ ...fyForm, startDate: e.target.value })} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="endDate">End Date</Label>
                                                    <Input id="endDate" type="date" value={fyForm.endDate} onChange={e => setFyForm({ ...fyForm, endDate: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="fyDesc">Description</Label>
                                                <Input id="fyDesc" value={fyForm.description} onChange={e => setFyForm({ ...fyForm, description: e.target.value })} />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="fyActive" checked={fyForm.isActive} onChange={e => setFyForm({ ...fyForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                <Label htmlFor="fyActive">Is Current / Active FY</Label>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Save Financial Year
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>FY Name</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingFY ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                                    ) : financialYears.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No financial years found.</TableCell></TableRow>
                                    ) : financialYears.map(fy => (
                                        <TableRow key={fy.id}>
                                            <TableCell className="font-medium">{fy.name}</TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    {mounted ? `${new Date(fy.startDate).toLocaleDateString()} - ${new Date(fy.endDate).toLocaleDateString()}` : 'Loading dates...'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={fy.isActive ? "default" : "secondary"}>{fy.isActive ? "Active" : "Inactive"}</Badge>
                                            </TableCell>
                                             <TableCell className="text-right">
                                                 <div className="flex justify-end gap-2">
                                                     {canEdit("ADMIN", "MASTERS") && <Button variant="ghost" size="icon" onClick={() => handleEditFY(fy)}><Pencil className="h-4 w-4" /></Button>}
                                                     {canDelete("ADMIN", "MASTERS") && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFY(fy.id!)}><Trash2 className="h-4 w-4" /></Button>}
                                                 </div>
                                             </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

/* aria-label */
