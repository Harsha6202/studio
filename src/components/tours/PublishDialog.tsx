
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Check } from 'lucide-react';
import type { Tour } from '@/lib/types';
import { useTourStore } from '@/hooks/useTourStore';
import { useToast } from '@/hooks/use-toast';

interface PublishDialogProps {
  tour: Tour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode; // For custom trigger
}

export function PublishDialog({ tour, open, onOpenChange, children }: PublishDialogProps) {
  const [isPublic, setIsPublic] = useState(tour.isPublic);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { updateTour } = useTourStore();
  const { toast } = useToast();

  const getBaseUrl = () => {
    // Prefer NEXT_PUBLIC_APP_BASE_URL if set, otherwise use window.location.origin
    // Ensure this runs client-side where window is available or NEXT_PUBLIC_APP_BASE_URL is accessible
    if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
      return process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if any
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return ''; // Fallback, though ideally one of the above should work
  };

  useEffect(() => {
    setIsPublic(tour.isPublic);
    const baseUrl = getBaseUrl();
    if (tour.isPublic && tour.id && baseUrl) {
        const newLink = `${baseUrl}/tours/${tour.id}`;
        setShareLink(newLink);
        if (tour.shareableLink !== newLink) {
            updateTour(tour.id, { shareableLink: newLink, isPublic: tour.isPublic });
        }
    } else if (!tour.isPublic) {
        setShareLink('');
         if (tour.shareableLink) { // Clear shareable link if tour is not public
            updateTour(tour.id, { shareableLink: '', isPublic: false });
        }
    }
  }, [tour.isPublic, tour.id, tour.shareableLink, updateTour]);

  const handlePublishToggle = (checked: boolean) => {
    setIsPublic(checked);
    let newLink = '';
    const baseUrl = getBaseUrl();

    if (checked && tour.id && baseUrl) {
        newLink = `${baseUrl}/tours/${tour.id}`;
    }
    
    updateTour(tour.id, { isPublic: checked, shareableLink: newLink });
    setShareLink(newLink); // Update local state immediately
    
    toast({
      title: `Tour ${checked ? 'Published' : 'Unpublished'}`,
      description: `Your tour is now ${checked ? 'public' : 'private'}.`,
    });
  };

  const handleCopyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        toast({ title: "Link Copied!", description: "Shareable link copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        toast({ title: "Copy Failed", description: "Could not copy link to clipboard.", variant: "destructive" });
      });
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Publish Tour: {tour.title}</DialogTitle>
          <DialogDescription>
            Manage visibility and get a shareable link for your tour.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="publish-status"
              checked={isPublic}
              onCheckedChange={handlePublishToggle}
              aria-label={isPublic ? 'Set tour to private' : 'Set tour to public'}
            />
            <Label htmlFor="publish-status" className="text-base">
              {isPublic ? 'Publicly Accessible' : 'Private (Only you can see)'}
            </Label>
          </div>
          {isPublic && shareLink && (
            <div className="space-y-2">
              <Label htmlFor="shareable-link">Shareable Link</Label>
              <div className="flex items-center space-x-2">
                <Input id="shareable-link" value={shareLink} readOnly />
                <Button type="button" size="icon" variant="outline" onClick={handleCopyToClipboard} aria-label="Copy shareable link">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Anyone with this link can view your tour.</p>
            </div>
          )}
           {!isPublic && (
             <p className="text-sm text-muted-foreground">Make the tour public to generate a shareable link.</p>
           )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
  );

  if (children) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            {dialogContent}
        </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
    </Dialog>
  );
}
