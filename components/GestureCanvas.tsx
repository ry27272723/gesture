import React, { useEffect, useRef, useState } from 'react';
import { gestureService } from '../services/gestureService';
import { effectService } from '../services/effectService';
import { Theme, GestureType, HandLandmark } from '../types';

interface GestureCanvasProps {
  theme: Theme;
  onGestureChange: (gesture: GestureType) => void;
}

const GestureCanvas: React.FC<GestureCanvasProps> = ({ theme, onGestureChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  
  const [loaded, setLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Force reset effects on mount
    effectService.setTheme(theme);
    
    // 1. Initialize MediaPipe & Camera
    const init = async () => {
      try {
        await gestureService.initialize();
        setLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Failed to init MediaPipe", err);
        setCameraError("Failed to load gesture model.");
      }
    };
    init();

    // Cleanup: stop animation loop and camera tracks
    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
       if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
       }
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Please allow camera access.");
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Resize canvas to match video
    if (canvasRef.current.width !== videoRef.current.videoWidth) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        effectService.resize(canvasRef.current.width, canvasRef.current.height);
    }

    const startTimeMs = performance.now();
    const result = gestureService.detect(videoRef.current, startTimeMs);
    const ctx = canvasRef.current.getContext('2d');

    if (result && result.landmarks && result.landmarks.length > 0 && ctx) {
      const landmarks = result.landmarks[0] as HandLandmark[]; // Detect first hand
      const gesture = gestureService.classifyGesture(landmarks);
      
      onGestureChange(gesture);

      // Get palm center or index tip for interaction point
      let interactionPoint = null;
      if (gesture === GestureType.OneFinger) {
         interactionPoint = landmarks[8]; // Index tip
      } else {
         interactionPoint = landmarks[9]; // Middle finger MCP (palm center approx)
      }

      // We need to mirror x because video is mirrored
      // Normalized coordinates: x (0-1), y(0-1)
      const visualPoint = interactionPoint ? {
          x: 1 - interactionPoint.x, // Mirror X
          y: interactionPoint.y
      } : null;

      effectService.update(ctx, gesture, visualPoint);
      
    } else if (ctx) {
       // No hand, just update particles
       onGestureChange(GestureType.None);
       effectService.update(ctx, GestureType.None, null);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
      {cameraError && (
         <div className="absolute z-50 text-red-500 bg-black/80 p-4 rounded border border-red-500">
            {cameraError}
         </div>
      )}
      {!loaded && !cameraError && (
          <div className="absolute z-50 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
            <div className="text-white font-mono tracking-widest text-sm animate-pulse">INITIALIZING VISION CORE...</div>
          </div>
      )}
      
      {/* Video is now fully opaque and colored for AR feel */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover opacity-100" 
        style={{ transform: 'scaleX(-1)' }} // Mirror locally
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(1)' }} // Canvas drawing is already logic-mirrored
      />
    </div>
  );
};

export default GestureCanvas;