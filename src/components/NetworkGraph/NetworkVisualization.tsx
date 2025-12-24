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
        background: 'linear-gradient(145deg, #000000 0%, #0a0a1a 30%, #0f0f2a 60%, #050510 100%)'
      }}
    >
      {/* Apple-style ambient glow effects */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 100%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)
          `
        }}
      />

      {/* Title overlay - Apple SF Pro style */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 
          className="text-3xl font-semibold tracking-tight text-white/90"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          ЯДРО ЛЕНИН
        </h1>
        <p 
          className="text-sm text-white/40 mt-2 font-light"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            letterSpacing: '0.02em'
          }}
        >
          Фрактальная вселенная
        </p>
      </div>

      {/* 3D Canvas with Apple Vision Pro depth */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 4, 25]} />
        <FractalScene
          isPaused={isPaused}
          onReset={handleReset}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Controls - Apple glassmorphism style */}
      <Controls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />

      {/* Instructions - subtle Apple style */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p 
          className="text-xs text-white/30 font-light"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            letterSpacing: '0.03em'
          }}
        >
          Кликните на узел чтобы погрузиться во внутреннюю вселенную
        </p>
      </div>

      {/* Vision Pro style vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </div>
  );
};
