"use client";

import { TourForm } from '@/components/tours/TourForm';
import { useTourStore } from '@/hooks/useTourStore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTourPage({ params }: { params: { id: string } }) {
  const { getTourById } = useTourStore();
  const [tourExists, setTourExists] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const tour = getTourById(params.id);
    setTourExists(!!tour);
  }, [params.id, getTourById]);

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

  if (!tourExists) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Tour Not Found</h1>
        <p className="text-muted-foreground">The tour you are trying to edit does not exist.</p>
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
      <TourForm tourId={params.id} />
    </div>
  );
}
