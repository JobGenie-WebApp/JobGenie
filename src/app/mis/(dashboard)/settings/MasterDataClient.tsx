"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, RefreshCw, Download, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { InterviewRemindersSettings } from "./InterviewRemindersSettings";
import { SidebarVisibilitySettings } from "./SidebarVisibilitySettings";
import Papa from "papaparse";

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

const SENIORITY_LEVELS = [
    { id: 1, name: "Entry Level", order: 1 },
    { id: 2, name: "Junior", order: 2 },
    { id: 3, name: "Mid Level", order: 3 },
    { id: 4, name: "Senior", order: 4 },
    { id: 5, name: "Lead", order: 5 },
    { id: 6, name: "Principal", order: 6 },
];

export function MasterDataClient() {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(true);
    const [addIndustryOpen, setAddIndustryOpen] = useState(false);
    const [addDesignationOpen, setAddDesignationOpen] = useState(false);
    const [newIndustry, setNewIndustry] = useState("");
    const [newDesignation, setNewDesignation] = useState({
        name: "",
        industry_id: "",
        level_id: "",
    });
    const [uploadingIndustries, setUploadingIndustries] = useState(false);
    const [uploadingDesignations, setUploadingDesignations] = useState(false);
    const industryFileInputRef = useRef<HTMLInputElement>(null);
    const designationFileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [industriesRes, designationsRes] = await Promise.all([
                fetch("/api/mis/master-data/industries"),
                fetch("/api/mis/master-data/designations"),
            ]);

            const industriesData = await industriesRes.json();
            const designationsData = await designationsRes.json();

            if (industriesData.success) setIndustries(industriesData.industries);
            if (designationsData.success) setDesignations(designationsData.designations);
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

    const handleIndustryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingIndustries(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/mis/master-data/industries/bulk-upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchData();
            } else {
                toast.error(data.error || "Failed to upload CSV");
                if (data.details) {
                    console.error("Upload errors:", data.details);
                }
            }
        } catch (error) {
            console.error("Failed to upload CSV:", error);
            toast.error("Failed to upload CSV");
        } finally {
            setUploadingIndustries(false);
            if (industryFileInputRef.current) {
                industryFileInputRef.current.value = "";
            }
        }
    };

    const handleDesignationFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingDesignations(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/mis/master-data/designations/bulk-upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchData();
            } else {
                toast.error(data.error || "Failed to upload CSV");
                if (data.details) {
                    console.error("Upload errors:", data.details);
                }
            }
        } catch (error) {
            console.error("Failed to upload CSV:", error);
            toast.error("Failed to upload CSV");
        } finally {
            setUploadingDesignations(false);
            if (designationFileInputRef.current) {
                designationFileInputRef.current.value = "";
            }
        }
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

            {/* Tabs */}
            <Tabs defaultValue="industries" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="industries">
                        Industries ({industries.length})
                    </TabsTrigger>
                    <TabsTrigger value="designations">
                        Job Designations ({designations.length})
                    </TabsTrigger>
                    <TabsTrigger value="seniority">
                        Seniority Levels ({SENIORITY_LEVELS.length})
                    </TabsTrigger>
                    <TabsTrigger value="reminders">Interview Reminders</TabsTrigger>
                    <TabsTrigger value="sidebar-visibility">Sidebar Visibility</TabsTrigger>
                </TabsList>

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
                                        {uploadingIndustries ? "Uploading..." : "Upload CSV"}
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
                                        {uploadingDesignations ? "Uploading..." : "Upload CSV"}
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
                                                    {SENIORITY_LEVELS.map((level) => (
                                                        <SelectItem key={level.id} value={level.id.toString()}>
                                                            {level.name}
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
                                <strong>Bulk Upload Instructions:</strong> Download the CSV template, fill in your data, and upload it back. Required columns: <code className="text-xs bg-background px-1 py-0.5 rounded">designation_name</code>, <code className="text-xs bg-background px-1 py-0.5 rounded">industry_name</code>, and <code className="text-xs bg-background px-1 py-0.5 rounded">seniority_level</code> (valid values: Entry Level, Junior, Mid Level, Senior, Lead, Principal).
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
                                {SENIORITY_LEVELS.map((level) => (
                                    <TableRow key={level.id}>
                                        <TableCell className="font-mono">{level.id}</TableCell>
                                        <TableCell className="font-medium">{level.name}</TableCell>
                                        <TableCell>{level.order}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Seniority levels are system-defined and cannot be modified through the UI.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
