'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to the database via server action
        console.error(error);
        logError({
            source: 'app/error.tsx',
            errorType: 'ClientRenderingError',
            message: error.message,
            stack: error.stack,
            metadata: { digest: error.digest }
        }).catch(err => console.error("Failed to log error:", err));
    }, [error]);

    return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
            <p className="text-muted-foreground">
                We apologize for the inconvenience. The error has been logged.
            </p>
            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </Button>
        </div>
    );
}
