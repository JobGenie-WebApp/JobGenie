"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export function FormSection({ title, description, children, className, icon }: FormSectionProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {icon && <div className="text-primary">{icon}</div>}
                    <CardTitle>{title}</CardTitle>
                </div>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
