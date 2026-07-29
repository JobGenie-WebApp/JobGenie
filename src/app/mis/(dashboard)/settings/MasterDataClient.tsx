"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Download, Upload } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { InterviewRemindersSettings } from "./InterviewRemindersSettings";
import { SidebarVisibilitySettings } from "./SidebarVisibilitySettings";
import { BulkUploadPreviewDialog, type PreviewColumn, type PreviewRow, type PreviewSummary } from "./BulkUploadPreviewDialog";
import Papa from "papaparse";

type PreviewType = "industries" | "designations" | "seniority";

const BULK_ENDPOINTS: Record<PreviewType, string> = {
    industries: "/api/mis/master-data/industries",
    designations: "/api/mis/master-data/designations",
    seniority: "/api/mis/master-data/seniority-levels",
};

const PREVIEW_TITLES: Record<PreviewType, string> = {
    industries: "Preview Industries Import",
    designations: "Preview Job Designations Import",
    seniority: "Preview Seniority Levels Import",
};

const PREVIEW_COLUMNS: Record<PreviewType, PreviewColumn[]> = {
    industries: [{ key: "industry_name", label: "Industry Name" }],
    designations: [
        { key: "designation_name", label: "Designation Name" },
        { key: "industry_name", label: "Industry" },
        { key: "seniority_level", label: "Seniority Level" },
    ],
    seniority: [
        { key: "level_name", label: "Level Name" },
        { key: "level_order", label: "Order" },
    ],
};

interface Industry {
    industry_id: number;
    industry_name: string;
}

interface Designation {
    designation_id: number;
    designation_name: string;
    industry_id: number;
    level_id: number;
    industry: { industry_name: string };
    seniority_level: { level_name: string; level_order: number };
}

interface SeniorityLevel {
    level_id: number;
    level_name: string;
    level_order: number;
}

const SECTIONS = ["industries", "designations", "seniority", "reminders", "sidebar-visibility"] as const;

