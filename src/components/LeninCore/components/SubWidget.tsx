// Sub-Widget Component - iOS 26 Liquid Glass
import React, { useMemo, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { WidgetData, CATEGORY_COLORS } from '../types';

interface SubWidgetProps {
  widget: WidgetData;
  index: number;
  total: number;
  parentPosition: { x: number; y: number; z: number };
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

const InfoLoadBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full h-1 rounded-full overflow-hidden bg-foreground/10">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
      }}
    />
  </div>
);

export const SubWidget: React.FC<SubWidgetProps> = ({
  widget, index, total, parentPosition, onHover, onClick,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      ? `0 12px 36px ${categoryStyle.glow}, 0 0 30px ${categoryStyle.glow}80, inset 0 1px 2px rgba(255,255,255,0.4)`
      : '0 12px 40px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '18px',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
    position: 'relative' as const,
  };

  return (
    <Html
      position={[position.x, position.y, position.z]}
      center
      distanceFactor={6}
      zIndexRange={[200, 100]}
    >
      <div
        style={containerStyle}
        className="ios26-subwidget"
        onMouseEnter={() => { setIsHovered(true); onHover(widget.id); }}
        onMouseLeave={() => { setIsHovered(false); onHover(null); }}
        onClick={() => onClick(widget.id)}
        role="button"
        tabIndex={0}
        aria-label={`${widget.title}: ${widget.subtitle}`}
      >
        {/* Category gradient */}
        <div className="absolute inset-0 rounded-2xl" style={{ background: categoryStyle.gradient, opacity: 0.4 }} />
        
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />

        <div className="relative h-full flex flex-col p-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl mb-1" style={{ background: categoryStyle.iconBg }}>
            {widget.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-foreground leading-tight">{widget.title}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{widget.subtitle}</p>
          </div>
          <div className="mt-auto">
            <InfoLoadBar value={widget.infoLoad} color={glowColor} />
          </div>
        </div>

        {/* Connecting line to parent */}
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

      <style>{`
        .dark .ios26-subwidget {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </Html>
  );
};
