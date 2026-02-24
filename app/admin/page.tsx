"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Search,
    MoreHorizontal,
    UserPlus,
    Mail,
    Calendar,
    CreditCard,
    Shield,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { AdminNav } from "@/components/admin/nav";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newPlanId, setNewPlanId] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [addUserFormData, setAddUserFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        planId: "none"
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const [usersRes, plansRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/admin/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (usersRes.data?.status === "success") {
                setUsers(usersRes.data.data.users);
            }
            if (plansRes.data?.status === "success") {
                setPlans(plansRes.data.data.plans);
            }
        } catch (err: any) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.patch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                isActive: !currentStatus
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
                fetchUsers();
            }
        } catch (err: any) {
            toast.error("Failed to update user status");
        }
    };

    const handleChangePlan = async () => {
        if (!selectedUser || !newPlanId) return;
        try {
            setIsUpdating(true);
            const token = localStorage.getItem("token");
            const response = await axios.patch(`${API_BASE_URL}/admin/users/${selectedUser._id}/plan`, {
                planId: newPlanId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                toast.success("Plan updated successfully");
                setIsPlanModalOpen(false);
                fetchUsers();
            }
        } catch (err: any) {
            toast.error("Failed to update plan");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddUser = async () => {
        try {
            setIsUpdating(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${API_BASE_URL}/admin/users`, addUserFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                toast.success("User created successfully");
                setIsAddUserModalOpen(false);
                setAddUserFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "user",
                    planId: "none"
                });
                fetchUsers();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add user");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-sora">User Management</h1>
                    <p className="text-muted-foreground">Manage all users and their plans across the SaaS platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        className="shadow-lg"
                        onClick={() => setIsAddUserModalOpen(true)}
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            <AdminNav currentPath="/admin" />

            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-card border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-10 rounded-full border-border"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold px-6">User</TableHead>
                                    <TableHead className="font-semibold">Role</TableHead>
                                    <TableHead className="font-semibold">Plan</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Joined</TableHead>
                                    <TableHead className="text-right px-6 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {user.isSuperAdmin ? (
                                                    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                                                        <Shield className="h-3 w-3 mr-1" /> Super Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                                                        {user.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-primary border-primary/20">
                                                {user.plan?.name || "Free Trial"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`h-2 w-2 rounded-full ${user.isActive !== false ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-medium capitalize ${user.isActive === false ? 'text-red-500' : ''}`}>
                                                    {user.isActive === false ? 'Deactivated' : (user.planStatus || 'active')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setNewPlanId(user.plan?._id || "none");
                                                            setIsPlanModalOpen(true);
                                                        }}
                                                    >
                                                        Change Plan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className={`cursor-pointer ${user.isActive !== false ? 'text-red-600 focus:text-red-600 focus:bg-red-50' : 'text-green-600 focus:text-green-600 focus:bg-green-50'}`}
                                                        onClick={() => handleUpdateStatus(user._id, user.isActive !== false)}
                                                    >
                                                        {user.isActive !== false ? 'Deactivate User' : 'Activate User'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change User Plan</DialogTitle>
                        <DialogDescription>
                            Select a new subscription plan for {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Subscription Plan</Label>
                            <Select
                                value={newPlanId}
                                onValueChange={setNewPlanId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Plan / Free Trial</SelectItem>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan._id} value={plan._id}>
                                            {plan.name} - {plan.price > 0 ? `$${plan.price}` : 'Free'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePlan} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account within the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-name">Full Name</Label>
                            <Input
                                id="add-name"
                                placeholder="John Doe"
                                value={addUserFormData.name}
                                onChange={(e) => setAddUserFormData({ ...addUserFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-email">Email Address</Label>
                            <Input
                                id="add-email"
                                type="email"
                                placeholder="john@example.com"
                                value={addUserFormData.email}
                                onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-password">Password</Label>
                            <Input
                                id="add-password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={addUserFormData.password}
                                onChange={(e) => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-role">Role</Label>
                                <Select
                                    value={addUserFormData.role}
                                    onValueChange={(val) => setAddUserFormData({ ...addUserFormData, role: val })}
                                >
                                    <SelectTrigger id="add-role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-plan">Plan</Label>
                                <Select
                                    value={addUserFormData.planId}
                                    onValueChange={(val) => setAddUserFormData({ ...addUserFormData, planId: val })}
                                >
                                    <SelectTrigger id="add-plan">
                                        <SelectValue placeholder="Select plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Free Trial</SelectItem>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan._id} value={plan._id}>
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
