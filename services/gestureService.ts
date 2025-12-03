import { FilesetResolver, HandLandmarker, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm";
import { GestureType, HandLandmark } from '../types';

export class GestureService {
  private handLandmarker: HandLandmarker | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";

  async initialize() {
    // Prevent re-initialization if already loaded
    if (this.handLandmarker) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: this.runningMode,
      numHands: 2
    });
  }

  detect(video: HTMLVideoElement, timestamp: number) {
    if (!this.handLandmarker) return null;
    return this.handLandmarker.detectForVideo(video, timestamp);
  }

  classifyGesture(landmarks: HandLandmark[]): GestureType {
    // 0: Wrist
    // 4: Thumb Tip
    // 8: Index Tip, 6: Index PIP
    // 12: Middle Tip, 10: Middle PIP
    // 16: Ring Tip, 14: Ring PIP
    // 20: Pinky Tip, 18: Pinky PIP
    
    const isFingerExtended = (tipIdx: number, pipIdx: number) => {
      // Simple y-axis check (works best when hand is upright)
      // Note: Coordinates are normalized 0-1. 0 is top.
      return landmarks[tipIdx].y < landmarks[pipIdx].y;
    };

    const indexExt = isFingerExtended(8, 6);
    const middleExt = isFingerExtended(12, 10);
    const ringExt = isFingerExtended(16, 14);
    const pinkyExt = isFingerExtended(20, 18);
    
    const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

    if (extendedCount === 4) return GestureType.OpenPalm;
    if (extendedCount === 0) return GestureType.ClosedFist;
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return GestureType.OneFinger;

    if (extendedCount === 1 && !indexExt) return GestureType.None; 
    if (extendedCount >= 3) return GestureType.OpenPalm; 

    return GestureType.None;
  }
}

export const gestureService = new GestureService();