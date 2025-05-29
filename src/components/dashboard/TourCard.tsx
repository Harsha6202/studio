"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Edit, Trash2, Share2, Eye, MoreVertical, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Tour } from '@/lib/types';
import { useTourStore } from '@/hooks/useTourStore';
import { PublishDialog } from '@/components/tours/PublishDialog';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';


interface TourCardProps {
  tour: Tour;
  viewMode?: 'grid' | 'list';
}

export function TourCard({ tour, viewMode = 'grid' }: TourCardProps) {
  const { deleteTour } = useTourStore();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteTour(tour.id);
  };
  
  const lastUpdated = formatDistanceToNow(new Date(tour.updatedAt), { addSuffix: true });

  if (viewMode === 'list') {
    return (
      <Card className="flex flex-col md:flex-row w-full hover:shadow-lg transition-shadow duration-200">
        <div className="md:w-1/4 relative h-48 md:h-auto">
          <Image
            src={tour.thumbnailUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(tour.title)}`}
            alt={tour.title}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
            data-ai-hint="product screenshot"
          />
        </div>
        <div className="md:w-3/4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl hover:text-primary transition-colors">
              <Link href={`/tours/${tour.id}/edit`}>{tour.title}</Link>
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">{tour.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pb-2">
             <p className="text-xs text-muted-foreground flex items-center">
                <Clock size={14} className="mr-1" /> Last updated: {lastUpdated}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {tour.isPublic ? 'Public' : 'Private'}
              </p>
          </CardContent>
          <CardFooter className="flex justify-end items-center gap-2 pt-0 pb-4 px-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tours/${tour.id}/edit`}>
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
            {tour.isPublic && tour.shareableLink && (
               <Button variant="outline" size="sm" asChild>
                 <Link href={tour.shareableLink} target="_blank">
                   <Eye className="mr-1 h-4 w-4" /> View
                 </Link>
               </Button>
            )}
            <PublishDialog tour={tour} open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
              <Button variant="outline" size="sm" onClick={() => setIsPublishDialogOpen(true)}>
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
            </PublishDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your tour
                    "{tour.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </div>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="relative p-0">
        <Link href={`/tours/${tour.id}/edit`} className="block">
          <Image
            src={tour.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(tour.title)}`}
            alt={tour.title}
            width={600}
            height={400}
            className="rounded-t-lg object-cover aspect-[3/2]"
            data-ai-hint="product ui"
          />
        </Link>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-card/80 hover:bg-card">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tours/${tour.id}/edit`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              {tour.isPublic && tour.shareableLink && (
                 <DropdownMenuItem asChild>
                   <Link href={tour.shareableLink} target="_blank" className="flex items-center">
                     <Eye className="mr-2 h-4 w-4" /> View Public Tour
                   </Link>
                 </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsPublishDialogOpen(true)} className="flex items-center">
                <Share2 className="mr-2 h-4 w-4" /> Share / Publish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your tour
                      "{tour.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
          <PublishDialog tour={tour} open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-4 pb-2">
        <CardTitle className="text-lg mb-1 hover:text-primary transition-colors">
            <Link href={`/tours/${tour.id}/edit`}>{tour.title}</Link>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-3">{tour.description}</CardDescription>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-0 pb-4 flex justify-between items-center">
        <span>{tour.isPublic ? 'Public' : 'Private'}</span>
        <div className="flex items-center">
            <Clock size={14} className="mr-1" /> {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}
