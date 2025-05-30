
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
import type { Tour, TourStep, MediaType, Annotation } from '@/lib/types';
import { AIHelper } from './AIHelper';
// import { StepList } from './StepList'; // StepList integrated below
import { ScreenRecorder } from './ScreenRecorder'; // Updated import
import { PublishDialog } from './PublishDialog';
import { Save, PlusCircle, Trash2, ArrowUp, ArrowDown, Eye, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { inferIsVideoUrl, isPotentiallyValidMediaSrc } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const annotationSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Annotation text cannot be empty"),
  position: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
});

const tourStepSchema = z.object({
  id: z.string().optional(), // Existing steps will have an ID
  title: z.string().min(1, "Step title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL or data URI").or(z.string().startsWith("data:")).or(z.string().startsWith("blob:")).or(z.literal("")).or(z.null()),
  mediaType: z.enum(['image', 'video']).optional(),
  order: z.number(),
  annotations: z.array(annotationSchema).optional(),
});

const tourFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url("Must be a valid URL for thumbnail").or(z.string().startsWith("data:image")).or(z.literal("")).or(z.null()).optional(),
  steps: z.array(tourStepSchema).min(1, "At least one step is required for a tour"),
});

type TourFormData = z.infer<typeof tourFormSchema>;

interface TourFormProps {
  tourId: string | null; // null for create, string for edit
}

