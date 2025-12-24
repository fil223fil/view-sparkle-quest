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
        background: '#1C1C1C'
      }}
    >
      {/* 3B1B style - subtle gradient, not cosmic */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(88, 196, 221, 0.06) 0%, transparent 60%)
          `
        }}
      />

      {/* Title - 3B1B clean style */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 
          className="text-[28px] font-light tracking-[-0.01em]"
          style={{ 
            fontFamily: '"CMU Serif", Georgia, serif',
            color: '#FFFFFF',
            opacity: 0.9
          }}
        >
          ЯДРО ЛЕНИН
        </h1>
        <p 
          className="text-[14px] mt-1 font-light tracking-[0.02em]"
          style={{ 
            fontFamily: '"CMU Serif", Georgia, serif',
            color: 'rgba(88, 196, 221, 0.7)'
          }}
        >
          Фрактальная вселенная
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#1C1C1C']} />
        <FractalScene
          isPaused={isPaused}
          onReset={handleReset}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Controls - minimal 3B1B style */}
      <Controls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />

      {/* Instructions */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p 
          className="text-[13px] font-light tracking-[0.02em]"
          style={{ 
            fontFamily: '"CMU Serif", Georgia, serif',
            color: 'rgba(255,255,255,0.3)'
          }}
        >
          нажмите на узел для погружения
        </p>
      </div>
    </div>
  );
};
