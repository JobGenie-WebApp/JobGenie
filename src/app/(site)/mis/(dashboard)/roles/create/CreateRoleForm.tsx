"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CreateRoleForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Role name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/mis/roles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Role created successfully");
                router.push(`/mis/roles/${data.role.id}/permissions`);
            } else {
                toast.error(data.error || "Failed to create role");
            }
        } catch (error) {
            console.error("Error creating role:", error);
            toast.error("Failed to create role");
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
                            Creating Role...
                        </>
                    ) : (
                        <>
                            <Shield className="h-4 w-4" />
                            Create Role
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
