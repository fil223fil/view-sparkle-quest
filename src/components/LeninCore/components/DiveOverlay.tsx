// Dive Overlay - UI for dive mode with back button
import React from 'react';
import { Html } from '@react-three/drei';

interface DiveOverlayProps {
  widgetTitle: string;
  onSurface: () => void;
}

export const DiveOverlay: React.FC<DiveOverlayProps> = ({ widgetTitle, onSurface }) => {
  return (
    <Html
      position={[0, 3.5, 0]}
      center
      distanceFactor={8}
      zIndexRange={[300, 200]}
    >
      <div className="flex items-center gap-4 glass-liquid rounded-[24px] px-5 py-3">
        {/* Back button */}
        <button
          onClick={onSurface}
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 glass-button text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Ядро Ленин</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground opacity-50">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="font-semibold text-foreground">{widgetTitle}</span>
        </div>

        {/* Depth indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass-capsule text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          <span>🔬</span>
          <span>Детали</span>
        </div>
      </div>
    </Html>
  );
};
