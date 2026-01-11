import { useEffect, useCallback } from 'react';
import { useSoundStore } from '@/stores/soundStore';
import { toast } from 'sonner';

interface KeyboardShortcutsOptions {
  onResign?: () => void;
  onOfferDraw?: () => void;
  onBackToLobby?: () => void;
  isGameActive?: boolean;
  isMyTurn?: boolean;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const { onResign, onOfferDraw, onBackToLobby, isGameActive, isMyTurn } = options;
  const { toggleEnabled, enabled } = useSoundStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();

    switch (key) {
      // M - Toggle mute
      case 'm':
        toggleEnabled();
        toast.info(enabled ? 'Sound muted' : 'Sound unmuted', {
          duration: 1500,
          icon: enabled ? '🔇' : '🔊',
        });
        break;

      // R - Resign (only during active game)
      case 'r':
        if (isGameActive && onResign) {
          e.preventDefault();
          onResign();
        }
        break;

      // D - Offer draw (only during active game and my turn)
      case 'd':
        if (isGameActive && isMyTurn && onOfferDraw) {
          e.preventDefault();
          onOfferDraw();
        }
        break;

      // Escape - Back to lobby
      case 'escape':
        if (onBackToLobby) {
          e.preventDefault();
          onBackToLobby();
        }
        break;

      // ? or / - Show shortcuts help
      case '?':
      case '/':
        if (!e.shiftKey || key === '?') {
          e.preventDefault();
          showShortcutsHelp();
        }
        break;
    }
  }, [toggleEnabled, enabled, onResign, onOfferDraw, onBackToLobby, isGameActive, isMyTurn]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

const showShortcutsHelp = () => {
  toast.info(
    'Shortcuts: M=Mute, R=Resign, D=Draw, Esc=Lobby, ?=Help',
    { duration: 4000 }
  );
};

export const KEYBOARD_SHORTCUTS = [
  { key: 'M', action: 'Toggle sound on/off' },
  { key: 'R', action: 'Resign game (during play)' },
  { key: 'D', action: 'Offer draw (your turn)' },
  { key: 'Esc', action: 'Return to lobby' },
  { key: '?', action: 'Show keyboard shortcuts' },
];
