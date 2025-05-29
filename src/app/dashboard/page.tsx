"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourCard } from '@/components/dashboard/TourCard';
import { useTourStore } from '@/hooks/useTourStore';
import type { Tour } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


export default function DashboardPage() {
  const { tours, addTour } = useTourStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setMounted(true);
    // Example of adding a demo tour if none exist - for new users
    // This will only run once on client after zustand has rehydrated
    if (tours.length === 0 && mounted) {
        addTour({
            title: "My First Awesome Demo",
            description: "A quick walkthrough of our main product features. This will show you how to get started and make the most of our platform.",
            thumbnailUrl: "https://placehold.co/600x400.png?text=Demo+Tour",
            steps: [
                { title: "Welcome Screen", description: "This is the first thing you see.", imageUrl: "https://placehold.co/800x600.png?text=Step+1", annotations: [] },
                { title: "Key Feature X", description: "Discover our amazing Feature X.", imageUrl: "https://placehold.co/800x600.png?text=Step+2" , annotations: []},
            ]
        });
    }
  }, [mounted, tours, addTour]);
  
  if (!mounted) {
    // Prevents hydration mismatch by not rendering tour-dependent UI on server
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Loading Dashboard...</h1>
         <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-card rounded-lg"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground">My Tours</h1>
          <Button asChild size="lg">
            <Link href="/tours/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Tour
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tours..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle could be here, or filters */}
            <Tabs defaultValue="grid" onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid"><LayoutGrid className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="list"><List className="h-5 w-5" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {filteredTours.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-foreground mb-2">No tours found.</h2>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "Try adjusting your search or " : ""}
            Get started by creating your first interactive product demo!
          </p>
          <Button asChild>
            <Link href="/tours/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Tour
            </Link>
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {filteredTours.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((tour: Tour) => (
            <TourCard key={tour.id} tour={tour} viewMode={viewMode}/>
          ))}
        </div>
      )}
    </div>
  );
}
