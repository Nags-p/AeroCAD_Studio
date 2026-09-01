'use client';

import { useEffect } from 'react';

export function DevToolsGuard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 2. Ctrl+Shift+I / Cmd+Option+I (Inspect Elements / DevTools)
      // 3. Ctrl+Shift+J / Cmd+Option+J (Console)
      // 4. Ctrl+Shift+C / Cmd+Option+C (Inspect Element selection)
      // 5. Ctrl+Shift+K (Firefox Web Console)
      if (isCtrlOrCmd && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'I' || key === 'J' || key === 'C' || key === 'K') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // 6. Ctrl+U / Cmd+U (View Page Source)
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 7. Ctrl+S / Cmd+S (Save Page HTML)
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        // Prevent default save page in browser
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent right-click context menu inspection
    const handleContextMenu = (e: MouseEvent) => {
      // Check if target is an editable input or textarea where text selection is needed
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return; // Allow typing edits
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  return null;
}
