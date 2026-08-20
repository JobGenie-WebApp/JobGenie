import { UserCircle } from "lucide-react";
import { CreateProfileWizard } from "@/components/profile/CreateProfileWizard";
import { createClient } from "@/lib/supabase/server";
import { getCountryNames } from "@/lib/countries";
import { redirect } from "next/navigation";

async function getCandidateData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: candidate } = await supabase
        .from("candidates")
        .select(`
            first_name,
            last_name,
            email,
            phone,
            address,
            country,
            industry
        `)
        .eq("user_id", user.id)
        .single();

    return { userId: user.id, candidate };
}

export default async function CreateProfilePage() {
    const [{ userId, candidate }, countries] = await Promise.all([getCandidateData(), getCountryNames()]);

    return (
        <div className="mx-auto w-full max-w-4xl space-y-5">
            {/* Header */}
            <div className="rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_12px_40px_-30px_rgba(0,0,0,.45)] ring-1 ring-primary/[0.04] backdrop-blur-xl sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <UserCircle className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                            Candidate onboarding
                        </p>
                        <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.035em] text-foreground">
                            Complete your profile
                        </h1>
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            Welcome{candidate?.first_name ? `, ${candidate.first_name}` : ""}!
                            Fill in your details to access your dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Wizard */}
            <CreateProfileWizard
                userId={userId}
                countries={countries}
                initialData={{
                    firstName: candidate?.first_name || "",
                    lastName: candidate?.last_name || "",
                    email: candidate?.email || "",
                    phone: candidate?.phone || "",
                    address: candidate?.address || "",
                    country: candidate?.country || "",
                    industry: candidate?.industry || "",
                }}
            />
        </div>
    );
}
