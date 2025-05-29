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
import { Copy, Link as LinkIcon, Check } from 'lucide-react';
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

  useEffect(() => {
    setIsPublic(tour.isPublic);
    if (tour.isPublic && tour.id) {
        // Ensure window is defined for client-side URL construction
        if (typeof window !== 'undefined') {
            const newLink = `${window.location.origin}/tours/${tour.id}`;
            setShareLink(newLink);
            // Update tour in store if link differs or wasn't set
            if (tour.shareableLink !== newLink) {
                updateTour(tour.id, { shareableLink: newLink });
            }
        }
    } else {
        setShareLink('');
    }
  }, [tour.isPublic, tour.id, tour.shareableLink, updateTour]);

  const handlePublishToggle = (checked: boolean) => {
    setIsPublic(checked);
    let newLink = '';
    if (checked && tour.id) {
        if (typeof window !== 'undefined') {
            newLink = `${window.location.origin}/tours/${tour.id}`;
        }
    }
    updateTour(tour.id, { isPublic: checked, shareableLink: newLink });
    setShareLink(newLink);
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
                <Button type="button" size="icon" variant="outline" onClick={handleCopyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Anyone with this link can view your tour.</p>
            </div>
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
        {/* This dialog is typically triggered by a button elsewhere, props.children allow custom trigger */}
        {dialogContent}
    </Dialog>
  );
}
