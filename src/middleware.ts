import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logApiRequest } from '@/lib/logger';
import {
    authLimiter,
    aiLimiter,
    uploadLimiter,
    apiLimiter,
    checkRateLimit,
    getClientIp,
    tooManyRequests,
    type RateLimitResult,
} from '@/lib/rate-limit';

// PostgREST returns 503 + PGRST002 during schema-cache reloads (triggered by
// DDL changes like RLS policy updates). Retry the request with exponential
// back-off so the middleware never causes a redirect loop due to a transient
// database unavailability. Mirrors the same helper in src/lib/supabase/admin.ts.
const MIDDLEWARE_POSTGREST_ATTEMPTS = 5;
const MIDDLEWARE_POSTGREST_BASE_MS = 300;

async function fetchWithTransientRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    let last: Response | undefined;
    for (let attempt = 1; attempt <= MIDDLEWARE_POSTGREST_ATTEMPTS; attempt++) {
        last = await fetch(input, init);
        if (last.ok) return last;

        let body = '';
        try { body = await last.clone().text(); } catch { /* ignore */ }

        const isTransient =
            last.status === 503 ||
            body.includes('PGRST002') ||
            /\bschema cache\b/i.test(body);

        if (!isTransient || attempt === MIDDLEWARE_POSTGREST_ATTEMPTS) {
            return new Response(body, {
                status: last.status,
                statusText: last.statusText,
                headers: last.headers,
            });
        }

        await new Promise(r => setTimeout(r, MIDDLEWARE_POSTGREST_BASE_MS * attempt));
    }
    return last!;
}

// Role-based route configuration
const roleRoutes: Record<string, string[]> = {
    candidate: [
        '/candidate/dashboard',
        '/candidate/profile',
        '/candidate/settings',
        '/candidate/jobs',
        '/candidate/create-profile',
        '/candidate/calendar',
    ],
    employer: [
        '/employer/dashboard',
        '/employer/jobs',
        '/employer/candidates',
        '/employer/company',
        '/employer/profile',
        '/employer/admins',
        '/employer/settings',
        '/employer/calendar',
    ],
    mis: [
        '/mis/dashboard',
        '/mis/users',
        '/mis/candidates',
        '/mis/employers',
        '/mis/jobs',
        '/mis/settings',
        '/mis/reports',
        '/mis/audit',
        '/mis/interviews',
        '/mis/roles',
        '/mis/content',
    ],
};

// All protected routes (combined from all roles)
const allProtectedRoutes = Object.values(roleRoutes).flat();

// Routes that should redirect to dashboard if authenticated
const authRoutes = [
    '/login',
    '/candidate/signup',
    '/employer/login',
    '/employer/signup',
    '/mis/login',
    '/mis/register',
    '/forgot-password',
    '/reset-password',
];

// Choose the appropriate rate limiter for a request, or null if it shouldn't be
// limited. Auth pages are only limited on POST (server-action submissions) so
// normal page loads are never throttled.
function selectLimiter(pathname: string, method: string) {
    if (pathname.startsWith('/api/verify-br-certificate')) return aiLimiter;
    if (
        pathname.startsWith('/api/upload-presignup') ||
        pathname.startsWith('/api/delete-presignup-file')
    ) {
        return uploadLimiter;
    }
    if (pathname.startsWith('/api/')) return apiLimiter;
    if (method === 'POST' && authRoutes.includes(pathname)) return authLimiter;
    return null;
}

// Get the default dashboard for a role
function getDashboardForRole(role: string): string {
    switch (role) {
        case 'candidate':
            return '/candidate/dashboard';
        case 'employer':
            return '/employer/dashboard';
        case 'mis':
            return '/mis/dashboard';
        default:
            return '/';
    }
}

