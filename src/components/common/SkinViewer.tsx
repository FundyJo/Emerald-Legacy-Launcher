import { useEffect, useRef, useState } from 'react';
import { SkinViewer as Skinview3D, IdleAnimation } from 'skinview3d';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusable } from '../../hooks/useFocusable';

interface SkinViewerProps {
  username: string;
  setUsername: (name: string) => void;
  skinUrl: string;
  setSkinUrl: (url: string) => void;
  setActiveTab: (tab: string) => void;
  playSfx: (name: string, multiplier?: number) => void;
}

export function SkinViewer({ username, setUsername, skinUrl, setSkinUrl, setActiveTab, playSfx }: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Skinview3D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);

  const [showLayers, setShowLayers] = useLocalStorage('lce-show-layers', true);
  const showLayersRef = useRef(showLayers);

  useEffect(() => {
    showLayersRef.current = showLayers;
  }, [showLayers]);

  const nameInput = useFocusable('skinviewer-name', 'main', 0);
  const changeSkinBtn = useFocusable('skinviewer-changeskin', 'main', 1, () => {
    playSfx('click.wav');
    setActiveTab('skins');
  });
  const toggleLayersBtn = useFocusable('skinviewer-layers', 'main', 2, () => {
    playSfx('click.wav');
    setShowLayers(!showLayers);
  });
  const resetSkinBtn = useFocusable('skinviewer-reset', 'main', 3, () => {
    playSfx('click.wav');
    setSkinUrl('/images/Default.png');
  });

  // Initialize Three.js viewer with performance optimizations
  useEffect(() => {
    if (!canvasRef.current) return;

    viewerRef.current = new Skinview3D({
      canvas: canvasRef.current,
      width: 220,
      height: 380,
    });

    viewerRef.current.animation = new IdleAnimation();
    viewerRef.current.autoRotate = false;

    if (viewerRef.current.controls) {
      viewerRef.current.controls.enableZoom = false;
      viewerRef.current.controls.enablePan = false;
      viewerRef.current.controls.minPolarAngle = Math.PI / 2;
      viewerRef.current.controls.maxPolarAngle = Math.PI / 2;
    }

    // PERFORMANCE FIX: Implement throttled rendering to reduce CPU usage
    const throttledRender = (time: number) => {
      // Only render at 30 FPS to reduce CPU usage (especially on Linux)
      if (time - lastRenderTime.current < 33.33) {
        animationFrameRef.current = requestAnimationFrame(throttledRender);
        return;
      }

      lastRenderTime.current = time;

      if (viewerRef.current && !document.hidden) {
        viewerRef.current.render();
      }

      animationFrameRef.current = requestAnimationFrame(throttledRender);
    };

    // Start custom render loop
    animationFrameRef.current = requestAnimationFrame(throttledRender);

    return () => {
      // MEMORY LEAK FIX: Properly clean up animation frame and viewer
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  // Load skin texture
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.loadSkin(skinUrl).then(() => {
        const skin = viewerRef.current?.playerObject.skin;
        if (skin) {
          [skin.body, skin.rightArm, skin.leftArm, skin.rightLeg, skin.leftLeg, skin.head].forEach(part => {
            if (part && part.outerLayer) part.outerLayer.visible = showLayersRef.current;
          });
        }
      }).catch(console.error);
    }
  }, [skinUrl]);

  // Toggle layers visibility
  useEffect(() => {
    if (viewerRef.current) {
      const skin = viewerRef.current.playerObject?.skin;
      if (skin) {
        [skin.body, skin.rightArm, skin.leftArm, skin.rightLeg, skin.leftLeg, skin.head].forEach(part => {
          if (part && part.outerLayer) part.outerLayer.visible = showLayers;
        });
      }
    }
  }, [showLayers]);

  // PERFORMANCE FIX: Pause animation when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (viewerRef.current && viewerRef.current.animation) {
        viewerRef.current.animation.paused = document.hidden;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-16 top-[42%] -translate-y-1/2 flex flex-col items-center gap-1 outline-none z-10"
    >
      <div className={`bg-black/20 flex justify-center items-center mb-2 px-2 py-1 rounded-sm border-2 transition-colors ${nameInput.className}`}>
        <input
          ref={nameInput.ref as React.RefObject<HTMLInputElement>}
          type="text"
          value={username}
          maxLength={16}
          style={{ width: `${Math.max(username.length, 3) + 2}ch` }}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-transparent text-white focus:text-[#FFFF55] outline-none border-none text-center mc-text-shadow tracking-widest text-xl cursor-default"
        />
      </div>
      <canvas ref={canvasRef} className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] cursor-ew-resize outline-none" />
      <div className="flex gap-4 mt-2 items-center">
        <button
          ref={changeSkinBtn.ref as React.RefObject<HTMLButtonElement>}
          onClick={() => { playSfx('click.wav'); setActiveTab('skins'); }}
          className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${changeSkinBtn.className}`}
          title="Change Skin"
        >
          <img
            src="/images/Change_Skin_Icon.png"
            alt="Skin"
            className="w-8 h-8 object-contain pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </button>
        <button
          ref={toggleLayersBtn.ref as React.RefObject<HTMLButtonElement>}
          onClick={() => { playSfx('click.wav'); setShowLayers(!showLayers); }}
          className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${toggleLayersBtn.className}`}
          title="Toggle Layers"
        >
          <img
            src="/images/Layer_Icon.png"
            alt="Layers"
            className="w-8 h-8 object-contain pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </button>
        <button
          ref={resetSkinBtn.ref as React.RefObject<HTMLButtonElement>}
          onClick={() => { playSfx('click.wav'); setSkinUrl('/images/Default.png'); }}
          className={`mc-sq-btn w-12 h-12 flex items-center justify-center outline-none border-none transition-all ${resetSkinBtn.className}`}
          title="Reset to Default"
        >
          <img
            src="/images/Trash_Bin_Icon.png"
            alt="Delete"
            className="w-8 h-8 object-contain brightness-200 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}
