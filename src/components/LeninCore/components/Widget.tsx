// iOS 26 Style Widget Component with Liquid Glass
import React, { useMemo, useCallback, useRef } from 'react';
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
  isDived?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDoubleTap?: (id: string) => void;
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
      className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer hover:scale-110 glass-capsule text-foreground"
      style={{
        left: `calc(50% + ${x}px - 28px)`,
        top: `calc(50% + ${y}px - 12px)`,
        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
      }}
    >
      <span>{data.icon}</span>
      <span>{data.label}</span>
    </div>
  );
};

// Info Load Bar component
const InfoLoadBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full h-1.5 rounded-full overflow-hidden bg-foreground/10">
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
  isDived = false,
  onHover,
  onSelect,
  onDoubleTap,
}) => {
  const { id, icon, title, subtitle, priority, category, infoLoad, miniWidgets } = widget;
  const lastTapRef = useRef<number>(0);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && onDoubleTap) {
      onDoubleTap(id);
    } else {
      onSelect(id);
    }
    
    lastTapRef.current = now;
  }, [id, onSelect, onDoubleTap]);
  
  const scale = PRIORITY_SCALE[priority];
  const categoryStyle = CATEGORY_COLORS[category];
  
  const baseWidth = 160;
  const baseHeight = 120;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const containerStyle = useMemo(() => {
    let transform = 'translate(-50%, -50%)';
    let filter = 'none';
    let opacity = 1;
    let boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)';

    if (isDived) {
      transform = 'translate(-50%, -50%) scale(1.5)';
      boxShadow = `0 20px 60px ${categoryStyle.glow}, 0 0 60px ${categoryStyle.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.4)`;
    } else if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.3)';
      boxShadow = `0 16px 48px ${categoryStyle.glow}, 0 0 40px ${categoryStyle.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.4)`;
    } else if (isRelated) {
      boxShadow = `0 12px 36px ${categoryStyle.glow}80, 0 0 20px ${categoryStyle.glow}60, inset 0 1px 2px rgba(255, 255, 255, 0.3)`;
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
      // iOS 26 liquid glass: translucent with deep blur and saturation
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '24px',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      position: 'relative' as const,
    };
  }, [isFocused, isRelated, isBlurred, isDived, width, height, categoryStyle]);

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
        className="ios26-widget"
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${subtitle}. Двойной клик для погружения.`}
      >
        {/* Category gradient overlay */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: categoryStyle.gradient,
            opacity: 0.5,
          }}
        />

        {/* Inner highlight - iOS glass refraction effect */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col p-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-2"
            style={{ background: categoryStyle.iconBg }}
          >
            {icon}
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>

          <div className="mt-auto">
            <InfoLoadBar value={infoLoad} color={glowColor} />
          </div>

          {priority === 'critical' && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
        </div>

        {/* Mini-widgets orbit */}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-color-scheme: dark) {
          .ios26-widget {
            background: linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%) !important;
            border-color: rgba(255, 255, 255, 0.15) !important;
          }
        }
        .dark .ios26-widget {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </Html>
  );
};
