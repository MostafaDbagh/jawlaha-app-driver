import { w, h, r, sp, screenWidth } from './scale';

// Mirrors ResponsiveUtils (core/style/responsive_utils.dart)
export const Responsive = {
  mobileBreakpoint: 600,
  tabletBreakpoint: 900,
  desktopBreakpoint: 1200,

  // spacing
  padding: w(22),
  paddingLarge: w(32),
  paddingSmall: w(16),
  paddingTiny: w(8),

  // margins
  margin: w(24),
  marginLarge: w(40),
  marginSmall: w(16),

  // gaps
  gap: h(16),
  gapLarge: h(24),
  gapSmall: h(12),
  gapMedium: h(14),
  gapTiny: h(8),

  // text sizes
  textSmall: sp(12),
  textMedium: sp(14),
  textLarge: sp(16),
  textXLarge: sp(18),
  textXXLarge: sp(20),

  // icon sizes
  iconSmall: r(16),
  iconMedium: r(24),
  iconLarge: r(32),
  iconXLarge: r(48),

  // cards
  cardHeight: h(120),
  cardWidth: w(165),

  // images
  profileImageSize: w(120),
  logoHeight: h(100),
  logoWidth: w(100),
  logoSquare: r(200),

  // buttons
  buttonHeight: h(48),

  // inputs
  inputHeight: h(50),
  inputPadding: w(16),

  // border radius
  borderRadiusSmall: r(8),
  borderRadiusMedium: r(12),
  borderRadiusLarge: r(16),
  borderRadiusTiny: r(4),

  // Horizontal page padding based on screen width
  getResponsivePadding(): { paddingHorizontal: number } {
    if (screenWidth < this.mobileBreakpoint) {
      return { paddingHorizontal: this.paddingSmall };
    } else if (screenWidth < this.tabletBreakpoint) {
      return { paddingHorizontal: this.padding };
    }
    return { paddingHorizontal: this.paddingLarge };
  },

  getResponsiveGridCrossAxisCount(): number {
    if (screenWidth < this.mobileBreakpoint) return 2;
    if (screenWidth < this.tabletBreakpoint) return 3;
    if (screenWidth < this.desktopBreakpoint) return 4;
    return 5;
  },

  // Get responsive icon size
  getResponsiveIconSize(): number {
    if (screenWidth < this.mobileBreakpoint) return this.iconSmall;
    if (screenWidth < this.tabletBreakpoint) return this.iconMedium;
    return this.iconLarge;
  },

  // Get responsive font size
  getResponsiveFontSize(
    opts: { small?: number; medium?: number; large?: number; scale?: number } = {}
  ): number {
    let baseSize: number;
    if (screenWidth < this.mobileBreakpoint) {
      baseSize = opts.small ?? this.textMedium;
    } else if (screenWidth < this.tabletBreakpoint) {
      baseSize = opts.medium ?? this.textLarge;
    } else {
      baseSize = opts.large ?? this.textXLarge;
    }
    if (opts.scale != null) return baseSize * opts.scale;
    return baseSize;
  },
} as const;
