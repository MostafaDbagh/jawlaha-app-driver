// Safe back navigation. Calling router.back() with an empty history (e.g. on a
// tab root, a deep-linked screen, or after a replace) throws
// "The action 'GO_BACK' was not handled by any navigator". This guards that.
import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

export function goBack(router: Router, fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
