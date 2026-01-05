// iOS 26 Style Widget Component with Glassmorphism 2.0
import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { 
  WidgetData, 
  PRIORITY_SCALE, 
  CATEGORY_COLORS,
  MiniWidgetData 
} from '../types';

interface WidgetProps {
  widget: WidgetData;
  isFocused: boolean;
  isRelated: boolean;
  isBlurred: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

// Mini-widget component for orbit display
const MiniWidget: React.FC<{
  data: MiniWidgetData;
  index: number;
  total: number;
  parentSize: number;
}> = ({ data, index, total, parentSize }) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = 80;
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <div
      className="absolute flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer hover:scale-110"
      style={{
        left: `calc(50% + ${x}px - 28px)`,
        top: `calc(50% + ${y}px - 12px)`,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
      }}
    >
      <span>{data.icon}</span>
      <span className="text-gray-700">{data.label}</span>
    </div>
  );
};

// Info Load Bar component
const InfoLoadBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.1)' }}>
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
      }}
    />
  </div>
);

export const Widget: React.FC<WidgetProps> = ({
  widget,
  isFocused,
  isRelated,
  isBlurred,
  onHover,
  onSelect,
}) => {
  const { id, icon, title, subtitle, priority, category, infoLoad, miniWidgets } = widget;
  
  const scale = PRIORITY_SCALE[priority];
  const categoryStyle = CATEGORY_COLORS[category];
  
  // Calculate widget dimensions based on priority
  const baseWidth = 160;
  const baseHeight = 120;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  // Dynamic styles based on focus state
  const containerStyle = useMemo(() => {
    let transform = 'translate(-50%, -50%)';
    let filter = 'none';
    let opacity = 1;
    let boxShadow = `0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.2)`;

    if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.3)';
      boxShadow = `0 16px 48px ${categoryStyle.glow}, 0 0 40px ${categoryStyle.glow}, 0 0 0 2px rgba(255, 255, 255, 0.4)`;
    } else if (isRelated) {
      boxShadow = `0 12px 36px ${categoryStyle.glow}80, 0 0 20px ${categoryStyle.glow}60`;
    } else if (isBlurred) {
      filter = 'blur(4px)';
      opacity = 0.3;
    }

    return {
      width: `${width}px`,
      height: `${height}px`,
      transform,
      filter,
      opacity,
      boxShadow,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '24px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      position: 'relative' as const,
    };
  }, [isFocused, isRelated, isBlurred, width, height, categoryStyle]);

  // Glow color based on category
  const glowColor = useMemo(() => {
    switch (category) {
      case 'system': return '#58C4DD';
      case 'productivity': return '#34C759';
      case 'communication': return '#007AFF';
      case 'media': return '#FF2D55';
      case 'utilities': return '#FF9F0A';
      default: return '#58C4DD';
    }
  }, [category]);

  return (
    <Html
      position={[widget.position.x / 100, -widget.position.y / 100, widget.position.z / 50]}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
    >
      <div
        style={containerStyle}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(id)}
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${subtitle}`}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: categoryStyle.gradient,
            opacity: 0.5,
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col p-4">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-2"
            style={{ background: categoryStyle.iconBg }}
          >
            {icon}
          </div>

          {/* Title & Subtitle */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>

          {/* Info Load Bar */}
          <div className="mt-auto">
            <InfoLoadBar value={infoLoad} color={glowColor} />
          </div>

          {/* Priority badge */}
          {priority === 'critical' && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>

        {/* Mini-widgets orbit (only when focused) */}
        {isFocused && miniWidgets.length > 0 && (
          <div className="absolute inset-0 pointer-events-auto">
            {miniWidgets.map((mini, i) => (
              <MiniWidget
                key={mini.id}
                data={mini}
                index={i}
                total={miniWidgets.length}
                parentSize={width}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Html>
  );
};
