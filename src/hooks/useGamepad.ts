import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseGamepadProps {
  playSfx: (file: string) => void;
}

export const useGamepad = ({ playSfx }: UseGamepadProps) => {
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const requestRef = useRef<number | undefined>(undefined);
  const lastButtons = useRef<Record<number, boolean>>({});
  const lastAxes = useRef<Record<number, number>>({});

  const stateRef = useRef({
    playSfx,
  });

  useEffect(() => {
    stateRef.current = { playSfx };
  }, [playSfx]);

  const dispatchKey = (key: string, shiftKey = false) => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
      view: window
    }));
    window.dispatchEvent(new KeyboardEvent('keyup', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
      view: window
    }));
  };

  const update = useCallback(() => {
    let anyConnected = false;
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : null;
      if (gamepads) {
        const gpArray = Array.from(gamepads);
        for (const gp of gpArray) {
          if (!gp) continue;
          anyConnected = true;

          const btnVal = (i: number): number => {
            const btn = gp.buttons[i];
            if (!btn) return 0;
            return typeof btn === "object" ? btn.value : (btn as any) ?? 0;
          };

          const justPressed = (i: number) => btnVal(i) > 0.5 && !lastButtons.current[i];
          if (justPressed(1)) { // A
            dispatchKey('Enter');
          }

          if (justPressed(2)) { // B
            dispatchKey('Escape');
          }

          if (justPressed(4)) dispatchKey('Tab', true);
          if (justPressed(5)) dispatchKey('Tab');
          const newButtons: Record<number, boolean> = {};
          gp.buttons.forEach((btn, i) => {
            newButtons[i] = (typeof btn === "object" ? btn.value : btn) > 0.5;
          });
          lastButtons.current = newButtons;
          const deadzone = 0.5;
          const axisY = gp.axes[2] ?? 0; // LS Y
          const prevY = lastAxes.current[2] ?? 0;
          if (Math.abs(axisY) > deadzone && Math.abs(prevY) <= deadzone) {
            dispatchKey(axisY < 0 ? 'ArrowDown' : 'ArrowUp');
          }
          lastAxes.current[2] = axisY;
          const axisX = gp.axes[1] ?? 0; // LS X
          const prevX = lastAxes.current[1] ?? 0;
          if (Math.abs(axisX) > deadzone && Math.abs(prevX) <= deadzone) {
            dispatchKey(axisX > 0 ? 'ArrowRight' : 'ArrowLeft');
          }
          lastAxes.current[1] = axisX;
        }
      }
    } catch (e) {
      console.error("Gamepad error:", e);
    }

    if (anyConnected !== connectedRef.current) {
      connectedRef.current = anyConnected;
      setConnected(anyConnected);
    }
    requestRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return { connected };
};
