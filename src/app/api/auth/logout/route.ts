import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logAuth } from '@/lib/logger';

export async function POST() {
    const supabase = await createClient();

    // Get user role before signing out
    const { data: { user } } = await supabase.auth.getUser();
    let redirectPath = '/login'; // Default redirect

    if (user) {
        // Fetch user role from database
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        // Set redirect based on role
        if (userData?.role === 'mis') {
            redirectPath = '/mis/login';
        } else if (userData?.role === 'employer') {
            redirectPath = '/employer/login';
        } else {
            redirectPath = '/login'; // candidate or default
        }
    }

    // Sign out from Supabase - this clears the session
    const { error } = await supabase.auth.signOut();

    if (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to sign out' },
            { status: 500 }
        );
    }

    // Return success with role-specific redirect
    await logAuth('user_logout', user?.id, (user ? undefined : undefined), { role: user ? undefined : 'unknown' });
    return NextResponse.json({
        success: true,
        message: 'Signed out successfully',
        redirectTo: redirectPath,
    });
}

