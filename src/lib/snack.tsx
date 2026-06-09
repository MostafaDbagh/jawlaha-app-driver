// Lightweight global snackbar — replaces GetX showSnackBarMessage / Get.snackbar
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, sp, r } from '@/theme';
import { BaseText } from '@/components/BaseText';

type SnackKind = 'info' | 'success' | 'error';

let externalShow: ((message: string, kind?: SnackKind) => void) | null = null;

/** Call from anywhere (mirrors Flutter showSnackBarMessage). */
export function showSnack(message: string, kind: SnackKind = 'info') {
  externalShow?.(message, kind);
}

interface SnackState {
  message: string;
  kind: SnackKind;
  visible: boolean;
}

const SnackCtx = createContext<((m: string, k?: SnackKind) => void) | null>(null);

export function SnackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<SnackState>({ message: '', kind: 'info', visible: false });
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: SnackKind = 'info') => {
      setState({ message, kind, visible: true });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
          () => setState((s) => ({ ...s, visible: false })),
        );
      }, 2800);
    },
    [opacity],
  );

  React.useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
    };
  }, [show]);

  const bg =
    state.kind === 'error'
      ? AppColors.red
      : state.kind === 'success'
        ? AppColors.green
        : AppColors.primaryColorTheme;

  return (
    <SnackCtx.Provider value={show}>
      {children}
      {state.visible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { bottom: insets.bottom + 24, opacity }]}
        >
          <View style={[styles.toast, { backgroundColor: bg }]}>
            <BaseText title={state.message} color={AppColors.white} size={sp(14)} maxLines={4} />
          </View>
        </Animated.View>
      )}
    </SnackCtx.Provider>
  );
}

export function useSnack() {
  const ctx = useContext(SnackCtx);
  return ctx ?? showSnack;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: r(10), maxWidth: '100%' },
});
