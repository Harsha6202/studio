
// src/components/tours/ScreenRecorder.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScreenShare, ScreenShareOff, AlertCircle, CircleDot, Square, Download, Film, UploadCloud, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/firebase/client';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '@/contexts/AuthContext';


export function ScreenRecorder() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null); // Blob URL for local preview
  const [screenSharePolicyError, setScreenSharePolicyError] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoStorageUrl, setUploadedVideoStorageUrl] = useState<string | null>(null); // URL from Firebase Storage

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const requestPermissionsAndStartStream = async () => {
    setHasPermission(null); 
    setScreenSharePolicyError(false); 
    setRecordedVideoUrl(null); 
    setRecordedChunks([]);
    setUploadedVideoStorageUrl(null);

    if (typeof navigator.mediaDevices?.getDisplayMedia !== 'function') {
        toast({
            variant: 'destructive',
            title: 'Screen Share Not Supported',
            description: 'Your browser does not support screen sharing, or it is not available in this context (e.g. insecure HTTP).',
        });
        setHasPermission(false);
        return;
    }

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
        setScreenSharePolicyError(true); 
        // The toast for this specific error is now handled by the Alert component directly in the UI.
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
    // Only show "Screen Share Stopped" if it was active and not due to a policy error initial denial.
    if (hasPermission && mediaStreamRef.current?.active === false && !screenSharePolicyError) { 
        // toast({ title: "Screen Share Stopped" }); // Can be a bit noisy, consider removing or making conditional
    }
  }, [isRecording, hasPermission, toast, screenSharePolicyError]); 
  
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
    setUploadedVideoStorageUrl(null); 
    
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
        mediaRecorderRef.current.onstop = () => {
             // This logic is now handled by the useEffect below to ensure it runs after state updates.
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
    if (!isRecording && recordedChunks.length > 0 && !recordedVideoUrl) { 
        const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url); 
    }
  }, [isRecording, recordedChunks, recordedVideoUrl]);

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
      toast({ title: "Recording Downloaded" });
    } else {
        toast({ title: "No Recording", description: "There is no recording to download.", variant: "destructive" });
    }
  };

  const handleUploadAndUseRecording = async () => {
    if (recordedChunks.length === 0) {
      toast({ title: "No Recording Data", description: "Record something first!", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to save recordings.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadedVideoStorageUrl(null); 
    toast({ title: "Uploading Recording...", description: "This may take a moment depending on video size and internet speed." });

    const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
    const fileExtension = blob.type.split('/')[1]?.split(';')[0] || 'webm'; 
    const fileName = `screen-recording-${user.uid}-${Date.now()}.${fileExtension}`;
    const sRef = storageRef(storage, `userRecordings/${user.uid}/${fileName}`);

    try {
      const snapshot = await uploadBytes(sRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadedVideoStorageUrl(downloadURL);
      toast({ title: "Upload Successful!", description: "Recording uploaded. You can copy the link below." });
    } catch (error: any) {
      console.error("Error uploading to Firebase Storage:", error);
      toast({ title: "Upload Failed", description: error.message || "Could not upload recording.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };


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
        {screenSharePolicyError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Screen Share Blocked by Environment Policy</AlertTitle>
            <AlertDescription>
              Screen sharing is disallowed by the current browser environment (e.g., due to iframe security policies in tools like Firebase Studio).
              This feature should work as expected when the app is deployed to its own domain (e.g., on Vercel).
            </AlertDescription>
          </Alert>
        )}
        {hasPermission === false && !screenSharePolicyError && !isStreaming && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Screen Share Permission Issue</AlertTitle>
            <AlertDescription>
              The Product Demo Platform needs access to your screen to record. You may have denied permission or another issue occurred.
              Please check browser permissions or the console for more details. Click "Enable Screen Share" again to retry.
            </AlertDescription>
          </Alert>
        )}

        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden relative">
          <video ref={videoPreviewRef} className="w-full h-full object-contain" autoPlay muted playsInline />
           {!isStreaming && hasPermission !== false && ( 
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground p-4 text-center">Screen share preview will appear here once enabled.</p>
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
                <Button type="button" onClick={handleDownloadRecording} variant="outline" disabled={isUploading}>
                    <Download className="mr-2 h-5 w-5" /> Download Recording
                </Button>
                <Button type="button" onClick={handleUploadAndUseRecording} variant="default" disabled={isUploading || !user}>
                     {isUploading ? (
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <UploadCloud className="mr-2 h-5 w-5" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload to Cloud & Get Link'}
                </Button>
            </div>
             {uploadedVideoStorageUrl && (
              <div className="mt-4 p-3 border border-primary/30 rounded-md bg-primary/10">
                  <Label htmlFor="uploadedVideoLink" className="font-semibold text-primary">Cloud Video Link:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                      <Input id="uploadedVideoLink" value={uploadedVideoStorageUrl} readOnly />
                      <Button type="button" size="icon" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(uploadedVideoStorageUrl);
                          toast({ title: "Link Copied!" });
                      }} aria-label="Copy cloud video link">
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Copy this link and paste it into a tour step's media URL field.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
