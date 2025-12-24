import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { FractalScene } from './FractalScene';
import { Controls } from './Controls';

export const NetworkVisualization = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
    setIsPaused(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ 
        background: '#000000'
      }}
    >
      {/* Apple-style ambient gradient orbs */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 35% at 50% 0%, rgba(120, 80, 220, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 90%, rgba(60, 130, 255, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 35% 25% at 15% 85%, rgba(200, 100, 180, 0.06) 0%, transparent 50%)
          `
        }}
      />

      {/* Title overlay - Apple style */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 
          className="text-[28px] font-semibold tracking-[-0.02em] text-white"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          }}
        >
          ЯДРО ЛЕНИН
        </h1>
        <p 
          className="text-[13px] text-white/50 mt-1.5 font-normal tracking-[0.01em]"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Фрактальная вселенная
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: 3
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 30]} />
        <FractalScene
          isPaused={isPaused}
          onReset={handleReset}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Controls - Apple pill style */}
      <Controls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />

      {/* Instructions */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p 
          className="text-[11px] text-white/25 font-normal tracking-[0.02em]"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
          }}
        >
          Нажмите на узел для погружения
        </p>
      </div>
    </div>
  );
};
