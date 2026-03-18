import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HomeView({ handleLaunch, setActiveView, playClickSound, setShowCredits, isFocusedSection, onNavigateLeft }: any) {
  const [menuFocus, setMenuFocus] = useState<number | null>(null);
  const buttons = [
    { label: 'Play Game', action: handleLaunch },
    { label: 'Help & Options', action: () => setActiveView('settings') },
    { label: 'Versions', action: () => setActiveView('versions') },
    { label: 'Marketplace', action: () => setActiveView('marketplace') },
    { label: 'Themes & Tools', action: () => setActiveView('themes') }
  ];

  useEffect(() => {
    if (!isFocusedSection) {
      setMenuFocus(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') setMenuFocus(prev => prev === null ? 0 : (prev < buttons.length - 1 ? prev + 1 : prev));
      if (e.key === 'ArrowUp') setMenuFocus(prev => prev === null ? buttons.length - 1 : (prev > 0 ? prev - 1 : prev));
      if (e.key === 'ArrowLeft') onNavigateLeft();
      if (e.key === 'Enter' && menuFocus !== null) { playClickSound(); buttons[menuFocus].action(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuFocus, buttons, playClickSound, isFocusedSection, onNavigateLeft]);

  return (
    <motion.div tabIndex={-1} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-[540px] flex flex-col space-y-3 transition-opacity duration-300 ${!isFocusedSection ? 'opacity-50' : 'opacity-100'} outline-none`}>
      {buttons.map((btn, i) => (
        <button 
          key={i} onMouseEnter={() => isFocusedSection && setMenuFocus(i)} onMouseLeave={() => setMenuFocus(null)}
          onClick={() => { if (isFocusedSection) { playClickSound(); btn.action(); } }} 
          className={`w-full h-12 flex items-center justify-center text-2xl mc-text-shadow transition-colors outline-none border-none ${menuFocus === i ? 'text-[#FFFF55]' : 'text-white'}`}
          style={{ backgroundImage: menuFocus === i ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
        >
          {btn.label}
        </button>
      ))}
      <div className="pt-4 flex flex-col items-center w-full gap-3">
        <div className="flex gap-8">
          <a href="https://discord.gg/YBy7kbnR4m" target="_blank" rel="noopener noreferrer" onClick={() => { if (isFocusedSection) playClickSound(); }} className={`hover:scale-110 transition-transform ${!isFocusedSection ? 'pointer-events-none' : ''}`}><img src="/images/discord.png" className="w-16 h-16 drop-shadow-md object-contain" style={{ imageRendering: 'pixelated' }} /></a>
          <a href="https://github.com/Emerald-Legacy-Launcher/Emerald-Legacy-Launcher" target="_blank" rel="noopener noreferrer" onClick={() => { if (isFocusedSection) playClickSound(); }} className={`hover:scale-110 transition-transform ${!isFocusedSection ? 'pointer-events-none' : ''}`}><img src="/images/github.png" className="w-16 h-16 drop-shadow-md object-contain" style={{ imageRendering: 'pixelated' }} /></a>
        </div>
        <div className="border-b-[3px] border-[#A0A0A0] w-48 opacity-60" />
        <button 
          onClick={() => { if (isFocusedSection) { playClickSound(); setShowCredits(true); } }} 
          className={`text-white hover:text-[#FFFF55] text-xl mc-text-shadow tracking-widest transition-colors mt-1 bg-transparent border-none outline-none ${!isFocusedSection ? 'cursor-default pointer-events-none' : ''}`}
        >
          EMERALD TEAM
        </button>
      </div>
    </motion.div>
  );
}