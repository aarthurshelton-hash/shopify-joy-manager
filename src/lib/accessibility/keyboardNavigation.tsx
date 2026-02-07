/**
 * Keyboard Navigation Utilities
 * 
 * Comprehensive keyboard navigation support for accessibility
 * and power user workflows.
 * 
 * @module keyboardNavigation
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import React from 'react';

export interface KeyboardShortcut {
  key: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 * 
 * @example
 * ```typescript
 * useKeyboardShortcuts([
 *   { key: 'k', modifier: 'ctrl', action: () => openSearch(), description: 'Open search' },
 *   { key: 'Escape', action: () => closeModal(), description: 'Close modal' }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        
        let modifierMatch = true;
        if (shortcut.modifier) {
          const modifiers: Record<string, boolean> = {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey,
          };
          modifierMatch = modifiers[shortcut.modifier];
        }

        if (keyMatch && modifierMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

/**
 * Hook for focus management within a container
 * Supports Tab, Shift+Tab, Escape, and arrow key navigation
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    onEscape?: () => void;
  } = {}
) {
  const { enabled = true, onEscape } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!container.contains(document.activeElement)) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      switch (event.key) {
        case 'Tab':
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
          break;
          
        case 'Escape':
          onEscape?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape]);
}

/**
 * Navigate with arrow keys within a list
 */
export function useArrowKeyNavigation<T extends HTMLElement>(
  items: unknown[],
  onSelect: (index: number) => void
) {
  const containerRef = useRef<T>(null);
  const [focusedIndex, setFocusedIndex] = useKeyboardNavigationState(0, items.length);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(i => Math.min(i + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          onSelect(focusedIndex);
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [items.length, focusedIndex, onSelect]);

  return { containerRef, focusedIndex };
}

/**
 * State hook for keyboard navigation
 */
function useKeyboardNavigationState(maxIndex: number, itemCount: number) {
  const [index, setIndex] = useState(0);
  
  const setIndexClamped = useCallback((newIndex: number | ((prev: number) => number)) => {
    setIndex(prev => {
      const resolved = typeof newIndex === 'function' ? newIndex(prev) : newIndex;
      return Math.max(0, Math.min(resolved, itemCount - 1));
    });
  }, [itemCount]);

  return [index, setIndexClamped] as const;
}

/**
 * Skip to content link for accessibility
 */
export function SkipToContent({ contentId }: { contentId: string }) {
  return (
    <a
      href={`#${contentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground"
    >
      Skip to main content
    </a>
  );
}

/**
 * Announces changes to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus visible utility - only show focus ring on keyboard navigation
 */
export const focusVisibleClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
