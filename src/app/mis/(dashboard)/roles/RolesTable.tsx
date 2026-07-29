"use client";

import { formatTimestamp } from "@/lib/date-utils";
import { Shield, Users, Key, Edit, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Role {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    role_permissions: [{ count: number }];
    mis_users: [{ count: number }];
}

interface RolesTableProps {
    roles: Role[];
}

export function RolesTable({ roles }: RolesTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (roleId: string, roleName: string, userCount: number) => {
        if (userCount > 0) {
            toast.error(`Cannot delete role: ${userCount} user(s) are assigned to this role`);
            return;
        }

        if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(roleId);

        try {
            const response = await fetch(`/api/mis/roles/${roleId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Role deleted successfully");
                router.refresh();
            } else {
                toast.error(data.error || "Failed to delete role");
            }
        } catch (error) {
            console.error("Error deleting role:", error);
            toast.error("Failed to delete role");
        } finally {
            setDeletingId(null);
        }
    };

    // Empty state
    if (roles.length === 0) {
        return (
            <div className="bg-card border rounded-lg p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                        <Shield className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Roles Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        Get started by creating your first role. Roles help you organize and manage permissions for MIS users.
                    </p>
                    <Link
                        href="/mis/roles/create"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
                    >
                        Create Role
                    </Link>
                </div>
            </div>
        );
    }

    // Table with data
    return (
        <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">Permissions</TableHead>
                            <TableHead className="text-center">Users</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {roles.map((role) => {
                            const permissionCount = role.role_permissions?.[0]?.count || 0;
                            const userCount = role.mis_users?.[0]?.count || 0;

                            return (
                                <TableRow
                                    key={role.id}
                                    className="border-b transition-colors duration-150 hover:bg-muted/60"
                                >
                                    <TableCell className="font-medium">
                                        {role.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">
                                        {role.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Key className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm">{permissionCount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm">{userCount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={role.is_active ? "default" : "secondary"}>
                                            {role.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatTimestamp(role.created_at, "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/mis/roles/${role.id}`} className="cursor-pointer">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Role
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/mis/roles/${role.id}/permissions`} className="cursor-pointer">
                                                        <Key className="h-4 w-4 mr-2" />
                                                        Manage Permissions
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(role.id, role.name, userCount)}
                                                    disabled={deletingId === role.id || userCount > 0}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {deletingId === role.id ? "Deleting..." : "Delete Role"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
