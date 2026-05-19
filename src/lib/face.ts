// Real facial-expression analysis from the webcam frame.
// Uses @vladmandic/face-api (TinyFaceDetector + FaceExpressionNet) entirely
// in the browser. Lazy-imported so it never touches the SSR bundle.

import { EXPRESSIONS, type Expression } from "@/lib/emotion";

type FaceApi = typeof import("@vladmandic/face-api");

let api: FaceApi | null = null;
let loadPromise: Promise<FaceApi> | null = null;

/** load the library + weights once; subsequent calls reuse the promise. */
export function loadFaceModels(): Promise<FaceApi> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faceapi = await import("@vladmandic/face-api");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    api = faceapi;
    return faceapi;
  })();
  return loadPromise;
}

/** face box, normalized 0..1 against the video frame */
export type FaceBox = { x: number; y: number; w: number; h: number };

export type Detection = {
  expression: Expression;
  /** probability of the chosen expression, 0..1 */
  confidence: number;
  /** rough arousal proxy 0..100 derived from the expression mix */
  arousal: number;
  /** where the face is, for the rPPG forehead ROI */
  box: FaceBox;
};

// face-api emits: neutral happy sad angry fearful disgusted surprised
const AROUSAL: Record<string, number> = {
  neutral: 25,
  happy: 45,
  sad: 55,
  surprised: 75,
  fearful: 88,
  disgusted: 80,
  angry: 92,
};

function mapExpression(label: string): Expression {
  switch (label) {
    case "happy":
      return EXPRESSIONS.happy;
    case "sad":
      return EXPRESSIONS.sad;
    case "neutral":
      return EXPRESSIONS.neutral;
    default: // angry | fearful | disgusted | surprised
      return EXPRESSIONS.tense;
  }
}

/** analyze one video frame; null if no face is found or models not ready. */
export async function detectExpression(
  video: HTMLVideoElement,
): Promise<Detection | null> {
  if (!api) return null;
  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const res = await api
    .detectSingleFace(video, new api.TinyFaceDetectorOptions({ inputSize: 224 }))
    .withFaceExpressions();
  if (!res) return null;

  const scores = res.expressions as unknown as Record<string, number>;
  let bestLabel = "neutral";
  let best = -1;
  let arousal = 0;
  for (const [label, p] of Object.entries(scores)) {
    arousal += (AROUSAL[label] ?? 30) * p;
    if (p > best) {
      best = p;
      bestLabel = label;
    }
  }

  const b = res.detection.box;
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;

  return {
    expression: mapExpression(bestLabel),
    confidence: best,
    arousal: Math.round(Math.max(0, Math.min(100, arousal))),
    box: {
      x: Math.max(0, Math.min(1, b.x / vw)),
      y: Math.max(0, Math.min(1, b.y / vh)),
      w: Math.max(0, Math.min(1, b.width / vw)),
      h: Math.max(0, Math.min(1, b.height / vh)),
    },
  };
}
