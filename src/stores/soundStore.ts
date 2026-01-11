import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleEnabled: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume }),
      toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'chess-sound-settings',
    }
  )
);
