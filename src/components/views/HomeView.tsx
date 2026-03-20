import React from 'react';
import { useFocusable } from '../../hooks/useFocusable';

interface HomeViewProps {
  username: string;
  selectedInstance: string;
  setSelectedInstance: (id: string) => void;
  installedStatus: Record<string, boolean>;
  isRunning: boolean;
  installingInstance: string | null;
  fadeAndLaunch: () => void;
  playSfx: (name: string, multiplier?: number) => void;
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  username,
  selectedInstance,
  setSelectedInstance,
  installedStatus,
  isRunning,
  installingInstance,
  fadeAndLaunch,
  playSfx,
  setActiveTab,
}) => {
  const hasInstalledInstance = installedStatus.vanilla_tu19 || installedStatus.vanilla_tu24;

  const instanceSelect = useFocusable(
    'home-instance-select',
    'main',
    0,
    undefined,
    [hasInstalledInstance]
  );

  const playBtn = useFocusable(
    'home-play-btn',
    'main',
    1,
    fadeAndLaunch,
    [hasInstalledInstance, isRunning, installingInstance]
  );

  const goToVersionsBtn = useFocusable(
    'home-go-versions',
    'main',
    0,
    () => {
      playSfx('click.wav');
      setActiveTab("versions");
    },
    [hasInstalledInstance]
  );

  return (
    <div className="flex flex-col items-center text-center animate-in fade-in">
      <div className="relative mb-12 flex flex-col items-center">
        <img src="/images/MenuTitle.png" className="w-[550px]" alt="Menu Title" />
        <div className="splash-text absolute bottom-2 -right-12 text-3xl">
          Welcome, {username}!
        </div>
      </div>
      <div className="bg-black/80 p-8 border-4 border-black w-[550px] flex flex-col gap-6 mt-12">
        {hasInstalledInstance ? (
          <>
            <select
              ref={instanceSelect.ref as React.RefObject<HTMLSelectElement>}
              value={selectedInstance}
              onChange={(e) => {
                playSfx('click.wav');
                setSelectedInstance(e.target.value);
              }}
              className={`w-full legacy-select p-3 text-2xl outline-none ${instanceSelect.className}`}
            >
              {installedStatus.vanilla_tu19 && (
                <option value="vanilla_tu19">Vanilla Nightly (TU19)</option>
              )}
              {installedStatus.vanilla_tu24 && (
                <option value="vanilla_tu24">Vanilla TU24</option>
              )}
            </select>
            <button
              ref={playBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={fadeAndLaunch}
              disabled={isRunning || !!installingInstance}
              className={`legacy-btn py-4 text-6xl w-full ${playBtn.className}`}
            >
              {installingInstance ? "WAITING..." : isRunning ? "RUNNING..." : "PLAY"}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-2xl text-red-400 mb-6 font-bold uppercase">Game not installed</p>
            <button
              ref={goToVersionsBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={() => {
                playSfx('click.wav');
                setActiveTab("versions");
              }}
              className={`legacy-btn py-4 px-8 text-3xl w-full ${goToVersionsBtn.className}`}
            >
              Go to Versions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
