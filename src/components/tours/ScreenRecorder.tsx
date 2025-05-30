
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
  const [screenSharePolicyError, setScreenSharePolicyError] = useState(false); // New state for specific policy error
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const requestPermissionsAndStartStream = async () => {
    setHasPermission(null); // Reset permission state
    setScreenSharePolicyError(false); // Reset policy error state on new attempt
    setRecordedVideoUrl(null); 
    setRecordedChunks([]);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsStreaming(true);
      toast({ title: "Screen Share Started", description: "Live preview active. Select a window/tab to record." });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error: any) {
      console.error('Error accessing screen share:', error);
      setHasPermission(false);
      setIsStreaming(false);

      if (error.name === 'NotAllowedError') {
         toast({
          variant: 'destructive',
          title: 'Screen Share Access Denied',
          description: 'You denied permission for screen sharing. Please enable it if you want to use this feature.',
        });
      } else if (error.message && (error.message.toLowerCase().includes("disallowed by permissions policy") || error.message.toLowerCase().includes("display-capture"))) {
        setScreenSharePolicyError(true); // Set specific policy error state
        toast({
          variant: 'destructive',
          title: 'Screen Share Blocked by Policy',
          description: 'Screen sharing is disallowed by the current environment (e.g., iframe policy). This feature should work in a standalone deployment.',
          duration: 10000,
        });
      }
      else {
        toast({
          variant: 'destructive',
          title: 'Screen Share Error',
          description: error.message || 'Could not start screen sharing. Please check browser permissions.',
        });
      }
    }
  };

  const stopScreenShare = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    if (isRecording) { 
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
    setIsStreaming(false);
    if (hasPermission) { 
        toast({ title: "Screen Share Stopped" });
    }
  }, [isRecording, hasPermission, toast]); 
  
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
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
    
    const mimeTypes = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=vp8',
        'video/webm',
        'video/mp4',
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            break;
        }
    }

    if (!selectedMimeType) {
        toast({ title: "Recording Error", description: "No supported video MIME type found for recording.", variant: "destructive" });
        return;
    }

    try {
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType: selectedMimeType });
        mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
        }
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Screen Recording Started" });
    } catch (e: any) {
        console.error("MediaRecorder error: ", e);
        toast({ title: "Recording Failed", description: e.message || "Could not start MediaRecorder.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
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
      const extension = (mediaRecorderRef.current?.mimeType?.includes('mp4')) ? 'mp4' : 'webm';
      a.download = `screen-recording-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(recordedVideoUrl); 
      toast({ title: "Recording Downloaded" });
    } else {
        toast({ title: "No Recording", description: "There is no recording to download.", variant: "destructive" });
    }
  };

  const handleUseRecording = () => {
    if (recordedVideoUrl) {
      toast({ title: "Use Recording (Placeholder)", description: "This will eventually upload and link the recording to a tour step."});
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
          Capture your product workflow. Start by enabling screen share access. Recordings are in WebM format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPermission === false && !isStreaming && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {screenSharePolicyError ? "Screen Share Blocked by Policy" : "Screen Share Permission Issue"}
            </AlertTitle>
            <AlertDescription>
              {screenSharePolicyError 
                ? "Screen sharing is disallowed by the current environment (e.g., due to iframe security policies). This feature is expected to work when the app is deployed as a standalone website."
                : "StoryFlow needs access to your screen to record. You may have denied permission or another issue occurred. Please check browser permissions or the console."
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden relative">
          <video ref={videoPreviewRef} className="w-full h-full object-contain" autoPlay muted playsInline />
           {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground p-4 text-center">Screen share preview will appear here.</p>
            </div>
          )}
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
      </CardContent>
    </Card>
  );
}
