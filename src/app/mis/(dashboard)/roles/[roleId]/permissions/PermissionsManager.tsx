"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
}

interface PermissionsManagerProps {
    roleId: string;
    roleName: string;
    allPermissions: Permission[];
    assignedPermissionIds: string[];
}

export function PermissionsManager({
    roleId,
    roleName,
    allPermissions,
    assignedPermissionIds,
}: PermissionsManagerProps) {
    const router = useRouter();
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(assignedPermissionIds)
    );
    const [isSaving, setIsSaving] = useState(false);

    // Group permissions by resource
    const groupedPermissions = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
            acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    const handleTogglePermission = (permissionId: string) => {
        setSelectedPermissions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const handleSelectAllForResource = (resource: string, checked: boolean) => {
        setSelectedPermissions((prev) => {
            const newSet = new Set(prev);
            const resourcePermissions = groupedPermissions[resource];
            
            if (checked) {
                resourcePermissions.forEach((p) => newSet.add(p.id));
            } else {
                resourcePermissions.forEach((p) => newSet.delete(p.id));
            }
            
            return newSet;
        });
    };

    const handleGrantAllPermissions = (checked: boolean) => {
        if (checked) {
            // Grant all permissions
            const allPermissionIds = allPermissions.map((p) => p.id);
            setSelectedPermissions(new Set(allPermissionIds));
        } else {
            // Revoke all permissions
            setSelectedPermissions(new Set());
        }
    };

    const handleSave = async () => {
        const originalSet = new Set(assignedPermissionIds);
        const currentSet = selectedPermissions;

        // Calculate what to add and what to remove
        const toAdd = Array.from(currentSet).filter((id) => !originalSet.has(id));
        const toRemove = Array.from(originalSet).filter((id) => !currentSet.has(id));

        if (toAdd.length === 0 && toRemove.length === 0) {
            toast.info("No changes to save");
            return;
        }

        setIsSaving(true);

        try {
            // Add new permissions
            if (toAdd.length > 0) {
                const addResponse = await fetch(`/api/mis/roles/${roleId}/permissions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ permission_ids: toAdd }),
                });

                const addData = await addResponse.json();
                if (!addData.success) {
                    throw new Error(addData.error || "Failed to add permissions");
                }
            }

            // Remove permissions
            if (toRemove.length > 0) {
                const removeResponse = await fetch(`/api/mis/roles/${roleId}/permissions`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ permission_ids: toRemove }),
                });

                const removeData = await removeResponse.json();
                if (!removeData.success) {
                    throw new Error(removeData.error || "Failed to remove permissions");
                }
            }

            toast.success("Permissions updated successfully");
            router.refresh();
        } catch (error) {
            console.error("Error updating permissions:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update permissions");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges =
        selectedPermissions.size !== assignedPermissionIds.length ||
        !Array.from(selectedPermissions).every((id) => assignedPermissionIds.includes(id));

    const allPermissionsSelected = selectedPermissions.size === allPermissions.length;

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selectedPermissions.size} of {allPermissions.length} permissions selected
                </div>
                <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Grant All Permissions Toggle */}
            <Alert className="border-primary/20 bg-primary/5">
                <Shield className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="font-medium mb-1">Grant All Permissions (Super Admin Mode)</div>
                        <div className="text-xs text-muted-foreground">
                            Toggle to grant or revoke all {allPermissions.length} permissions at once
                        </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                        <span className="text-sm font-medium">
                            {allPermissionsSelected ? "All Granted" : "Limited Access"}
                        </span>
                        <Switch
                            checked={allPermissionsSelected}
                            onCheckedChange={handleGrantAllPermissions}
                        />
                    </div>
                </AlertDescription>
            </Alert>

            {/* Permissions by Resource */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => {
                    const allSelected = permissions.every((p) => selectedPermissions.has(p.id));
                    const someSelected = permissions.some((p) => selectedPermissions.has(p.id));

                    return (
                        <Card key={resource}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base capitalize">
                                        {resource.replace(/_/g, " ")}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`${resource}-all`}
                                            checked={allSelected}
                                            onCheckedChange={(checked) =>
                                                handleSelectAllForResource(resource, checked === true)
                                            }
                                        />
                                        <Label
                                            htmlFor={`${resource}-all`}
                                            className="text-xs text-muted-foreground cursor-pointer"
                                        >
                                            Select All
                                        </Label>
                                    </div>
                                </div>
                                <CardDescription className="text-xs">
                                    {someSelected
                                        ? `${permissions.filter((p) => selectedPermissions.has(p.id)).length} of ${permissions.length} selected`
                                        : "No permissions selected"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={permission.id}
                                            checked={selectedPermissions.has(permission.id)}
                                            onCheckedChange={() => handleTogglePermission(permission.id)}
                                        />
                                        <div className="flex-1 cursor-pointer" onClick={() => handleTogglePermission(permission.id)}>
                                            <Label
                                                htmlFor={permission.id}
                                                className="text-sm font-medium cursor-pointer capitalize"
                                            >
                                                {permission.action.replace(/_/g, " ")}
                                            </Label>
                                            {permission.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {permission.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
