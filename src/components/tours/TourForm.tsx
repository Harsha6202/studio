"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTourStore } from '@/hooks/useTourStore';
import type { Tour, TourStep } from '@/lib/types';
import { AIHelper } from './AIHelper';
import { StepList } from './StepList';
import { ScreenRecorderPlaceholder } from './ScreenRecorderPlaceholder';
import { PublishDialog } from './PublishDialog';
import { Save, PlusCircle, Trash2, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

const tourStepSchema = z.object({
  id: z.string().optional(), // Existing steps will have an ID
  title: z.string().min(1, "Step title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.string().startsWith("data:image")).or(z.literal("")),
  order: z.number(),
  // Annotations can be added later if complex schema is needed
});

const tourFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url("Must be a valid URL for thumbnail").or(z.string().startsWith("data:image")).or(z.literal("")).optional(),
  steps: z.array(tourStepSchema).min(1, "At least one step is required for a tour"),
});

type TourFormData = z.infer<typeof tourFormSchema>;

interface TourFormProps {
  tourId: string | null; // null for create, string for edit
}

export function TourForm({ tourId }: TourFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addTour, getTourById, updateTour, addStepToTour, updateStepInTour, deleteStepFromTour } = useTourStore();
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  
  const defaultValues: TourFormData = {
    title: '',
    description: '',
    thumbnailUrl: '',
    steps: [],
  };

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TourFormData>({
    resolver: zodResolver(tourFormSchema),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const watchedSteps = watch("steps");

  useEffect(() => {
    if (tourId) {
      const tour = getTourById(tourId);
      if (tour) {
        setCurrentTour(tour);
        reset({
          title: tour.title,
          description: tour.description,
          thumbnailUrl: tour.thumbnailUrl || '',
          steps: tour.steps.sort((a,b) => a.order - b.order).map(step => ({ // ensure steps are ordered
            id: step.id,
            title: step.title,
            description: step.description || '',
            imageUrl: step.imageUrl,
            order: step.order,
          })),
        });
      } else {
        // Tour not found, redirect or show error
        toast({ title: "Error", description: "Tour not found.", variant: "destructive" });
        router.push('/dashboard');
      }
    } else {
        // For new tours, add one default step
        if (fields.length === 0) {
             append({ title: 'Step 1', description: '', imageUrl: `https://placehold.co/800x600.png?text=Step+1`, order: 0 });
        }
    }
  }, [tourId, getTourById, reset, toast, router, fields.length, append]);

  const onSubmit = (data: TourFormData) => {
    try {
      if (tourId) { // Editing existing tour
        const existingTour = getTourById(tourId);
        if (!existingTour) throw new Error("Tour not found for update");

        updateTour(tourId, { 
          title: data.title, 
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
        });

        // Update steps
        data.steps.forEach((stepData, index) => {
          const existingStep = existingTour.steps.find(s => s.id === stepData.id);
          if (existingStep) { // Existing step
            updateStepInTour(tourId, existingStep.id, { 
              title: stepData.title, 
              description: stepData.description, 
              imageUrl: stepData.imageUrl,
              order: index // Ensure order is updated
            });
          } else { // New step added during edit
             addStepToTour(tourId, { 
              title: stepData.title, 
              description: stepData.description, 
              imageUrl: stepData.imageUrl,
            });
          }
        });
        // Handle deleted steps
        existingTour.steps.forEach(existingStep => {
            if(!data.steps.find(s => s.id === existingStep.id)){
                deleteStepFromTour(tourId, existingStep.id);
            }
        });

        toast({ title: "Success", description: "Tour updated successfully!" });
        setCurrentTour(getTourById(tourId) || null); // Refresh current tour state
      } else { // Creating new tour
        const newTourData = {
          title: data.title,
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.title)}`,
          steps: data.steps.map((step, index) => ({ ...step, order: index })), // Set initial order
        };
        const createdTour = addTour(newTourData);
        toast({ title: "Success", description: "Tour created! You can now add more steps." });
        router.push(`/tours/${createdTour.id}/edit`); // Redirect to edit page for the new tour
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "Failed to save tour.", variant: "destructive" });
    }
  };

  const handleAddStep = () => {
    const newOrder = fields.length;
    append({ title: `Step ${newOrder + 1}`, description: '', imageUrl: `https://placehold.co/800x600.png?text=Step+${newOrder + 1}`, order: newOrder });
  };
  
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      move(index, targetIndex);
      // Update order for all steps after move
      const newOrderedSteps = fields.map((field, idx) => ({...field, order: idx}));
      newOrderedSteps.forEach((step, idx) => {
        setValue(`steps.${idx}.order`, idx);
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tour Details</CardTitle>
          <CardDescription>Provide the main information for your tour.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">Tour Title</Label>
            <Input id="title" {...register("title")} className="mt-1" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Tour Description</Label>
            <Textarea id="description" {...register("description")} className="mt-1" rows={4} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            <AIHelper
              currentDescription={watch("description") || ""}
              onApplyDescription={(newDesc) => setValue("description", newDesc)}
              productName={watch("title")}
            />
          </div>
           <div>
            <Label htmlFor="thumbnailUrl">Thumbnail Image URL</Label>
            <Input 
                id="thumbnailUrl" 
                {...register("thumbnailUrl")} 
                className="mt-1" 
                placeholder="https://example.com/image.png or leave blank for default" 
            />
            {errors.thumbnailUrl && <p className="text-sm text-destructive mt-1">{errors.thumbnailUrl.message}</p>}
            {watch("thumbnailUrl") && (
                 <Image 
                    src={watch("thumbnailUrl")!} 
                    alt="Thumbnail preview" 
                    width={200} height={120} 
                    className="mt-2 rounded object-cover"
                    data-ai-hint="abstract background"
                    onError={(e) => e.currentTarget.style.display='none'}/>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tour Steps</CardTitle>
          <CardDescription>Add, edit, and reorder the steps for your interactive tour.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="bg-background/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-lg">Step {index + 1}: {watch(`steps.${index}.title`)}</h4>
                  <div className="flex gap-2">
                     <Button type="button" variant="outline" size="icon" onClick={() => handleMoveStep(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move Up</span>
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => handleMoveStep(index, 'down')} disabled={index === fields.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move Down</span>
                      </Button>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Step</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`steps.${index}.title`}>Step Title</Label>
                  <Input id={`steps.${index}.title`} {...register(`steps.${index}.title`)} className="mt-1" />
                  {errors.steps?.[index]?.title && <p className="text-sm text-destructive mt-1">{errors.steps[index]?.title?.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`steps.${index}.imageUrl`}>Image URL</Label>
                  <Input id={`steps.${index}.imageUrl`} {...register(`steps.${index}.imageUrl`)} className="mt-1" placeholder="https://placehold.co/800x600.png"/>
                  {errors.steps?.[index]?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.steps[index]?.imageUrl?.message}</p>}
                  {watchedSteps[index]?.imageUrl && (
                    <Image 
                        src={watchedSteps[index].imageUrl} 
                        alt={`Step ${index + 1} preview`} 
                        width={300} height={180} 
                        className="mt-2 rounded object-cover border"
                        data-ai-hint="ui screenshot"
                        onError={(e) => e.currentTarget.style.display='none'} />
                  )}
                </div>
                <div>
                  <Label htmlFor={`steps.${index}.description`}>Step Description/Instructions</Label>
                  <Textarea id={`steps.${index}.description`} {...register(`steps.${index}.description`)} className="mt-1" rows={2} />
                </div>
                {/* Placeholder for annotations - could be a sub-component */}
                {/* <AnnotationPlaceholder tourId={tourId} stepId={field.id} /> */}
              </CardContent>
            </Card>
          ))}
          {errors.steps && !errors.steps.root && typeof errors.steps.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.steps.message}</p>}

          <Button type="button" variant="outline" onClick={handleAddStep}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Step
          </Button>
          <ScreenRecorderPlaceholder />
        </CardContent>
      </Card>
      
      <Separator />

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        {currentTour && currentTour.isPublic && currentTour.shareableLink && (
            <Button variant="outline" asChild>
                <Link href={currentTour.shareableLink} target="_blank">
                    <Eye className="mr-2 h-4 w-4" /> View Public Tour
                </Link>
            </Button>
        )}
        {tourId && currentTour && (
          <Button type="button" variant="secondary" onClick={() => setIsPublishDialogOpen(true)}>
            Publish / Share Options
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> {isSubmitting ? (tourId ? "Saving..." : "Creating...") : (tourId ? "Save Changes" : "Create Tour")}
        </Button>
      </div>

      {currentTour && <PublishDialog tour={currentTour} open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen} />}
    </form>
  );
}
