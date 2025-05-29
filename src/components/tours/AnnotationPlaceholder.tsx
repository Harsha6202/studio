"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnnotationPlaceholderProps {
  tourId?: string | null;
  stepId?: string;
}

export function AnnotationPlaceholder({ tourId, stepId }: AnnotationPlaceholderProps) {
  const { toast } = useToast();

  const handleAddAnnotation = () => {
    toast({
      title: "Annotation Feature",
      description: "Visual annotations will be available soon. You'll be able to click on the image to add notes.",
    });
  };

  return (
    <div className="mt-3 p-3 border border-dashed rounded-md">
      <p className="text-sm text-muted-foreground mb-2">Annotations (Coming Soon)</p>
      <Button type="button" variant="outline" size="sm" onClick={handleAddAnnotation} disabled>
        <MessageSquarePlus className="mr-2 h-4 w-4" /> Add Annotation
      </Button>
      {/* Future: Display list of existing annotations for this step */}
    </div>
  );
}
