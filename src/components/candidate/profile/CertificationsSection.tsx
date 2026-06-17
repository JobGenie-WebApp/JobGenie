"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Certificate } from "@/types/profile-types";
import { Award, Calendar, ExternalLink, Hash, Pencil, Trash2, Plus } from "lucide-react";
import { CertificationDialog } from "./dialogs/CertificationDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { deleteCertification } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { formatUTCDate } from "@/lib/date-utils";

interface CertificationsSectionProps {
    certificates: Certificate[];
}

export function CertificationsSection({ certificates }: CertificationsSectionProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [showAll, setShowAll] = useState(false);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCertification, setSelectedCertification] = useState<Certificate | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [certToDelete, setCertToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!certificates || certificates.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedCertification(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certification
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No certifications added yet. Click &quot;Add Certification&quot; to get started.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return formatUTCDate(dateString, "MMM yyyy") || null;
    };

    const isExpired = (expiryDate: string | null) => {
        if (!expiryDate) return false;
        const ms = new Date(expiryDate).getTime();
        return Number.isFinite(ms) && ms < Date.now();
    };

    const toggleDescription = (id: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleEdit = (cert: Certificate) => {
        setSelectedCertification(cert);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setCertToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!certToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteCertification(certToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Certification deleted successfully",
                });
                setDeleteDialogOpen(false);
                setCertToDelete(null);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete certification",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const sortedCertificates = [...(certificates || [])].sort((a, b) => {
        const dateA = a.issue_date ? new Date(a.issue_date).getTime() : 0;
        const dateB = b.issue_date ? new Date(b.issue_date).getTime() : 0;
        return dateB - dateA;
    });

    const displayedCertificates = showAll ? sortedCertificates : sortedCertificates.slice(0, 3);
    const hasMore = sortedCertificates.length > 3;

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedCertification(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certification
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {displayedCertificates.map((cert, index) => (
                            <div key={cert.id}>
                                {index > 0 && <Separator className="my-6" />}
                                <div className="group relative flex gap-4">
                                    {/* Icon - hidden on mobile */}
                                    <div className="flex-shrink-0 hidden md:flex">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Award className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>

                                    {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
                                    <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEdit(cert)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteClick(cert.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2 pr-16 md:pr-0">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {cert.certificate_name || "Certification"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {cert.issuing_authority || "Issuing Authority"}
                                            </p>
                                        </div>

                                        {/* Date Information */}
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            {cert.issue_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>Issued {formatDate(cert.issue_date)}</span>
                                                </div>
                                            )}
                                            {cert.expiry_date && (
                                                <Badge
                                                    variant={isExpired(cert.expiry_date) ? "destructive" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {isExpired(cert.expiry_date) ? "Expired" : "Expires"} {formatDate(cert.expiry_date)}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Credential Information */}
                                        {(cert.credential_id || cert.credential_url) && (
                                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                                {cert.credential_id && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Hash className="h-3 w-3" />
                                                        <span className="font-mono">{cert.credential_id}</span>
                                                    </div>
                                                )}
                                                {cert.credential_url && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        asChild
                                                    >
                                                        <a
                                                            href={cert.credential_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View Credential
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Description with Read More */}
                                        {cert.description && (
                                            <div className="pt-1">
                                                <p
                                                    className={`text-sm text-muted-foreground leading-relaxed ${!expandedDescriptions[cert.id] ? 'line-clamp-2' : ''
                                                        }`}
                                                >
                                                    {cert.description}
                                                </p>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => toggleDescription(cert.id)}
                                                    className="px-0 h-auto mt-1 text-xs"
                                                >
                                                    {expandedDescriptions[cert.id] ? "Read Less" : "Read More"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View All Button */}
                    {hasMore && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowAll(!showAll)}
                                className="w-full md:w-auto"
                            >
                                {showAll ? "Show Less" : `View All Certifications (${certificates.length})`}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CertificationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                certification={selectedCertification}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Certification"
                description="Are you sure you want to delete this certification? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
}
