
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, LayoutGrid, List, TrendingUp, Eye, CheckSquare, BarChartBig } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourCard } from '@/components/dashboard/TourCard';
import { useTourStore } from '@/hooks/useTourStore';
import type { Tour } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function DashboardPage() {
  const { tours, addTour } = useTourStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mocked Analytics Data
  const [mockedAnalytics, setMockedAnalytics] = useState({
    totalViews: 0,
    completionRate: 0,
    activeTours: 0,
  });

  useEffect(() => {
    setMounted(true);
    // This will only run once on client after zustand has rehydrated
    if (tours.length === 0 && mounted) {
        addTour({
            title: "My First Awesome Demo",
            description: "A quick walkthrough of our main product features. This will show you how to get started and make the most of our platform.",
            thumbnailUrl: "https://placehold.co/600x400.png",
            steps: [
                { title: "Welcome Screen", description: "This is the first thing you see.", imageUrl: "https://placehold.co/800x600.png", annotations: [] },
                { title: "Key Feature X", description: "Discover our amazing Feature X.", imageUrl: "https://placehold.co/800x600.png" , annotations: []},
            ]
        });
    }
  }, [mounted, tours.length, addTour]); // Corrected dependency array

 useEffect(() => {
    if (mounted) {
      // Simulate fetching analytics data
      const totalTours = tours.length;
      const publicTours = tours.filter(t => t.isPublic).length;
      setMockedAnalytics({
        totalViews: totalTours * (Math.floor(Math.random() * 500) + 50), // Random views per tour
        completionRate: Math.floor(Math.random() * 60) + 40, // Random rate between 40-100%
        activeTours: publicTours,
      });
    }
  }, [mounted, tours]);


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
    (tour.description && tour.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground">My Tours Dashboard</h1>
          <Button asChild size="lg">
            <Link href="/tours/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Tour
            </Link>
          </Button>
        </div>
      </header>

      {/* Mocked Analytics Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
          <TrendingUp className="mr-2 h-6 w-6 text-primary" />
          Analytics Overview (Mocked)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
              <BarChartBig className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tours.length}</div>
              <p className="text-xs text-muted-foreground">tours created</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public Tours</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockedAnalytics.activeTours}</div>
              <p className="text-xs text-muted-foreground">currently public</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockedAnalytics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">across all public tours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockedAnalytics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">for viewed tours</p>
            </CardContent>
          </Card>
        </div>
      </section>


      <div className="mt-6 flex flex-col md:flex-row gap-4 mb-8">
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
          <Tabs defaultValue="grid" onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid"><LayoutGrid className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="list"><List className="h-5 w-5" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

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
          {filteredTours.sort((a,b) => (b.updatedAt && a.updatedAt ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : 0)).map((tour: Tour) => (
            <TourCard key={tour.id} tour={tour} viewMode={viewMode}/>
          ))}
        </div>
      )}
    </div>
  );
}

    