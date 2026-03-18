import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function VersionsView({ selectedProfile, setSelectedProfile, installedVersions, toggleInstall, playClickSound, playBackSound, setActiveView, editions }: any) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ITEM_COUNT = editions.length + 1; // Editions + Back button

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        playBackSound();
        setActiveView('main');
        return;
      }

      if (e.key === 'ArrowDown') {
        setFocusIndex(prev => (prev === null || prev >= ITEM_COUNT - 1) ? 0 : prev + 1);
      } else if (e.key === 'ArrowUp') {
        setFocusIndex(prev => (prev === null || prev <= 0) ? ITEM_COUNT - 1 : prev - 1);
      } else if (e.key === 'Enter') {
        if (focusIndex !== null) {
           if (focusIndex < editions.length) {
              const edition = editions[focusIndex];
              if (installedVersions.includes(edition.id)) {
                 playClickSound();
                 setSelectedProfile(edition.id);
              }
           } else {
              playBackSound();
              setActiveView('main');
           }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, editions, installedVersions, playClickSound, playBackSound, setSelectedProfile, setActiveView]);

  useEffect(() => {
    if (focusIndex !== null) {
      const el = containerRef.current?.querySelector(`[data-index="${focusIndex}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }, [focusIndex]);

  return (
    <motion.div ref={containerRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-4xl outline-none">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[40%] max-w-[200px] text-center tracking-widest uppercase opacity-80">Versions</h2>
      
      <div className="w-full max-w-[700px] h-[350px] overflow-y-auto mb-6 p-4 shadow-2xl relative" style={{ backgroundImage: "url('/images/frame_background.png')", backgroundSize: "100% 100%", imageRendering: "pixelated" }}>
        
        <div className="flex flex-col gap-3">
            {editions.map((edition: any, i: number) => {
                const isInstalled = installedVersions.includes(edition.id);
                const isSelected = selectedProfile === edition.id;
                const isFocused = focusIndex === i;
                
                return (
                    <div 
                        key={edition.id}
                        data-index={i}
                        tabIndex={0}
                        onMouseEnter={() => setFocusIndex(i)}
                        onClick={() => {
                            if (isInstalled) {
                                playClickSound();
                                setSelectedProfile(edition.id);
                            }
                        }}
                        className={`w-full p-4 flex items-center transition-all outline-none border-none ${isInstalled ? 'cursor-pointer hover:text-[#FFFF55]' : 'opacity-70'}`}
                        style={{ 
                          backgroundImage: (isSelected || isFocused) ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
                          backgroundSize: "100% 100%", 
                          imageRendering: "pixelated" 
                        }}
                    >
                        <div className="w-[100px] flex-shrink-0"></div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <span className={`text-2xl mc-text-shadow ${(isSelected || isFocused) ? 'text-[#FFFF55]' : 'text-white'}`}>{edition.name}</span>
                            <span className="text-base text-[#E0E0E0] mc-text-shadow mt-1">{edition.desc}</span>
                        </div>
                        
                        <div className="flex gap-4 items-center justify-end w-[100px] pr-2">
                            {!isInstalled ? (
                                <button 
                                    tabIndex={-1}
                                    onClick={(e) => { e.stopPropagation(); playClickSound(); toggleInstall(edition.id); }}
                                    className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                >
                                    <img src="/images/Download_Icon.png" alt="Download" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        tabIndex={-1}
                                        onClick={(e) => { e.stopPropagation(); playClickSound(); }}
                                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                    >
                                        <img src="/images/Update_Icon.png" alt="Update" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                    </button>
                                    <button 
                                        tabIndex={-1}
                                        onClick={(e) => { e.stopPropagation(); playClickSound(); }}
                                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none"
                                    >
                                        <img src="/images/Folder_Icon.png" alt="Open Folder" className="w-6 h-6 object-contain pointer-events-none drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

      </div>

      <button 
        data-index={editions.length}
        onMouseEnter={() => setFocusIndex(editions.length)}
        onClick={() => { playBackSound(); setActiveView('main'); }} 
        className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${focusIndex === editions.length ? 'text-[#FFFF55]' : 'text-white'}`}
        style={{ 
          backgroundImage: focusIndex === editions.length ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
          backgroundSize: '100% 100%', 
          imageRendering: 'pixelated' 
        }}
      >
        Back
      </button>
    </motion.div>
  );
}