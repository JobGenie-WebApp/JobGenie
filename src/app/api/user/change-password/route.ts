import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

function validatePasswordStrength(password: string): string | null {
    if (!password || password.length < 8)
        return "Password must be at least 8 characters long.";
    if (!/[a-z]/.test(password))
        return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(password))
        return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password))
        return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
        return "Password must contain at least one special character (e.g. !@#$%).";
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body ?? {};

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
        }

        const strengthError = validatePasswordStrength(newPassword);
        if (strengthError) {
            return NextResponse.json({ error: strengthError }, { status: 400 });
        }

        const admin = createAdminClient();

        // Fetch bcrypt hash — requires admin client due to column-level SELECT revoke on users
        const { data: userData, error: fetchError } = await admin
            .from("users")
            .select("password")
            .eq("id", user.id)
            .single();

        if (fetchError || !userData) {
            return NextResponse.json({ error: "Failed to verify current password." }, { status: 500 });
        }

        const isMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
        }

        // Update Supabase Auth (handles JWT/session invalidation)
        const { error: supabaseAuthError } = await admin.auth.admin.updateUserById(user.id, {
            password: newPassword,
        });

        if (supabaseAuthError) {
            if (
                supabaseAuthError.message?.includes("weak_password") ||
                supabaseAuthError.message?.includes("Password should")
            ) {
                return NextResponse.json(
                    { error: "Password is too weak. Use uppercase, lowercase, a number, and a special character." },
                    { status: 400 }
                );
            }
            return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
        }

        // Update bcrypt hash in users table
        const newHash = await bcrypt.hash(newPassword, 12);
        const { error: dbError } = await admin
            .from("users")
            .update({ password: newHash, updated_at: new Date().toISOString() })
            .eq("id", user.id);

        if (dbError) {
            return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}
