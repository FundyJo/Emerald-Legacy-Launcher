import { useEffect, useRef, useCallback } from 'react';

export interface GamepadButton {
  A: boolean;
  B: boolean;
  X: boolean;
  Y: boolean;
  LB: boolean;
  RB: boolean;
  LT: boolean;
  RT: boolean;
  Select: boolean;
  Start: boolean;
  LeftStick: boolean;
  RightStick: boolean;
  DPadUp: boolean;
  DPadDown: boolean;
  DPadLeft: boolean;
  DPadRight: boolean;
}

export interface GamepadAxes {
  leftStickX: number;
  leftStickY: number;
  rightStickX: number;
  rightStickY: number;
}

export interface GamepadInput {
  buttons: GamepadButton;
  axes: GamepadAxes;
  connected: boolean;
}

const AXIS_THRESHOLD = 0.5;
const BUTTON_PRESS_THRESHOLD = 0.5;
const REPEAT_DELAY = 500; // ms before repeating
const REPEAT_RATE = 150; // ms between repeats

export const useGamepad = (
  onNavigateUp: () => void,
  onNavigateDown: () => void,
  onNavigateLeft: () => void,
  onNavigateRight: () => void,
  onActivate: () => void,
  onBack: () => void,
  onTabLeft?: () => void,
  onTabRight?: () => void,
  playSfx?: (name: string, multiplier?: number) => void
) => {
  const gamepadIndexRef = useRef<number | null>(null);
  const lastInputRef = useRef<string | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);
  const prevButtonsRef = useRef<boolean[]>([]);
  const prevAxesRef = useRef<number[]>([]);

  const clearRepeatTimers = useCallback(() => {
    if (repeatTimerRef.current !== null) {
      window.clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  const handleInput = useCallback((input: string, callback: () => void) => {
    clearRepeatTimers();
    lastInputRef.current = input;
    callback();

    // Set up repeat after delay
    repeatTimerRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => {
        if (lastInputRef.current === input) {
          callback();
        }
      }, REPEAT_RATE);
    }, REPEAT_DELAY);
  }, [clearRepeatTimers]);

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepadIndexRef.current !== null ? gamepads[gamepadIndexRef.current] : null;

    if (!gamepad) return;

    const buttons = gamepad.buttons;
    const axes = gamepad.axes;

    // Check for button state changes (only trigger on new press)
    const buttonPressed = (index: number): boolean => {
      const isPressed = buttons[index]?.pressed || buttons[index]?.value > BUTTON_PRESS_THRESHOLD;
      const wasPressed = prevButtonsRef.current[index] || false;
      prevButtonsRef.current[index] = isPressed;
      return isPressed && !wasPressed;
    };

    // A button (0) - Activate
    if (buttonPressed(0)) {
      playSfx?.('click.wav');
      onActivate();
    }

    // B button (1) - Back
    if (buttonPressed(1)) {
      playSfx?.('back.ogg');
      onBack();
    }

    // LB button (4) - Tab left
    if (buttonPressed(4) && onTabLeft) {
      playSfx?.('click.wav');
      onTabLeft();
    }

    // RB button (5) - Tab right
    if (buttonPressed(5) && onTabRight) {
      playSfx?.('click.wav');
      onTabRight();
    }

    // D-Pad Up (12)
    if (buttonPressed(12)) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('up', onNavigateUp);
    } else if (!buttons[12]?.pressed && lastInputRef.current === 'up') {
      clearRepeatTimers();
      lastInputRef.current = null;
    }

    // D-Pad Down (13)
    if (buttonPressed(13)) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('down', onNavigateDown);
    } else if (!buttons[13]?.pressed && lastInputRef.current === 'down') {
      clearRepeatTimers();
      lastInputRef.current = null;
    }

    // D-Pad Left (14)
    if (buttonPressed(14)) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('left', onNavigateLeft);
    } else if (!buttons[14]?.pressed && lastInputRef.current === 'left') {
      clearRepeatTimers();
      lastInputRef.current = null;
    }

    // D-Pad Right (15)
    if (buttonPressed(15)) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('right', onNavigateRight);
    } else if (!buttons[15]?.pressed && lastInputRef.current === 'right') {
      clearRepeatTimers();
      lastInputRef.current = null;
    }

    // Left stick as D-Pad alternative
    const axisChanged = (index: number, threshold: number): { positive: boolean; negative: boolean } => {
      const value = axes[index] || 0;
      const prevValue = prevAxesRef.current[index] || 0;
      prevAxesRef.current[index] = value;

      const isPositive = value > threshold;
      const isNegative = value < -threshold;
      const wasPositive = prevValue > threshold;
      const wasNegative = prevValue < -threshold;

      return {
        positive: isPositive && !wasPositive,
        negative: isNegative && !wasNegative,
      };
    };

    // Left stick vertical (axis 1)
    const verticalAxis = axisChanged(1, AXIS_THRESHOLD);
    if (verticalAxis.negative) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('stick_up', onNavigateUp);
    } else if (verticalAxis.positive) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('stick_down', onNavigateDown);
    } else if (Math.abs(axes[1] || 0) < AXIS_THRESHOLD) {
      if (lastInputRef.current === 'stick_up' || lastInputRef.current === 'stick_down') {
        clearRepeatTimers();
        lastInputRef.current = null;
      }
    }

    // Left stick horizontal (axis 0)
    const horizontalAxis = axisChanged(0, AXIS_THRESHOLD);
    if (horizontalAxis.negative) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('stick_left', onNavigateLeft);
    } else if (horizontalAxis.positive) {
      playSfx?.('wood click.wav', 0.5);
      handleInput('stick_right', onNavigateRight);
    } else if (Math.abs(axes[0] || 0) < AXIS_THRESHOLD) {
      if (lastInputRef.current === 'stick_left' || lastInputRef.current === 'stick_right') {
        clearRepeatTimers();
        lastInputRef.current = null;
      }
    }
  }, [onNavigateUp, onNavigateDown, onNavigateLeft, onNavigateRight, onActivate, onBack, onTabLeft, onTabRight, playSfx, handleInput, clearRepeatTimers]);

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      gamepadIndexRef.current = e.gamepad.index;
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      if (gamepadIndexRef.current === e.gamepad.index) {
        gamepadIndexRef.current = null;
      }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Check for already connected gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        gamepadIndexRef.current = i;
        break;
      }
    }

    // Poll gamepad state
    const pollInterval = setInterval(pollGamepad, 16); // ~60fps

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      clearInterval(pollInterval);
      clearRepeatTimers();
    };
  }, [pollGamepad, clearRepeatTimers]);

  return {
    connected: gamepadIndexRef.current !== null,
  };
};
