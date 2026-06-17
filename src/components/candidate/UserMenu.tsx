"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
        membershipNo?: string;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

    // Only render after mounting to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success && data.redirectTo) {
                router.push(data.redirectTo);
                router.refresh();
            } else {
                // Fallback redirect
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback redirect on error
            router.push('/login');
            router.refresh();
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Show avatar placeholder during SSR
    if (!mounted) {
        return (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-border hover:border-primary transition-colors cursor-pointer">
                        <AvatarImage src={user.profileImage} alt={fullName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                        {user.membershipNo && (
                            <p className="text-xs leading-none font-mono mt-1 text-green-500 font-bold">
                                Membership No: {user.membershipNo}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/candidate/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/candidate/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="cursor-pointer"
                    >
                        {theme === "dark" ? (
                            <>
                                <Sun className="mr-2 h-4 w-4" />
                                <span>Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="mr-2 h-4 w-4" />
                                <span>Dark Mode</span>
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
