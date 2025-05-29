"use client";

import { TourForm } from '@/components/tours/TourForm';
import { useRouter } from 'next/navigation';
import { useTourStore } from '@/hooks/useTourStore';

export default function CreateTourPage() {
  const router = useRouter();
  const { addTour } = useTourStore();

  const handleTourCreate = (title: string, description: string) => {
    // Add a new tour with basic info, then redirect to its edit page
    // The TourForm will handle actual step creation etc. on the edit page.
    const newTour = addTour({ title, description });
    router.push(`/tours/${newTour.id}/edit`);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Create New Tour</h1>
        <p className="text-muted-foreground mt-2">
          Start by giving your tour a title and description. You'll add steps and content next.
        </p>
      </header>
      {/* We pass null for tourId to indicate creation mode */}
      <TourForm tourId={null} />
    </div>
  );
}
