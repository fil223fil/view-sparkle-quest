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
      className="relative w-full h-screen"
      style={{ background: 'linear-gradient(180deg, #0b0c2a 0%, #0a1628 100%)' }}
    >
      {/* Title overlay */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-2xl font-light tracking-widest text-foreground/90">
          ЯДРО ЛЕНИН
        </h1>
        <p className="text-sm text-foreground/50 mt-1 tracking-wider">
          Фрактальная вселенная
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0b0c2a']} />
        <fog attach="fog" args={['#0b0c2a', 3, 20]} />
        <FractalScene
          isPaused={isPaused}
          onReset={handleReset}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Controls */}
      <Controls
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onFullscreen={handleFullscreen}
      />

      {/* Instructions */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p className="text-xs text-foreground/40 tracking-wide">
          Кликните на узел чтобы погрузиться во внутреннюю вселенную
        </p>
      </div>
    </div>
  );
};
