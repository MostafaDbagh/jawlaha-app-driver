// Generic loading/error/empty wrapper — replaces StateBodyWidget pattern + states.
import React from 'react';
import { View, ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { AppColors, sp } from '@/theme';
import { t } from '@/i18n';
import { BaseText } from './BaseText';

interface StateBodyProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
  children?: React.ReactNode;
}

export function StateBody({
  loading,
  error,
  empty,
  emptyText,
  onRefresh,
  refreshing,
  scroll = true,
  children,
}: StateBodyProps) {
  let body: React.ReactNode;
  if (loading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primaryColorTheme} size="large" />
      </View>
    );
  } else if (error) {
    body = (
      <View style={styles.center}>
        <BaseText title={error} color={AppColors.red} size={sp(14)} textAlign="center" />
      </View>
    );
  } else if (empty) {
    body = (
      <View style={styles.center}>
        <BaseText
          title={emptyText ?? t('no_data')}
          color={AppColors.hintColor}
          size={sp(14)}
          textAlign="center"
        />
      </View>
    );
  } else {
    body = children;
  }

  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={AppColors.primaryColorTheme} />
          ) : undefined
        }
      >
        {body}
      </ScrollView>
    );
  }
  return <View style={{ flex: 1 }}>{body}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

export default StateBody;
