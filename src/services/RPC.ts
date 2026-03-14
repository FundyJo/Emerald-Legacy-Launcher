import { setActivity, start } from "tauri-plugin-drpc";
import { Activity, ActivityType, Button, Timestamps } from "tauri-plugin-drpc/activity";

class RPC {
  public async StartRPC() {
    await start("1482504445152460871");

    const activity = new Activity();
    activity.setButton([new Button("Download", "https://github.com/Emerald-Legacy-Launcher/Emerald-Legacy-Launcher")]);
    activity.setTimestamps(new Timestamps(Date.now()));
    activity.setActivity(ActivityType.Playing);
    // activity.setDetails(`Playing as ${useLauncherStore.getState().displayName}`); commented out until i add zustand state management

    await setActivity(activity);
  }
}

export default new RPC();