"use client";

import { FolderGit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { ProjectData } from "@/lib/validations/profile-schema";
import { projectSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface ProjectsStepProps {
    projects: ProjectData[];
    onChange: (projects: ProjectData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const emptyProject: ProjectData = {
    projectName: "",
    description: "",
    demoUrl: "",
    isCurrent: false,
};

export function ProjectsStep({ projects, onChange, onNext, onPrevious }: ProjectsStepProps) {
    const handleAdd = () => {
        onChange([...projects, { ...emptyProject }]);
    };

    const handleRemove = (index: number) => {
        onChange(projects.filter((_, i) => i !== index));
    };

    const handleUpdate = (index: number, field: keyof ProjectData, value: unknown) => {
        const updated = [...projects];
        updated[index] = { ...updated[index], [field]: value };

        if (errors[`${index}.${field as string}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }

        onChange(updated);
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        const result = z.array(projectSchema).safeParse(projects);
        if (result.success) {
            setErrors({});
            onNext();
        } else {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const pathKey = issue.path.join('.');
                newErrors[pathKey] = issue.message;
            });
            setErrors(newErrors);
        }
    };

    return (
        <div className="space-y-6">
            <FormSection
                title="Projects"
                description="Showcase your key projects (for IT professionals)"
            >
                <DynamicList
                    items={projects}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    addLabel="Add Project"
                    emptyMessage="No projects added yet. Add projects to showcase your work."
                    maxItems={100}
                    renderItem={(project, index) => (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`projectName-${index}`}>
                                    Project Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`projectName-${index}`}
                                    value={project.projectName}
                                    onChange={(e) => handleUpdate(index, "projectName", e.target.value)}
                                    placeholder="e.g., E-commerce Platform"
                                />
                                {errors[`${index}.projectName`] && <p className="text-sm text-destructive">{errors[`${index}.projectName`]}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    value={project.description || ""}
                                    onChange={(e) => handleUpdate(index, "description", e.target.value)}
                                    placeholder="Technologies used, your role, key features..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`demoUrl-${index}`}>Demo / GitHub URL</Label>
                                <Input
                                    id={`demoUrl-${index}`}
                                    value={project.demoUrl || ""}
                                    onChange={(e) => handleUpdate(index, "demoUrl", e.target.value)}
                                    placeholder="https://github.com/username/project"
                                />
                                {errors[`${index}.demoUrl`] && <p className="text-sm text-destructive">{errors[`${index}.demoUrl`]}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`isCurrent-${index}`}
                                    checked={project.isCurrent}
                                    onCheckedChange={(checked) => handleUpdate(index, "isCurrent", checked)}
                                />
                                <Label htmlFor={`isCurrent-${index}`}>Currently working on this</Label>
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={6}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