export function MasterDataClient() {
    // The active section is chosen from the sidebar ("Master Data" group) and
    // carried in the `?section=` query param; default is Industries.
    const searchParams = useSearchParams();
    const sectionParam = searchParams.get("section");
    const section = SECTIONS.includes(sectionParam as (typeof SECTIONS)[number])
        ? (sectionParam as string)
        : "industries";

    const [industries, setIndustries] = useState<Industry[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [seniorityLevels, setSeniorityLevels] = useState<SeniorityLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [addIndustryOpen, setAddIndustryOpen] = useState(false);
    const [addDesignationOpen, setAddDesignationOpen] = useState(false);
    const [addSeniorityOpen, setAddSeniorityOpen] = useState(false);
    const [newIndustry, setNewIndustry] = useState("");
    const [newDesignation, setNewDesignation] = useState({
        name: "",
        industry_id: "",
        level_id: "",
    });
    const [newSeniority, setNewSeniority] = useState({ name: "", order: "" });
    const [uploadingIndustries, setUploadingIndustries] = useState(false);
    const [uploadingDesignations, setUploadingDesignations] = useState(false);
    const [uploadingSeniority, setUploadingSeniority] = useState(false);
    const industryFileInputRef = useRef<HTMLInputElement>(null);
    const designationFileInputRef = useRef<HTMLInputElement>(null);
    const seniorityFileInputRef = useRef<HTMLInputElement>(null);

    // Bulk-upload preview state (shared across the three tabs)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewType, setPreviewType] = useState<PreviewType | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [previewSummary, setPreviewSummary] = useState<PreviewSummary>({ total: 0, valid: 0, invalid: 0 });
    const [confirming, setConfirming] = useState(false);

    const generatePreview = async (
        type: PreviewType,
        file: File,
        setUploading: (v: boolean) => void,
        inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("mode", "preview");

            const response = await fetch(`${BULK_ENDPOINTS[type]}/bulk-upload`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (data.success && data.mode === "preview") {
                setPreviewType(type);
                setPreviewFile(file);
                setPreviewRows(data.rows);
                setPreviewSummary(data.summary);
                setPreviewOpen(true);
            } else {
                toast.error(data.error || "Failed to read CSV");
                if (data.details) console.error("Preview errors:", data.details);
            }
        } catch (error) {
            console.error("Failed to read CSV:", error);
            toast.error("Failed to read CSV");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const confirmImport = async () => {
        if (!previewType || !previewFile) return;
        setConfirming(true);
        try {
            const formData = new FormData();
            formData.append("file", previewFile);
            formData.append("mode", "commit");

            const response = await fetch(`${BULK_ENDPOINTS[previewType]}/bulk-upload`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setPreviewOpen(false);
                setPreviewFile(null);
                setPreviewType(null);
                fetchData();
            } else {
                toast.error(data.error || "Failed to import");
                if (data.details) console.error("Import errors:", data.details);
            }
        } catch (error) {
            console.error("Failed to import:", error);
            toast.error("Failed to import");
        } finally {
            setConfirming(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [industriesRes, designationsRes, seniorityRes] = await Promise.all([
                fetch("/api/mis/master-data/industries"),
                fetch("/api/mis/master-data/designations"),
                fetch("/api/mis/master-data/seniority-levels"),
            ]);

            const industriesData = await industriesRes.json();
            const designationsData = await designationsRes.json();
            const seniorityData = await seniorityRes.json();

            if (industriesData.success) setIndustries(industriesData.industries);
            if (designationsData.success) setDesignations(designationsData.designations);
            if (seniorityData.success) setSeniorityLevels(seniorityData.seniorityLevels);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddIndustry = async () => {
        if (!newIndustry.trim()) {
            toast.error("Industry name is required");
            return;
        }

        try {
            const response = await fetch("/api/mis/master-data/industries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ industry_name: newIndustry }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Industry added successfully");
                setNewIndustry("");
                setAddIndustryOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to add industry");
            }
        } catch (error) {
            console.error("Failed to add industry:", error);
            toast.error("Failed to add industry");
        }
    };

    const handleAddDesignation = async () => {
        if (!newDesignation.name.trim() || !newDesignation.industry_id || !newDesignation.level_id) {
            toast.error("All fields are required");
            return;
        }

        try {
            const response = await fetch("/api/mis/master-data/designations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    designation_name: newDesignation.name,
                    industry_id: newDesignation.industry_id,
                    level_id: newDesignation.level_id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Designation added successfully");
                setNewDesignation({ name: "", industry_id: "", level_id: "" });
                setAddDesignationOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to add designation");
            }
        } catch (error) {
            console.error("Failed to add designation:", error);
            toast.error("Failed to add designation");
        }
    };

    const handleAddSeniority = async () => {
        if (!newSeniority.name.trim()) {
            toast.error("Level name is required");
            return;
        }

        try {
            const response = await fetch("/api/mis/master-data/seniority-levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    level_name: newSeniority.name,
                    level_order: newSeniority.order ? Number(newSeniority.order) : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Seniority level added successfully");
                setNewSeniority({ name: "", order: "" });
                setAddSeniorityOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to add seniority level");
            }
        } catch (error) {
            console.error("Failed to add seniority level:", error);
            toast.error("Failed to add seniority level");
        }
    };

    const downloadIndustryTemplate = () => {
        const csv = Papa.unparse([
            { industry_name: "Banking" },
            { industry_name: "Finance & Investment" },
            { industry_name: "IT / Software Development" },
        ]);

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "industries_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded");
    };

    const downloadDesignationTemplate = () => {
        const csv = Papa.unparse([
            {
                designation_name: "Senior Software Engineer",
                industry_name: "IT / Software Development",
                seniority_level: "Senior",
            },
            {
                designation_name: "Junior Software Engineer",
                industry_name: "IT / Software Development",
                seniority_level: "Junior",
            },
            {
                designation_name: "Financial Analyst",
                industry_name: "Finance & Investment",
                seniority_level: "Mid Level",
            },
        ]);

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "designations_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded");
    };

    const handleIndustryFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        generatePreview("industries", file, setUploadingIndustries, industryFileInputRef);
    };

    const handleDesignationFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        generatePreview("designations", file, setUploadingDesignations, designationFileInputRef);
    };

    const downloadSeniorityTemplate = () => {
        const csv = Papa.unparse([
            { level_name: "Entry Level", level_order: 1 },
            { level_name: "Junior", level_order: 2 },
            { level_name: "Senior", level_order: 4 },
        ]);

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "seniority_levels_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded");
    };

    const handleSeniorityFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        generatePreview("seniority", file, setUploadingSeniority, seniorityFileInputRef);
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Section is driven by the sidebar ("Master Data" group) via ?section= */}
            <Tabs value={section} className="space-y-4">
                {/* Industries Tab */}
                <TabsContent value="industries">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={downloadIndustryTemplate}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                                <div>
                                    <input
                                        ref={industryFileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleIndustryFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => industryFileInputRef.current?.click()}
                                        disabled={uploadingIndustries}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploadingIndustries ? "Reading..." : "Upload CSV"}
                                    </Button>
                                </div>
                            </div>
                            <Dialog open={addIndustryOpen} onOpenChange={setAddIndustryOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Industry
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Industry</DialogTitle>
                                        <DialogDescription>
                                            Create a new industry category
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="industry-name">Industry Name</Label>
                                            <Input
                                                id="industry-name"
                                                placeholder="e.g., Information Technology"
                                                value={newIndustry}
                                                onChange={(e) => setNewIndustry(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAddIndustryOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddIndustry}>Add Industry</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-muted/50 border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Bulk Upload Instructions:</strong> Download the CSV template, fill in your data, and upload it back. The CSV should have a column named <code className="text-xs bg-background px-1 py-0.5 rounded">industry_name</code>.
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Industry Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : industries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                No industries found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        industries.map((industry) => (
                                            <TableRow key={industry.industry_id}>
                                                <TableCell className="font-mono">
                                                    {industry.industry_id}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {industry.industry_name}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* Designations Tab */}
                <TabsContent value="designations">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={downloadDesignationTemplate}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                                <div>
                                    <input
                                        ref={designationFileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleDesignationFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => designationFileInputRef.current?.click()}
                                        disabled={uploadingDesignations}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploadingDesignations ? "Reading..." : "Upload CSV"}
                                    </Button>
                                </div>
                            </div>
                            <Dialog open={addDesignationOpen} onOpenChange={setAddDesignationOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Designation
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Job Designation</DialogTitle>
                                        <DialogDescription>
                                            Create a new job designation
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="designation-name">Designation Name</Label>
                                            <Input
                                                id="designation-name"
                                                placeholder="e.g., Senior Software Engineer"
                                                value={newDesignation.name}
                                                onChange={(e) =>
                                                    setNewDesignation((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="industry">Industry</Label>
                                            <Select
                                                value={newDesignation.industry_id}
                                                onValueChange={(value) =>
                                                    setNewDesignation((prev) => ({ ...prev, industry_id: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {industries.map((industry) => (
                                                        <SelectItem
                                                            key={industry.industry_id}
                                                            value={industry.industry_id.toString()}
                                                        >
                                                            {industry.industry_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="level">Seniority Level</Label>
                                            <Select
                                                value={newDesignation.level_id}
                                                onValueChange={(value) =>
                                                    setNewDesignation((prev) => ({ ...prev, level_id: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {seniorityLevels.map((level) => (
                                                        <SelectItem key={level.level_id} value={level.level_id.toString()}>
                                                            {level.level_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAddDesignationOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddDesignation}>Add Designation</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-muted/50 border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Bulk Upload Instructions:</strong> Download the CSV template, fill in your data, and upload it back. Required: <code className="text-xs bg-background px-1 py-0.5 rounded">designation_name</code>, plus an industry (<code className="text-xs bg-background px-1 py-0.5 rounded">industry_id</code> or <code className="text-xs bg-background px-1 py-0.5 rounded">industry_name</code>) and a seniority level (<code className="text-xs bg-background px-1 py-0.5 rounded">level_id</code> or <code className="text-xs bg-background px-1 py-0.5 rounded">seniority_level</code>). Seniority names: {seniorityLevels.map((l) => l.level_name).join(", ") || "add seniority levels first"}.
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Designation Name</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Seniority Level</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : designations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No designations found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        designations.map((designation) => (
                                            <TableRow key={designation.designation_id}>
                                                <TableCell className="font-mono">
                                                    {designation.designation_id}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {designation.designation_name}
                                                </TableCell>
                                                <TableCell>{designation.industry.industry_name}</TableCell>
                                                <TableCell>{designation.seniority_level.level_name}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="reminders">
                    <InterviewRemindersSettings />
                </TabsContent>

                <TabsContent value="sidebar-visibility">
                    <SidebarVisibilitySettings />
                </TabsContent>

                {/* Seniority Levels Tab */}
                <TabsContent value="seniority">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={downloadSeniorityTemplate}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                                <div>
                                    <input
                                        ref={seniorityFileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleSeniorityFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => seniorityFileInputRef.current?.click()}
                                        disabled={uploadingSeniority}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploadingSeniority ? "Reading..." : "Upload CSV"}
                                    </Button>
                                </div>
                            </div>
                            <Dialog open={addSeniorityOpen} onOpenChange={setAddSeniorityOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Seniority Level
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Seniority Level</DialogTitle>
                                        <DialogDescription>
                                            Create a new seniority level
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="seniority-name">Level Name</Label>
                                            <Input
                                                id="seniority-name"
                                                placeholder="e.g., Senior"
                                                value={newSeniority.name}
                                                onChange={(e) =>
                                                    setNewSeniority((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="seniority-order">Order (optional)</Label>
                                            <Input
                                                id="seniority-order"
                                                type="number"
                                                min={1}
                                                placeholder="Leave blank to append at the end"
                                                value={newSeniority.order}
                                                onChange={(e) =>
                                                    setNewSeniority((prev) => ({ ...prev, order: e.target.value }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAddSeniorityOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddSeniority}>Add Seniority Level</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-muted/50 border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Bulk Upload Instructions:</strong> Download the CSV template, fill in your data, and upload it back. Required column: <code className="text-xs bg-background px-1 py-0.5 rounded">level_name</code>. Optional column: <code className="text-xs bg-background px-1 py-0.5 rounded">level_order</code> (rows without an order are appended to the end).
                            </p>
                        </div>

                        <div className="bg-card border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Level ID</TableHead>
                                        <TableHead>Level Name</TableHead>
                                        <TableHead>Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : seniorityLevels.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                No seniority levels found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        seniorityLevels.map((level) => (
                                            <TableRow key={level.level_id}>
                                                <TableCell className="font-mono">{level.level_id}</TableCell>
                                                <TableCell className="font-medium">{level.level_name}</TableCell>
                                                <TableCell>{level.level_order}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {previewType && (
                <BulkUploadPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={PREVIEW_TITLES[previewType]}
                    columns={PREVIEW_COLUMNS[previewType]}
                    rows={previewRows}
                    summary={previewSummary}
                    confirming={confirming}
                    onConfirm={confirmImport}
                />
            )}
        </div>
    );
}
