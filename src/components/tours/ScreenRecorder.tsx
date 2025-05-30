
// src/components/tours/ScreenRecorder.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScreenShare, ScreenShareOff, AlertCircle, CircleDot, Square, Download, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ScreenRecorder() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const requestPermissionsAndStartStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsStreaming(true);
      setRecordedVideoUrl(null); // Clear previous recording
      setRecordedChunks([]);
      toast({ title: "Screen Share Started", description: "Live preview active." });

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      console.error('Error accessing screen share:', error);
      setHasPermission(false);
      setIsStreaming(false);
      toast({
        variant: 'destructive',
        title: 'Screen Share Access Denied',
        description: 'Please enable screen sharing permissions and try again.',
      });
    }
  };

  const stopScreenShare = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    if (isRecording) { // If recording, stop it as well
      handleStopRecording();
    }
    setIsStreaming(false);
    setHasPermission(null);
    toast({ title: "Screen Share Stopped" });
  }, [isRecording]); // Added isRecording dependency
  
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartRecording = () => {
    if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
      toast({ title: "No active screen share", description: "Please start screen sharing first.", variant: "destructive" });
      return;
    }
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    
    // Determine MIME type - prefer vp9 if available, else default
    const options = { mimeType: 'video/webm; codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      // console.log(options.mimeType + ' is not Supported');
      options.mimeType = 'video/webm; codecs=vp8';
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        // console.log(options.mimeType + ' is not Supported');
        options.mimeType = 'video/webm'; // Fallback to generic webm
         if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          // console.log(options.mimeType + ' is not Supported');
          toast({ title: "Recording Error", description: "No supported video/webm codec found.", variant: "destructive" });
          return;
        }
      }
    }

    try {
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, options);
        mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
        }
        };
        mediaRecorderRef.current.onstop = () => {
        // Handled by setRecordedChunks effect
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Screen Recording Started" });
    } catch (e) {
        console.error("MediaRecorder error: ", e);
        toast({ title: "Recording Failed", description: "Could not start MediaRecorder.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        // setRecordedChunks([]); // Clear chunks after blob creation
    }
  }, [isRecording, recordedChunks]);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    toast({ title: "Screen Recording Stopped" });
  };

  const handleDownloadRecording = () => {
    if (recordedVideoUrl) {
      const a = document.createElement('a');
      a.href = recordedVideoUrl;
      a.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "Recording Downloaded" });
    } else {
        toast({ title: "No Recording", description: "There is no recording to download.", variant: "destructive" });
    }
  };

  const handleUseRecording = () => {
    // Placeholder for saving to Firebase Storage and using in TourForm
    if (recordedVideoUrl) {
      toast({ title: "Use Recording (Placeholder)", description: "This will eventually upload and link the recording to a tour step."});
      // Example: pass `new Blob(recordedChunks, { type: 'video/webm' })` to an upload function
    } else {
      toast({ title: "No Recording", description: "Record something first!", variant: "destructive" });
    }
  }

  return (
    <Card className="mt-6 border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <ScreenShare className="mr-2 h-5 w-5" /> Screen Recorder
        </CardTitle>
        <CardDescription>
          Capture your product workflow. Start by enabling screen share access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isStreaming && hasPermission === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
              StoryFlow needs access to your screen to record. Please enable permissions and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
          <video ref={videoPreviewRef} className="w-full h-full object-contain" autoPlay muted playsInline />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isStreaming ? (
            <Button type="button" onClick={requestPermissionsAndStartStream}>
              <ScreenShare className="mr-2 h-5 w-5" /> Enable Screen Share & Preview
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={stopScreenShare}>
              <ScreenShareOff className="mr-2 h-5 w-5" /> Stop Screen Share
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
        </div>

        {recordedVideoUrl && (
          <div className="mt-6 space-y-4">
            <h3 className="text-md font-semibold flex items-center"><Film className="mr-2 h-5 w-5" /> Recorded Video Preview</h3>
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
                 <video ref={recordedVideoRef} src={recordedVideoUrl} controls className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleDownloadRecording} variant="outline">
                    <Download className="mr-2 h-5 w-5" /> Download Recording
                </Button>
                <Button type="button" onClick={handleUseRecording} variant="default">
                    Use this Recording (Placeholder)
                </Button>
            </div>
          </div>
        )}

         <p className="text-xs text-muted-foreground mt-4">
            Note: This feature uses your browser's built-in screen sharing and recording capabilities. The recorded video will be in WebM format.
          </p>
      </CardContent>
    </Card>
  );
}

