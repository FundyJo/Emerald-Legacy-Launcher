import React from 'react';
import { TauriService } from '../../services/tauri';
import { ReinstallModalData } from '../../types';
import { useFocusable } from '../../hooks/useFocusable';

interface VersionsViewProps {
  installedStatus: Record<string, boolean>;
  installingInstance: string | null;
  executeInstall: (id: string, url: string) => void;
  setReinstallModal: (data: ReinstallModalData | null) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export const VersionsView: React.FC<VersionsViewProps> = ({
  installedStatus,
  installingInstance,
  executeInstall,
  setReinstallModal,
  playSfx,
}) => {
  const versions = [
    {
      id: "vanilla_tu19",
      name: "Vanilla Nightly (TU19)",
      desc: "Leaked 4J Studios build.",
      url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu19_vanilla.zip"
    },
    {
      id: "vanilla_tu24",
      name: "Vanilla TU24",
      desc: "Horses and Wither update.",
      url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip"
    }
  ];

  // Create focusable refs for each version's buttons
  const versionButtons: Record<string, any> = {};

  versions.forEach((v, index) => {
    if (installedStatus[v.id]) {
      versionButtons[`${v.id}-folder`] = useFocusable(
        `version-${v.id}-folder`,
        'main',
        index * 2,
        () => {
          playSfx('pop.wav');
          TauriService.openInstanceFolder(v.id);
        },
        [installedStatus[v.id]]
      );
      versionButtons[`${v.id}-reinstall`] = useFocusable(
        `version-${v.id}-reinstall`,
        'main',
        index * 2 + 1,
        () => {
          playSfx('click.wav');
          setReinstallModal({ id: v.id, url: v.url });
        },
        [installedStatus[v.id], installingInstance]
      );
    } else {
      versionButtons[`${v.id}-install`] = useFocusable(
        `version-${v.id}-install`,
        'main',
        index * 2,
        () => {
          playSfx('click.wav');
          executeInstall(v.id, v.url);
        },
        [installedStatus[v.id], installingInstance]
      );
    }
  });

  return (
    <div className="w-full max-w-3xl bg-black/80 p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
      <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Instances</h2>
      <div className="flex flex-col gap-6">
        {versions.map(v => (
          <div key={v.id} className="flex justify-between items-center bg-[#2a2a2a] border-4 border-black p-6">
            <div>
              <h3 className="text-2xl font-bold">{v.name}</h3>
              <p className="text-slate-400 text-sm">{v.desc}</p>
            </div>
            <div className="flex gap-2">
              {installedStatus[v.id] ? (
                <>
                  <button
                    ref={versionButtons[`${v.id}-folder`]?.ref as React.RefObject<HTMLButtonElement>}
                    onClick={() => {
                      playSfx('pop.wav');
                      TauriService.openInstanceFolder(v.id);
                    }}
                    className={`legacy-btn px-4 py-2 text-xl ${versionButtons[`${v.id}-folder`]?.className || ''}`}
                  >
                    Folder
                  </button>
                  <button
                    ref={versionButtons[`${v.id}-reinstall`]?.ref as React.RefObject<HTMLButtonElement>}
                    onClick={() => {
                      playSfx('click.wav');
                      setReinstallModal({ id: v.id, url: v.url });
                    }}
                    disabled={!!installingInstance}
                    className={`legacy-btn px-4 py-2 text-xl reinstall-btn ${versionButtons[`${v.id}-reinstall`]?.className || ''}`}
                  >
                    Reinstall
                  </button>
                </>
              ) : (
                <button
                  ref={versionButtons[`${v.id}-install`]?.ref as React.RefObject<HTMLButtonElement>}
                  onClick={() => {
                    playSfx('click.wav');
                    executeInstall(v.id, v.url);
                  }}
                  disabled={!!installingInstance}
                  className={`legacy-btn px-6 py-2 text-xl ${versionButtons[`${v.id}-install`]?.className || ''}`}
                >
                  INSTALL
                </button>
              )}
            </div>
          </div>
        ))}

        {['TU75', 'TU9', 'Modded Pack'].map(v => (
          <div key={v} className="flex justify-between items-center bg-[#1a1a1a] border-4 border-black p-6 opacity-50 grayscale">
            <div>
              <h3 className="text-2xl font-bold text-slate-500">Vanilla {v}</h3>
              <p className="text-slate-600 text-sm">Legacy version.</p>
            </div>
            <span className="text-[#ffff55] text-2xl font-bold italic">SOON</span>
          </div>
        ))}
      </div>
    </div>
  );
};
