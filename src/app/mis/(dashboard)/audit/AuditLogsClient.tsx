"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTimestamp } from "@/lib/date-utils";
import type { AuditSummary } from "@/lib/audit-queries";
import { Activity, AlertCircle, Calendar, Filter, MoreHorizontal, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const PAGE = 50;
const ALL = "all";
const NO_ROLE_VALUE = "__none__";

type DatePreset = "all" | "24h" | "7d" | "30d" | "custom";

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { from: string; to: string } | null {
    const now = new Date();
    if (preset === "24h") {
        const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: now.toISOString() };
    }
    if (preset === "7d") {
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: now.toISOString() };
    }
    if (preset === "30d") {
        const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: now.toISOString() };
    }
    if (preset === "custom" && customFrom) {
        return {
            from: new Date(customFrom).toISOString(),
            to: customTo ? new Date(customTo + "T23:59:59").toISOString() : now.toISOString(),
        };
    }
    return null;
}

interface EventLog {
    id: string;
    user_id: string | null;
    user_role: string | null;
    category: string;
    action: string;
    label: string | null;
    resource_type: string | null;
    resource_id: string | null;
    metadata: unknown;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface ErrorLog {
    id: string;
    user_id: string | null;
    source: string;
    error_type: string;
    message: string;
    resolved: boolean;
    created_at: string;
}

function shortId(id: string | null | undefined, len = 8) {
    if (!id) return "—";
    return id.length > len + 2 ? `${id.slice(0, len)}…` : id;
}

function formatJson(value: unknown) {
    if (value == null) return "—";
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function AuditLogsClient() {
    const [summary, setSummary] = useState<AuditSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [eventTotal, setEventTotal] = useState(0);
    const [eventOffset, setEventOffset] = useState(0);
    const [eventsLoading, setEventsLoading] = useState(true);

    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [errorTotal, setErrorTotal] = useState(0);
    const [errorOffset, setErrorOffset] = useState(0);
    const [errorsLoading, setErrorsLoading] = useState(true);

    const [categoryFilter, setCategoryFilter] = useState(ALL);
    const [roleFilter, setRoleFilter] = useState(ALL);
    const [actionDraft, setActionDraft] = useState("");
    const [actionQuery, setActionQuery] = useState("");
    const initActionRef = useRef(true);

    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const [detailEvent, setDetailEvent] = useState<EventLog | null>(null);

    const loadSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await fetch("/api/mis/audit/summary");
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (e) {
            console.error("Failed to load audit summary:", e);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const loadEvents = useCallback(async () => {
        setEventsLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== ALL) {
                params.set("category", categoryFilter);
            }
            if (roleFilter === NO_ROLE_VALUE) {
                params.set("emptyUserRole", "1");
            } else if (roleFilter !== ALL) {
                params.set("userRole", roleFilter);
            }
            if (actionQuery.trim()) {
                params.set("action", actionQuery.trim());
            }
            const dateRange = getDateRange(datePreset, customFrom, customTo);
            if (dateRange) {
                params.set("dateFrom", dateRange.from);
                params.set("dateTo", dateRange.to);
            }
            params.set("limit", String(PAGE));
            params.set("offset", String(eventOffset));

            const res = await fetch(`/api/mis/audit/logs?${params}`);
            const data = await res.json();
            if (data.success) {
                setEventLogs(data.logs || []);
                setEventTotal(data.total ?? 0);
            }
        } catch (e) {
            console.error("Failed to load event logs:", e);
        } finally {
            setEventsLoading(false);
        }
    }, [categoryFilter, roleFilter, actionQuery, eventOffset, datePreset, customFrom, customTo]);

    const loadErrors = useCallback(async () => {
        setErrorsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("resolved", "false");
            const dateRange = getDateRange(datePreset, customFrom, customTo);
            if (dateRange) {
                params.set("dateFrom", dateRange.from);
                params.set("dateTo", dateRange.to);
            }
            params.set("limit", String(PAGE));
            params.set("offset", String(errorOffset));

            const res = await fetch(`/api/mis/audit/errors?${params}`);
            const data = await res.json();
            if (data.success) {
                setErrorLogs(data.errors || []);
                setErrorTotal(data.total ?? 0);
            }
        } catch (e) {
            console.error("Failed to load error logs:", e);
        } finally {
            setErrorsLoading(false);
        }
    }, [errorOffset, datePreset, customFrom, customTo]);

