"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
    Briefcase, 
    Calendar, 
    DollarSign, 
    Clock,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { formatTimestamp } from "@/lib/date-utils";
import Link from "next/link";

interface JobOffer {
    id: string;
    job_title: string;
    salary_amount: number | null;
    salary_currency: string | null;
    salary_period: string | null;
    start_date: string | null;
    expiry_date: string | null;
    offer_letter_url: string | null;
    description: string | null;
    status: string;
    created_at: string;
    responded_at: string | null;
}

interface JobOfferCardProps {
    invitationId: string;
    offer: JobOffer;
    companyName: string;
    jobDesignation: string;
    onRefresh?: () => void;
}

export function JobOfferCard({
    invitationId,
    offer,
    companyName,
    jobDesignation,
    onRefresh,
}: JobOfferCardProps) {
    const [responding, setResponding] = useState<"accept" | "decline" | null>(null);

    const respond = async (action: "accept" | "decline") => {
        setResponding(action);
        try {
            const response = await fetch(`/api/candidate/invitations/${invitationId}/offer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message || (action === "accept" ? "Offer accepted" : "Offer declined"));
                onRefresh?.();
            } else {
                toast.error(data.error || "Could not update your response");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setResponding(null);
        }
    };

    const getStatusConfig = () => {
        switch (offer.status) {
            case 'accepted':
                return {
                    color: 'bg-green-500',
                    text: 'Accepted',
                    icon: CheckCircle2,
                    bgClass: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/60 dark:to-green-900/40',
                    borderClass: 'border-green-300 dark:border-green-700'
                };
            case 'declined':
                return {
                    color: 'bg-red-500',
                    text: 'Declined',
                    icon: XCircle,
                    bgClass: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/60 dark:to-red-900/40',
                    borderClass: 'border-red-300 dark:border-red-700'
                };
            default:
                return {
                    color: 'bg-blue-500',
                    text: 'Pending Response',
                    icon: Clock,
                    bgClass: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/60 dark:to-blue-900/40',
                    borderClass: 'border-blue-300 dark:border-blue-700'
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    const formatSalary = () => {
        if (!offer.salary_amount || !offer.salary_currency) return null;
        
        const amount = offer.salary_amount.toLocaleString();
        const period = offer.salary_period || 'monthly';
        
        return `${offer.salary_currency} ${amount} / ${period}`;
    };

    const isExpired = offer.expiry_date && new Date(offer.expiry_date) < new Date();

    return (
        <Card className={`border-2 ${statusConfig.borderClass} ${statusConfig.bgClass} mb-6`}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <Badge className={`${statusConfig.color} text-white mb-2`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.text}
                                </Badge>
                                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                                    Job Offer Received! 🎉
                                </h3>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                    {companyName} has sent a formal job offer for the position of {offer.job_title}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Details */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <p className="font-semibold text-lg">{offer.job_title}</p>
                        </div>
                    </div>

                    {formatSalary() && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Compensation</p>
                                    <p className="font-semibold text-lg">{formatSalary()}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {offer.start_date && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Proposed Start Date</p>
                                    <p className="font-semibold">
                                        {formatTimestamp(offer.start_date, "MMMM d, yyyy")}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {offer.expiry_date && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <Clock className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Offer Valid Until</p>
                                    <p className={`font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : ''}`}>
                                        {formatTimestamp(offer.expiry_date, "MMMM d, yyyy")}
                                        {isExpired && (
                                            <Badge variant="destructive" className="ml-2">Expired</Badge>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {offer.description && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Additional Details</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                                    {offer.description}
                                </p>
                            </div>
                        </>
                    )}

                    {offer.offer_letter_url && (
                        <>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-2">Formal Offer Letter</p>
                                    <Link href={offer.offer_letter_url} target="_blank">
                                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Offer Letter
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Response Section */}
                {offer.status === 'pending' && !isExpired && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/30 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-100 mb-3 font-medium">
                            ⏰ Action Required: Please review the offer and respond
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Button
                                type="button"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={responding !== null}
                                onClick={() => respond("accept")}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {responding === "accept" ? "Saving…" : "Accept Offer"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                disabled={responding !== null}
                                onClick={() => respond("decline")}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                {responding === "decline" ? "Saving…" : "Decline Offer"}
                            </Button>
                        </div>
                    </div>
                )}

                {offer.status === 'accepted' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/30 dark:border-green-800">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <p className="text-sm text-green-800 dark:text-green-100 font-medium">
                                You accepted this offer on {offer.responded_at && formatTimestamp(offer.responded_at, "MMMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                )}

                {offer.status === 'declined' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950/30 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-800 dark:text-red-100 font-medium">
                                You declined this offer on {offer.responded_at && formatTimestamp(offer.responded_at, "MMMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                )}

                {isExpired && offer.status === 'pending' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-950/30 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                                This offer has expired. Please contact the employer if you&apos;re still interested.
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4">
                    Offer created on {formatTimestamp(offer.created_at, "MMMM d, yyyy 'at' HH:mm")}
                </p>
            </CardContent>
        </Card>
    );
}
