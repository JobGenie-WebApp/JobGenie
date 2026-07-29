"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

interface InterviewStatsCardsProps {
    stats: {
        overview: {
            totalInterviews: number;
            confirmedInterviews: number;
            pendingConfirmation: number;
            cancelledInterviews: number;
            monthlyInterviews: number;
            avgResponseTimeHours: number;
        };
        interviewMode: {
            online: number;
            physical: number;
        };
    };
}

export function InterviewStatsCards({ stats }: InterviewStatsCardsProps) {
    const { overview } = stats;

    return (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {/* Total Interviews */}
            <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{overview.totalInterviews}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                </CardContent>
            </Card>

            {/* Confirmed Interviews */}
            <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Confirmed</p>
                            <p className="text-2xl font-bold">{overview.confirmedInterviews}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                </CardContent>
            </Card>

            {/* Pending Confirmation */}
            <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold">{overview.pendingConfirmation}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                    </div>
                </CardContent>
            </Card>

            {/* Cancelled Interviews */}
            <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Cancelled</p>
                            <p className="text-2xl font-bold">{overview.cancelledInterviews}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
