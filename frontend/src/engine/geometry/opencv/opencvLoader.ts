export type OpenCVLoadState = 'idle' | 'loading' | 'ready' | 'failed';

export interface OpenCVModule {
  Mat: new (...args: unknown[]) => OpenCVMat;
  matFromImageData(imageData: ImageData): OpenCVMat;
  cvtColor(src: OpenCVMat, dst: OpenCVMat, code: number): void;
  threshold(src: OpenCVMat, dst: OpenCVMat, thresh: number, maxval: number, type: number): void;
  GaussianBlur(src: OpenCVMat, dst: OpenCVMat, ksize: OpenCVSize, sigmaX: number): void;
  findContours(
    image: OpenCVMat,
    contours: OpenCVMatVector,
    hierarchy: OpenCVMat,
    mode: number,
    method: number
  ): void;
  approxPolyDP(curve: OpenCVMat, approx: OpenCVMat, epsilon: number, closed: boolean): void;
  arcLength(curve: OpenCVMat, closed: boolean): number;
  contourArea(contour: OpenCVMat): number;
  minEnclosingCircle(contour: OpenCVMat): { center: { x: number; y: number }; radius: number };
  minAreaRect(contour: OpenCVMat): {
    center: { x: number; y: number };
    size: { width: number; height: number };
    angle: number;
  };
  HoughLinesP(
    image: OpenCVMat,
    lines: OpenCVMat,
    rho: number,
    theta: number,
    threshold: number,
    minLineLength: number,
    maxLineGap: number
  ): void;
  HoughCircles(
    image: OpenCVMat,
    circles: OpenCVMat,
    method: number,
    dp: number,
    minDist: number,
    param1: number,
    param2: number,
    minRadius: number,
    maxRadius: number
  ): void;
  matFromArray(rows: number, cols: number, type: number, array: number[]): OpenCVMat;
  imread(canvas: HTMLCanvasElement): OpenCVMat;
  COLOR_RGBA2GRAY: number;
  THRESH_BINARY: number;
  THRESH_BINARY_INV: number;
  RETR_EXTERNAL: number;
  RETR_LIST: number;
  CHAIN_APPROX_SIMPLE: number;
  HOUGH_GRADIENT: number;
  CV_32FC2: number;
  CV_8UC1: number;
  MatVector: new () => OpenCVMatVector;
}

export interface OpenCVMat {
  rows: number;
  cols: number;
  delete(): void;
  data32S?: Int32Array;
  data32F?: Float32Array;
  intPtr(row: number, col: number): number;
  floatPtr(row: number, col: number): number;
}

export interface OpenCVMatVector {
  size(): number;
  get(index: number): OpenCVMat;
  delete(): void;
}

interface OpenCVSize {
  width: number;
  height: number;
}

let loadState: OpenCVLoadState = 'idle';
let loadError: string | null = null;
let cvInstance: OpenCVModule | null = null;
let cvPromise: Promise<OpenCVModule | null> | null = null;

export function getOpenCVLoadState(): OpenCVLoadState {
  return loadState;
}

export function getOpenCVLoadError(): string | null {
  return loadError;
}

export function isOpenCVReady(): boolean {
  return loadState === 'ready' && cvInstance !== null;
}

async function waitForMatFactory(cv: OpenCVModule, timeoutMs = 30_000): Promise<void> {
  const started = Date.now();
  while (typeof cv.Mat !== 'function') {
    if (Date.now() - started > timeoutMs) {
      throw new Error('OpenCV.js initialization timed out after 30s');
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
}

/**
 * @techstark/opencv-js v5+ default export is a Promise — await it directly.
 * Do not assign onRuntimeInitialized (ESM namespace is read-only).
 */
async function resolveOpenCVModule(): Promise<OpenCVModule> {
  const module = await import('@techstark/opencv-js');
  let cvModule: unknown = module.default ?? module;

  if (cvModule instanceof Promise) {
    cvModule = await cvModule;
  }

  const cv = cvModule as OpenCVModule;
  if (typeof cv.Mat !== 'function') {
    await waitForMatFactory(cv);
  }

  return cv;
}

export async function loadOpenCV(): Promise<OpenCVModule | null> {
  if (cvInstance) return cvInstance;
  if (cvPromise) return cvPromise;

  loadState = 'loading';
  loadError = null;

  cvPromise = (async () => {
    try {
      cvInstance = await resolveOpenCVModule();
      loadState = 'ready';
      return cvInstance;
    } catch (error) {
      loadState = 'failed';
      loadError = error instanceof Error ? error.message : 'OpenCV.js failed to load';
      if (import.meta.env.DEV) {
        console.warn('[OpenCV] Initialization failed:', loadError);
      }
      return null;
    }
  })();

  return cvPromise;
}

export function getOpenCV(): OpenCVModule | null {
  return cvInstance;
}
