
"use client";

import { TourForm } from '@/components/tours/TourForm';
import { useTourStore } from '@/hooks/useTourStore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation'; // Import useParams and useRouter
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function EditTourPage() {
  const params = useParams<{ id: string }>(); // Use useParams hook
  const router = useRouter(); // For potential redirection
  const { toast } = useToast(); // For notifications
  const { getTourById } = useTourStore();
  const [tourExists, setTourExists] = useState<boolean | undefined>(undefined);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);

  useEffect(() => {
    // params.id from useParams should be a string for a route like /tours/[id]/edit
    const idFromParams = params?.id;

    if (idFromParams) {
      const tour = getTourById(idFromParams);
      if (tour) {
        setTourExists(true);
        setCurrentTourId(idFromParams);
      } else {
        setTourExists(false);
        setCurrentTourId(null);
        // Optionally, redirect if tour not found after checking
        // toast({ title: "Error", description: "Tour not found.", variant: "destructive" });
        // router.push('/dashboard'); 
      }
    } else {
      // Handle cases where id might not be available, though unlikely for this route structure
      setTourExists(false);
      setCurrentTourId(null);
      toast({ title: "Error", description: "Tour ID missing.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [params, getTourById, router, toast]);

  if (tourExists === undefined) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-12 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-1/4" />
        </div>
      </div>
    );
  }

  if (!tourExists || !currentTourId) {
    // This state implies the useEffect has run and determined the tour doesn't exist or ID is invalid
    // To avoid flashing this UI if redirecting, ensure toast/router.push happens in useEffect
    // For now, let's keep the not found message if not redirecting immediately from useEffect
    return (
      <div className="p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Tour Not Found</h1>
        <p className="text-muted-foreground">The tour you are trying to edit does not exist or the ID is invalid.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Tour</h1>
        <p className="text-muted-foreground mt-2">
          Refine your tour details, manage steps, and enhance with AI.
        </p>
      </header>
      <TourForm tourId={currentTourId} />
    </div>
  );
}
