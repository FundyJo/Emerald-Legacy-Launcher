import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusable } from '../../hooks/useFocusable';

interface SavedSkin {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_SKINS: SavedSkin[] = [
  { id: 'default', name: 'Default Steve', url: '/images/Default.png' },
  { id: 'journ3ym3n', name: 'Journ3ym3n', url: '/Skins/Journ3ym3n.png' },
  { id: 'justneki', name: 'JustNeki', url: '/Skins/JustNeki.png' },
  { id: 'kayjann', name: 'KayJann', url: '/Skins/KayJann.png' },
  { id: 'leon', name: 'Leon', url: '/Skins/Leon.png' },
  { id: 'mr_anilex', name: 'mr_anilex', url: '/Skins/mr_anilex.png' },
  { id: 'neoapps', name: 'neoapps', url: '/Skins/neoapps.png' },
  { id: 'peter', name: 'Peter', url: '/Skins/Peter.png' },
];

interface SkinsViewProps {
  skinUrl: string;
  setSkinUrl: (url: string) => void;
  setActiveTab: (tab: string) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export function SkinsView({ skinUrl, setSkinUrl, setActiveTab, playSfx }: SkinsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storedSkins, setStoredSkins] = useLocalStorage<SavedSkin[]>('lce-custom-skins', []);
  const savedSkins = [...DEFAULT_SKINS, ...storedSkins.filter(s => !DEFAULT_SKINS.some(d => d.id === s.id))];

  const setSavedSkins = (newSkins: SavedSkin[] | ((val: SavedSkin[]) => SavedSkin[])) => {
    const updatedSkins = typeof newSkins === 'function' ? newSkins(savedSkins) : newSkins;
    const customOnes = updatedSkins.filter(s => !DEFAULT_SKINS.some(d => d.id === s.id));
    setStoredSkins(customOnes);
  };

  const [activeSkinId, setActiveSkinId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSkinId) {
      const match = savedSkins.find(s => s.url === skinUrl);
      if (match) setActiveSkinId(match.id);
    }
  }, [activeSkinId, savedSkins, skinUrl]);

  const importBtn = useFocusable('skins-import', 'main', 0, () => {
    playSfx('click.wav');
    fileInputRef.current?.click();
  });

  const isActiveDefault = isDefaultSkin(activeSkinId) || (!activeSkinId && skinUrl === '/images/Default.png');

  const deleteBtn = useFocusable('skins-delete', 'main', 1, () => {
    if (isActiveDefault) return;
    handleDeleteActive();
  }, [isActiveDefault]);

  const backBtn = useFocusable('skins-back', 'main', 2, () => {
    playSfx('back.ogg');
    setActiveTab('home');
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') return;

    const defaultName = file.name.replace('.png', '').substring(0, 16);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement("canvas");
        cvs.width = 64;
        cvs.height = 32;
        const ctx = cvs.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
          const base64String = cvs.toDataURL("image/png");
          const newId = Date.now().toString();
          const newSkin = { id: newId, name: defaultName, url: base64String };
          setSavedSkins([...savedSkins, newSkin]);
          setSkinUrl(base64String);
          setActiveSkinId(newId);
        }
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSkinSelect = (skin: SavedSkin) => {
    playSfx('click.wav');
    setActiveSkinId(skin.id);
    setSkinUrl(skin.url);
  };

  function isDefaultSkin(id: string | null) {
    return DEFAULT_SKINS.some(d => d.id === id);
  }

  const handleDeleteActive = () => {
    if (!activeSkinId || isDefaultSkin(activeSkinId)) return;
    playSfx('click.wav');
    const updatedSkins = savedSkins.filter(s => s.id !== activeSkinId);
    setSavedSkins(updatedSkins);
    setSkinUrl('/images/Default.png');
    setActiveSkinId('default');
  };

  const handleNameChange = (id: string, newName: string) => {
    const updatedSkins = savedSkins.map(s => s.id === id ? { ...s, name: newName } : s);
    setSavedSkins(updatedSkins);
  };

  return (
    <div ref={containerRef} tabIndex={-1} className="flex flex-col items-center w-full max-w-3xl -mt-16 outline-none animate-in fade-in">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80 font-bold">Skin Library</h2>

      <div className="w-full max-w-[640px] h-[340px] mb-4 p-5 shadow-2xl flex flex-col relative bg-black/40 border-4 border-black">
        <div className="w-full flex items-center justify-between border-b-2 border-[#373737] pb-4 mb-4">
          <button
            ref={importBtn.ref as React.RefObject<HTMLButtonElement>}
            onClick={() => { playSfx('click.wav'); fileInputRef.current?.click(); }}
            className={`legacy-btn px-6 py-2 text-xl ${importBtn.className}`}
          >
            Import Skin
          </button>

          <button
            ref={deleteBtn.ref as React.RefObject<HTMLButtonElement>}
            onClick={handleDeleteActive}
            disabled={isActiveDefault}
            className={`legacy-btn px-6 py-2 text-xl ${deleteBtn.className} ${isActiveDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Delete Skin
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".png" className="hidden" />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-x-8 gap-y-6 items-start content-start justify-center">
          {savedSkins.map((skin) => {
            const isActive = activeSkinId ? activeSkinId === skin.id : skinUrl === skin.url;
            return (
              <div key={skin.id} className="flex flex-col items-center gap-1 w-32 outline-none">
                <div className="h-4">
                  {isActive && <span className="text-[#FFFF55] text-xs mc-text-shadow uppercase tracking-widest">Active</span>}
                </div>
                <div
                  onClick={() => handleSkinSelect(skin)}
                  className={`w-16 h-16 bg-black/40 border-2 shadow-inner relative cursor-pointer overflow-hidden transition-colors outline-none ${isActive ? 'border-[#FFFF55]' : 'border-[#373737] hover:border-[#A0A0A0]'}`}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {/* FIX: Disable image dragging */}
                  <img
                    src={skin.url}
                    alt={skin.name}
                    className="absolute max-w-none pointer-events-none select-none"
                    style={{ width: '800%', height: 'auto', left: '-100%', top: '-100%', imageRendering: 'pixelated' }}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
                <input
                  type="text"
                  value={skin.name}
                  maxLength={16}
                  onChange={(e) => handleNameChange(skin.id, e.target.value)}
                  className={`bg-transparent text-center outline-none border-none text-base mc-text-shadow w-full truncate transition-colors ${isActive ? 'text-[#FFFF55]' : 'text-white'} ${isDefaultSkin(skin.id) ? 'pointer-events-none' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                  spellCheck={false}
                  readOnly={isDefaultSkin(skin.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        ref={backBtn.ref as React.RefObject<HTMLButtonElement>}
        onClick={() => { playSfx('back.ogg'); setActiveTab('home'); }}
        className={`legacy-btn px-12 py-3 text-2xl ${backBtn.className}`}
      >
        Back
      </button>
    </div>
  );
}
