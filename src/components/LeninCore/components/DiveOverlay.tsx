// Dive Overlay — iOS 26 Liquid Glass — Theme-Aware
import React from 'react';
import { Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { ChevronLeft } from 'lucide-react';

interface DiveOverlayProps {
  widgetTitle: string;
  onSurface: () => void;
}

export const DiveOverlay: React.FC<DiveOverlayProps> = ({ widgetTitle, onSurface }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const glassStyle: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.5)',
    boxShadow: isDark
      ? '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)'
      : '0 12px 40px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
  };

  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <Html position={[0, 3.5, 0]} center distanceFactor={8} zIndexRange={[300, 200]}>
      <div className="flex items-center gap-4 rounded-[24px] px-5 py-3" style={glassStyle}>
        {/* Back button */}
        <button
          onClick={onSurface}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            color: '#007AFF',
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-semibold">Назад</span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium" style={{ color: mutedColor }}>Ядро Ленин</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: mutedColor, opacity: 0.5 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="font-semibold" style={{ color: textColor }}>{widgetTitle}</span>
        </div>

        {/* Depth indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
          background: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.1)',
          color: '#34C759',
          border: isDark ? '1px solid rgba(52,199,89,0.2)' : '1px solid rgba(52,199,89,0.15)',
        }}>
          <span>🔬</span>
          <span>Детали</span>
        </div>
      </div>
    </Html>
  );
};
