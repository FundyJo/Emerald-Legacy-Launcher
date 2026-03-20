use gilrs::{Axis, Button, EventType, Gilrs};
use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Window};

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeKeyEventPayload {
    pub key: String,
    pub shift_key: bool,
    pub event_type: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ControllerConnectionPayload {
    pub connected: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ControllerDebugPayload {
    pub connected: bool,
    pub gamepad_count: usize,
    pub pressed_count: usize,
    pub last_event: String,
    pub axis_x: f32,
    pub axis_y: f32,
    pub south_pressed: bool,
    pub east_pressed: bool,
}

#[tauri::command]
pub fn relay_key_event(
    window: Window,
    key: String,
    shift_key: bool,
    event_type: String,
) -> Result<(), String> {
    let normalized = match event_type.as_str() {
        "keydown" | "keyup" => event_type,
        _ => "keydown".to_string(),
    };

    window
        .emit(
            "controller-key-event",
            NativeKeyEventPayload {
                key,
                shift_key,
                event_type: normalized,
            },
        )
        .map_err(|e| e.to_string())
}

fn emit_key(app: &AppHandle, key: &str, shift_key: bool) {
    let down = NativeKeyEventPayload {
        key: key.to_string(),
        shift_key,
        event_type: "keydown".to_string(),
    };
    let up = NativeKeyEventPayload {
        key: key.to_string(),
        shift_key,
        event_type: "keyup".to_string(),
    };
    let _ = app.emit("controller-key-event", down);
    let _ = app.emit("controller-key-event", up);
}

pub fn start_controller_polling(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut gilrs = match Gilrs::new() {
            Ok(g) => g,
            Err(err) => {
                let _ = app.emit(
                    "controller-debug",
                    ControllerDebugPayload {
                        connected: false,
                        gamepad_count: 0,
                        pressed_count: 0,
                        last_event: format!("gilrs init error: {err}"),
                        axis_x: 0.0,
                        axis_y: 0.0,
                        south_pressed: false,
                        east_pressed: false,
                    },
                );
                return;
            }
        };

        let mut last_connected = false;
        let mut tick: u32 = 0;
        let mut axis_up_active = false;
        let mut axis_down_active = false;
        let mut axis_left_active = false;
        let mut axis_right_active = false;
        let mut axis_x = 0.0f32;
        let mut axis_y = 0.0f32;
        let mut dpad_x = 0.0f32;
        let mut dpad_y = 0.0f32;
        let mut last_event = String::from("idle");

        let mut south_active = false;
        let mut east_active = false;
        let mut l_trigger_active = false;
        let mut r_trigger_active = false;

        loop {
            while let Some(ev) = gilrs.next_event() {
                last_event = format!("{:?}", ev.event);
                match ev.event {
                    EventType::ButtonPressed(button, _) => {
                        match button {
                            Button::South => emit_key(&app, "Enter", false),
                            Button::East => emit_key(&app, "Escape", false),
                            Button::LeftTrigger | Button::LeftTrigger2 => emit_key(&app, "Tab", true),
                            Button::RightTrigger | Button::RightTrigger2 => emit_key(&app, "Tab", false),
                            Button::DPadUp => emit_key(&app, "ArrowUp", false),
                            Button::DPadDown => emit_key(&app, "ArrowDown", false),
                            Button::DPadLeft => emit_key(&app, "ArrowLeft", false),
                            Button::DPadRight => emit_key(&app, "ArrowRight", false),
                            _ => {}
                        }
                    }
                    EventType::ButtonChanged(button, value, _) => {
                        if matches!(button, Button::LeftTrigger | Button::LeftTrigger2) {
                            let now = value > 0.6;
                            if now && !l_trigger_active {
                                emit_key(&app, "Tab", true);
                            }
                            l_trigger_active = now;
                        }
                        if matches!(button, Button::RightTrigger | Button::RightTrigger2) {
                            let now = value > 0.6;
                            if now && !r_trigger_active {
                                emit_key(&app, "Tab", false);
                            }
                            r_trigger_active = now;
                        }
                    }
                    EventType::AxisChanged(axis, value, _) => {
                        match axis {
                            Axis::RightStickX => axis_x = value,
                            Axis::RightStickY => axis_y = value,
                            Axis::DPadX => dpad_x = value,
                            Axis::DPadY => dpad_y = value,
                            _ => {}
                        }
                    }
                    _ => {}
                }
            }

            let threshold = 0.55f32;

            // Fallback: poll current state directly in case backend emits only connect events.
            for (_, gamepad) in gilrs.gamepads().filter(|(_, g)| g.is_connected()) {
                let south_now = gamepad.is_pressed(Button::South);
                let east_now = gamepad.is_pressed(Button::East);
                let l_now = gamepad.is_pressed(Button::LeftTrigger) || gamepad.is_pressed(Button::LeftTrigger2);
                let r_now = gamepad.is_pressed(Button::RightTrigger) || gamepad.is_pressed(Button::RightTrigger2);

                if south_now && !south_active {
                    emit_key(&app, "Enter", false);
                }
                if east_now && !east_active {
                    emit_key(&app, "Escape", false);
                }
                if l_now && !l_trigger_active {
                    emit_key(&app, "Tab", true);
                }
                if r_now && !r_trigger_active {
                    emit_key(&app, "Tab", false);
                }

                south_active = south_now;
                east_active = east_now;
                l_trigger_active = l_now;
                r_trigger_active = r_now;

                axis_x = gamepad.value(Axis::RightStickX);
                axis_y = gamepad.value(Axis::RightStickY);
                dpad_x = gamepad.value(Axis::DPadX);
                dpad_y = gamepad.value(Axis::DPadY);
                break;
            }

            let up_now = axis_y < -threshold || dpad_y > threshold;
            let down_now = axis_y > threshold || dpad_y < -threshold;
            let left_now = axis_x < -threshold || dpad_x < -threshold;
            let right_now = axis_x > threshold || dpad_x > threshold;

            if up_now && !axis_up_active {
                emit_key(&app, "ArrowUp", false);
            }
            if down_now && !axis_down_active {
                emit_key(&app, "ArrowDown", false);
            }
            if left_now && !axis_left_active {
                emit_key(&app, "ArrowLeft", false);
            }
            if right_now && !axis_right_active {
                emit_key(&app, "ArrowRight", false);
            }

            axis_up_active = up_now;
            axis_down_active = down_now;
            axis_left_active = left_now;
            axis_right_active = right_now;

            let gamepad_count = gilrs.gamepads().filter(|(_, g)| g.is_connected()).count();
            let connected = gamepad_count > 0;
            let pressed_count = gilrs
                .gamepads()
                .filter(|(_, g)| g.is_connected())
                .map(|(_, g)| g.state().buttons().count())
                .sum::<usize>();

            if connected != last_connected {
                let _ = app.emit(
                    "controller-connected",
                    ControllerConnectionPayload { connected },
                );
                last_connected = connected;
            }

            // Emit a heartbeat once per second so frontend state stays in sync.
            tick = tick.wrapping_add(1);
            if tick % 60 == 0 {
                let _ = app.emit(
                    "controller-connected",
                    ControllerConnectionPayload { connected },
                );
                let _ = app.emit(
                    "controller-debug",
                    ControllerDebugPayload {
                        connected,
                        gamepad_count,
                        pressed_count,
                        last_event: last_event.clone(),
                        axis_x,
                        axis_y,
                        south_pressed: south_active,
                        east_pressed: east_active,
                    },
                );
            }

            if !connected {
                axis_up_active = false;
                axis_down_active = false;
                axis_left_active = false;
                axis_right_active = false;
                south_active = false;
                east_active = false;
                l_trigger_active = false;
                r_trigger_active = false;
            }
            tokio::time::sleep(Duration::from_millis(16)).await;
        }
    });
}

