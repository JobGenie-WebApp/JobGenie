"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Role {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

interface EditRoleFormProps {
    role: Role;
}

export function EditRoleForm({ role }: EditRoleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: role.name,
        description: role.description || "",
        is_active: role.is_active,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Role name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/mis/roles/${role.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    is_active: formData.is_active,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Role updated successfully");
                router.push("/mis/roles");
                router.refresh();
            } else {
                toast.error(data.error || "Failed to update role");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Approver, Support Agent, Finance Admin"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isSubmitting}
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">
                    Description <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this role does and who should have it"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    disabled={isSubmitting}
                />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="text-base">
                        Active Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Inactive roles cannot be assigned to new users
                    </p>
                </div>
                <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                    disabled={isSubmitting}
                />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating Role...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Update Role
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
