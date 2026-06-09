// Ported from core/widgets/bars/sub_app_bar.dart (SubAppBar)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, r, sp } from '@/theme';
import { useI18n } from '@/i18n';
import { BaseText } from './BaseText';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  needLeading?: boolean;
  actions?: React.ReactNode;
  arrowColor?: string;
  onTitlePress?: () => void;
}

export function AppBar({
  title,
  onBack,
  needLeading = true,
  actions,
  arrowColor,
  onTitlePress,
}: AppBarProps) {
  const router = useRouter();
  const { isRTL } = useI18n();
  const backIcon = isRTL ? 'arrow-forward' : 'arrow-back';

  return (
    <View style={styles.bar}>
      {needLeading ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          style={styles.leading}
        >
          <Ionicons
            name={backIcon as any}
            size={r(25)}
            color={arrowColor ?? AppColors.textColorTheme}
          />
        </Pressable>
      ) : (
        <View style={{ width: 25 }} />
      )}
      <Pressable onPress={onTitlePress} style={styles.titleWrap}>
        <BaseText title={title} size={sp(16)} color={AppColors.textColorTheme} />
      </Pressable>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  leading: { padding: 4 },
  titleWrap: { flex: 1, marginHorizontal: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});

export default AppBar;
