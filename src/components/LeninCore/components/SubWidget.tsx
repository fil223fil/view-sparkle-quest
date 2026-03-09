// Sub-Widget Component — iOS 26 Liquid Glass — Theme-Aware
import React, { useMemo, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { WidgetData, CATEGORY_COLORS } from '../types';

interface SubWidgetProps {
  widget: WidgetData;
  index: number;
  total: number;
  parentPosition: { x: number; y: number; z: number };
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

const InfoLoadBar: React.FC<{ value: number; color: string; isDark: boolean }> = ({ value, color, isDark }) => (
  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
  </div>
);

export const SubWidget: React.FC<SubWidgetProps> = ({
  widget, index, total, parentPosition, onHover, onClick,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const categoryStyle = CATEGORY_COLORS[widget.category];

  const position = useMemo(() => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 2;
    return {
      x: parentPosition.x / 100 + Math.cos(angle) * radius,
      y: -parentPosition.y / 100 + Math.sin(angle) * radius,
      z: parentPosition.z / 50 + 0.5,
    };
  }, [index, total, parentPosition]);

  const glowColor = useMemo(() => {
    switch (widget.category) {
      case 'system': return '#58C4DD';
      case 'productivity': return '#34C759';
      case 'communication': return '#007AFF';
      case 'media': return '#FF2D55';
      case 'utilities': return '#FF9F0A';
      default: return '#58C4DD';
    }
  }, [widget.category]);

  const containerStyle: React.CSSProperties = {
    width: '120px',
    height: '90px',
    transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0.5})`,
    opacity: isVisible ? 1 : 0,
    boxShadow: isHovered 
      ? `0 12px 36px ${categoryStyle.glow}, 0 0 30px ${categoryStyle.glow}80, inset 0 1px 2px rgba(255,255,255,${isDark ? '0.08' : '0.4'})`
      : isDark
        ? '0 12px 40px 0 rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)'
        : '0 12px 40px 0 rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)',
    background: isDark
      ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.4)',
    borderRadius: '18px',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
    position: 'relative' as const,
  };

  return (
    <Html position={[position.x, position.y, position.z]} center distanceFactor={6} zIndexRange={[200, 100]}>
      <div
        style={containerStyle}
        onMouseEnter={() => { setIsHovered(true); onHover(widget.id); }}
        onMouseLeave={() => { setIsHovered(false); onHover(null); }}
        onClick={() => onClick(widget.id)}
        role="button"
        tabIndex={0}
        aria-label={`${widget.title}: ${widget.subtitle}`}
      >
        <div className="absolute inset-0 rounded-2xl" style={{ background: categoryStyle.gradient, opacity: isDark ? 0.6 : 0.4 }} />
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%)' : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
        }} />

        <div className="relative h-full flex flex-col p-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl mb-1" style={{ background: categoryStyle.iconBg }}>
            {widget.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold leading-tight" style={{ color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)' }}>{widget.title}</h3>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{widget.subtitle}</p>
          </div>
          <div className="mt-auto">
            <InfoLoadBar value={widget.infoLoad} color={glowColor} isDark={isDark} />
          </div>
        </div>

        <svg className="absolute pointer-events-none" style={{ width: '200px', height: '200px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: isVisible ? 0.4 : 0, transition: 'opacity 0.5s ease-out' }}>
          <defs>
            <linearGradient id={`subGrad-${widget.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={glowColor} stopOpacity="0" />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <line x1="100" y1="100" x2="100" y2="180" stroke={`url(#subGrad-${widget.id})`} strokeWidth="2" strokeDasharray="4,4" />
        </svg>
      </div>
    </Html>
  );
};
