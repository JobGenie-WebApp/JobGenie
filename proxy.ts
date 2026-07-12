import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

const payloadRoutePrefixes = [
    '/cms',
    '/cms-api',
    '/cms-graphql',
    '/cms-graphql-playground',
];

export async function proxy(request: NextRequest) {
    if (payloadRoutePrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
        return NextResponse.next({ request });
    }

    // update user's auth session
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - cms / cms-api (Payload CMS handles its own auth and routes)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|cms(?:/.*)?|cms-api(?:/.*)?|cms-graphql(?:/.*)?|cms-graphql-playground(?:/.*)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