    // Debounce action input -> actionQuery
    useEffect(() => {
        const t = setTimeout(() => setActionQuery(actionDraft), 400);
        return () => clearTimeout(t);
    }, [actionDraft]);

    useEffect(() => {
        if (initActionRef.current) {
            initActionRef.current = false;
            return;
        }
        setEventOffset(0);
    }, [actionQuery]);

    useEffect(() => {
        setEventOffset(0);
        setErrorOffset(0);
    }, [datePreset, customFrom, customTo]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useEffect(() => {
        loadErrors();
    }, [loadErrors]);

    const onRefresh = () => {
        loadSummary();
        loadEvents();
        loadErrors();
    };

    const pageLoading = summaryLoading;
    const categories = summary
        ? Object.keys(summary.categoryCounts).sort((a, b) => a.localeCompare(b))
        : [];
    const roles = summary?.userRoles ?? [];
    const authEventCount = summary ? (summary.categoryCounts["auth"] ?? 0) : 0;
    const eventTo = eventTotal > 0 ? Math.min(eventOffset + eventLogs.length, eventTotal) : 0;
    const errorTo = errorTotal > 0 ? Math.min(errorOffset + errorLogs.length, errorTotal) : 0;

    return (
        <div className="space-y-6">
            {/* Stats: all counts from /api/mis/audit/summary and error_total */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Event log records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summaryLoading ? "…" : (summary?.eventLogTotal ?? "—")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total in database (all time)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Unresolved errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {summaryLoading ? "…" : (summary?.errorLogUnresolved ?? "—")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Where resolved is false in the error_logs table</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Auth-tagged events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summaryLoading ? "…" : authEventCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Where category = auth (global count)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {summary?.facetsAreSampled && (
                <p className="text-xs text-amber-700 dark:text-amber-400/90">
                    Some filter options are derived from a large sample; prefer configuring{" "}
                    <code className="rounded bg-muted px-1">DATABASE_URL</code> for exact faceting.
                </p>
            )}

            {summary && summary.topActions.length > 0 && (
                <p className="text-xs text-muted-foreground max-w-4xl">
                    <span className="font-medium text-foreground">Top actions in the database: </span>
                    {summary.topActions.slice(0, 8).map((a, i) => (
                        <span key={a.action}>
                            {i > 0 && " · "}
                            {a.action}
                            <span className="text-muted-foreground"> ({a.count})</span>
                        </span>
                    ))}
                    {summary.topActions.length > 8 && "…"}
                </p>
            )}

            {/* Filters — options from live DB (summary) */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5" />
                        Category
                    </div>
                    <Select
                        value={categoryFilter}
                        onValueChange={(v) => {
                            setCategoryFilter(v);
                            setEventOffset(0);
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories (in use)</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c} ({summary?.categoryCounts[c] ?? 0})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">User role (logged)</div>
                    <Select
                        value={roleFilter}
                        onValueChange={(v) => {
                            setRoleFilter(v);
                            setEventOffset(0);
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All roles (in use)</SelectItem>
                            <SelectItem value={NO_ROLE_VALUE}>
                                (empty / system — not role-scoped)
                            </SelectItem>
                            {roles.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Action contains (ilike)</div>
                    <Input
                        placeholder="e.g. login, invite…"
                        value={actionDraft}
                        onChange={(e) => setActionDraft(e.target.value)}
                        className="max-w-xs w-[200px]"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Time range
                    </div>
                    <Select
                        value={datePreset}
                        onValueChange={(v) => setDatePreset(v as DatePreset)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All time</SelectItem>
                            <SelectItem value="24h">Past 24 hours</SelectItem>
                            <SelectItem value="7d">Past 7 days</SelectItem>
                            <SelectItem value="30d">Past 30 days</SelectItem>
                            <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {datePreset === "custom" && (
                    <>
                        <div className="space-y-1.5">
                            <div className="text-xs text-muted-foreground">From</div>
                            <Input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                className="w-[160px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-xs text-muted-foreground">To</div>
                            <Input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                className="w-[160px]"
                            />
                        </div>
                    </>
                )}

                <Button
                    type="button"
                    variant="outline"
                    onClick={onRefresh}
                    disabled={pageLoading && !eventLogs.length}
                >
                    <RefreshCw
                        className={`h-4 w-4 ${(eventsLoading || summaryLoading) ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="events" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="events">
                        <Activity className="h-4 w-4 mr-2" />
                        Event records
                    </TabsTrigger>
                    <TabsTrigger value="errors">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Unresolved errors ({errorTotal})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                            {eventTotal > 0
                                ? `Showing ${eventOffset + 1}–${eventTo} of ${eventTotal} (this page: ${PAGE})`
                                : eventsLoading
                                    ? "Loading…"
                                    : "No records match the filters."}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={eventOffset === 0 || eventsLoading}
                                onClick={() => setEventOffset((o) => Math.max(0, o - PAGE))}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    eventsLoading || !eventTotal || eventOffset + PAGE >= eventTotal
                                }
                                onClick={() => setEventOffset((o) => o + PAGE)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                    <div className="bg-card border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-40">Timestamp</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead className="w-32">IP</TableHead>
                                    <TableHead className="w-32">User agent</TableHead>
                                    <TableHead className="w-24" />
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {eventsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            Loading event logs…
                                        </TableCell>
                                    </TableRow>
                                ) : eventLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No event logs
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    eventLogs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="border-b transition-colors duration-150 hover:bg-muted/60"
                                        >
                                            <TableCell className="text-xs align-top">
                                                {formatTimestamp(
                                                    log.created_at,
                                                    "MMM dd, yyyy HH:mm:ss"
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <Badge variant="outline">{log.category}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm align-top max-w-[14rem]">
                                                {log.action}
                                            </TableCell>
                                            <TableCell
                                                className="text-xs font-mono align-top"
                                                title={log.user_id ?? ""}
                                            >
                                                {shortId(log.user_id)}
                                            </TableCell>
                                            <TableCell className="align-top text-xs">
                                                {log.user_role ? (
                                                    <Badge variant="secondary">{log.user_role}</Badge>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs align-top max-w-[12rem]">
                                                {log.resource_type ? (
                                                    <span className="break-words">
                                                        {log.resource_type}
                                                        {log.label && ` · ${log.label}`}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground align-top break-all max-w-[8rem]">
                                                {log.ip_address ?? "—"}
                                            </TableCell>
                                            <TableCell
                                                className="text-xs text-muted-foreground align-top max-w-[7rem] truncate"
                                                title={log.user_agent ?? ""}
                                            >
                                                {log.user_agent ?? "—"}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDetailEvent(log)}
                                                    title="View full event"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="errors" className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                            {errorTotal > 0
                                ? `Showing ${errorOffset + 1}–${errorTo} of ${errorTotal}`
                                : errorsLoading
                                    ? "Loading…"
                                    : "No unresolved errors."}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={errorOffset === 0 || errorsLoading}
                                onClick={() => setErrorOffset((o) => Math.max(0, o - PAGE))}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={errorsLoading || !errorTotal || errorOffset + PAGE >= errorTotal}
                                onClick={() => setErrorOffset((o) => o + PAGE)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                    <div className="bg-card border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Error type</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {errorsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading error logs…
                                        </TableCell>
                                    </TableRow>
                                ) : errorLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No unresolved errors
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    errorLogs.map((error) => (
                                        <TableRow
                                            key={error.id}
                                            className="border-b transition-colors duration-150 hover:bg-muted/60"
                                        >
                                            <TableCell className="text-xs">
                                                {formatTimestamp(
                                                    error.created_at,
                                                    "MMM dd, yyyy HH:mm:ss"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono break-all max-w-xs">
                                                {error.source}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">{error.error_type}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-sm" title={error.message}>
                                                {error.message}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={error.resolved ? "default" : "destructive"}
                                                >
                                                    {error.resolved ? "Resolved" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Event log detail</DialogTitle>
                    </DialogHeader>
                    {detailEvent && (
                        <div className="space-y-3 text-sm min-h-0">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <div className="text-muted-foreground">User id</div>
                                    <div className="font-mono break-all">
                                        {detailEvent.user_id ?? "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Resource id</div>
                                    <div className="font-mono break-all">
                                        {detailEvent.resource_id ?? "—"}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">User agent</div>
                                <p className="text-xs break-all max-h-24 overflow-y-auto border rounded p-2 bg-muted/30">
                                    {detailEvent.user_agent || "—"}
                                </p>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Metadata</div>
                                <ScrollArea className="h-48 w-full border rounded p-2 bg-muted/20">
                                    <pre className="text-xs font-mono whitespace-pre-wrap pr-2">
                                        {formatJson(detailEvent.metadata)}
                                    </pre>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
