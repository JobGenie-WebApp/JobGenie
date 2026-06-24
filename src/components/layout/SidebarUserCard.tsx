"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsUpDown, LogOut, Moon, Settings, Sun, User } from "lucide-react";
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
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

interface SidebarUserCardProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
    };
    /** Secondary line under the email in the dropdown (membership no / company). */
    detail?: string;
    profileHref?: string;
    settingsHref?: string;
}

export function SidebarUserCard({ user, detail, profileHref, settingsHref }: SidebarUserCardProps) {
    const [mounted, setMounted] = useState(false);
    const { isMobile } = useSidebar();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (data.success && data.redirectTo) {
                router.push(data.redirectTo);
                router.refresh();
            } else {
                router.push("/login");
                router.refresh();
            }
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login");
            router.refresh();
        }
    };

    const trigger = (
        <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
            <Avatar className="h-8 w-8 rounded-lg">
                {mounted && <AvatarImage src={user.profileImage} alt={fullName} />}
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </SidebarMenuButton>
    );

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                {!mounted ? (
                    trigger
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{fullName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    {detail && (
                                        <p className="mt-1 text-xs font-medium leading-none text-primary">{detail}</p>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                {profileHref && (
                                    <DropdownMenuItem asChild>
                                        <Link href={profileHref} className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {settingsHref && (
                                    <DropdownMenuItem asChild>
                                        <Link href={settingsHref} className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
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
                )}
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