export function TourForm({ tourId }: TourFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addTour, getTourById, updateTour, addStepToTour, updateStepInTour, deleteStepFromTour, addAnnotationToStep, updateAnnotationInStep, deleteAnnotationFromStep } = useTourStore();
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  
  const defaultValues: TourFormData = {
    title: '',
    description: '',
    thumbnailUrl: '',
    steps: [],
  };

  const { control, register, handleSubmit, reset, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<TourFormData>({
    resolver: zodResolver(tourFormSchema),
    defaultValues,
  });

  const { fields, append, remove, move, update: updateFieldArray } = useFieldArray({
    control,
    name: "steps",
  });

  const watchedSteps = watch("steps");
  const watchedThumbnailUrl = watch("thumbnailUrl");

  useEffect(() => {
    if (tourId) {
      const tour = getTourById(tourId);
      if (tour) {
        setCurrentTour(tour);
        reset({
          title: tour.title,
          description: tour.description,
          thumbnailUrl: tour.thumbnailUrl || '',
          steps: tour.steps.sort((a,b) => a.order - b.order).map(step => { 
            const imageUrl = step.imageUrl || '';
            return {
              id: step.id,
              title: step.title,
              description: step.description || '',
              imageUrl: imageUrl,
              mediaType: step.mediaType || (inferIsVideoUrl(imageUrl) ? 'video' : 'image'),
              order: step.order,
              annotations: step.annotations || [],
            };
          }),
        });
      } else {
        toast({ title: "Error", description: "Tour not found.", variant: "destructive" });
        router.push('/dashboard');
      }
    } else {
        if (fields.length === 0) {
             append({ 
               title: 'Step 1', 
               description: '', 
               imageUrl: `https://placehold.co/800x600.png`, 
               mediaType: 'image', 
               order: 0,
               annotations: []
              });
        }
    }
  }, [tourId, getTourById, reset, toast, router, fields.length, append]);

  const onSubmit = (data: TourFormData) => {
    try {
      const processedSteps = data.steps.map((step, index) => ({
        ...step,
        order: index, 
        mediaType: step.mediaType || (inferIsVideoUrl(step.imageUrl) ? 'video' : 'image'),
        annotations: step.annotations || [],
      }));

      if (tourId) { 
        const existingTour = getTourById(tourId);
        if (!existingTour) throw new Error("Tour not found for update");

        updateTour(tourId, { 
          title: data.title, 
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
        });
        
        // Sync steps: update existing, add new, remove deleted
        const newStepDataMap = new Map(processedSteps.map(s => [s.id, s]));

        existingTour.steps.forEach(existingStep => {
          if (!newStepDataMap.has(existingStep.id)) {
            deleteStepFromTour(tourId, existingStep.id);
          }
        });

        processedSteps.forEach((stepData, index) => {
          const currentStepInStore = existingTour.steps.find(s => s.id === stepData.id);
          const payload = { 
            title: stepData.title, 
            description: stepData.description, 
            imageUrl: stepData.imageUrl,
            mediaType: stepData.mediaType,
            order: index, // Crucial: use the current loop index for order
            annotations: stepData.annotations || [],
          };

          if (stepData.id && currentStepInStore) { 
            updateStepInTour(tourId, stepData.id, payload);
          } else { 
             addStepToTour(tourId, { 
              title: payload.title, 
              description: payload.description, 
              imageUrl: payload.imageUrl,
              mediaType: payload.mediaType,
              annotations: payload.annotations,
              // order is set by addStepToTour or implicitly by array position
            });
          }
        });
        
        toast({ title: "Success", description: "Tour updated successfully!" });
        const refreshedTour = getTourById(tourId); // Fetch the latest state
        if (refreshedTour) {
            setCurrentTour(refreshedTour);
            reset({ // Re-sync form with the latest state, especially step IDs and orders
                title: refreshedTour.title,
                description: refreshedTour.description,
                thumbnailUrl: refreshedTour.thumbnailUrl || '',
                steps: refreshedTour.steps.sort((a, b) => a.order - b.order).map(s => ({
                    ...s,
                    id: s.id,
                    description: s.description || '',
                    imageUrl: s.imageUrl || '',
                    mediaType: s.mediaType || (inferIsVideoUrl(s.imageUrl) ? 'video' : 'image'),
                    annotations: s.annotations || [],
                }))
            });
        }

      } else { 
        const newTourData = {
          title: data.title,
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png`,
          steps: processedSteps.map(s => ({...s, id: undefined})), // Ensure IDs are not passed for new steps if any were generated client-side prematurely
        };
        const createdTour = addTour(newTourData);
        toast({ title: "Success", description: "Tour created! You can now add more steps." });
        router.push(`/tours/${createdTour.id}/edit`); 
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "Failed to save tour.", variant: "destructive" });
    }
  };

  const handleAddStep = () => {
    const newOrder = fields.length;
    append({ 
      title: `Step ${newOrder + 1}`, 
      description: '', 
      imageUrl: `https://placehold.co/800x600.png`, 
      mediaType: 'image', 
      order: newOrder,
      annotations: []
    });
  };
  
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      move(index, targetIndex);
      // After moving, re-evaluate and set the 'order' property for all steps
      const currentSteps = getValues('steps');
      const newOrderedSteps = currentSteps.map((step, idx) => ({ ...step, order: idx }));
      setValue('steps', newOrderedSteps, { shouldDirty: true });
    }
  };

  const handleAddAnnotation = (stepIndex: number) => {
    const stepId = getValues(`steps.${stepIndex}.id`);
    if (!tourId || !stepId) {
        toast({ title: "Cannot Add Annotation", description: "Step must be saved first or tour must exist.", variant: "destructive" });
        return;
    }
    // For now, add with default text/position. A modal or inline form would be better.
    const newAnnotation: Omit<Annotation, 'id'> = {
      text: "New Annotation",
      position: { x: 0.1, y: 0.1 }, // Default position
    };
    addAnnotationToStep(tourId, stepId, newAnnotation);
    // Re-fetch and reset form to reflect new annotation in store if needed, or directly update form state
    const updatedStep = getTourById(tourId)?.steps.find(s => s.id === stepId);
    if (updatedStep) {
        updateFieldArray(stepIndex, { ...getValues(`steps.${stepIndex}`), annotations: updatedStep.annotations });
    }
  };

  const handleDeleteAnnotation = (stepIndex: number, annotationId: string) => {
    const stepId = getValues(`steps.${stepIndex}.id`);
     if (!tourId || !stepId) {
        toast({ title: "Error", description: "Tour or Step ID missing.", variant: "destructive" });
        return;
    }
    deleteAnnotationFromStep(tourId, stepId, annotationId);
    const updatedStep = getTourById(tourId)?.steps.find(s => s.id === stepId);
     if (updatedStep) {
        updateFieldArray(stepIndex, { ...getValues(`steps.${stepIndex}`), annotations: updatedStep.annotations });
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
            {isPotentiallyValidMediaSrc(watchedThumbnailUrl) && (
                 <Image 
                    src={watchedThumbnailUrl} 
                    alt="Thumbnail preview" 
                    width={200} height={120} 
                    className="mt-2 rounded object-cover"
                    data-ai-hint="abstract background"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display='none';
                        setValue('thumbnailUrl', ''); // Clear if image fails to load
                        toast({variant: "destructive", title: "Invalid Thumbnail URL", description: "The thumbnail URL could not be loaded."})
                    }}
                  />
            )}
          </div>
        </CardContent>
      </Card>
      
      <ScreenRecorder />

      <Card>
        <CardHeader>
          <CardTitle>Tour Steps</CardTitle>
          <CardDescription>Add, edit, and reorder the steps for your interactive tour. Media can be images or videos (e.g. from screen recordings).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => {
            const stepMediaUrl = watchedSteps[index]?.imageUrl;
            const stepMediaType = watchedSteps[index]?.mediaType || (inferIsVideoUrl(stepMediaUrl) ? 'video' : 'image');
            const stepAnnotations = watchedSteps[index]?.annotations || [];
            
            return (
            <Card key={field.id || `step-${index}`} className="bg-background/50">
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
                  <Label htmlFor={`steps.${index}.imageUrl`}>Media URL (Image or Video)</Label>
                  <Input 
                    id={`steps.${index}.imageUrl`} 
                    {...register(`steps.${index}.imageUrl`)} 
                    className="mt-1" 
                    placeholder="https://example.com/image.png or /video.mp4 or blob:..."
                    onChange={(e) => {
                        const newUrl = e.target.value;
                        setValue(`steps.${index}.imageUrl`, newUrl);
                        setValue(`steps.${index}.mediaType`, inferIsVideoUrl(newUrl) ? 'video' : 'image');
                    }}
                   />
                  {errors.steps?.[index]?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.steps[index]?.imageUrl?.message}</p>}
                  
                  {isPotentiallyValidMediaSrc(stepMediaUrl) && (
                    <div className="mt-2 border rounded overflow-hidden max-w-xs">
                      {stepMediaType === 'video' ? (
                        <video 
                            src={stepMediaUrl!} 
                            controls 
                            className="aspect-video w-full object-contain bg-muted"
                             onError={(e) => {
                                const target = e.target as HTMLVideoElement;
                                target.style.display='none';
                                setValue(`steps.${index}.imageUrl`, '');
                                toast({variant: "destructive", title: "Invalid Media URL", description: `Video for Step ${index+1} could not be loaded.`})
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                      ) : (
                        <Image 
                            src={stepMediaUrl!} 
                            alt={`Step ${index + 1} preview`} 
                            width={300} height={180} 
                            className="object-contain"
                            data-ai-hint="ui screenshot"
                             onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display='none';
                                setValue(`steps.${index}.imageUrl`, '');
                                toast({variant: "destructive", title: "Invalid Media URL", description: `Image for Step ${index+1} could not be loaded.`})
                            }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor={`steps.${index}.description`}>Step Description/Instructions</Label>
                  <Textarea id={`steps.${index}.description`} {...register(`steps.${index}.description`)} className="mt-1" rows={2} />
                </div>
                
                {/* Annotations Section */}
                <div className="mt-3 p-3 border border-dashed rounded-md">
                    <div className="flex justify-between items-center mb-2">
                        <Label className="text-base">Annotations</Label>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddAnnotation(index)}
                            disabled={!tourId || !getValues(`steps.${index}.id`)} // Disable if tour/step not saved
                            title={(!tourId || !getValues(`steps.${index}.id`)) ? "Save tour and step first to add annotations" : "Add annotation"}
                        >
                            <MessageSquarePlus className="mr-2 h-4 w-4" /> Add Annotation
                        </Button>
                    </div>
                    {stepAnnotations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No annotations for this step yet.</p>
                    ) : (
                        <div className="space-y-2">
                        {stepAnnotations.map((annotation, annIndex) => (
                            <Card key={annotation.id || `ann-${annIndex}`} className="p-2 bg-muted/50">
                                <div className="flex justify-between items-start">
                                    <Textarea
                                        defaultValue={annotation.text}
                                        placeholder="Annotation text..."
                                        className="text-xs flex-grow mr-2"
                                        rows={1}
                                        onBlur={(e) => {
                                            const newText = e.target.value;
                                            if (tourId && field.id && annotation.id && newText !== annotation.text) {
                                                updateAnnotationInStep(tourId, field.id, annotation.id, { text: newText });
                                                const currentAnns = getValues(`steps.${index}.annotations`) || [];
                                                const newAnns = currentAnns.map(a => a.id === annotation.id ? {...a, text: newText} : a);
                                                setValue(`steps.${index}.annotations`, newAnns, { shouldDirty: true });
                                            }
                                        }}
                                    />
                                     <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                         <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Annotation?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this annotation: "{annotation.text.substring(0, 30)}..."?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteAnnotation(index, annotation.id!)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Position: (x: {annotation.position.x.toFixed(2)}, y: {annotation.position.y.toFixed(2)})
                                    {/* TODO: Add inputs to change position */}
                                </p>
                            </Card>
                        ))}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Visual placement of annotations on the image/video is coming soon!</p>
                    </div>

              </CardContent>
            </Card>
          )})}
          {errors.steps && !errors.steps.root && typeof errors.steps.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.steps.message}</p>}

          <Button type="button" variant="outline" onClick={handleAddStep}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Step
          </Button>
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

    