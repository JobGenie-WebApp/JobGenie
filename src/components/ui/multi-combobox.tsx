"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface ComboboxOption {
    value: string
    label: string
}

interface MultiComboboxProps {
    options: ComboboxOption[]
    values?: string[]
    onValuesChange: (values: string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function MultiCombobox({
    options,
    values = [],
    onValuesChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    className,
    disabled = false,
}: MultiComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const selectedOptions = React.useMemo(() => {
        return options.filter((option) => values.includes(option.value))
    }, [options, values])

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options
        const query = searchQuery.toLowerCase()
        return options.filter((option) =>
            option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    const handleSelect = (optionValue: string) => {
        const newValues = values.includes(optionValue)
            ? values.filter((val) => val !== optionValue)
            : [...values, optionValue]
        onValuesChange(newValues)
    }

    const removeValue = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation()
        onValuesChange(values.filter((val) => val !== optionValue))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-10 px-3 py-2", className)}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
                        {selectedOptions.length === 0 ? (
                            <span className="text-muted-foreground/50 truncate text-left w-full">{placeholder}</span>
                        ) : (
                            selectedOptions.map((option) => (
                                <Badge
                                    variant="secondary"
                                    key={option.value}
                                    className="mr-1 mb-1 font-normal"
                                >
                                    {option.label}
                                    <div
                                        role="button"
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                removeValue(e as unknown as React.MouseEvent, option.value);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => removeValue(e, option.value)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </div>
                                </Badge>
                            ))
                        )}
                    </div>
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
                                {filteredOptions.map((option, index) => {
                                    const isSelected = values.includes(option.value)
                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                                isSelected && "bg-accent/50"
                                            )}
                                            onClick={() => handleSelect(option.value)}
                                        >
                                            <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border", isSelected ? "border-primary" : "border-muted-foreground")}>
                                                <Check
                                                    className={cn(
                                                        "h-3 w-3 text-primary",
                                                        isSelected ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </div>
                                            <span className="flex-1">{option.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
