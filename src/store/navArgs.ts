// Transient navigation arguments — mirrors GetX `Get.arguments` / `Get.to(arguments:)`.
// Set args before router.push, then read them on the target screen.
import { create } from 'zustand';

interface NavArgsState {
  args: Record<string, any>;
  setArgs: (args: Record<string, any>) => void;
  clearArgs: () => void;
}

export const useNavArgs = create<NavArgsState>((set) => ({
  args: {},
  setArgs: (args) => set({ args }),
  clearArgs: () => set({ args: {} }),
}));

/** Imperative helpers (call outside React). */
export const navArgs = {
  set: (args: Record<string, any>) => useNavArgs.getState().setArgs(args),
  get: () => useNavArgs.getState().args,
  clear: () => useNavArgs.getState().clearArgs(),
};
