export class GamepadManager {
  constructor(options = {}) {
    this.deadzone = typeof options.deadzone === 'number' ? options.deadzone : 0.5;
    this.listeners = new Map();
    this.rafId = null;
    this.connectedIndices = new Set();

    this.boundConnect = this.onConnect.bind(this);
    this.boundDisconnect = this.onDisconnect.bind(this);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  off(event, handler) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch {
        // Ignore listener failures so polling keeps running.
      }
    }
  }

  start() {
    window.addEventListener('gamepadconnected', this.boundConnect);
    window.addEventListener('gamepaddisconnected', this.boundDisconnect);
    this.tick();
  }

  stop() {
    window.removeEventListener('gamepadconnected', this.boundConnect);
    window.removeEventListener('gamepaddisconnected', this.boundDisconnect);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onConnect(event) {
    const index = event?.gamepad?.index;
    if (typeof index === 'number') {
      this.connectedIndices.add(index);
    }
    this.emit('connect', { index, gamepad: event?.gamepad ?? null });
  }

  onDisconnect(event) {
    const index = event?.gamepad?.index;
    if (typeof index === 'number') {
      this.connectedIndices.delete(index);
    }
    this.emit('disconnect', this.connectedIndices.size);
  }

  tick() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    let activeCount = 0;

    for (const gp of pads) {
      if (!gp) continue;
      activeCount += 1;
      this.connectedIndices.add(gp.index);

      this.emit('frame', {
        id: gp.id,
        index: gp.index,
        mapping: gp.mapping,
        axes: Array.from(gp.axes || []),
        buttons: gp.buttons.map((b) => (typeof b === 'object' ? b.value : Number(b || 0))),
        timestamp: gp.timestamp || 0,
      });
    }

    if (activeCount === 0 && this.connectedIndices.size > 0) {
      this.connectedIndices.clear();
      this.emit('disconnect', 0);
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }
}

