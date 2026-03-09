// iOS 26 Style Widget Component — Apple WidgetKit Specifications
// Sizes: Small 170×170, Medium 364×170, Large 364×382
// Padding: 16pt, Element gap: 8pt, Corner radius: 20/24px
import React, { useMemo, useCallback, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
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

// Apple system colors
const APPLE_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  purple: '#AF52DE',
  pink: '#FF2D55',
  teal: '#5AC8FA',
  indigo: '#5856D6',
};

// Mini-widget — orbit pill (Apple HIG 44pt touch target)
const MiniWidget: React.FC<{
  data: MiniWidgetData;
  index: number;
  total: number;
  parentSize: number;
  isDark: boolean;
}> = ({ data, index, total, parentSize, isDark }) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = 85; // Comfortable distance
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        minHeight: 36, // Close to 44pt touch target
        borderRadius: 18,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animation: `miniWidgetFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
        background: isDark
          ? 'linear-gradient(180deg, rgba(44, 44, 46, 0.85) 0%, rgba(28, 28, 30, 0.7) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: isDark ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(0,0,0,0.06)',
        boxShadow: isDark
          ? '0 4px 16px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.06)'
          : '0 4px 16px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.8)',
        color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 8px 24px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.1)'
          : '0 8px 24px rgba(0,0,0,0.15), inset 0 0.5px 0 rgba(255,255,255,0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 16px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.06)'
          : '0 4px 16px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.8)';
      }}
    >
      <span style={{ fontSize: 14 }}>{data.icon}</span>
      <span>{data.label}</span>
    </div>
  );
};

// Info Load Bar — Apple-style progress
const InfoLoadBar: React.FC<{ value: number; color: string; isDark: boolean }> = ({ value, color, isDark }) => (
  <div style={{
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }}>
    <div
      style={{
        height: '100%',
        borderRadius: 2,
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  </div>
);

export const Widget: React.FC<WidgetProps> = ({
  widget, isFocused, isRelated, isBlurred, isDived = false,
  onHover, onSelect, onDoubleTap,
}) => {
  const { id, icon, title, subtitle, priority, category, infoLoad, miniWidgets } = widget;
  const lastTapRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && onDoubleTap) {
      onDoubleTap(id);
    } else {
      onSelect(id);
    }
    lastTapRef.current = now;
  }, [id, onSelect, onDoubleTap]);
  
  const scale = PRIORITY_SCALE[priority];
  const categoryStyle = CATEGORY_COLORS[category];

  // Apple Widget sizes (scaled for 3D scene)
  // Small: 170×170 → base 150
  const baseSize = 150;
  const width = baseSize * scale;
  const height = baseSize * scale * 0.85; // Slightly more compact ratio

  const glowColor = useMemo(() => {
    switch (category) {
      case 'system': return APPLE_COLORS.teal;
      case 'productivity': return APPLE_COLORS.green;
      case 'communication': return APPLE_COLORS.blue;
      case 'media': return APPLE_COLORS.pink;
      case 'utilities': return APPLE_COLORS.orange;
      default: return APPLE_COLORS.blue;
    }
  }, [category]);

  const containerStyle = useMemo(() => {
    let transform = 'translate(-50%, -50%)';
    let filter = 'none';
    let opacity = 1;

    // Elevation shadows — Apple depth system
    let boxShadow = isDark
      ? `0 8px 32px 0 rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.06)`
      : `0 8px 32px 0 rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.5)`;

    if (isDived) {
      transform = 'translate(-50%, -50%) scale(1.5)';
      boxShadow = `0 24px 64px ${glowColor}40, 0 0 80px ${glowColor}30, inset 0 0.5px 0 rgba(255,255,255,${isDark ? '0.1' : '0.5'})`;
    } else if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.25)';
      boxShadow = `0 16px 48px ${glowColor}35, 0 0 48px ${glowColor}25, inset 0 0.5px 0 rgba(255,255,255,${isDark ? '0.08' : '0.4'})`;
    } else if (isRelated) {
      boxShadow = `0 12px 36px ${glowColor}25, 0 0 24px ${glowColor}15, inset 0 0.5px 0 rgba(255,255,255,${isDark ? '0.06' : '0.35'})`;
    } else if (isBlurred) {
      filter = 'blur(6px)';
      opacity = 0.25;
    }

    return {
      width: `${width}px`,
      height: `${height}px`,
      transform, filter, opacity, boxShadow,
      // iOS 26 liquid glass
      background: isDark
        ? 'linear-gradient(145deg, rgba(44, 44, 46, 0.75) 0%, rgba(28, 28, 30, 0.55) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.45) 100%)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: isDark
        ? '0.5px solid rgba(255, 255, 255, 0.1)'
        : '0.5px solid rgba(255, 255, 255, 0.6)',
      borderRadius: '20px', // Apple WidgetKit small/medium
      padding: '16px', // Apple standard padding
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      position: 'relative' as const,
      fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
    };
  }, [isFocused, isRelated, isBlurred, isDived, width, height, glowColor, isDark]);

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
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${subtitle}. Двойной клик для погружения.`}
      >
        {/* Category tint overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: categoryStyle.gradient,
          opacity: isDark ? 0.5 : 0.4,
          pointerEvents: 'none',
        }} />

        {/* Glass highlight — top edge refraction */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
          pointerEvents: 'none',
        }} />

        {/* Content — Apple typography hierarchy */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Icon */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            background: categoryStyle.iconBg,
            marginBottom: 8,
          }}>
            {icon}
          </div>

          {/* Title & Subtitle */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
              marginBottom: 2,
            }}>
              {title}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 400,
              lineHeight: 1.3,
              letterSpacing: '0',
              color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            }}>
              {subtitle}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 'auto' }}>
            <InfoLoadBar value={infoLoad} color={glowColor} isDark={isDark} />
          </div>

          {/* Critical indicator */}
          {priority === 'critical' && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: APPLE_COLORS.red,
              boxShadow: `0 0 8px ${APPLE_COLORS.red}80`,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Mini-widgets orbit */}
        {isFocused && miniWidgets.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
            {miniWidgets.map((mini, i) => (
              <MiniWidget
                key={mini.id}
                data={mini}
                index={i}
                total={miniWidgets.length}
                parentSize={width}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes miniWidgetFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Html>
  );
};