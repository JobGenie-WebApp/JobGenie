"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    FileText, Upload, Download, ExternalLink, Trash2, Star,
    Plus, Loader2, CheckCircle2, X, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_RESUMES = 5;

interface Resume {
    id: string;
    file_name: string;
    file_url: string;
    is_primary: boolean;
    created_at: string;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d}d ago`;
    const m = Math.floor(d / 30);
    return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`;
}

// ─── Upload area ──────────────────────────────────────────────────────────────

function UploadArea({ onFile, uploading, compact = false }: {
    onFile: (f: File) => void;
    uploading: boolean;
    compact?: boolean;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    const pick = (f: File) => {
        if (f.type !== "application/pdf") { toast.error("PDF files only."); return; }
        if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 MB per file."); return; }
        onFile(f);
    };

    if (compact) {
        return (
            <label className="cursor-pointer">
                <input ref={ref} type="file" accept=".pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { pick(f); e.target.value = ""; } }} />
                <Button size="sm" variant="outline" className="gap-1.5 pointer-events-none" disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading…" : "Add Resume"}
                </Button>
            </label>
        );
    }

    return (
        <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
            onClick={() => !uploading && ref.current?.click()}
            className={cn(
                "flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-5 text-center transition-all",
                uploading ? "cursor-wait opacity-70" : "cursor-pointer",
                drag ? "border-primary bg-primary/10" : "border-primary/25 bg-primary/[0.03] hover:bg-primary/[0.06] hover:border-primary/40",
            )}
        >
            <input ref={ref} type="file" accept=".pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { pick(f); e.target.value = ""; } }} />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                {uploading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Upload className="h-4 w-4 text-primary" />}
            </div>
            <div>
                <p className="text-xs font-semibold">{uploading ? "Uploading & watermarking…" : "Drop PDF or click to browse"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Max 5 MB · Watermark applied automatically</p>
            </div>
        </div>
    );
}

// ─── Resume card (mobile + desktop list) ──────────────────────────────────────

function ResumeCard({ resume, selected, onSelect, onPreview, onSetPrimary, onDelete, settingPrimary, deleting }: {
    resume: Resume; selected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    onSetPrimary: (id: string) => void;
    onDelete: (id: string) => void;
    settingPrimary: string | null;
    deleting: string | null;
}) {
    return (
        <div className={cn(
            "relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-150",
            selected ? "border-primary/40 bg-primary/8 shadow-sm" : "border-border bg-card hover:border-primary/25"
        )}>
            {/* Primary badge */}
            {resume.is_primary && (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                    <CheckCircle2 className="h-2.5 w-2.5" />Primary
                </span>
            )}

            {/* Top row: icon + info */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-primary/15" : "bg-muted"
                )}>
                    <FileText className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{resume.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">PDF · {timeAgo(resume.created_at)}</p>
                </div>
                {/* Star for primary */}
                {resume.is_primary
                    ? <Star className="h-4 w-4 text-amber-400 fill-current shrink-0" />
                    : (
                        <button disabled={settingPrimary === resume.id} title="Set as primary"
                            onClick={e => { e.stopPropagation(); onSetPrimary(resume.id); }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-amber-400/15 text-muted-foreground hover:text-amber-400 transition-colors">
                            {settingPrimary === resume.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                        </button>
                    )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                {/* Preview — opens overlay on mobile, selects on desktop */}
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs"
                    onClick={() => { onSelect(); onPreview(); }}>
                    <FileText className="h-3.5 w-3.5" />Preview
                </Button>

                {/* Download */}
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs" asChild>
                    <a href={resume.file_url} download onClick={e => e.stopPropagation()}>
                        <Download className="h-3.5 w-3.5" />Download
                    </a>
                </Button>

                {/* Open */}
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" asChild>
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </Button>

                {/* Delete */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deleting === resume.id} onClick={e => e.stopPropagation()}>
                            {deleting === resume.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete &quot;{resume.file_name}&quot;?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This resume will be permanently removed.
                                {resume.is_primary && " The next resume will become your primary."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(resume.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// ─── Mobile full-screen preview overlay ──────────────────────────────────────

function MobilePreviewOverlay({ resume, resumes, onClose, onSelect, onSetPrimary, settingPrimary }: {
    resume: Resume;
    resumes: Resume[];
    onClose: () => void;
    onSelect: (id: string) => void;
    onSetPrimary: (id: string) => void;
    settingPrimary: string | null;
}) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
            {/* Header bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
                <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-accent transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{resume.file_name}</span>
                        {resume.is_primary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-1.5 py-0.5 text-[10px] font-bold text-primary shrink-0">
                                <CheckCircle2 className="h-2.5 w-2.5" />Primary
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">PDF · {timeAgo(resume.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!resume.is_primary && (
                        <button disabled={settingPrimary === resume.id}
                            onClick={() => onSetPrimary(resume.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-amber-400/15 text-muted-foreground hover:text-amber-500 transition-colors">
                            {settingPrimary === resume.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                        </button>
                    )}
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-accent transition-colors text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                    <a href={resume.file_url} download
                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground">
                        <Download className="h-3.5 w-3.5" />Download
                    </a>
                </div>
            </div>

            {/* Resume switcher tabs (only shown when multiple resumes) */}
            {resumes.length > 1 && (
                <div className="flex gap-2 px-4 py-2 border-b bg-card shrink-0 overflow-x-auto">
                    {resumes.map(r => (
                        <button
                            key={r.id}
                            onClick={() => onSelect(r.id)}
                            className={cn(
                                "flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                r.id === resume.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <FileText className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{r.file_name}</span>
                            {r.is_primary && <Star className="h-2.5 w-2.5 fill-current text-amber-400 shrink-0" />}
                        </button>
                    ))}
                </div>
            )}

            {/* Watermark notice */}
            {/* <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/15 bg-amber-500/5 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">JobGenie watermark applied — your resume is protected.</p>
            </div> */}

            {/* Full iframe */}
            <iframe
                key={resume.id}
                src={`${resume.file_url}#toolbar=0&navpanes=0`}
                className="flex-1 w-full border-0 min-h-0"
                title={resume.file_name}
            />
        </div>
    );
}

// ─── Desktop right panel ──────────────────────────────────────────────────────

function DesktopPreviewPanel({ selected, onSetPrimary, settingPrimary }: {
    selected: Resume | undefined;
    onSetPrimary: (id: string) => void;
    settingPrimary: string | null;
}) {
    if (!selected) {
        return (
            <div className="flex-1 min-w-0 hidden md:flex flex-col items-center justify-center gap-3 text-center p-8 bg-muted/10">
                <FileText className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Select a resume from the list to preview it here.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-w-0 hidden md:flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-card shrink-0 flex-wrap gap-y-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold truncate">{selected.file_name}</span>
                            {selected.is_primary && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                                    <CheckCircle2 className="h-2.5 w-2.5" />Primary
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">PDF · {timeAgo(selected.created_at)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!selected.is_primary && (
                        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                            disabled={!!settingPrimary} onClick={() => onSetPrimary(selected.id)}>
                            {settingPrimary === selected.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                            Set Primary
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" asChild>
                        <a href={selected.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />Open
                        </a>
                    </Button>
                    <Button size="sm" className="gap-1.5 h-8 text-xs" asChild>
                        <a href={selected.file_url} download>
                            <Download className="h-3.5 w-3.5" />Download
                        </a>
                    </Button>
                </div>
            </div>

            {/* Watermark notice */}
            {/* <div className="flex items-center gap-2 px-5 py-2 border-b border-amber-500/15 bg-amber-500/5 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">JobGenie watermark applied — your resume is protected.</p>
            </div> */}

            {/* PDF iframe — flex-1 fills all remaining panel height */}
            <iframe
                key={selected.id}
                src={`${selected.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="flex-1 w-full min-h-0 border-0 block"
                title={selected.file_name}
            />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ResumesClientContent() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/candidate/resumes");
            const data = await res.json();
            if (data.success) {
                setResumes(data.resumes ?? []);
                setSelectedId(prev => {
                    if (prev && data.resumes?.some((r: Resume) => r.id === prev)) return prev;
                    return data.resumes?.find((r: Resume) => r.is_primary)?.id ?? data.resumes?.[0]?.id ?? null;
                });
            }
        } catch { toast.error("Failed to load resumes."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (file: File) => {
        if (resumes.length >= MAX_RESUMES) { toast.error(`Max ${MAX_RESUMES} resumes.`); return; }
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/candidate/resumes", { method: "POST", body: form });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            toast.success("Resume uploaded with watermark.");
            await load();
            setSelectedId(data.resume.id);
        } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); }
        finally { setUploading(false); }
    };

    const handleSetPrimary = async (id: string) => {
        setSettingPrimary(id);
        try {
            const res = await fetch(`/api/candidate/resumes/${id}/primary`, { method: "PUT" });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            toast.success("Primary resume updated.");
            setResumes(prev => prev.map(r => ({ ...r, is_primary: r.id === id })));
        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
        finally { setSettingPrimary(null); }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/candidate/resumes/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            toast.success("Resume deleted.");
            if (selectedId === id) setMobileOverlayOpen(false);
            await load();
        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
        finally { setDeleting(null); }
    };

    const selected = resumes.find(r => r.id === selectedId);
    const canUpload = resumes.length < MAX_RESUMES && !uploading;

    // ── Skeleton ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-3 md:hidden animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted" />)}
            </div>
        );
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (resumes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-5 max-w-sm mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold">No resumes yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Upload your first resume — a JobGenie watermark is applied automatically.</p>
                </div>
                <UploadArea onFile={handleUpload} uploading={uploading} />
            </div>
        );
    }

    return (
        <>
            {/* ── Mobile full-screen overlay — rendered via portal to escape stacking context ── */}
            {mounted && mobileOverlayOpen && selected && createPortal(
                <MobilePreviewOverlay
                    resume={selected}
                    resumes={resumes}
                    onClose={() => setMobileOverlayOpen(false)}
                    onSelect={id => setSelectedId(id)}
                    onSetPrimary={handleSetPrimary}
                    settingPrimary={settingPrimary}
                />,
                document.body
            )}

            {/* ── Two-panel layout ── */}
            <div className={cn(
                "flex flex-col gap-4",
                /* Desktop: side-by-side, height-locked, only right panel scrolls */
                "md:flex-row md:gap-0 md:h-[calc(100dvh-8.25rem)] md:overflow-hidden",
                "lg:h-[calc(100dvh-9.25rem)]",
            )}>

                {/* ── LEFT: list panel ── */}
                <div className="flex flex-col md:w-72 lg:w-80 shrink-0 md:border-r md:border-border">

                    {/* Panel header */}
                    <div className="flex items-center justify-between px-1 md:px-4 py-2 md:py-3 md:border-b md:border-border">
                        <div>
                            <p className="text-sm font-semibold">Your Resumes</p>
                            <p className="text-[11px] text-muted-foreground">{resumes.length} / {MAX_RESUMES} uploaded</p>
                        </div>
                        {canUpload && <UploadArea onFile={handleUpload} uploading={uploading} compact />}
                    </div>

                    {/* Resume cards — scrollable on desktop */}
                    <div className="flex flex-col gap-3 md:flex-1 md:overflow-y-auto md:p-3">
                        {resumes.map(resume => (
                            <ResumeCard
                                key={resume.id}
                                resume={resume}
                                selected={selectedId === resume.id}
                                onSelect={() => setSelectedId(resume.id)}
                                onPreview={() => setMobileOverlayOpen(true)}
                                onSetPrimary={handleSetPrimary}
                                onDelete={handleDelete}
                                settingPrimary={settingPrimary}
                                deleting={deleting}
                            />
                        ))}
                    </div>

                    {/* Drop zone — at bottom of left panel */}
                    {canUpload && (
                        <div className="md:p-3 md:border-t md:border-border mt-2 md:mt-0">
                            <UploadArea onFile={handleUpload} uploading={uploading} />
                        </div>
                    )}
                    {!canUpload && resumes.length >= MAX_RESUMES && (
                        <p className="text-center text-[11px] text-muted-foreground mt-2 md:px-4 md:py-3 md:border-t md:border-border md:mt-0">
                            Maximum {MAX_RESUMES} resumes reached.
                        </p>
                    )}
                </div>

                {/* ── RIGHT: desktop preview panel (hidden on mobile) ── */}
                <DesktopPreviewPanel
                    selected={selected}
                    onSetPrimary={handleSetPrimary}
                    settingPrimary={settingPrimary}
                />
            </div>
        </>
    );
}
