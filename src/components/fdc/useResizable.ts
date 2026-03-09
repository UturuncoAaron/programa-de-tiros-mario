import { useRef, useState, useCallback } from 'react';

interface UseResizableOptions {
  direction:   'horizontal' | 'vertical';
  initialSize: number;
  minSize:     number;
  maxSize:     number;
}

/**
 * Hook para redimensionar paneles arrastrando un borde.
 *
 * - `horizontal`: arrastra el borde IZQUIERDO → agranda hacia la izquierda
 * - `vertical`:   arrastra el borde SUPERIOR  → agranda hacia arriba
 *
 * Retorna `size` (px actual) y `onMouseDown` para poner en el handle.
 */
export function useResizable({
  direction,
  initialSize,
  minSize,
  maxSize,
}: UseResizableOptions) {
  const [size, setSize] = useState(initialSize);
  const isDragging      = useRef(false);
  const startPos        = useRef(0);
  const startSize       = useRef(initialSize);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startPos.current   = direction === 'horizontal' ? e.clientX : e.clientY;
    startSize.current  = size;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = direction === 'horizontal'
        ? startPos.current - ev.clientX
        : startPos.current - ev.clientY;
      setSize(Math.min(maxSize, Math.max(minSize, startSize.current + delta)));
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [direction, size, minSize, maxSize]);

  return { size, onMouseDown };
}