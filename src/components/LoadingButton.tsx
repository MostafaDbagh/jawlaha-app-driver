// Ported from core/widgets/button/buttons/loading_button.dart (LoadingButton)
// + custom_elevated_button.dart (CustomElevatedButton)
import React from 'react';
import {
  Pressable,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AppColors } from '@/theme';
import { Responsive } from '@/theme/responsive';

interface LoadingButtonProps {
  loading?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  height?: number;
  width?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  style?: StyleProp<ViewStyle>;
}

export function LoadingButton({
  loading = false,
  onPress,
  children,
  height,
  width,
  color,
  borderColor = 'transparent',
  borderWidth = 1,
  borderRadius = 8,
  padding,
  margin,
  style,
}: LoadingButtonProps) {
  const h = height ?? Responsive.buttonHeight;
  const radius =
    borderRadius === 8 ? Responsive.borderRadiusMedium : borderRadius;
  const bg = color ?? AppColors.primaryColorTheme;

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          height: h,
          width: width ?? '100%',
          margin,
          padding,
          backgroundColor: bg,
          borderRadius: radius,
          borderColor,
          borderWidth,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.7 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={AppColors.white} /> : children}
    </Pressable>
  );
}

export default LoadingButton;
