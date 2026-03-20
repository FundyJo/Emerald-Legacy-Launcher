import { useEffect, useRef } from 'react';
import { useFocusManager } from '../contexts/FocusManager';

export const useFocusable = (
  id: string,
  group: string,
  order: number,
  onActivate?: () => void,
  deps: any[] = []
) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const { registerElement, unregisterElement, focusedId, isControllerMode } = useFocusManager();

  useEffect(() => {
    if (elementRef.current) {
      registerElement({
        id,
        group,
        order,
        element: elementRef.current,
        onActivate,
      });
    }

    return () => {
      unregisterElement(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, group, order, onActivate, registerElement, unregisterElement, ...deps]);

  const isFocused = focusedId === id && isControllerMode;

  return {
    ref: elementRef,
    isFocused,
    className: isFocused ? 'controller-focus' : '',
  };
};
