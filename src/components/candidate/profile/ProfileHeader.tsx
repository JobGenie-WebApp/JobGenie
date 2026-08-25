"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Briefcase, Calendar, FileText, Pencil, GraduationCap, TrendingUp, Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CandidateProfile } from "@/types/profile-types";
import { BasicInfoDialog } from "./dialogs/BasicInfoDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { formatIndustry, formatPhoneNumber, formatLabel } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
    profile: CandidateProfile;
    onProfileUpdated?: () => void;
}

export function ProfileHeader({ profile, onProfileUpdated }: ProfileHeaderProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [removingCover, setRemovingCover] = useState(false);
    const [confirmRemoveCover, setConfirmRemoveCover] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast({ title: "Invalid file type", description: "Please upload an image (JPEG, PNG, GIF, or WebP).", variant: "destructive" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Cover image must be smaller than 5MB.", variant: "destructive" });
            return;
        }

        setUploadingCover(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/candidate/upload-cover-image", { method: "POST", body: formData });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to upload cover image");
            }
            toast({ title: "Cover updated", description: "Your cover image has been updated." });
            router.refresh();
            onProfileUpdated?.();
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload cover image", variant: "destructive" });
        } finally {
            setUploadingCover(false);
            if (coverInputRef.current) coverInputRef.current.value = "";
        }
    };

    const handleCoverRemove = async () => {
        setRemovingCover(true);
        try {
            const response = await fetch("/api/candidate/upload-cover-image", { method: "DELETE" });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to remove cover image");
            }
            toast({ title: "Cover removed", description: "Your profile shows the default cover again." });
            setConfirmRemoveCover(false);
            router.refresh();
            onProfileUpdated?.();
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to remove cover image", variant: "destructive" });
        } finally {
            setRemovingCover(false);
        }
    };

    const getAvailabilityColor = (status: string | null) => {
        switch (status) {
            case "available":
                return "border-border/70 bg-background/70 text-primary";
            case "open_to_opportunities":
                return "border-border/70 bg-background/70 text-foreground";
            case "not_looking":
                return "border-border/70 bg-background/70 text-muted-foreground";
            default:
                return "";
        }
    };

    return (
        <>
            <Card className="group relative overflow-hidden pt-0">
                {/* Cover Image — candidate uploads override the branded default */}
                <div className="relative aspect-[15/3.5] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={profile.cover_image_url || "/default-candidate-cover.jpg"}
                        alt="Profile cover"
                        className="h-full w-full object-cover"
                    />

                    {/* Subtle gradient so overlaid controls stay readable */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Hidden file input for cover upload */}
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleCoverChange}
                    />

                    {/* Change cover control — bottom-right, with recommended size hint */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5 transition-opacity sm:bottom-3 sm:right-3 sm:gap-2 md:opacity-0 md:group-hover:opacity-100">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            className="bg-background/75 shadow-none backdrop-blur-sm sm:hidden"
                            onClick={() => setDialogOpen(true)}
                            aria-label="Edit profile"
                            title="Edit profile"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <span className="hidden rounded-md border border-border/60 bg-background/75 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm sm:inline">
                            Recommended: 1500 × 400px · max 5MB
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="size-8 gap-0 bg-background/75 p-0 shadow-none backdrop-blur-sm sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
                            disabled={uploadingCover}
                            onClick={() => coverInputRef.current?.click()}
                            aria-label={uploadingCover ? "Uploading cover" : (profile.cover_image_url ? "Change cover" : "Add cover")}
                            title={profile.cover_image_url ? "Change cover" : "Add cover"}
                        >
                            {uploadingCover ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Camera className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">
                                {uploadingCover ? "Uploading..." : (profile.cover_image_url ? "Change cover" : "Add cover")}
                            </span>
                        </Button>
                        {profile.cover_image_url && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="size-8 gap-0 bg-background/75 p-0 shadow-none backdrop-blur-sm sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
                                disabled={uploadingCover || removingCover}
                                onClick={() => setConfirmRemoveCover(true)}
                                aria-label="Remove cover"
                                title="Remove cover"
                            >
                                {removingCover ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">{removingCover ? "Removing..." : "Remove"}</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Separate edit control for larger covers; mobile uses the compact group above */}
                <div className="absolute top-2 right-2 hidden transition-opacity sm:block md:opacity-0 md:group-hover:opacity-100">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-background/75 shadow-none backdrop-blur-sm"
                        onClick={() => setDialogOpen(true)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>

                {/* Profile Content */}
                <div className="px-4 pb-5 sm:px-6">
                    {/* Avatar - Overlapping cover */}
                    <div className="-mt-10 mb-4 flex items-start justify-between sm:-mt-12">
                        <Avatar className="h-20 w-20 border-[3px] border-card shadow-sm sm:h-24 sm:w-24">
                            <AvatarImage src={profile.profile_image_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} />
                            <AvatarFallback className="bg-secondary text-lg font-semibold text-foreground sm:text-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {profile.availability_status && (
                            <Badge
                                variant="outline"
                                className={`mt-12 sm:mt-14 ${getAvailabilityColor(profile.availability_status)}`}
                            >
                                {formatLabel(profile.availability_status)}
                            </Badge>
                        )}
                    </div>

                    {/* Name and Position */}
                    <div className="space-y-2 mb-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {profile.first_name} {profile.last_name}
                            </h1>
                            {profile.membership_no && (
                                <p className="text-sm text-muted-foreground font-mono mt-1">
                                    Member: {profile.membership_no}
                                </p>
                            )}
                        </div>
                        <p className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            {profile.current_position}
                        </p>

                        {(profile.expected_positions ?? []).length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm text-muted-foreground">Targeting:</span>
                                {(profile.expected_positions ?? []).map((pos, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                        {pos}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {profile.resume_url && (
                            <div className="mt-3">
                                <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-3.5 w-3.5" />
                                        View Resume
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 text-sm md:grid-cols-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{formatPhoneNumber(profile.phone)}{profile.alternative_phone ? ` / ${formatPhoneNumber(profile.alternative_phone)}` : ''}</span>
                        </div>
                        {profile.country && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>{profile.country}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{formatIndustry(profile.industry)}</span>
                        </div>
                        {profile.highest_qualification && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                                <span className="capitalize">{profile.highest_qualification.replace(/_/g, ' ')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Edit Dialog */}
            <BasicInfoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                profile={profile}
                onProfileUpdated={onProfileUpdated}
            />

            <DeleteConfirmDialog
                open={confirmRemoveCover}
                onOpenChange={setConfirmRemoveCover}
                onConfirm={handleCoverRemove}
                isLoading={removingCover}
                title="Remove cover image?"
                description="Your uploaded cover will be deleted and your profile will show the default cover. You can upload a new one any time."
            />
        </>
    );
}
