import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSettings";
import { TauriService } from "./services/tauri";
import { AppConfig, Runner, InstalledStatus, ReinstallModalData, McNotification } from "./types";
import { Sidebar } from "./components/layout/Sidebar";
import { HomeView } from "./components/views/HomeView";
import { VersionsView } from "./components/views/VersionsView";
import { SettingsView } from "./components/views/SettingsView";
import { FirstRunView } from "./components/views/FirstRunView";
import { ReinstallModal } from "./components/modals/ReinstallModal";
import { Notification } from "./components/common/Notification";
import "./index.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [installingInstance, setInstallingInstance] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [installedStatus, setInstalledStatus] = useState<InstalledStatus>({
    vanilla_tu19: false,
    vanilla_tu24: false,
  });
  const [selectedInstance, setSelectedInstance] = useState<string>("vanilla_tu19");
  const [reinstallModal, setReinstallModal] = useState<ReinstallModalData | null>(null);
  const [mcNotif, setMcNotif] = useState<McNotification | null>(null);
  const [availableRunners, setAvailableRunners] = useState<Runner[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<string>("");
  const [isLinux, setIsLinux] = useState(false);

  const { musicVol, setMusicVol, sfxVol, setSfxVol, isMuted, setIsMuted } = useSettings();
  const { musicRef, playRandomMusic, playSfx, ensureAudio } = useAudio(musicVol, sfxVol, isMuted);

  const updateAllStatus = async () => {
    const v19 = await TauriService.checkGameInstalled("vanilla_tu19");
    const v24 = await TauriService.checkGameInstalled("vanilla_tu24");
    setInstalledStatus({ vanilla_tu19: v19, vanilla_tu24: v24 });
  };

  const fadeAndLaunch = async () => {
    playSfx('levelup.ogg', 0.4);
    setIsRunning(true);
    if (musicRef.current && !isMuted) {
      const startVol = musicRef.current.volume;
      const steps = 20;
      let currentStep = 0;
      const fade = setInterval(() => {
        currentStep++;
        if (musicRef.current) {
          musicRef.current.volume = Math.max(0, startVol * (1 - currentStep / steps));
        }
        if (currentStep >= steps) {
          clearInterval(fade);
          if (musicRef.current) musicRef.current.pause();
        }
      }, 50);
    }
    setTimeout(async () => {
      try {
        await TauriService.launchGame(selectedInstance);
      } catch (e) {
        alert(`Failed to launch game: ${e}`);
      } finally {
        setIsRunning(false);
        if (musicRef.current) {
          musicRef.current.volume = isMuted ? 0 : musicVol;
          playRandomMusic();
        }
      }
    }, 1500);
  };

  const executeInstall = async (id: string, url: string) => {
    setInstallingInstance(id);
    setDownloadProgress(0);
    try {
      await TauriService.downloadAndInstall(url, id);
      setMcNotif({ t: "Success!", m: "Ready to play." });
      playSfx('orb.ogg');
      setTimeout(() => setMcNotif(null), 4000);
      updateAllStatus();
    } catch (e) {
      console.error(e);
      alert("Error during installation: " + e);
    }
    setInstallingInstance(null);
  };

  useEffect(() => {
    TauriService.loadConfig().then((c) => {
      const config = c as AppConfig;
      if (config.username && config.username.trim() !== "") {
        setUsername(config.username);
        setIsFirstRun(false);
        setTimeout(playRandomMusic, 1000);
      }
      if (config.linuxRunner) setSelectedRunner(config.linuxRunner);
    });

    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("linux")) {
      setIsLinux(true);
      TauriService.getAvailableRunners().then((runners) => {
        setAvailableRunners(runners);
      });
    }

    updateAllStatus();
    const unlisten = listen<number>("download-progress", (e) =>
      setDownloadProgress(Math.round(e.payload))
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  if (isFirstRun) {
    return (
      <FirstRunView 
        username={username}
        setUsername={setUsername}
        isLinux={isLinux}
        selectedRunner={selectedRunner}
        availableRunners={availableRunners}
        setIsFirstRun={setIsFirstRun}
        playRandomMusic={playRandomMusic}
        playSfx={playSfx}
        ensureAudio={ensureAudio}
      />
    );
  }

  return (
    <div
      className="h-screen flex select-none overflow-hidden bg-black text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={musicRef} onEnded={playRandomMusic} />
      
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playSfx={playSfx}
        updateAllStatus={updateAllStatus}
        installingInstance={installingInstance}
        downloadProgress={downloadProgress}
      />

      <main className="flex-1 relative h-full">
        <div className="h-full flex flex-col items-center justify-center p-12 relative z-10">
          {activeTab === "home" && (
            <HomeView
              username={username}
              selectedInstance={selectedInstance}
              setSelectedInstance={setSelectedInstance}
              installedStatus={installedStatus}
              isRunning={isRunning}
              installingInstance={installingInstance}
              fadeAndLaunch={fadeAndLaunch}
              playSfx={playSfx}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "versions" && (
            <VersionsView
              installedStatus={installedStatus}
              installingInstance={installingInstance}
              executeInstall={executeInstall}
              setReinstallModal={setReinstallModal}
              playSfx={playSfx}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              username={username}
              setUsername={setUsername}
              isLinux={isLinux}
              selectedRunner={selectedRunner}
              setSelectedRunner={setSelectedRunner}
              availableRunners={availableRunners}
              musicVol={musicVol}
              setMusicVol={setMusicVol}
              sfxVol={sfxVol}
              setSfxVol={setSfxVol}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              playSfx={playSfx}
            />
          )}
        </div>

        {reinstallModal && (
          <ReinstallModal
            data={reinstallModal}
            onCancel={() => setReinstallModal(null)}
            onConfirm={(id, url) => {
              executeInstall(id, url);
              setReinstallModal(null);
            }}
            playSfx={playSfx}
          />
        )}

        {mcNotif && (
          <Notification title={mcNotif.t} message={mcNotif.m} />
        )}
      </main>
    </div>
  );
}