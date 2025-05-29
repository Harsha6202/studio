"use client";

import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export function ScreenRecorderPlaceholder() {
  const { toast } = useToast();

  const handleRecordClick = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "In-app screen recording will be available in a future update.",
    });
  };

  return (
    <Card className="mt-6 border-dashed border-border">
        <CardHeader>
            <CardTitle className="text-lg">Record Screen Flow</CardTitle>
            <CardDescription>Capture your product workflow directly in the app (Feature Coming Soon).</CardDescription>
        </CardHeader>
        <CardContent>
            <Button type="button" variant="outline" onClick={handleRecordClick} className="w-full">
                <Video className="mr-2 h-5 w-5 text-muted-foreground" />
                Start Screen Recording
            </Button>
        </CardContent>
    </Card>
  );
}
