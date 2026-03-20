export interface GamepadFrame {
  id: string;
  index: number;
  mapping: string;
  axes: number[];
  buttons: number[];
  timestamp: number;
}

export interface GamepadManagerOptions {
  deadzone?: number;
}

type ListenerMap = {
  frame: (frame: GamepadFrame) => void;
  connect: (payload: { index?: number; gamepad: Gamepad | null }) => void;
  disconnect: (remainingCount: number) => void;
};

export class GamepadManager {
  constructor(options?: GamepadManagerOptions);
  on<K extends keyof ListenerMap>(event: K, handler: ListenerMap[K]): void;
  off<K extends keyof ListenerMap>(event: K, handler: ListenerMap[K]): void;
  start(): void;
  stop(): void;
}

