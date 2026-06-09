import { Dimensions, PixelRatio } from 'react-native';

// Mirrors flutter_screenutil designSize: Size(393, 852)
export const GUIDELINE_BASE_WIDTH = 393;
export const GUIDELINE_BASE_HEIGHT = 852;

const { width, height } = Dimensions.get('window');
// Use the shorter/longer side consistently regardless of orientation (app is portrait-locked).
const shortDim = Math.min(width, height);
const longDim = Math.max(width, height);

/** width-based scale — flutter_screenutil `.w` */
export const w = (size: number): number =>
  (shortDim / GUIDELINE_BASE_WIDTH) * size;

/** height-based scale — flutter_screenutil `.h` */
export const h = (size: number): number =>
  (longDim / GUIDELINE_BASE_HEIGHT) * size;

/** radius-based scale — flutter_screenutil `.r` (uses min of w/h factor) */
export const r = (size: number): number =>
  Math.min(w(size), h(size));

/** font scale — flutter_screenutil `.sp` (width-based, rounded to pixel grid) */
export const sp = (size: number): number => {
  const scaled = w(size);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const screenWidth = width;
export const screenHeight = height;
