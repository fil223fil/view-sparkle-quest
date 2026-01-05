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
      <div
        className="flex items-center gap-4"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Back button */}
        <button
          onClick={onSurface}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(0, 122, 255, 0.1)',
            color: '#007AFF',
            border: '1px solid rgba(0, 122, 255, 0.2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Ядро Ленин</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="font-semibold text-gray-800">{widgetTitle}</span>
        </div>

        {/* Depth indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.2), rgba(52, 199, 89, 0.1))',
            color: '#34C759',
          }}
        >
          <span>🔬</span>
          <span>Детали</span>
        </div>
      </div>
    </Html>
  );
};
