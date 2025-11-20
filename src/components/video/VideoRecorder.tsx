"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Camera,
  X,
} from "lucide-react";

interface VideoRecorderProps {
  estimateId: string;
  onVideoSaved?: (videoUrl: string) => void;
}

export default function VideoRecorder({ estimateId, onVideoSaved }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Back camera on mobile
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorderRef.current = mediaRecorder;
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setRecordedChunks([blob]);
      stopCamera();
    };

    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setRecordedChunks([]);
    setRecordingTime(0);
    startCamera();
  };

  // Download recording
  const downloadRecording = () => {
    if (!videoUrl) return;

    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `estimate-${estimateId}-video.webm`;
    a.click();
  };

  // Upload to server
  const uploadVideo = async () => {
    if (recordedChunks.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      formData.append("video", videoBlob, `estimate-${estimateId}-video.webm`);
      formData.append("estimateId", estimateId);

      const response = await fetch(`/api/estimates/${estimateId}/videos`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Video uploaded successfully!");
        if (onVideoSaved) {
          onVideoSaved(data.videoUrl);
        }
      } else {
        alert(`Failed to upload video: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Walkthrough
          </span>
          <span className="text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            🚀 EXCLUSIVE FEATURE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview/Playback */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!videoUrl}
            src={videoUrl || undefined}
            controls={!!videoUrl}
            className="w-full h-full object-contain"
          />

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Paused indicator */}
          {isPaused && (
            <div className="absolute top-4 left-4 bg-yellow-600 text-white px-3 py-1 rounded-full">
              <span className="font-bold">PAUSED</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isRecording && !videoUrl && (
            <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
              <Camera className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button onClick={togglePause} variant="outline">
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            </>
          )}

          {videoUrl && (
            <>
              <Button onClick={deleteRecording} variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button onClick={downloadRecording} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={uploadVideo}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Save to Estimate
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="font-semibold mb-2">📹 How to use:</p>
          <ul className="space-y-1 ml-4">
            <li>• Click "Start Recording" to begin recording your walkthrough</li>
            <li>• Point camera at damage and explain what you see</li>
            <li>• Keep videos under 60 seconds for best results</li>
            <li>• Click "Stop Recording" when done</li>
            <li>• Review, then "Save to Estimate" to attach to customer's estimate</li>
          </ul>
        </div>

        {/* Stats */}
        {videoUrl && (
          <div className="text-sm text-gray-600">
            <p>
              <strong>Recording Length:</strong> {formatTime(recordingTime)}
            </p>
            <p>
              <strong>File Size:</strong>{" "}
              {(recordedChunks[0]?.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
