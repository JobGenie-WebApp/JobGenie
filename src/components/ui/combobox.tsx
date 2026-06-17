"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface ComboboxOption {
    value: string
    label: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    className,
    disabled = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const selectedOption = options.find((option) => option.value === value)

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options
        const query = searchQuery.toLowerCase()
        return options.filter((option) =>
            option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue)
        setOpen(false)
        setSearchQuery("")
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    <span className={cn("truncate text-left", !selectedOption && "text-muted-foreground/50")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={true}
                collisionPadding={10}
            >
                <div className="flex flex-col max-h-[350px]">
                    <div className="border-b px-3 py-2">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus={false}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-[300px]">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                            value === option.value && "bg-accent"
                                        )}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 flex-shrink-0",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="flex-1">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
