"use client";

// This component is largely integrated into TourForm.tsx for simplicity with react-hook-form.
// This file can serve as a placeholder or for future refactoring if StepList becomes more complex.

import type { TourStep } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepListProps {
  steps: TourStep[];
  onAddStep: () => void;
  onDeleteStep: (stepId: string) => void;
  onEditStep: (step: TourStep) => void;
  // onReorderSteps: (steps: TourStep[]) => void; // For future drag-and-drop
}

// Note: Actual step rendering and management is primarily handled within TourForm.tsx using useFieldArray.
// This component structure is kept for conceptual clarity and potential future expansion.
export function StepList({ steps, onAddStep, onDeleteStep, onEditStep }: StepListProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">No steps yet. Add your first step to begin building your tour!</p>
        <Button onClick={onAddStep} variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Add First Step
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={step.id} className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Step {index + 1}: {step.title}</CardTitle>
            <div className="space-x-2">
              <Button variant="ghost" size="icon" onClick={() => onEditStep(step)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteStep(step.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {step.imageUrl && <img src={step.imageUrl} alt={step.title} className="rounded-md max-h-40 object-contain border mb-2" data-ai-hint="product interface" />}
            <p className="text-sm text-muted-foreground truncate">{step.description || "No description provided."}</p>
            {/* Placeholder for annotations count or quick view */}
          </CardContent>
        </Card>
      ))}
      <Button onClick={onAddStep} variant="outline" className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Step
      </Button>
    </div>
  );
}
