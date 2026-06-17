'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

const THEME_ORDER = ['light', 'dark', 'system'] as const;

function nextTheme(current: string | undefined): (typeof THEME_ORDER)[number] {
    const normalized = THEME_ORDER.includes(current as (typeof THEME_ORDER)[number])
        ? (current as (typeof THEME_ORDER)[number])
        : 'system';
    const i = THEME_ORDER.indexOf(normalized);
    return THEME_ORDER[(i + 1) % THEME_ORDER.length];
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const cycle = React.useCallback(() => {
        setTheme(nextTheme(theme));
    }, [theme, setTheme]);

    const upcoming = nextTheme(theme);

    const label = React.useMemo(() => {
        const names = { light: 'Light', dark: 'Dark', system: 'System' } as const;
        return `Theme: ${names[(theme as keyof typeof names) ?? 'system']}. Click to use ${names[upcoming]}.`;
    }, [theme, upcoming]);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="hover:bg-primary/10" aria-hidden>
                <Sun className="h-5 w-5 text-primary opacity-60" />
                <span className="sr-only">Loading theme control</span>
            </Button>
        );
    }

    const Icon =
        theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10"
            onClick={cycle}
            title={`Next: ${upcoming === 'light' ? 'Light' : upcoming === 'dark' ? 'Dark' : 'System'}`}
            aria-label={label}
        >
            <Icon className="h-5 w-5 text-primary transition-transform duration-200 active:scale-90" />
        </Button>
    );
}
