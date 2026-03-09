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
  MiniWidgetData,
  WidgetSize 
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

// Apple WidgetKit sizes (scaled for 3D scene ~0.8x)
const WIDGET_SIZES: Record<WidgetSize, { width: number; height: number; radius: number }> = {
  small: { width: 136, height: 136, radius: 20 },
  medium: { width: 290, height: 136, radius: 20 },
  large: { width: 290, height: 306, radius: 24 },
};

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
  parentWidth: number;
  isDark: boolean;
}> = ({ data, index, total, parentWidth, isDark }) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = Math.max(90, parentWidth * 0.4);
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
        minHeight: 36,
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
    >
      <span style={{ fontSize: 14 }}>{data.icon}</span>
      <span>{data.label}</span>
    </div>
  );
};

// Progress bar
const ProgressBar: React.FC<{ value: number; color: string; isDark: boolean; height?: number }> = ({ 
  value, color, isDark, height = 4 
}) => (
  <div style={{
    width: '100%',
    height,
    borderRadius: height / 2,
    overflow: 'hidden',
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }}>
    <div
      style={{
        height: '100%',
        borderRadius: height / 2,
        width: `${value}%`,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  </div>
);

// Activity Ring (for Health/Fitness)
const ActivityRing: React.FC<{ progress: number; color: string; size?: number }> = ({ 
  progress, color, size = 48 
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

// ===== SMALL WIDGET LAYOUT =====
const SmallWidgetContent: React.FC<{
  widget: WidgetData;
  isDark: boolean;
  glowColor: string;
  categoryStyle: { iconBg: string };
}> = ({ widget, isDark, glowColor, categoryStyle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 9,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      background: categoryStyle.iconBg,
      marginBottom: 8,
    }}>
      {widget.icon}
    </div>
    
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
        marginBottom: 2,
      }}>
        {widget.title}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 400,
        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
      }}>
        {widget.subtitle}
      </div>
    </div>
    
    <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} />
  </div>
);

// ===== MEDIUM WIDGET LAYOUT =====
const MediumWidgetContent: React.FC<{
  widget: WidgetData;
  isDark: boolean;
  glowColor: string;
  categoryStyle: { iconBg: string };
}> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData } = widget;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          background: categoryStyle.iconBg,
        }}>
          {widget.icon}
        </div>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
          }}>
            {widget.title}
          </div>
          <div style={{
            fontSize: 11,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          }}>
            {widget.subtitle}
          </div>
        </div>
        {widgetData?.unread && (
          <div style={{
            marginLeft: 'auto',
            background: APPLE_COLORS.red,
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {widgetData.unread}
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', gap: 12 }}>
        {widgetData?.items ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {widgetData.items.slice(0, 3).map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
              }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {item.value && (
                  <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        
        {widgetData?.progress !== undefined && (
          <ActivityRing progress={widgetData.progress} color={glowColor} size={56} />
        )}
      </div>
      
      <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} height={3} />
    </div>
  );
};

// ===== LARGE WIDGET LAYOUT =====
const LargeWidgetContent: React.FC<{
  widget: WidgetData;
  isDark: boolean;
  glowColor: string;
  categoryStyle: { iconBg: string };
}> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData } = widget;
  const isWeather = widget.id === 'weather';
  const isHealth = widget.id === 'health';
  const isCalendar = widget.id === 'calendar';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          background: categoryStyle.iconBg,
        }}>
          {widget.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
          }}>
            {widget.title}
          </div>
          <div style={{
            fontSize: 13,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
          }}>
            {widget.subtitle}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Weather specific */}
        {isWeather && widgetData?.temperature !== undefined && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: 56,
                  fontWeight: 200,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
                }}>
                  {widgetData.temperature}°
                </div>
                <div style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
                  marginTop: 4,
                }}>
                  {widgetData.condition}
                </div>
              </div>
              <div style={{ fontSize: 48 }}>🌤️</div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {widgetData.items?.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                }}>
                  <span>{item.icon}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Health specific */}
        {isHealth && widgetData && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ActivityRing progress={widgetData.progress || 0} color={APPLE_COLORS.red} size={72} />
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 600,
                  color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)',
                }}>
                  {widgetData.steps?.toLocaleString()}
                </div>
                <div style={{
                  fontSize: 13,
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                }}>
                  шагов
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {widgetData.items?.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                }}>
                  <span>{item.icon} {item.label}</span>
                  <span style={{ fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Calendar specific */}
        {isCalendar && widgetData?.events && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Сегодня
            </div>
            {widgetData.events.map((event, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 10,
                borderLeft: `3px solid ${event.color}`,
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                  minWidth: 45,
                }}>
                  {event.time}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                }}>
                  {event.title}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Generic large widget content */}
        {!isWeather && !isHealth && !isCalendar && widgetData?.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {widgetData.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                fontSize: 14,
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)',
              }}>
                <span>{item.icon} {item.label}</span>
                <span style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} height={3} />
    </div>
  );
};

// ===== MAIN WIDGET COMPONENT =====
export const Widget: React.FC<WidgetProps> = ({
  widget, isFocused, isRelated, isBlurred, isDived = false,
  onHover, onSelect, onDoubleTap,
}) => {
  const { id, icon, title, subtitle, priority, category, size, infoLoad, miniWidgets } = widget;
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
  
  const sizeConfig = WIDGET_SIZES[size];
  const priorityScale = PRIORITY_SCALE[priority];
  const categoryStyle = CATEGORY_COLORS[category];
  
  // Apply priority scaling
  const width = sizeConfig.width * priorityScale;
  const height = sizeConfig.height * priorityScale;
  const borderRadius = sizeConfig.radius;

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

    if (isDived) {
      transform = 'translate(-50%, -50%) scale(1.4)';
      boxShadow = `0 24px 64px ${glowColor}40, 0 0 80px ${glowColor}30, inset 0 0.5px 0 rgba(255,255,255,${isDark ? '0.1' : '0.5'})`;
    } else if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.15)';
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
      background: isDark
        ? 'linear-gradient(145deg, rgba(44, 44, 46, 0.75) 0%, rgba(28, 28, 30, 0.55) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.45) 100%)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: isDark
        ? '0.5px solid rgba(255, 255, 255, 0.1)'
        : '0.5px solid rgba(255, 255, 255, 0.6)',
      borderRadius: `${borderRadius}px`,
      padding: '16px',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      position: 'relative' as const,
      fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
    };
  }, [isFocused, isRelated, isBlurred, isDived, width, height, borderRadius, glowColor, isDark]);

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
        {/* Category tint */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          background: categoryStyle.gradient,
          opacity: isDark ? 0.5 : 0.4,
          pointerEvents: 'none',
        }} />

        {/* Glass highlight */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
          pointerEvents: 'none',
        }} />

        {/* Content based on size */}
        <div style={{ position: 'relative', height: '100%' }}>
          {size === 'small' && (
            <SmallWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />
          )}
          {size === 'medium' && (
            <MediumWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />
          )}
          {size === 'large' && (
            <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />
          )}
          
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
                parentWidth={width}
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