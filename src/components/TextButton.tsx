// Ported from core/widgets/button/custom_text_button.dart (CustomTextButton)
import React from 'react';
import { Pressable, TextStyle, StyleProp, ViewStyle } from 'react-native';
import { AppColors, sp } from '@/theme';
import { BaseText } from './BaseText';

interface TextButtonProps {
  title: string;
  onPress?: () => void;
  color?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export function TextButton({
  title,
  onPress,
  color,
  fontSize = 16,
  fontWeight = '300',
  textStyle,
  style,
}: TextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, style]}
    >
      <BaseText
        title={title}
        color={color ?? AppColors.secondMainColor}
        size={fontSize === 16 ? sp(14) : fontSize}
        fontWeight={fontWeight}
        style={textStyle}
      />
    </Pressable>
  );
}

export default TextButton;
