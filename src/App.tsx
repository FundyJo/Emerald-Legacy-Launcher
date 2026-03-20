import { useState, useEffect } from "react";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSettings";
import { useGameInstances } from "./hooks/useGameInstances";
import { useLauncher } from "./hooks/useLauncher";
import { useGamepad } from "./hooks/useGamepad";
import { FocusManagerProvider, useFocusManager } from "./contexts/FocusManager";
import { TauriService } from "./services/tauri";
import { AppConfig, Runner, ReinstallModalData, McNotification } from "./types";
import { Sidebar } from "./components/layout/Sidebar";
import { HomeView } from "./components/views/HomeView";
import { VersionsView } from "./components/views/VersionsView";
import { SettingsView } from "./components/views/SettingsView";
import { FirstRunView } from "./components/views/FirstRunView";
import { ReinstallModal } from "./components/modals/ReinstallModal";
import { Notification } from "./components/common/Notification";
import "./index.css";

function AppContent() {
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<string>("vanilla_tu19");
  const [reinstallModal, setReinstallModal] = useState<ReinstallModalData | null>(null);
  const [mcNotif, setMcNotif] = useState<McNotification | null>(null);
  const [availableRunners, setAvailableRunners] = useState<Runner[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<string>("");
  const [isLinux, setIsLinux] = useState(false);

  const { musicVol, setMusicVol, sfxVol, setSfxVol, isMuted, setIsMuted } = useSettings();
  const { musicRef, playRandomMusic, playSfx, ensureAudio } = useAudio(musicVol, sfxVol, isMuted);
  const { installedStatus, installingInstance, downloadProgress, executeInstall, updateAllStatus } = useGameInstances(playSfx, setMcNotif);
  const { isRunning, fadeAndLaunch } = useLauncher(selectedInstance, musicRef, isMuted, musicVol, playRandomMusic, playSfx);

  const {
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    activate,
    setActiveGroup,
    activeGroup,
    setControllerMode,
  } = useFocusManager();

  // Handle tab switching with controller
  const handleTabLeft = () => {
    const tabs = ["home", "versions", "settings"];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    setActiveTab(tabs[newIndex]);
    setActiveGroup('main');
    updateAllStatus();
  };

  const handleTabRight = () => {
    const tabs = ["home", "versions", "settings"];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(tabs[newIndex]);
    setActiveGroup('main');
    updateAllStatus();
  };

  const handleBack = () => {
    // If modal is open, close it
    if (reinstallModal) {
      setReinstallModal(null);
      setActiveGroup('main');
    } else if (activeGroup === 'main') {
      // Switch to sidebar navigation
      setActiveGroup('sidebar');
    } else if (activeGroup === 'sidebar') {
      // Switch back to main content
      setActiveGroup('main');
    }
  };

  // Initialize gamepad support
  const { connected } = useGamepad(
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    activate,
    handleBack,
    handleTabLeft,
    handleTabRight,
    playSfx
  );

  // Enable controller mode when gamepad is connected
  useEffect(() => {
    setControllerMode(connected);
    if (connected) {
      console.log('Controller connected - controller mode enabled');
    }
  }, [connected, setControllerMode]);

  // Update active group based on current tab and modal state
  useEffect(() => {
    if (reinstallModal) {
      setActiveGroup('modal');
    } else if (activeGroup === 'modal') {
      setActiveGroup('main');
    }
  }, [reinstallModal]);

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
  }, []);

  if (isFirstRun) {
    return (
      <FocusManagerProvider>
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
      </FocusManagerProvider>
    );
  }

  return (
    <div
      className={`h-screen flex select-none overflow-hidden bg-black text-white ${connected ? 'controller-mode' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={musicRef} onEnded={playRandomMusic} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveGroup('main');
        }}
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

export default function App() {
  return (
    <FocusManagerProvider>
      <AppContent />
    </FocusManagerProvider>
  );
}