import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndustrySpecialization } from "@/types/profile-types";
import { Sparkles, Target } from "lucide-react";

interface SkillsSectionProps {
    qualifications: string[];
    specializations: IndustrySpecialization[];
}

export function SkillsSection({ qualifications, specializations }: SkillsSectionProps) {
    if ((!qualifications || qualifications.length === 0) && (!specializations || specializations.length === 0)) {
        return null;
    }

    const formatQualification = (qual: string) => {
        return qual.split("_").map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
    };

    const formatIndustry = (industry: string) => {
        return industry.split("_").map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Skills & Qualifications
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Professional Qualifications */}
                {qualifications && qualifications.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Professional Qualifications
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {qualifications.map((qual, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-sm"
                                >
                                    {formatQualification(qual)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Industry Specializations */}
                {specializations && specializations.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3">
                            Industry Specializations
                        </h3>
                        <div className="space-y-3">
                            {specializations.map((spec) => (
                                <div
                                    key={spec.id}
                                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{spec.specialization}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatIndustry(spec.industry)}
                                            </p>
                                            {spec.description && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {spec.description}
                                                </p>
                                            )}
                                        </div>
                                        {spec.years_experience !== null && spec.years_experience > 0 && (
                                            <Badge variant="outline" className="flex-shrink-0">
                                                {spec.years_experience} {spec.years_experience === 1 ? 'year' : 'years'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
