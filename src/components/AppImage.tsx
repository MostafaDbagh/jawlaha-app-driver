// Ported from core/widgets/images/general_image_assets.dart (GeneralImageAssets)
import React from 'react';
import { StyleProp } from 'react-native';
import { Image, ImageContentFit, ImageStyle, ImageSource } from 'expo-image';

type Source = ImageSource | number | string | { uri: string } | null | undefined;

interface AppImageProps {
  /** require(...) module, a remote url string, or { uri } */
  source: Source;
  width?: number;
  height?: number;
  /** tint color (Flutter `color` / ColorFilter) */
  color?: string;
  contentFit?: ImageContentFit; // 'cover' (default) | 'contain' | ...
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

export function AppImage({
  source,
  width = 50,
  height = 50,
  color,
  contentFit = 'cover',
  style,
  borderRadius,
}: AppImageProps) {
  const resolved: any =
    typeof source === 'string' ? { uri: source } : source ?? undefined;

  return (
    <Image
      source={resolved}
      style={[{ width, height, borderRadius }, style]}
      contentFit={contentFit}
      tintColor={color}
      transition={0}
    />
  );
}

export default AppImage;
