"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DynamicListProps<T> {
    items: T[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    renderItem: (item: T, index: number) => React.ReactNode;
    addLabel?: string;
    emptyMessage?: string;
    maxItems?: number;
}

export function DynamicList<T>({
    items,
    onAdd,
    onRemove,
    renderItem,
    addLabel = "Add Item",
    emptyMessage = "No items added yet",
    maxItems = 100,
}: DynamicListProps<T>) {
    const canAdd = items.length < maxItems;

    return (
        <div className="space-y-4">
            {items.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <p className="text-muted-foreground">{emptyMessage}</p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onAdd}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {addLabel}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                items.map((item, index) => (
                    <Card key={index} className="relative">
                        <CardContent className="p-4 pr-12">
                            {renderItem(item, index)}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                                onClick={() => onRemove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))
            )}

            {items.length > 0 && canAdd && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={onAdd}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {addLabel}
                </Button>
            )}
        </div>
    );
}
