import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ThemesView({ theme: currentTheme, setTheme, playClickSound, playBackSound, setActiveView }: any) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const themes = ["Default", "Modern"];
  const ITEM_COUNT = 2; // Theme Button + Back Button

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        playBackSound();
        setActiveView('main');
        return;
      }

      if (e.key === 'ArrowDown') {
        setFocusIndex(prev => (prev === null || prev >= ITEM_COUNT - 1) ? 0 : prev + 1);
      } else if (e.key === 'ArrowUp') {
        setFocusIndex(prev => (prev === null || prev <= 0) ? ITEM_COUNT - 1 : prev - 1);
      } else if (e.key === 'Enter' && focusIndex !== null) {
        if (focusIndex === 0) {
          playClickSound();
          const currentIndex = themes.indexOf(currentTheme);
          const nextIndex = (currentIndex + 1) % themes.length;
          setTheme(themes[nextIndex]);
        } else {
          playBackSound();
          setActiveView('main');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, currentTheme, playClickSound, playBackSound, setActiveView, setTheme, themes]);

  useEffect(() => {
    if (focusIndex !== null) {
      const el = containerRef.current?.querySelector(`[data-index="${focusIndex}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }, [focusIndex]);

  return (
    <motion.div ref={containerRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center w-full max-w-2xl -mt-24 outline-none">
      <h2 className="text-2xl text-white mc-text-shadow mb-4 border-b-2 border-[#373737] pb-2 w-[60%] max-w-[300px] text-center tracking-widest uppercase opacity-80">Themes & Tools</h2>
      
      <div className="w-full max-w-[540px] flex flex-col items-center gap-6 mt-4 mb-8">
        <button 
           data-index="0"
           onMouseEnter={() => setFocusIndex(0)}
           onClick={() => {
             playClickSound();
             const currentIndex = themes.indexOf(currentTheme);
             const nextIndex = (currentIndex + 1) % themes.length;
             setTheme(themes[nextIndex]);
           }}
           className={`w-72 h-12 flex items-center justify-center px-4 relative transition-colors outline-none border-none hover:text-[#FFFF55] ${focusIndex === 0 ? 'text-[#FFFF55]' : 'text-white'}`}
           style={{ 
             backgroundImage: focusIndex === 0 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
             backgroundSize: "100% 100%", 
             imageRendering: "pixelated" 
           }}
        >
           <span className="text-2xl mc-text-shadow tracking-widest">{currentTheme}</span>
        </button>
      </div>
      
      <button 
        data-index="1"
        onMouseEnter={() => setFocusIndex(1)}
        onClick={() => { playBackSound(); setActiveView('main'); }} 
        className={`w-72 h-12 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none hover:text-[#FFFF55] ${focusIndex === 1 ? 'text-[#FFFF55]' : 'text-white'}`}
        style={{ 
          backgroundImage: focusIndex === 1 ? "url('/images/button_highlighted.png')" : "url('/images/Button_Background.png')", 
          backgroundSize: '100% 100%', 
          imageRendering: 'pixelated' 
        }}
      >
        Back
      </button>
    </motion.div>
  );
}