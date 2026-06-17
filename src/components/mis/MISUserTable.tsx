"use client";

import { formatTimestamp } from "@/lib/date-utils";
import { Users, Shield } from "lucide-react";
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MISUser {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    is_super_admin?: boolean;
    role_id?: string | null;
    role?: {
        name: string;
        description: string | null;
    } | null;
}

interface MISUserTableProps {
    users: MISUser[];
    isLoading?: boolean;
}

export function MISUserTable({ users, isLoading = false }: MISUserTableProps) {

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[1, 2, 3].map((i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-5 w-32" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-48" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-24" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-28" />
                                </TableCell>
                            </TableRow>
                        ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        );
    }

    // Empty state
    if (users.length === 0) {
        return (
            <div className="bg-card border rounded-lg p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No MIS Users Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Get started by adding your first MIS user. Click the &quot;Add MIS User&quot; button above to send an invitation.
                    </p>
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
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {users.map((user) => (
                            <TableRow
                                key={user.user_id}
                                className="border-b transition-colors duration-150 hover:bg-muted/60"
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {user.first_name} {user.last_name}
                                        {user.is_super_admin && (
                                            <Badge variant="default" className="gap-1">
                                                <Shield className="h-3 w-3" />
                                                Super Admin
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {user.email}
                                </TableCell>
                                <TableCell>
                                    {user.role ? (
                                        <Badge variant="secondary">{user.role.name}</Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No role assigned</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatTimestamp(user.created_at, "MMM dd, yyyy")}
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
