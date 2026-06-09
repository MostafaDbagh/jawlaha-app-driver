// Ported from core/widgets/text/base_text.dart (BaseText)
import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { AppColors, sp } from '@/theme';
import { quicksand, localizeFontFamily } from '@/theme/typography';
import { useI18n } from '@/i18n';

interface BaseTextProps {
  title?: string | null;
  size?: number;
  color?: string;
  textAlign?: TextStyle['textAlign'];
  decoration?: 'underline' | 'line-through' | 'none';
  fontWeight?: TextStyle['fontWeight'];
  maxLines?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function BaseText({
  title,
  size,
  color,
  textAlign,
  decoration,
  fontWeight,
  maxLines,
  style,
  numberOfLines,
}: BaseTextProps) {
  // Subscribe to the language so the font family re-resolves when it changes
  // (the app switches language in-place — no reload).
  const { lang } = useI18n();

  const base: TextStyle = {
    fontSize: size ?? sp(14),
    // Quicksand bakes the weight into the family name; pick the matching family.
    // Defaults to regular when no weight is given (quicksand(undefined) -> regular).
    fontFamily: quicksand(fontWeight),
    color: color ?? AppColors.textColor,
    textAlign,
    textDecorationLine: decoration,
  };
  // Only clamp (and show the trailing "…") when a caller explicitly asks for a
  // line limit — otherwise text is shown in full and wraps as needed.
  const lineLimit = numberOfLines ?? maxLines;
  // When an explicit fontWeight is passed it must win over any fontFamily that
  // `style` carries (e.g. a TextStyles preset), so the requested weight isn't
  // silently dropped — keeps the family/weight consistent across the app.
  const weightFamily =
    fontWeight != null ? { fontFamily: quicksand(fontWeight) } : null;
  // Flatten so we know the winning Quicksand family, then remap it to the locale
  // font (Tajawal for Arabic). This covers every caller — inline or StyleSheet —
  // without touching their call sites.
  const flat = StyleSheet.flatten([base, style, weightFamily]) as TextStyle;
  const fontFamily = localizeFontFamily(flat.fontFamily as string | undefined, lang);
  return (
    <Text
      numberOfLines={lineLimit}
      ellipsizeMode={lineLimit != null ? 'tail' : undefined}
      style={[flat, { fontFamily }]}
    >
      {title ?? ''}
    </Text>
  );
}

export default BaseText;
