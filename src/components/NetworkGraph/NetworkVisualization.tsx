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
        background: 'linear-gradient(180deg, #0A0A0C 0%, #000000 50%, #050508 100%)'
      }}
    >
      {/* visionOS ambient gradient layers */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(88, 86, 214, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 85% 100%, rgba(10, 132, 255, 0.12) 0%, transparent 45%),
            radial-gradient(ellipse 50% 35% at 10% 90%, rgba(191, 90, 242, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse 40% 30% at 30% 20%, rgba(100, 210, 255, 0.06) 0%, transparent 35%)
          `
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Title overlay - visionOS style with depth */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <div
          className="px-8 py-4 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <h1 
            className="text-[32px] font-semibold tracking-[-0.025em] bg-clip-text text-transparent"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
            }}
          >
            ЯДРО ЛЕНИН
          </h1>
          <p 
            className="text-[14px] mt-2 font-normal tracking-[0.02em]"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              color: 'rgba(255,255,255,0.45)'
            }}
          >
            Фрактальная вселенная
          </p>
        </div>
      </div>

      {/* 3D Canvas with enhanced settings */}
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: 4,
          toneMappingExposure: 1.1
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#050508', 4, 25]} />
        <FractalScene
          isPaused={isPaused}
          onReset={handleReset}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Controls - visionOS pill */}
      <Controls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />

      {/* Instructions - visionOS subtle */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p 
          className="text-[12px] font-medium tracking-[0.04em] uppercase"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            color: 'rgba(255,255,255,0.2)'
          }}
        >
          Нажмите на виджет для погружения
        </p>
      </div>
    </div>
  );
};