// Check if a route belongs to a specific role
function getRouteRole(pathname: string): string | null {
    for (const [role, routes] of Object.entries(roleRoutes)) {
        if (routes.some(route => pathname.startsWith(route))) {
            return role;
        }
    }
    return null;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- Rate limiting (DDoS / brute-force / cost-abuse protection) ---
    // Runs first, before any DB round-trip, keyed by client IP. Fails open if
    // Upstash is not configured or unavailable (see src/lib/rate-limit.ts).
    const limiter = selectLimiter(pathname, request.method);
    if (limiter) {
        const ip = getClientIp(request.headers);
        const rl: RateLimitResult = await checkRateLimit(limiter, ip);
        if (!rl.success) {
            return tooManyRequests(rl);
        }
    }

    // Check if accessing a protected route or auth route
    const isProtectedRoute = allProtectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname === route);

    // Filter for API routes to log
    if (pathname.startsWith('/api/')) {
        // Log the API request (fire and forget)
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

        logApiRequest({
            method: request.method,
            path: pathname,
            status: 0, // 0 indicates request started/in-progress
            duration: 0,
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || undefined
        }).catch(err => console.error("Middleware logging error:", err));
    }

    // Skip middleware if not a relevant route
    if (!isProtectedRoute && !isAuthRoute) {
        return NextResponse.next();
    }

    // Create response to modify cookies if needed
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Create Supabase client with cookie handling.
    // The custom fetch adds retry logic for PostgREST 503 / schema-cache
    // reload errors so that transient DDL-triggered unavailability never
    // results in an infinite redirect loop.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
            global: {
                fetch: fetchWithTransientRetry,
            },
        }
    );

    // Check for valid session
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // For authenticated users on protected routes, verify role
    if (isProtectedRoute && user) {
        // Get user role from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, status')
            .eq('id', user.id)
            .single();

        // If user data couldn't be fetched, distinguish transient vs real errors.
        // A real "no data" (PGRST116 / no rows) means the user record is missing →
        // redirect to login. A transient error (503 / network) after all retries
        // means we pass through and let the page handle it; redirecting to /login
        // here would cause an infinite loop because the login page also queries
        // the users table and would fail the same way.
        if (!userData) {
            const isTransientError =
                userError?.code === 'PGRST002' ||
                (userError as { status?: number })?.status === 503 ||
                userError?.message?.toLowerCase().includes('schema cache');

            if (isTransientError) {
                // PostgREST still reloading — pass through rather than loop.
                return response;
            }

            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Check if account is active
        if (userData.status !== 'active') {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('error', 'account_inactive');
            return NextResponse.redirect(loginUrl);
        }

        // Check role authorization
        const requiredRole = getRouteRole(pathname);
        if (requiredRole && userData.role !== requiredRole) {
            // Redirect to their correct dashboard
            return NextResponse.redirect(new URL(getDashboardForRole(userData.role), request.url));
        }

        // Additional check for candidates: verify profile completion and approval status
        if (userData.role === 'candidate' && requiredRole === 'candidate') {
            const { data: candidateData } = await supabase
                .from('candidates')
                .select('approval_status, profile_completed')
                .eq('user_id', user.id)
                .single();

            // Block access to any candidate route if profile is not yet completed
            if (!candidateData?.profile_completed) {
                // Only allow the profile creation route itself
                if (!pathname.startsWith('/candidate/create-profile')) {
                    return NextResponse.redirect(new URL('/candidate/create-profile', request.url));
                }
            } else if (candidateData.approval_status !== 'approved') {
                // Profile is complete but pending/rejected approval — restrict to a small set of routes
                const allowedRoutes = ['/candidate/dashboard', '/candidate/profile', '/candidate/resumes', '/candidate/create-profile', '/candidate/settings'];
                const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route));

                if (!isAllowedRoute) {
                    const dashboardUrl = new URL('/candidate/dashboard', request.url);
                    dashboardUrl.searchParams.set('info', 'approval_pending');
                    return NextResponse.redirect(dashboardUrl);
                }
            }
        }

        // Additional check for employers: verify profile completion and approval status
        if (userData.role === 'employer' && requiredRole === 'employer') {
            const { data: employerData } = await supabase
                .from('employers')
                .select(`
                    id,
                    profile_completed,
                    is_super_admin,
                    companies!inner (
                        approval_status,
                        profile_completed
                    )
                `)
                .eq('user_id', user.id)
                .single();

            // Type assertion for nested company data
            const company = (employerData as Record<string, unknown>)?.companies as { profile_completed?: boolean; approval_status?: string } | null;
            const isSuperAdmin = (employerData as Record<string, unknown>)?.is_super_admin as boolean | null;

            // Super admins complete the company profile only (the personal employer
            // profile step was removed from their wizard). Sub-admins only need their
            // own employer profile completed. This must stay aligned with the check in
            // src/app/employer/complete-profile/page.tsx, otherwise the two redirect
            // back and forth in an infinite loop.
            const isProfileComplete = isSuperAdmin
                ? company?.profile_completed
                : employerData?.profile_completed;

            // Block access to any employer route if profile is not yet completed
            if (!isProfileComplete) {
                return NextResponse.redirect(new URL('/employer/complete-profile', request.url));
            }

            // Profile is complete but company pending/rejected approval — restrict routes
            if (company?.profile_completed && company.approval_status !== 'approved') {
                const allowedRoutes = ['/employer/dashboard', '/employer/company', '/employer/profile'];
                const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route));

                if (!isAllowedRoute) {
                    const dashboardUrl = new URL('/employer/dashboard', request.url);
                    dashboardUrl.searchParams.set('info', 'approval_pending');
                    return NextResponse.redirect(dashboardUrl);
                }
            }
        }
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && user) {
        // Get user role to redirect to correct dashboard
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const dashboard = userData?.role ? getDashboardForRole(userData.role) : '/candidate/dashboard';
        return NextResponse.redirect(new URL(dashboard, request.url));
    }

    return response;
}

export const config = {
    matcher: [
        // Candidate routes
        '/candidate/dashboard/:path*',
        '/candidate/profile/:path*',
        '/candidate/settings/:path*',
        '/candidate/jobs/:path*',
        '/candidate/create-profile/:path*',
        '/candidate/calendar/:path*',
        // Employer routes
        '/employer/dashboard/:path*',
        '/employer/jobs/:path*',
        '/employer/candidates/:path*',
        '/employer/company/:path*',
        '/employer/profile/:path*',
        '/employer/admins/:path*',
        '/employer/settings/:path*',
        '/employer/calendar/:path*',
        // MIS routes
        '/mis/dashboard',
        '/mis/dashboard/:path*',
        '/mis/users',
        '/mis/users/:path*',
        '/mis/candidates',
        '/mis/candidates/:path*',
        '/mis/employers',
        '/mis/employers/:path*',
        '/mis/jobs',
        '/mis/jobs/:path*',
        '/mis/settings',
        '/mis/settings/:path*',
        '/mis/reports',
        '/mis/reports/:path*',
        '/mis/audit',
        '/mis/audit/:path*',
        '/mis/interviews',
        '/mis/interviews/:path*',
        '/mis/roles',
        '/mis/roles/:path*',
        '/mis/content',
        '/mis/content/:path*',
        // Auth routes
        '/login',
        '/candidate/signup',
        '/employer/login',
        '/employer/signup',
        '/mis/login',
        '/mis/register',
        '/forgot-password',
        '/reset-password',
        // API routes — rate limiting + request logging (excludes Next internals
        // and static assets which Next never routes through here anyway).
        '/api/:path*',
    ],
};
