
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
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"; // Already imported in firebase/client
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
    setHasPermission(null); // Reset permission state
    setScreenSharePolicyError(false); // Reset policy error state
    setRecordedVideoUrl(null); // Clear previous local recording preview
    setRecordedChunks([]);
    setUploadedVideoStorageUrl(null); // Clear previous cloud URL

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

      // Listen for when the user stops sharing via the browser's native UI
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
        setScreenSharePolicyError(true); // Set state to display persistent Alert
        // Toast is still useful for immediate feedback
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
    if (isRecording) { // If recording was active, stop it
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop(); // This will trigger ondataavailable and then onstop
      }
      setIsRecording(false); // Manually set recording state if not already
    }
    setIsStreaming(false);
    // Only show "stopped" toast if it was actually permitted and streaming
    if (hasPermission && mediaStreamRef.current?.active === false) { // Check if stream was active then stopped
        // toast({ title: "Screen Share Stopped" }); // This can be noisy if user stops via browser UI
    }
  }, [isRecording, hasPermission, toast]); // Added toast to dependencies
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
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
    setRecordedChunks([]); // Clear any previous chunks
    setRecordedVideoUrl(null); // Clear previous local recording preview
    setUploadedVideoStorageUrl(null); // Clear previous cloud URL
    
    // Try common MIME types, prioritizing webm with vp9/opus for good quality/compression
    const mimeTypes = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=vp8',
        'video/webm',
        'video/mp4', // Added for broader compatibility if browser supports
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
             // This ensures blob/URL creation happens after all data is collected
             if (recordedChunks.length > 0) { // Check if there are already chunks from ondataavailable
                const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedVideoUrl(url);
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

  // Create blob URL when recording stops and chunks are available
 useEffect(() => {
    if (!isRecording && recordedChunks.length > 0 && !recordedVideoUrl) { // Ensure it only runs once after stopping
        const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url); // This is the local blob URL for preview
    }
  }, [isRecording, recordedChunks, recordedVideoUrl]);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger ondataavailable, then onstop
    }
    setIsRecording(false); // Set state immediately
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
      // Don't revoke if still needed for upload or multiple downloads: URL.revokeObjectURL(recordedVideoUrl);
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
    setUploadedVideoStorageUrl(null); // Clear previous URL
    toast({ title: "Uploading Recording...", description: "Please wait." });

    const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
    const fileExtension = blob.type.split('/')[1]?.split(';')[0] || 'webm'; // Get 'webm' from 'video/webm; codecs=...'
    const fileName = `screen-recording-${user.uid}-${Date.now()}.${fileExtension}`;
    const sRef = storageRef(storage, `userRecordings/${user.uid}/${fileName}`);

    try {
      const snapshot = await uploadBytes(sRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadedVideoStorageUrl(downloadURL);
      toast({ title: "Upload Successful!", description: "Recording uploaded to the cloud." });
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
        {/* Persistent Alert for screenSharePolicyError */}
        {screenSharePolicyError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Screen Share Blocked by Policy</AlertTitle>
            <AlertDescription>
              Screen sharing is disallowed by the current environment (e.g., due to iframe security policies).
              This feature is expected to work when the app is deployed as a standalone website.
            </AlertDescription>
          </Alert>
        )}
        {/* Alert for general permission denial (if not policy error) */}
        {hasPermission === false && !screenSharePolicyError && !isStreaming && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Screen Share Permission Issue</AlertTitle>
            <AlertDescription>
              Product Demo Platform needs access to your screen to record. You may have denied permission or another issue occurred.
              Please check browser permissions or the console for more details.
            </AlertDescription>
          </Alert>
        )}

        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden relative">
          <video ref={videoPreviewRef} className="w-full h-full object-contain" autoPlay muted playsInline />
           {!isStreaming && hasPermission !== false && ( // Show placeholder if not streaming AND no explicit denial
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
                <Button type="button" onClick={handleDownloadRecording} variant="outline" disabled={isUploading}>
                    <Download className="mr-2 h-5 w-5" /> Download Recording
                </Button>
                <Button type="button" onClick={handleUploadAndUseRecording} variant="default" disabled={isUploading || !user}>
                     {isUploading ? (
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <UploadCloud className="mr-2 h-5 w-5" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload to Cloud'}
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
