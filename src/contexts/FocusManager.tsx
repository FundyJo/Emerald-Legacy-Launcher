import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface FocusableElement {
  id: string;
  group: string; // 'sidebar', 'main', 'modal'
  order: number;
  element: HTMLElement | null;
  onActivate?: () => void;
}

interface FocusManagerContextType {
  registerElement: (element: FocusableElement) => void;
  unregisterElement: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  moveUp: () => void;
  moveDown: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  activate: () => void;
  activeGroup: string;
  setActiveGroup: (group: string) => void;
  isControllerMode: boolean;
  setControllerMode: (mode: boolean) => void;
}

const FocusManagerContext = createContext<FocusManagerContextType | undefined>(undefined);

export const useFocusManager = () => {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider');
  }
  return context;
};

interface FocusManagerProviderProps {
  children: React.ReactNode;
}

export const FocusManagerProvider: React.FC<FocusManagerProviderProps> = ({ children }) => {
  const [elements, setElements] = useState<Map<string, FocusableElement>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('sidebar');
  const [isControllerMode, setControllerMode] = useState(false);
  const elementsRef = useRef<Map<string, FocusableElement>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const registerElement = useCallback((element: FocusableElement) => {
    setElements((prev) => {
      const newMap = new Map(prev);
      newMap.set(element.id, element);
      return newMap;
    });
  }, []);

  const unregisterElement = useCallback((id: string) => {
    setElements((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    if (focusedId === id) {
      setFocusedId(null);
    }
  }, [focusedId]);

  const getElementsInGroup = useCallback((group: string): FocusableElement[] => {
    const groupElements = Array.from(elementsRef.current.values())
      .filter((el) => el.group === group)
      .sort((a, b) => a.order - b.order);
    return groupElements;
  }, []);

  const moveToElement = useCallback((targetId: string | null) => {
    if (!targetId) return;

    const element = elementsRef.current.get(targetId);
    if (element?.element) {
      setFocusedId(targetId);
      element.element.focus({ preventScroll: false });
      element.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const moveUp = useCallback(() => {
    const groupElements = getElementsInGroup(activeGroup);
    if (groupElements.length === 0) return;

    const currentIndex = groupElements.findIndex((el) => el.id === focusedId);

    if (currentIndex === -1) {
      // No element focused, focus first
      moveToElement(groupElements[0].id);
    } else if (currentIndex > 0) {
      // Move to previous element
      moveToElement(groupElements[currentIndex - 1].id);
    } else {
      // Wrap around to last element
      moveToElement(groupElements[groupElements.length - 1].id);
    }
  }, [activeGroup, focusedId, getElementsInGroup, moveToElement]);

  const moveDown = useCallback(() => {
    const groupElements = getElementsInGroup(activeGroup);
    if (groupElements.length === 0) return;

    const currentIndex = groupElements.findIndex((el) => el.id === focusedId);

    if (currentIndex === -1) {
      // No element focused, focus first
      moveToElement(groupElements[0].id);
    } else if (currentIndex < groupElements.length - 1) {
      // Move to next element
      moveToElement(groupElements[currentIndex + 1].id);
    } else {
      // Wrap around to first element
      moveToElement(groupElements[0].id);
    }
  }, [activeGroup, focusedId, getElementsInGroup, moveToElement]);

  const moveLeft = useCallback(() => {
    // For horizontal navigation (e.g., sliders, buttons in a row)
    // Default to moving up for most UI elements
    const groupElements = getElementsInGroup(activeGroup);
    if (groupElements.length === 0) return;

    const currentIndex = groupElements.findIndex((el) => el.id === focusedId);
    if (currentIndex > 0) {
      moveToElement(groupElements[currentIndex - 1].id);
    }
  }, [activeGroup, focusedId, getElementsInGroup, moveToElement]);

  const moveRight = useCallback(() => {
    // For horizontal navigation (e.g., sliders, buttons in a row)
    // Default to moving down for most UI elements
    const groupElements = getElementsInGroup(activeGroup);
    if (groupElements.length === 0) return;

    const currentIndex = groupElements.findIndex((el) => el.id === focusedId);
    if (currentIndex !== -1 && currentIndex < groupElements.length - 1) {
      moveToElement(groupElements[currentIndex + 1].id);
    }
  }, [activeGroup, focusedId, getElementsInGroup, moveToElement]);

  const activate = useCallback(() => {
    if (!focusedId) return;

    const element = elementsRef.current.get(focusedId);
    if (element?.onActivate) {
      element.onActivate();
    } else if (element?.element) {
      // Trigger click event
      element.element.click();
    }
  }, [focusedId]);

  // Auto-focus first element when group changes
  useEffect(() => {
    if (!isControllerMode) return;

    const groupElements = getElementsInGroup(activeGroup);
    if (groupElements.length > 0 && !focusedId) {
      moveToElement(groupElements[0].id);
    }
  }, [activeGroup, isControllerMode, focusedId, getElementsInGroup, moveToElement]);

  const value: FocusManagerContextType = {
    registerElement,
    unregisterElement,
    focusedId,
    setFocusedId,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    activate,
    activeGroup,
    setActiveGroup,
    isControllerMode,
    setControllerMode,
  };

  return (
    <FocusManagerContext.Provider value={value}>
      {children}
    </FocusManagerContext.Provider>
  );
};
