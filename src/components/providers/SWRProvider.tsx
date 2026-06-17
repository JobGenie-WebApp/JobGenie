"use client";

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
    children: ReactNode;
}

/**
 * Global SWR Configuration Provider
 * 
 * Configures default behavior for all SWR hooks:
 * - Revalidates on window focus
 * - Revalidates on network reconnection
 * - Error retry with exponential backoff
 * - Request deduplication
 * - Cache management
 */
export function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                // Revalidate when window regains focus
                revalidateOnFocus: true,
                
                // Revalidate when network reconnects
                revalidateOnReconnect: true,
                
                // Dedupe requests within 2 seconds
                dedupingInterval: 2000,
                
                // Error retry configuration
                shouldRetryOnError: true,
                errorRetryCount: 3,
                errorRetryInterval: 5000,
                
                // Load cached data first, then fetch fresh data
                revalidateIfStale: true,
                
                // Keep previous data while fetching new data
                keepPreviousData: true,
                
                // Suspense and error boundary support
                suspense: false,
                
                // Fetcher function (can be overridden per hook)
                fetcher: async (url: string) => {
                    const response = await fetch(url);
                    
                    // Handle non-OK responses
                    if (!response.ok) {
                        const error = new Error('An error occurred while fetching the data.');
                        throw error;
                    }
                    
                    return response.json();
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
