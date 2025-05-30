
// src/app/tours/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTourStore } from '@/hooks/useTourStore';
import type { Tour, TourStep } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home, Share2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { inferIsVideoUrl, isPotentiallyValidMediaSrc } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert'; // Import Alert components

export default function ViewTourPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getTourById } = useTourStore();

  const [tour, setTour] = useState<Tour | null | undefined>(undefined); // undefined for loading, null for not found
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const tourId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && tourId) {
      const fetchedTour = getTourById(tourId as string);
      if (fetchedTour && fetchedTour.isPublic) {
        setTour(fetchedTour);
      } else if (fetchedTour && !fetchedTour.isPublic) {
        setTour(null); // Tour exists but is private
        toast({ title: "Access Denied", description: "This demo is private.", variant: "destructive"});
      }
      else {
        setTour(null); // Tour not found
      }
    }
  }, [mounted, tourId, getTourById, toast]);

  if (!mounted || tour === undefined) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="aspect-video w-full rounded-lg mb-6" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (tour === null) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center max-w-2xl">
        <h1 className="text-3xl font-bold text-destructive mb-4">Demo Not Available</h1>
        <p className="text-muted-foreground mb-6">This demo either does not exist or is not publically accessible.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const currentStep = tour.steps.sort((a,b) => a.order - b.order)[currentStepIndex];
  const stepMediaUrl = currentStep?.imageUrl;
  const stepMediaType = currentStep?.mediaType || (inferIsVideoUrl(stepMediaUrl) ? 'video' : 'image');

  const handleNextStep = () => {
    if (currentStepIndex < tour.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShareError(null); // Clear share error on navigation
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setShareError(null); // Clear share error on navigation
    }
  };

  const handleShare = async () => {
    setShareError(null);
    const shareData = {
      title: tour.title,
      text: `Check out this product demo: ${tour.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({title: "Shared successfully!"});
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard copy if navigator.share fails (e.g., on desktop or if user cancels)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast({title: "Link Copied!", description: "Demo link copied to clipboard. Sharing failed."});
          } catch (copyError) {
            setShareError("Could not share or copy link. Please copy the URL from your browser's address bar.");
            toast({title: "Share Failed", description: "Could not share or copy link automatically. Please copy manually.", variant: "destructive"});
          }
        } else {
            setShareError("Sharing not available. Please copy the URL from your browser's address bar.");
            toast({title: "Share Failed", description: "Sharing not available. Please copy the URL manually.", variant: "destructive"});
        }
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({title: "Link Copied!", description: "Demo link copied to clipboard."});
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        setShareError("Could not copy link. Please copy it manually. (This might be due to browser permissions.)");
        toast({title: "Copy Failed", description: "Could not copy link to clipboard. Please copy manually.", variant: "destructive"});
      }
    } else {
        setShareError("Sharing and automatic copying not supported. Please copy the URL from your browser's address bar.");
        toast({title: "Action Failed", description: "Cannot share or copy automatically. Please copy the URL manually.", variant: "destructive"});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-card">
      <header className="p-4 border-b border-border/50 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
           <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" /> Product Demo Home
              </Link>
            </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground truncate px-2" title={tour.title}>{tour.title}</h1>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Share</span>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-4xl">
        {shareError && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{shareError}</AlertDescription>
            </Alert>
        )}
        <Card className="overflow-hidden shadow-2xl">
          <div key={currentStepIndex} className="fade-in-step">
            <CardHeader className="bg-card/50 p-4 md:p-6">
              <p className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {tour.steps.length}</p>
              <CardTitle className="text-2xl md:text-3xl mt-1">{currentStep.title}</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="aspect-video w-full relative bg-muted/50 flex items-center justify-center">
                {!isPotentiallyValidMediaSrc(stepMediaUrl) ? (
                  <div className="text-muted-foreground">No media for this step.</div>
                ) : stepMediaType === 'video' ? (
                  <video
                    src={stepMediaUrl}
                    controls
                    autoPlay
                    muted // Good for autoplay UX
                    className="w-full h-full object-contain"
                    key={stepMediaUrl} // Re-render if src changes
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Image
                    src={stepMediaUrl || "https://placehold.co/1280x720.png"}
                    alt={currentStep.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                    priority={currentStepIndex === 0}
                    data-ai-hint="app screenshot"
                  />
                )}
                {/* Annotations overlay can be added here */}
                {(currentStep.annotations || []).map(annotation => (
                    <div
                      key={annotation.id}
                      className="absolute p-2 bg-black/70 text-white text-xs rounded shadow-lg"
                      style={{
                          left: `${annotation.position.x * 100}%`,
                          top: `${annotation.position.y * 100}%`,
                          transform: 'translate(-50%, -50%)' // Adjust if position is top-left corner
                      }}
                      title={annotation.text}
                    >
                      {annotation.text.length > 30 ? annotation.text.substring(0,27) + "..." : annotation.text}
                    </div>
                ))}
              </div>

              {currentStep.description && (
                <div className="p-4 md:p-6 border-t border-border">
                  <CardDescription className="text-base whitespace-pre-wrap">{currentStep.description}</CardDescription>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        <div className="mt-6 flex justify-between items-center">
          <Button onClick={handlePrevStep} disabled={currentStepIndex === 0} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-5 w-5" /> Previous
          </Button>
          <span className="text-muted-foreground">
            {currentStepIndex + 1} / {tour.steps.length}
          </span>
          <Button onClick={handleNextStep} disabled={currentStepIndex === tour.steps.length - 1} variant="default" size="lg">
            Next <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">About this demo: {tour.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap max-w-2xl mx-auto">{tour.description}</p>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border/50">
        Powered by Product Demo Platform
      </footer>
    </div>
  );
}
