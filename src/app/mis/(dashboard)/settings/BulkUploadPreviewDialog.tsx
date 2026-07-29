"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PreviewColumn {
    key: string;
    label: string;
}

export interface PreviewRow {
    row: number;
    valid: boolean;
    error: string | null;
    values: Record<string, string | number | null>;
}

export interface PreviewSummary {
    total: number;
    valid: number;
    invalid: number;
}

interface BulkUploadPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    columns: PreviewColumn[];
    rows: PreviewRow[];
    summary: PreviewSummary;
    confirming: boolean;
    onConfirm: () => void;
}

export function BulkUploadPreviewDialog({
    open,
    onOpenChange,
    title,
    columns,
    rows,
    summary,
    confirming,
    onConfirm,
}: BulkUploadPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Review each row below. Only valid rows will be imported; rows with errors are skipped.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{summary.total} total</Badge>
                    <Badge className="bg-green-600 text-white">{summary.valid} valid</Badge>
                    {summary.invalid > 0 && (
                        <Badge variant="destructive">{summary.invalid} with errors</Badge>
                    )}
                </div>

                <ScrollArea className="max-h-[50vh] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Row</TableHead>
                                {columns.map((col) => (
                                    <TableHead key={col.key}>{col.label}</TableHead>
                                ))}
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                                        No rows found in file
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.row} className={row.valid ? undefined : "bg-destructive/5"}>
                                        <TableCell className="font-mono text-muted-foreground">{row.row}</TableCell>
                                        {columns.map((col) => (
                                            <TableCell key={col.key} className="font-medium">
                                                {row.values[col.key] !== null && row.values[col.key] !== undefined && row.values[col.key] !== ""
                                                    ? row.values[col.key]
                                                    : <span className="text-muted-foreground italic">—</span>}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            {row.valid ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                                    <CheckCircle2 className="h-4 w-4" /> Valid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-start gap-1 text-destructive text-sm">
                                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <span>{row.error}</span>
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={confirming || summary.valid === 0}>
                        {confirming
                            ? "Importing..."
                            : `Import ${summary.valid} valid row${summary.valid === 1 ? "" : "s"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
