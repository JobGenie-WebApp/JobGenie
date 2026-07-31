"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface JobDesignation {
    designation_id: number;
    designation_name: string;
}

interface LookupState {
    loaded: boolean;
    designations: JobDesignation[];
    error: string | null;
}

interface JobDesignationComboboxProps {
    id: string;
    value: string;
    onValueChange: (value: string) => void;
    hasError?: boolean;
}

export function JobDesignationCombobox({
    id,
    value,
    onValueChange,
    hasError = false,
}: JobDesignationComboboxProps) {
    const [open, setOpen] = useState(false);
    const [lookup, setLookup] = useState<LookupState>({
        loaded: false,
        designations: [],
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();

        fetch("/api/job-designations", {
            signal: controller.signal,
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Failed to load job designations");
                }

                const rows: JobDesignation[] = Array.isArray(result.data) ? result.data : [];
                const seen = new Set<string>();
                const designations = rows.filter((designation) => {
                    const key = designation.designation_name.trim().toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                setLookup({ loaded: true, designations, error: null });
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setLookup({
                    loaded: true,
                    designations: [],
                    error: error instanceof Error ? error.message : "Failed to load job designations",
                });
            });

        return () => controller.abort();
    }, []);

    const isLoading = !lookup.loaded;
    const options = lookup.designations.map((designation) => ({
        value: designation.designation_name,
        id: designation.designation_id,
    }));

    const placeholder = isLoading
        ? "Loading designations…"
        : lookup.error
            ? "Unable to load designations"
            : "Search and select a designation";

    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={`${id}-options`}
                        aria-invalid={hasError || Boolean(lookup.error)}
                        disabled={isLoading || Boolean(lookup.error)}
                        className={cn(
                            "h-12 w-full justify-between rounded-xl border-border/80 bg-background/70 px-4 text-base font-normal text-foreground shadow-sm sm:text-sm",
                            "hover:bg-background/90 focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10",
                            !value && "text-muted-foreground/60",
                            (hasError || lookup.error) && "border-destructive/50",
                        )}
                    >
                        <span className="truncate">{value || placeholder}</span>
                        {isLoading ? (
                            <Loader2 className="ml-2 size-4 shrink-0 animate-spin opacity-60" />
                        ) : (
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    collisionPadding={12}
                >
                    <Command>
                        <CommandInput placeholder="Search job designation…" />
                        <CommandList id={`${id}-options`}>
                            <CommandEmpty>
                                No matching designation found.
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={option.value}
                                        onSelect={() => {
                                            onValueChange(option.value);
                                            setOpen(false);
                                        }}
                                        className="py-2.5"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 size-4 shrink-0",
                                                value === option.value ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        <span>{option.value}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {lookup.error && (
                <p className="mt-1.5 text-xs text-destructive" role="alert">
                    {lookup.error}. Please try again.
                </p>
            )}
        </div>
    );
}
