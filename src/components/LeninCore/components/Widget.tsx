// iOS 26 Style Widget Component — uses extracted interactive renderers
import React, { useMemo, useCallback, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { WidgetData, PRIORITY_SCALE, CATEGORY_COLORS, MiniWidgetData, WidgetSize } from '../types';
import type { MorphPhase } from '../hooks/useDiveAnimation';
import {
  SMALL_WIDGETS, MEDIUM_WIDGETS, LARGE_WIDGETS,
  ProgressBar, textPrimary, textTertiary, textSecondary,
  type WidgetContentProps,
} from './WidgetRenderers';

interface WidgetProps {
  widget: WidgetData;
  isFocused: boolean;
  isRelated: boolean;
  isBlurred: boolean;
  isDived?: boolean;
  morphProgress?: number;
  morphPhase?: MorphPhase;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDoubleTap?: (id: string) => void;
}

const WIDGET_SIZES: Record<WidgetSize, { width: number; height: number; radius: number }> = {
  small: { width: 155, height: 155, radius: 22 },
  medium: { width: 320, height: 155, radius: 22 },
  large: { width: 320, height: 340, radius: 26 },
};

const APPLE_COLORS = {
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', orange: '#FF9500',
  yellow: '#FFCC00', purple: '#AF52DE', pink: '#FF2D55', teal: '#5AC8FA', indigo: '#5856D6',
};

const MiniWidget: React.FC<{
  data: MiniWidgetData; index: number; total: number; parentWidth: number; isDark: boolean;
}> = ({ data, index, total, parentWidth, isDark }) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = Math.max(100, parentWidth * 0.42);
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;
  return (
    <div style={{
      position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 12px', minHeight: 36, borderRadius: 18, fontSize: 12, fontWeight: 600,
      fontFamily: '-apple-system, SF Pro Text, system-ui, sans-serif',
      cursor: 'pointer', transition: 'transform 0.2s ease',
      animation: `miniWidgetFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
      background: isDark ? 'linear-gradient(180deg, rgba(44,44,46,0.85), rgba(28,28,30,0.7))' : 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))',
      backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: isDark ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(0,0,0,0.06)',
      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.08)',
      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
    }}>
      <span style={{ fontSize: 14 }}>{data.icon}</span>
      <span>{data.label}</span>
    </div>
  );
};

// Default fallback renderers
const DefaultSmall: React.FC<WidgetContentProps> = ({ widget, isDark, glowColor, categoryStyle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: categoryStyle.iconBg, marginBottom: 8 }}>{widget.icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark), marginBottom: 2 }}>{widget.title}</div>
      <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.subtitle}</div>
    </div>
    <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} />
  </div>
);

const DefaultMedium: React.FC<WidgetContentProps> = ({ widget, isDark, glowColor, categoryStyle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: categoryStyle.iconBg }}>{widget.icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.title}</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.subtitle}</div>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {widget.widgetData?.items?.slice(0, 3).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: textSecondary(isDark) }}>
          <span>{item.icon}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          {item.value && <span style={{ fontSize: 11, color: textTertiary(isDark) }}>{item.value}</span>}
        </div>
      ))}
    </div>
    <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} height={3} />
  </div>
);

const DefaultLarge: React.FC<WidgetContentProps> = ({ widget, isDark, glowColor, categoryStyle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: categoryStyle.iconBg }}>{widget.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>{widget.title}</div>
        <div style={{ fontSize: 13, color: textTertiary(isDark) }}>{widget.subtitle}</div>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {widget.widgetData?.items?.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, fontSize: 14, color: textSecondary(isDark) }}>
          <span>{item.icon} {item.label}</span>
          <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
        </div>
      ))}
    </div>
    <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} height={3} />
  </div>
);

function getRenderer(size: WidgetSize, id: string): React.FC<WidgetContentProps> {
  if (size === 'small') return SMALL_WIDGETS[id] || DefaultSmall;
  if (size === 'medium') return MEDIUM_WIDGETS[id] || DefaultMedium;
  return LARGE_WIDGETS[id] || DefaultLarge;
}

export const Widget: React.FC<WidgetProps> = ({
  widget, isFocused, isRelated, isBlurred, isDived = false,
  morphProgress = 0, morphPhase = 'idle',
  onHover, onSelect, onDoubleTap,
}) => {
  const { id, title, subtitle, priority, category, size, miniWidgets } = widget;
  const lastTapRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && onDoubleTap) { onDoubleTap(id); } else { onSelect(id); }
    lastTapRef.current = now;
  }, [id, onSelect, onDoubleTap]);

  const sizeConfig = WIDGET_SIZES[size];
  const priorityScale = PRIORITY_SCALE[priority];
  const categoryStyle = CATEGORY_COLORS[category];
  const largeConfig = WIDGET_SIZES['large'];
  const isMorphing = morphPhase === 'expanding' || morphPhase === 'collapsing' || morphPhase === 'expanded';
  const mp = isMorphing ? morphProgress : 0;

  const baseWidth = sizeConfig.width * priorityScale;
  const baseHeight = sizeConfig.height * priorityScale;
  const targetWidth = largeConfig.width * 1.6;
  const targetHeight = largeConfig.height * 1.6;
  const width = isMorphing ? baseWidth + (targetWidth - baseWidth) * mp : baseWidth;
  const height = isMorphing ? baseHeight + (targetHeight - baseHeight) * mp : baseHeight;
  const borderRadius = isMorphing ? sizeConfig.radius + (largeConfig.radius - sizeConfig.radius) * mp : sizeConfig.radius;
  const showLargeContent = isMorphing && mp > 0.3;
  const contentOpacity = isMorphing ? (mp > 0.3 ? Math.min((mp - 0.3) / 0.4, 1) : 0) : 1;
  const originalContentOpacity = isMorphing ? Math.max(1 - mp * 2, 0) : 1;

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
    let boxShadow = isDark
      ? `0 8px 32px 0 rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.06)`
      : `0 8px 32px 0 rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.5)`;

    if (isDived || isMorphing) {
      const scale = 1 + 0.4 * mp;
      transform = `translate(-50%, -50%) scale(${scale})`;
      const gi = Math.floor(mp * 64);
      boxShadow = `0 ${8 + gi}px ${32 + gi}px ${glowColor}${Math.floor(mp * 40).toString(16).padStart(2, '0')}, 0 0 ${gi}px ${glowColor}${Math.floor(mp * 30).toString(16).padStart(2, '0')}`;
    } else if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.15)';
      boxShadow = `0 16px 48px ${glowColor}35, 0 0 48px ${glowColor}25`;
    } else if (isRelated) {
      boxShadow = `0 12px 36px ${glowColor}25, 0 0 24px ${glowColor}15`;
    } else if (isBlurred) {
      filter = 'blur(6px)'; opacity = 0.25;
    }

    return {
      width: `${width}px`, height: `${height}px`, transform, filter, opacity, boxShadow,
      background: isDark ? 'linear-gradient(145deg, rgba(44,44,46,0.75), rgba(28,28,30,0.55))' : 'linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))',
      backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: isDark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(255,255,255,0.6)',
      borderRadius: `${borderRadius}px`, padding: '16px',
      transition: isMorphing ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer', position: 'relative' as const,
      fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
      overflow: 'hidden',
    };
  }, [isFocused, isRelated, isBlurred, isDived, isMorphing, width, height, borderRadius, glowColor, isDark, mp]);

  const contentProps: WidgetContentProps = { widget, isDark, glowColor, categoryStyle };
  const CurrentRenderer = getRenderer(size, id);
  const LargeRenderer = getRenderer('large', id);

  return (
    <Html position={[widget.position.x / 100, -widget.position.y / 100, widget.position.z / 50]} center distanceFactor={8} zIndexRange={[100, 0]}>
      <div style={containerStyle} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onClick={handleClick} role="button" tabIndex={0} aria-label={`${title}: ${subtitle}`}>
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: categoryStyle.gradient, opacity: isDark ? 0.5 : 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 40%)' : 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent 40%)', pointerEvents: 'none' }} />

        {isMorphing && mp > 0 && (
          <div style={{
            position: 'absolute', inset: -2, borderRadius: borderRadius + 2,
            border: `2px solid ${glowColor}`, opacity: mp * 0.6,
            boxShadow: `0 0 ${20 * mp}px ${glowColor}40, inset 0 0 ${10 * mp}px ${glowColor}20`,
            pointerEvents: 'none', transition: 'none',
          }} />
        )}

        <div style={{ position: 'relative', height: '100%' }}>
          {isMorphing && !showLargeContent && (
            <div style={{ opacity: originalContentOpacity, transition: 'none' }}>
              <CurrentRenderer {...contentProps} />
            </div>
          )}
          {isMorphing && showLargeContent && (
            <div style={{ opacity: contentOpacity, transition: 'none' }}>
              <LargeRenderer {...contentProps} />
            </div>
          )}
          {!isMorphing && <CurrentRenderer {...contentProps} />}

          {priority === 'critical' && !isMorphing && (
            <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, background: APPLE_COLORS.red, boxShadow: `0 0 8px ${APPLE_COLORS.red}80`, animation: 'pulse 2s ease-in-out infinite' }} />
          )}
        </div>

        {isFocused && !isMorphing && miniWidgets.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
            {miniWidgets.map((mini, i) => (
              <MiniWidget key={mini.id} data={mini} index={i} total={miniWidgets.length} parentWidth={width} isDark={isDark} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes miniWidgetFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </Html>
  );
};
