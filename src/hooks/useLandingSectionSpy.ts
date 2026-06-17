'use client';

import { useEffect, useState } from 'react';

const HEADER_OFFSET = 96;

/**
 * Returns the nav id of the section currently in view.
 * Active = the last section whose top edge has scrolled past the header.
 * On initial load, reads window.location.hash to avoid the flash where
 * the first section appears active before scroll position is measured.
 */
export function useLandingSectionSpy(sectionIds: readonly string[]) {
    const [activeId, setActiveId] = useState(() => {
        // Server-safe: window doesn't exist during SSR
        if (typeof window === 'undefined') return '';
        const hash = window.location.hash.replace('#', '');
        return sectionIds.includes(hash) ? hash : '';
    });

    useEffect(() => {
        const computeActive = () => {
            const marker = window.scrollY + HEADER_OFFSET;
            let current = '';
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top + window.scrollY;
                if (top <= marker) current = id;
            }
            setActiveId(current);
        };

        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(computeActive);
        };

        // Run once after mount so scroll position is accurate
        computeActive();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [sectionIds]);

    return activeId;
}
