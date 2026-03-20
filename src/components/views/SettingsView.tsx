import React from 'react';
import { Icons } from '../Icons';
import { TauriService } from '../../services/tauri';
import { Runner } from '../../types';
import { openUrl } from "@tauri-apps/plugin-opener";
import { useFocusable } from '../../hooks/useFocusable';

interface SettingsViewProps {
  username: string;
  setUsername: (name: string) => void;
  isLinux: boolean;
  selectedRunner: string;
  setSelectedRunner: (runner: string) => void;
  availableRunners: Runner[];
  musicVol: number;
  setMusicVol: (vol: number) => void;
  sfxVol: number;
  setSfxVol: (vol: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  username,
  setUsername,
  isLinux,
  selectedRunner,
  setSelectedRunner,
  availableRunners,
  musicVol,
  setMusicVol,
  sfxVol,
  setSfxVol,
  isMuted,
  setIsMuted,
  playSfx,
}) => {
  const usernameInput = useFocusable('settings-username', 'main', 0);
  const saveBtn = useFocusable(
    'settings-save',
    'main',
    1,
    () => {
      playSfx('wood click.wav');
      TauriService.saveConfig({
        username,
        linuxRunner: selectedRunner || undefined,
      });
    }
  );
  const runnerSelect = useFocusable('settings-runner', 'main', 2, undefined, [isLinux]);
  const musicSlider = useFocusable('settings-music-vol', 'main', 3);
  const sfxSlider = useFocusable('settings-sfx-vol', 'main', 4);
  const muteBtn = useFocusable(
    'settings-mute',
    'main',
    5,
    () => {
      setIsMuted(!isMuted);
      playSfx('pop.wav');
    }
  );
  const discordBtn = useFocusable(
    'settings-discord',
    'main',
    6,
    () => openUrl("https://discord.gg/nzbxB8Hxjh")
  );
  const githubBtn = useFocusable(
    'settings-github',
    'main',
    7,
    () => openUrl("https://github.com/KayJannOnGit")
  );
  const redditBtn = useFocusable(
    'settings-reddit',
    'main',
    8,
    () => openUrl("https://reddit.com/user/KayJann")
  );

  return (
    <div className="w-full max-w-3xl bg-black/80 p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
      <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Settings</h2>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <label className="text-xl text-slate-400 italic">In-game Username</label>
          <div className="flex gap-4">
            <input
              ref={usernameInput.ref as React.RefObject<HTMLInputElement>}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`flex-1 bg-black border-4 border-slate-700 p-4 text-3xl outline-none focus:border-emerald-500 ${usernameInput.className}`}
            />
            <button
              ref={saveBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={() => {
                playSfx('wood click.wav');
                TauriService.saveConfig({
                  username,
                  linuxRunner: selectedRunner || undefined,
                });
              }}
              className={`legacy-btn px-8 text-2xl relative ${saveBtn.className}`}
            >
              Save
            </button>
          </div>
        </div>

        {isLinux && (
          <div className="flex flex-col gap-4">
            <label className="text-xl text-slate-400 italic flex items-center gap-2">
              <Icons.Linux /> Linux Runner
            </label>
            <div className="flex flex-col gap-2">
              <select
                ref={runnerSelect.ref as React.RefObject<HTMLSelectElement>}
                value={selectedRunner}
                onChange={(e) => {
                  playSfx('click.wav');
                  setSelectedRunner(e.target.value);
                }}
                className={`w-full legacy-select p-4 text-2xl outline-none focus:border-emerald-500 ${runnerSelect.className}`}
              >
                <option value="" disabled>Select a runner...</option>
                {availableRunners.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
              {availableRunners.length === 0 && (
                <p className="text-red-500 text-sm">
                  No Proton or Wine installations found. Please install Steam or Wine.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 bg-[#2a2a2a] p-6 border-4 border-black shadow-[inset_4px_4px_#555]">
          <label className="text-xl flex items-center gap-4">
            <Icons.Volume level={musicVol} /> Audio Controls
          </label>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-sm uppercase opacity-50">
                Music {Math.round(musicVol * 100)}%
              </span>
              <input
                ref={musicSlider.ref as React.RefObject<HTMLInputElement>}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVol}
                onChange={(e) => setMusicVol(parseFloat(e.target.value))}
                className={`mc-range ${musicSlider.className}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm uppercase opacity-50">
                SFX {Math.round(sfxVol * 100)}%
              </span>
              <input
                ref={sfxSlider.ref as React.RefObject<HTMLInputElement>}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVol}
                onChange={(e) => setSfxVol(parseFloat(e.target.value))}
                className={`mc-range ${sfxSlider.className}`}
              />
            </div>
          </div>
          <button
            ref={muteBtn.ref as React.RefObject<HTMLButtonElement>}
            onClick={() => {
              setIsMuted(!isMuted);
              playSfx('pop.wav');
            }}
            className={`legacy-btn mt-4 py-2 ${muteBtn.className}`}
          >
            {isMuted ? "UNMUTE ALL" : "MUTE ALL"}
          </button>
        </div>

        <div className="about-section border-4 border-black bg-[#2a2a2a] p-6 shadow-[inset_4px_4px_#555]">
          <h3 className="text-2xl text-[#ffff55] mb-2 uppercase tracking-wide">
            About the project
          </h3>
          <p className="text-xl text-white leading-relaxed mb-6 opacity-90">
            I'm <span className="text-emerald-400">KayJann</span>, and I absolutely love this project! It's my very first one,
            and my goal is to create a central hub for the LCE community to bring us all together.
          </p>
          <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-widest">Social Links</h3>
          <div className="flex gap-6">
            <button
              ref={discordBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={() => openUrl("https://discord.gg/nzbxB8Hxjh")}
              className={`social-btn btn-discord ${discordBtn.className}`}
              title="Discord"
            >
              <Icons.Discord />
            </button>
            <button
              ref={githubBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={() => openUrl("https://github.com/KayJannOnGit")}
              className={`social-btn btn-github ${githubBtn.className}`}
              title="GitHub"
            >
              <Icons.Github />
            </button>
            <button
              ref={redditBtn.ref as React.RefObject<HTMLButtonElement>}
              onClick={() => openUrl("https://reddit.com/user/KayJann")}
              className={`social-btn btn-reddit ${redditBtn.className}`}
              title="Reddit"
            >
              <Icons.Reddit />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
