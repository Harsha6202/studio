
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Zap, RefreshCw } from 'lucide-react';
import { generateTourDescription, type GenerateTourDescriptionInput } from '@/ai/flows/generate-tour-description';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIHelperProps {
  currentDescription: string;
  onApplyDescription: (description: string) => void;
  productName: string; // Typically the tour title
}

export function AIHelper({ currentDescription, onApplyDescription, productName }: AIHelperProps) {
  const [highlights, setHighlights] = useState('');
  const [audience, setAudience] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    if (!productName.trim()) {
        toast({ title: "Product Name Missing", description: "Please provide a product/tour name first.", variant: "destructive" });
        return;
    }
    if (!highlights.trim()) {
        toast({ title: "Highlights Missing", description: "Please provide some tour highlights.", variant: "destructive" });
        return;
    }
     if (!audience.trim()) {
        toast({ title: "Target Audience Missing", description: "Please specify the target audience.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setGeneratedDescription('');
    try {
      const input: GenerateTourDescriptionInput = {
        productName,
        tourHighlights: highlights,
        targetAudience: audience,
      };
      const result = await generateTourDescription(input);
      if (result.description) {
        setGeneratedDescription(result.description);
        toast({ title: "AI Description Generated!", description: "Review and apply the new description." });
      } else {
        throw new Error("AI did not return a description.");
      }
    } catch (error: any) { // Use 'any' to access potential digest property
      console.error("AI description generation error:", error);
      let descriptionMessage = "An error occurred while generating the description.";
      if (error.message) {
        // Avoid showing the generic "An error occurred in the Server Components render" if we have a digest.
        if (!error.digest || !error.message.includes("Server Components render")) {
          descriptionMessage = error.message;
        }
      }
      
      if (error.digest) {
        descriptionMessage = `A server error occurred. Digest: ${error.digest}. Please check Vercel logs for details.`;
      } else if (descriptionMessage.includes("Server Components render")) {
        // Fallback if digest is not present but it's a server component error
         descriptionMessage = "An error occurred on the server. Please check Vercel logs for more details.";
      }

      toast({ 
        title: "Error Generating Description", 
        description: descriptionMessage, 
        variant: "destructive",
        duration: 9000, // Longer duration for error messages with digests
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Zap className="mr-2 h-5 w-5 text-primary" />
          AI Description Enhancer
        </CardTitle>
        <CardDescription>
          Let AI help you craft a compelling tour description. Fill in the details below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="aiProductName">Product/Tour Name (from above)</Label>
          <Input id="aiProductName" value={productName} readOnly disabled className="mt-1 bg-muted" />
        </div>
        <div>
          <Label htmlFor="tourHighlights">Key Tour Highlights</Label>
          <Textarea
            id="tourHighlights"
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="e.g., Easy setup, Powerful analytics, Seamless integration"
            className="mt-1"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Marketing professionals, Developers, Small business owners"
            className="mt-1"
          />
        </div>
        <Button type="button" onClick={handleGenerateDescription} disabled={isLoading || !productName.trim()}>
          {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          {isLoading ? 'Generating...' : 'Generate with AI'}
        </Button>

        {generatedDescription && (
          <div className="mt-4 space-y-2 p-4 border border-primary/50 rounded-md bg-primary/10">
            <Label className="font-semibold text-primary">AI Suggested Description:</Label>
            <Textarea value={generatedDescription} readOnly rows={5} className="bg-background/80" />
            <div className="flex gap-2 mt-2">
                <Button type="button" onClick={() => onApplyDescription(generatedDescription)} variant="default">
                    Apply Suggestion
                </Button>
                <Button type="button" variant="outline" onClick={() => setGeneratedDescription('')}>
                    Clear Suggestion
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
