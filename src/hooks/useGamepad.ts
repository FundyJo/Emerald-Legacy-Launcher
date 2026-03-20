import { useEffect, useRef, useState } from 'react';
import { GamepadManager } from './dist/esm/gamepad.js';

export interface UseGamepadProps {
  playSfx: (file: string) => void;
}

export const useGamepad = (_props: UseGamepadProps) => {
  const DEBUG_GAMEPAD = true;
  const [connected, setConnected] = useState(false);
  const lastConnectedRef = useRef<boolean | null>(null);
  const lastButtonsRef = useRef<Record<number, boolean>>({});
  const lastAxesRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const manager = new GamepadManager({ deadzone: 0.5 });

    const emitKey = (key: string, shiftKey = false) => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        shiftKey,
        bubbles: true,
        cancelable: true,
        view: window,
      }));
      window.dispatchEvent(new KeyboardEvent('keyup', {
        key,
        shiftKey,
        bubbles: true,
        cancelable: true,
        view: window,
      }));

      if (DEBUG_GAMEPAD) {
        console.log(`[gamepad->key] ${key}${shiftKey ? ' (shift)' : ''}`);
      }
    };

    const setConnectedState = (value: boolean) => {
      setConnected(value);
      if (lastConnectedRef.current !== value) {
        lastConnectedRef.current = value;
        if (DEBUG_GAMEPAD) console.log(`[gamepad] ${value ? 'detected' : 'not detected'}`);
      }
    };

    const onFrame = (frame: { axes: number[]; buttons: number[] }) => {
      setConnectedState(true);

      const btnPressedNow = (i: number) => (frame.buttons[i] ?? 0) > 0.5;
      const justPressed = (i: number) => btnPressedNow(i) && !lastButtonsRef.current[i];

      // Common Xbox mapping
      if (justPressed(0)) emitKey('Enter');
      if (justPressed(1)) emitKey('Escape');
      if (justPressed(4) || justPressed(6)) emitKey('Tab', true);
      if (justPressed(5) || justPressed(7)) emitKey('Tab');

      if (justPressed(12)) emitKey('ArrowUp');
      if (justPressed(13)) emitKey('ArrowDown');
      if (justPressed(14)) emitKey('ArrowLeft');
      if (justPressed(15)) emitKey('ArrowRight');

      const axisX = frame.axes[0] ?? 0;
      const axisY = frame.axes[1] ?? 0;
      const prevX = lastAxesRef.current[0] ?? 0;
      const prevY = lastAxesRef.current[1] ?? 0;
      const deadzone = 0.5;

      if (Math.abs(axisY) > deadzone && Math.abs(prevY) <= deadzone) {
        emitKey(axisY < 0 ? 'ArrowUp' : 'ArrowDown');
      }
      if (Math.abs(axisX) > deadzone && Math.abs(prevX) <= deadzone) {
        emitKey(axisX > 0 ? 'ArrowRight' : 'ArrowLeft');
      }

      const nextButtons: Record<number, boolean> = {};
      frame.buttons.forEach((value, idx) => {
        nextButtons[idx] = value > 0.5;
      });
      lastButtonsRef.current = nextButtons;
      lastAxesRef.current[0] = axisX;
      lastAxesRef.current[1] = axisY;
    };

    const onConnect = () => setConnectedState(true);
    const onDisconnect = (count: number) => setConnectedState(count > 0);

    manager.on('frame', onFrame);
    manager.on('connect', onConnect);
    manager.on('disconnect', onDisconnect);
    manager.start();

    return () => {
      manager.off('frame', onFrame);
      manager.off('connect', onConnect);
      manager.off('disconnect', onDisconnect);
      manager.stop();
    };
  }, []);

  return { connected };
};