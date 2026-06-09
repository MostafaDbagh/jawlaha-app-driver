export { AppColors } from './colors';
export type { AppColorKey } from './colors';
export { w, h, r, sp, screenWidth, screenHeight } from './scale';
export { Fonts, TextStyles } from './typography';

// Shared layout constants mirrored from Constant (core/constant.dart) + app_theme.dart
export const Radii = {
  textField: 12,
  card: 10,
  button: 10,
} as const;

export const Borders = {
  textFieldWidth: 1,
} as const;
