import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { misRegistrationSchema } from "@/lib/validations/mis-schema";
import bcrypt from "bcryptjs";
import { logAuth, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate with Zod
        const validationResult = misRegistrationSchema.safeParse(body);

        if (!validationResult.success) {
            const errors: Record<string, string[]> = {};
            validationResult.error.issues.forEach((issue) => {
                const path = issue.path.join(".");
                if (!errors[path]) errors[path] = [];
                errors[path].push(issue.message);
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed. Please check your inputs.",
                    errors,
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Check if any MIS user already exists
        const { count: misCount, error: countError } = await adminClient
            .from("mis_user")
            .select("*", { count: "exact", head: true });

        if (countError) {
            return NextResponse.json(
                { success: false, message: "Unable to verify registration eligibility." },
                { status: 500 }
            );
        }

        if (misCount && misCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "MIS admin already exists in the system. Please contact your system administrator for access.",
                },
                { status: 409 }
            );
        }

        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    user_type: "mis",
                },
            },
        });

        if (authError) {
            return NextResponse.json(
                { success: false, message: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { success: false, message: "Failed to create user account." },
                { status: 500 }
            );
        }

        const now = new Date().toISOString();
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Insert into users table
        const { error: userError } = await adminClient.from("users").insert({
            id: authData.user.id,
            email: data.email,
            password: hashedPassword,
            role: "mis",
            status: "active",
            email_verified: true,
            created_at: now,
            updated_at: now,
        });

        if (userError) {
            console.error("User table insert error:", userError);
            return NextResponse.json(
                { success: false, message: "Account created but user setup failed." },
                { status: 500 }
            );
        }

        // Insert into mis_user table
        const { error: misUserError } = await adminClient.from("mis_user").insert({
            user_id: authData.user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            created_at: now,
            updated_at: now,
        });

        if (misUserError) {
            console.error("MIS user creation error:", misUserError);
            return NextResponse.json(
                { success: false, message: "Account created but profile setup failed." },
                { status: 500 }
            );
        }

        await logAuth("mis_signup_success", authData.user.id, "mis", { email: data.email });

        return NextResponse.json(
            {
                success: true,
                message: "MIS account created successfully!",
                user: {
                    id: authData.user.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: "mis",
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("MIS API registration error:", error);
        await logError({
            source: "api/mis/register:POST",
            errorType: "MISRegistrationAPIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
