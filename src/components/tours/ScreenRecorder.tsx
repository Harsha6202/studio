// src/components/tours/ScreenRecorder.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Camera, AlertCircle, CircleDot, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ScreenRecorder() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Placeholder state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const requestPermissions = async () => {
    try {
      // You can change { video: true } to getDisplayMedia for screen recording
      // const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsStreaming(true);
      toast({ title: "Camera Access Granted", description: "Preview started." });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermission(false);
      setIsStreaming(false);
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: 'Please enable camera/screen permissions in your browser settings.',
      });
    }
  };

  const stopStreaming = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setHasPermission(null); // Reset permission state to allow trying again
    // setIsRecording(false); // Stop recording if it was active
    toast({ title: "Preview Stopped" });
  };
  
  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartRecording = () => {
    // Placeholder for actual recording logic
    setIsRecording(true);
    toast({ title: "Recording Started (Mock)" });
  };

  const handleStopRecording = () => {
    // Placeholder
    setIsRecording(false);
    toast({ title: "Recording Stopped (Mock)" });
  };

  const handleSaveRecording = () => {
    // Placeholder for saving to Firebase Storage
    toast({ title: "Save Recording (Mock)", description: "This will eventually save to Firebase Storage."});
  }

  return (
    <Card className="mt-6 border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Camera className="mr-2 h-5 w-5" /> Screen/Camera Recorder
        </CardTitle>
        <CardDescription>
          Capture your product workflow. Start by enabling camera/screen access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isStreaming && hasPermission === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
              StoryFlow needs access to your camera or screen to record. Please enable permissions in your browser settings and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-contain" autoPlay muted playsInline />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isStreaming ? (
            <Button type="button" onClick={requestPermissions}>
              <Video className="mr-2 h-5 w-5" /> Enable Camera & Start Preview
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={stopStreaming}>
              <VideoOff className="mr-2 h-5 w-5" /> Stop Preview
            </Button>
          )}

          {isStreaming && !isRecording && (
            <Button type="button" onClick={handleStartRecording} variant="destructive">
              <CircleDot className="mr-2 h-5 w-5 animate-pulse" /> Start Recording
            </Button>
          )}
          {isStreaming && isRecording && (
             <Button type="button" onClick={handleStopRecording} variant="secondary">
              <Square className="mr-2 h-5 w-5" /> Stop Recording
            </Button>
          )}
          {isStreaming && ( // Could be shown after recording stops
            <Button type="button" onClick={handleSaveRecording} variant="outline" disabled={isRecording}>
              Save Recording
            </Button>
          )}
        </div>
         <p className="text-xs text-muted-foreground mt-3">
            Note: For actual screen recording, `getDisplayMedia` API would be used. This example uses `getUserMedia` for camera access as a starting point. Full recording and upload functionality will be added next.
          </p>
      </CardContent>
    </Card>
  );
}
