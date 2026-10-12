import { useState, useRef, useEffect, useCallback } from 'react';

// Global stack of active floating window elements to manage z-index elevation (OB-127)
const activeWindows: HTMLElement[] = [];
export const BASE_WINDOW_Z_INDEX = 50;

/**
 * Elevates the given window element to the top of the floating window z-index stack.
 * All registered windows have their z-index updated sequentially starting from BASE_WINDOW_Z_INDEX.
 */
export function bringWindowToFront(element: HTMLElement | null): number {
  if (!element) return BASE_WINDOW_Z_INDEX;
  const index = activeWindows.indexOf(element);
  if (index !== -1) {
    activeWindows.splice(index, 1);
  }
  activeWindows.push(element);
  activeWindows.forEach((win, idx) => {
    if (win?.style) {
      win.style.zIndex = String(BASE_WINDOW_Z_INDEX + idx);
    }
  });
  return BASE_WINDOW_Z_INDEX + activeWindows.length - 1;
}

/**
 * Unregisters a window element from the global z-index stack.
 */
export function unregisterWindow(element: HTMLElement | null): void {
  if (!element) return;
  const index = activeWindows.indexOf(element);
  if (index !== -1) {
    activeWindows.splice(index, 1);
  }
}

/**
 * Returns a copy of the active window stack (useful for testing).
 */
export function getActiveWindowStack(): HTMLElement[] {
  return [...activeWindows];
}

/**
 * Resets the active window stack (useful for testing).
 */
export function clearActiveWindows(): void {
  activeWindows.length = 0;
}

export interface UseDraggableOptions {
  initialX?: number;
  initialY?: number;
  storageKey?: string;
  defaultZIndex?: number;
  initialWidth?: number;
  initialHeight?: number;
  sizeStorageKey?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function useDraggableWindow(options: UseDraggableOptions = {}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (options.storageKey && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(options.storageKey);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    if (options.initialX !== undefined && options.initialY !== undefined) {
      return { x: options.initialX, y: options.initialY };
    }
    return null;
  });

  const [size, setSize] = useState<{ width: number; height: number } | null>(() => {
    const key = options.sizeStorageKey || (options.storageKey ? `${options.storageKey}_size` : undefined);
    if (key && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    if (options.initialWidth !== undefined && options.initialHeight !== undefined) {
      return { width: options.initialWidth, height: options.initialHeight };
    }
    return null;
  });

  const [zIndex, setZIndex] = useState<number>(options.defaultZIndex ?? BASE_WINDOW_Z_INDEX);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startWidth: number; startHeight: number } | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);

  const bringToFront = useCallback(() => {
    if (windowRef.current) {
      const topZ = bringWindowToFront(windowRef.current);
      setZIndex(topZ);
      return topZ;
    }
    return zIndex;
  }, [zIndex]);

  // Register window in z-index stack on mount and handle clicks inside window
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const initialZ = bringWindowToFront(el);
    setZIndex(initialZ);

    const handleWindowFocus = () => {
      bringToFront();
    };

    el.addEventListener('mousedown', handleWindowFocus);
    return () => {
      el.removeEventListener('mousedown', handleWindowFocus);
      unregisterWindow(el);
    };
  }, [bringToFront]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Elevate window z-index on interaction/drag start (OB-127)
    bringToFront();

    // Disable drag on mobile/narrow screens
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return;

    // Don't drag if clicking buttons, inputs, links, or elements with no-drag class
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, .no-drag, .draggable-window-resize-handle')) {
      return;
    }

    const rect = windowRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : (position?.x ?? 0);
    const currentY = rect ? rect.top : (position?.y ?? 0);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    };
    setIsDragging(true);
  }, [position, bringToFront]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const rect = windowRef.current?.getBoundingClientRect();
      const winW = rect?.width || 320;

      const newX = Math.max(0, Math.min(window.innerWidth - winW, dragStartRef.current.startX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 50, dragStartRef.current.startY + dy));

      const newPos = { x: newX, y: newY };
      setPosition(newPos);

      if (options.storageKey && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(options.storageKey, JSON.stringify(newPos));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, options.storageKey]);

  // Window resize mouse down handler (OB-203)
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront();

    if (typeof window !== 'undefined' && window.innerWidth <= 768) return;

    const rect = windowRef.current?.getBoundingClientRect();
    const currentW = rect?.width ?? size?.width ?? options.initialWidth ?? 360;
    const currentH = rect?.height ?? size?.height ?? options.initialHeight ?? 400;

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: currentW,
      startHeight: currentH,
    };
    setIsResizing(true);
  }, [size, bringToFront, options.initialWidth, options.initialHeight]);

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;

      const minW = options.minWidth ?? 260;
      const maxW = options.maxWidth ?? (typeof window !== 'undefined' ? window.innerWidth - 40 : 1200);
      const minH = options.minHeight ?? 180;
      const maxH = options.maxHeight ?? (typeof window !== 'undefined' ? window.innerHeight - 40 : 1000);

      const newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.startWidth + dx));
      const newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.startHeight + dy));

      const newSize = { width: Math.round(newW), height: Math.round(newH) };
      setSize(newSize);

      const key = options.sizeStorageKey || (options.storageKey ? `${options.storageKey}_size` : undefined);
      if (key && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(newSize));
        } catch {}
      }
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, options.minWidth, options.maxWidth, options.minHeight, options.maxHeight, options.sizeStorageKey, options.storageKey]);

  return {
    windowRef,
    position,
    setPosition,
    size,
    setSize,
    isDragging,
    isResizing,
    handleMouseDown,
    handleResizeMouseDown,
    zIndex,
    bringToFront,
  };
}
