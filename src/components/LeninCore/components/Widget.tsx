// iOS 26 Style Widget Component — Full Apple WidgetKit Specifications
// Every widget has its own specific rich UI layout
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
import type { MorphPhase } from '../hooks/useDiveAnimation';

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
  small: { width: 136, height: 136, radius: 20 },
  medium: { width: 290, height: 136, radius: 20 },
  large: { width: 290, height: 306, radius: 24 },
};

const APPLE_COLORS = {
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', orange: '#FF9500',
  yellow: '#FFCC00', purple: '#AF52DE', pink: '#FF2D55', teal: '#5AC8FA', indigo: '#5856D6',
};

// ===== SHARED COMPONENTS =====

const MiniWidget: React.FC<{
  data: MiniWidgetData; index: number; total: number; parentWidth: number; isDark: boolean;
}> = ({ data, index, total, parentWidth, isDark }) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = Math.max(90, parentWidth * 0.4);
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;
  return (
    <div style={{
      position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 12px', minHeight: 36, borderRadius: 18, fontSize: 12, fontWeight: 600,
      fontFamily: '-apple-system, SF Pro Text, system-ui, sans-serif', letterSpacing: '-0.01em',
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

const ProgressBar: React.FC<{ value: number; color: string; isDark: boolean; height?: number }> = ({ value, color, isDark, height = 4 }) => (
  <div style={{ width: '100%', height, borderRadius: height / 2, overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
    <div style={{ height: '100%', borderRadius: height / 2, width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)`, transition: 'width 0.5s ease' }} />
  </div>
);

const ActivityRing: React.FC<{ progress: number; color: string; size?: number; strokeWidth?: number }> = ({ progress, color, size = 48, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
};

const Divider: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', margin: '2px 0' }} />
);

const SectionLabel: React.FC<{ children: React.ReactNode; isDark: boolean }> = ({ children, isDark }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
    {children}
  </div>
);

const textPrimary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)';
const textSecondary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
const textTertiary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
const rowBg = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

// ===== SMALL WIDGET LAYOUTS =====

const SmallWidgetContent: React.FC<{ widget: WidgetData; isDark: boolean; glowColor: string; categoryStyle: { iconBg: string } }> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData, id } = widget;

  // Clock widget
  if (id === 'reminders') {
    const now = new Date();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginBottom: 4 }}>🌍 Москва</div>
        <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: '-0.02em', color: textPrimary(isDark), lineHeight: 1 }}>
          {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
        </div>
        {widgetData?.items?.[0] && (
          <div style={{ fontSize: 11, color: textSecondary(isDark), marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⏰</span> {widgetData.items[0].label} <span style={{ color: textTertiary(isDark) }}>{widgetData.items[0].value}</span>
          </div>
        )}
      </div>
    );
  }

  // Wallet widget
  if (id === 'wallet') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>💳</div>
        <div>
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widgetData?.items?.[0]?.label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary(isDark), letterSpacing: '-0.02em' }}>{widgetData?.items?.[0]?.value}</div>
        </div>
      </div>
    );
  }

  // Notes widget
  if (id === 'notes') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Заметки</span>
        </div>
        <div style={{ fontSize: 11, color: textSecondary(isDark), marginBottom: 4 }}>+ Создать</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {widgetData?.unread && <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.unread}</div>}
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>заметок</div>
        </div>
      </div>
    );
  }

  // Files widget
  if (id === 'files') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📁</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Файлы</span>
        </div>
        <div style={{ flex: 1 }}>
          {widgetData?.items?.slice(0, 2).map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: textSecondary(isDark), marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>
        {widgetData?.unread && <div style={{ fontSize: 11, color: textTertiary(isDark) }}>+{widgetData.unread} недавних</div>}
      </div>
    );
  }

  // Phone widget
  if (id === 'phone') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
        {widgetData?.unread ? (
          <>
            <div style={{ background: APPLE_COLORS.red, color: 'white', fontSize: 18, fontWeight: 700, width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>{widgetData.unread}</div>
            <div style={{ fontSize: 11, color: textSecondary(isDark) }}>Пропущено</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: textSecondary(isDark) }}>Телефон</div>
        )}
      </div>
    );
  }

  // Contacts
  if (id === 'contacts') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8 }}>👤</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'Мама'}</div>
        <div style={{ fontSize: 11, color: textSecondary(isDark), marginTop: 4 }}>{widgetData?.items?.[0]?.value || '📞 💬'}</div>
      </div>
    );
  }

  // FaceTime
  if (id === 'facetime') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📹</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'FaceTime'}</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginTop: 2 }}>{widgetData?.items?.[0]?.value || ''}</div>
      </div>
    );
  }

  // Camera
  if (id === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>📸</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: textSecondary(isDark) }}>
          <span>📷</span><span>🎞️</span><span>🌃</span>
        </div>
      </div>
    );
  }

  // Podcasts
  if (id === 'podcasts') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{widgetData?.items?.[0]?.label || 'Подкасты'}</div>
          <div style={{ marginTop: 6, fontSize: 18, cursor: 'pointer' }}>▶️</div>
        </div>
      </div>
    );
  }

  // TV
  if (id === 'tv') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📺</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'Apple TV+'}</div>
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>🎬 Каталог</div>
        </div>
      </div>
    );
  }

  // Books
  if (id === 'books') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>Books</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label}</div>
          <div style={{ fontSize: 11, color: textTertiary(isDark), marginTop: 2 }}>{widgetData?.items?.[0]?.value}</div>
        </div>
        {widgetData?.progress !== undefined && <ProgressBar value={widgetData.progress} color={glowColor} isDark={isDark} />}
      </div>
    );
  }

  // Freeform
  if (id === 'freeform') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>Freeform</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginTop: 2 }}>+ Создать</div>
      </div>
    );
  }

  // FindMy
  if (id === 'findmy') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || '3 устройства'}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 16 }}>📱 💻 ⌚</div>
      </div>
    );
  }

  // Translate
  if (id === 'translate') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'EN → RU'}</div>
      </div>
    );
  }

  // App Store
  if (id === 'appstore') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🛍️</div>
        <div style={{ flex: 1 }} />
        {widgetData?.unread ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: APPLE_COLORS.blue, color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>
            <span style={{ fontSize: 11, color: textSecondary(isDark) }}>обновлений</span>
          </div>
        ) : null}
      </div>
    );
  }

  // Settings (processing-queue)
  if (id === 'processing-queue') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚙️</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ color: APPLE_COLORS.green, fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default small
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: categoryStyle.iconBg, marginBottom: 8 }}>{widget.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark), marginBottom: 2 }}>{widget.title}</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.subtitle}</div>
      </div>
      <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} />
    </div>
  );
};

// ===== MEDIUM WIDGET LAYOUTS =====

const MediumWidgetContent: React.FC<{ widget: WidgetData; isDark: boolean; glowColor: string; categoryStyle: { iconBg: string } }> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData, id } = widget;

  // Siri widget — voice suggestions
  if (id === 'siri') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, #FF2D55, #AF52DE, #007AFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Siri</div>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>Предложения</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: rowBg(isDark), fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{item.label}"</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Music — Now Playing
  if (id === 'music') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, #FF2D55, #AF52DE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'Сейчас играет'}</div>
            <div style={{ fontSize: 12, color: textSecondary(isDark) }}>{widgetData?.items?.[0]?.value || ''}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>▶️</span>
          <div style={{ flex: 1 }}><ProgressBar value={widgetData?.progress || 65} color={APPLE_COLORS.pink} isDark={isDark} height={3} /></div>
          <span style={{ fontSize: 11, color: textTertiary(isDark) }}>{widgetData?.items?.[1]?.label || '3:42'}</span>
        </div>
      </div>
    );
  }

  // Messages — chat list
  if (id === 'messages') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Messages</span>
          {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: textSecondary(isDark) }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{item.icon}</div>
              <span style={{ fontWeight: 500, color: textPrimary(isDark), minWidth: 40 }}>{item.label}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textTertiary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mail — inbox
  if (id === 'mail') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📧</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Входящие</span>
          {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: textSecondary(isDark) }}>
              <span style={{ fontWeight: 600, color: textPrimary(isDark), minWidth: 36 }}>{item.label}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fitness — Activity Rings
  if (id === 'fitness') {
    return (
      <div style={{ display: 'flex', height: '100%', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <ActivityRing progress={widgetData?.progress || 54} color={APPLE_COLORS.red} size={72} strokeWidth={7} />
          <div style={{ position: 'absolute' }}>
            <ActivityRing progress={(widgetData?.exerciseMinutes || 25) / 30 * 100} color={APPLE_COLORS.green} size={56} strokeWidth={6} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <ActivityRing progress={(widgetData?.standHours || 8) / 12 * 100} color={APPLE_COLORS.teal} size={40} strokeWidth={5} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Neural Engine — performance metrics
  if (id === 'neural-engine') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔮</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Neural Engine</div>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>16-core</div>
          </div>
          {widgetData?.progress && (
            <div style={{ marginLeft: 'auto' }}>
              <ActivityRing progress={widgetData.progress} color={APPLE_COLORS.teal} size={40} strokeWidth={4} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // iCloud — storage
  if (id === 'memory-bank') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>💾</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>iCloud</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: textSecondary(isDark) }}>128/200 ГБ</span>
        </div>
        <ProgressBar value={widgetData?.progress || 64} color={APPLE_COLORS.blue} isDark={isDark} height={6} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
          {widgetData?.items?.slice(1).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Safari — tabs
  if (id === 'safari') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🧭</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Safari</span>
          {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tasks/Reminders — todo list
  if (id === 'tasks') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Напоминания</span>
          {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: item.value === '✓' ? textTertiary(isDark) : textSecondary(isDark), textDecoration: item.value === '✓' ? 'line-through' : 'none' }}>
              <span style={{ color: item.value === '✓' ? APPLE_COLORS.green : textTertiary(isDark) }}>{item.value === '✓' ? '●' : '○'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Shortcuts — grid
  if (id === 'shortcuts') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Команды</span>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {widgetData?.items?.slice(0, 4).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: rowBg(isDark), fontSize: 11, color: textSecondary(isDark) }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // News — headlines
  if (id === 'news') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📰</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Для вас</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ padding: '5px 0', borderBottom: i < (widgetData.items?.length || 0) - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: textTertiary(isDark), marginTop: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Maps — navigation
  if (id === 'maps') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Карты</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: rowBg(isDark) }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary(isDark), flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 12, color: textSecondary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Home — smart home
  if (id === 'homekit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Дом</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: rowBg(isDark) }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: textPrimary(isDark), flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: item.value === 'Вкл' ? APPLE_COLORS.yellow : textTertiary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default medium
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: categoryStyle.iconBg }}>{widget.icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.title}</div>
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.subtitle}</div>
        </div>
        {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {widgetData?.items?.slice(0, 3).map((item, i) => (
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
};

// ===== LARGE WIDGET LAYOUTS =====

const LargeWidgetContent: React.FC<{ widget: WidgetData; isDark: boolean; glowColor: string; categoryStyle: { iconBg: string } }> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData, id } = widget;

  // Weather — Full Apple style
  if (id === 'weather' && widgetData?.temperature !== undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 64, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.03em', color: textPrimary(isDark) }}>{widgetData.temperature}°</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: textSecondary(isDark), marginTop: 6 }}>{widgetData.condition}</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark), marginTop: 2 }}>H:{widgetData.tempHigh}° L:{widgetData.tempLow}°</div>
          </div>
          <div style={{ fontSize: 56, filter: 'drop-shadow(0 4px 12px rgba(255,180,0,0.3))' }}>
            {widgetData.condition?.includes('Солн') ? '☀️' : widgetData.condition?.includes('Обл') ? '⛅' : widgetData.condition?.includes('Дожд') ? '🌧️' : '🌤️'}
          </div>
        </div>
        <Divider isDark={isDark} />
        {widgetData.hourlyForecast && (
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <SectionLabel isDark={isDark}>Прогноз по часам</SectionLabel>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              {widgetData.hourlyForecast.slice(0, 5).map((h, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{h.time}</div>
                  <div style={{ fontSize: 20 }}>{h.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: textPrimary(isDark) }}>{h.temp}°</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Divider isDark={isDark} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { icon: '💧', label: 'Влажность', value: `${widgetData.humidity}%` },
            { icon: '💨', label: 'Ветер', value: `${widgetData.wind} м/с` },
            { icon: '🌡️', label: 'Ощущается', value: `${widgetData.feelsLike}°` },
            { icon: '🌧️', label: 'Осадки', value: `${widgetData.precipitation}%` },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: textSecondary(isDark) }}>
              <span>{d.icon}</span><span>{d.label}</span><span style={{ marginLeft: 'auto', fontWeight: 500 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Health — Full Apple style with triple rings
  if (id === 'health' && widgetData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>❤️</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Сегодня</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Здоровье</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityRing progress={widgetData.progress || 84} color={APPLE_COLORS.red} size={80} strokeWidth={8} />
            <div style={{ position: 'absolute' }}>
              <ActivityRing progress={(widgetData.exerciseMinutes || 25) / 30 * 100} color={APPLE_COLORS.green} size={62} strokeWidth={7} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <ActivityRing progress={(widgetData.standHours || 8) / 12 * 100} color={APPLE_COLORS.teal} size={44} strokeWidth={6} />
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: APPLE_COLORS.red }} />
              <span style={{ fontSize: 12, color: textSecondary(isDark) }}>Движение</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.calories} ккал</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: APPLE_COLORS.green }} />
              <span style={{ fontSize: 12, color: textSecondary(isDark) }}>Упражнения</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.exerciseMinutes} мин</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: APPLE_COLORS.teal }} />
              <span style={{ fontSize: 12, color: textSecondary(isDark) }}>Вставание</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.standHours} ч</span>
            </div>
          </div>
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>🚶 Шаги</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.steps?.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>🏃 Дистанция</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>5.2 км</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>⏱️ Время</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>45 мин</div>
          </div>
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {widgetData.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calendar — Full Apple style
  if (id === 'calendar' && widgetData?.events) {
    const today = new Date();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: APPLE_COLORS.red, textTransform: 'uppercase' }}>
              {today.toLocaleDateString('ru', { month: 'long' })}
            </div>
            <div style={{ fontSize: 34, fontWeight: 200, color: textPrimary(isDark), lineHeight: 1 }}>{today.getDate()}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary(isDark) }}>
              {today.toLocaleDateString('ru', { weekday: 'long' })}
            </div>
          </div>
        </div>
        <Divider isDark={isDark} />
        <SectionLabel isDark={isDark}>Сегодня</SectionLabel>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {widgetData.events.map((event, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: rowBg(isDark), borderRadius: 10, borderLeft: `3px solid ${event.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: textSecondary(isDark), minWidth: 45 }}>{event.time}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: textPrimary(isDark) }}>{event.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Apple Intelligence — AI dashboard
  if (id === 'lmm-core' && widgetData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, rgba(88,196,221,0.3), rgba(175,82,222,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Apple Intelligence</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Активен</div>
          </div>
          <ActivityRing progress={widgetData.progress || 92} color={APPLE_COLORS.teal} size={40} strokeWidth={4} />
        </div>
        <Divider isDark={isDark} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {widgetData.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: rowBg(isDark), borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: textPrimary(isDark) }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: APPLE_COLORS.teal }}>{item.value}</span>
            </div>
          ))}
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
          {['Текст', 'Изображения', 'Код'].map((label, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{['✓', '✓', '✓'][i]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Photos — gallery grid
  if (id === 'photos' && widgetData) {
    const photoEmojis = ['🌅', '🏔️', '🌊', '🌺', '🏙️', '🌌'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>📷</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Фото дня</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Из Воспоминаний</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, marginBottom: 10 }}>
          {photoEmojis.map((emoji, i) => (
            <div key={i} style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 0 ? 32 : 20 }}>
              {emoji}
            </div>
          ))}
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
          {widgetData.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default large
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: categoryStyle.iconBg }}>{widget.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>{widget.title}</div>
          <div style={{ fontSize: 13, color: textTertiary(isDark) }}>{widget.subtitle}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {widgetData?.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, fontSize: 14, color: textSecondary(isDark) }}>
            <span>{item.icon} {item.label}</span>
            <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
          </div>
        ))}
      </div>
      <ProgressBar value={widget.infoLoad} color={glowColor} isDark={isDark} height={3} />
    </div>
  );
};

// ===== MAIN WIDGET COMPONENT =====
export const Widget: React.FC<WidgetProps> = ({
  widget, isFocused, isRelated, isBlurred, isDived = false,
  morphProgress = 0, morphPhase = 'idle',
  onHover, onSelect, onDoubleTap,
}) => {
  const { id, title, subtitle, priority, category, size, infoLoad, miniWidgets } = widget;
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
  
  // Morph: interpolate from current size to large size
  const largeConfig = WIDGET_SIZES['large'];
  const isMorphing = morphPhase === 'expanding' || morphPhase === 'collapsing' || morphPhase === 'expanded';
  const mp = isMorphing ? morphProgress : 0;
  
  const baseWidth = sizeConfig.width * priorityScale;
  const baseHeight = sizeConfig.height * priorityScale;
  const targetWidth = largeConfig.width * 1.6;
  const targetHeight = largeConfig.height * 1.6;
  
  const width = isMorphing ? baseWidth + (targetWidth - baseWidth) * mp : baseWidth;
  const height = isMorphing ? baseHeight + (targetHeight - baseHeight) * mp : baseHeight;
  const borderRadius = isMorphing 
    ? sizeConfig.radius + (largeConfig.radius - sizeConfig.radius) * mp 
    : sizeConfig.radius;

  // Determine which content to show during morph
  const showLargeContent = isMorphing && mp > 0.3;
  const contentOpacity = isMorphing 
    ? (mp > 0.3 ? Math.min((mp - 0.3) / 0.4, 1) : 0)
    : 1;
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
      const glowIntensity = Math.floor(mp * 64);
      boxShadow = `0 ${8 + glowIntensity}px ${32 + glowIntensity}px ${glowColor}${Math.floor(mp * 40).toString(16).padStart(2, '0')}, 0 0 ${glowIntensity}px ${glowColor}${Math.floor(mp * 30).toString(16).padStart(2, '0')}`;
    } else if (isFocused) {
      transform = 'translate(-50%, -50%) scale(1.15)';
      boxShadow = `0 16px 48px ${glowColor}35, 0 0 48px ${glowColor}25`;
    } else if (isRelated) {
      boxShadow = `0 12px 36px ${glowColor}25, 0 0 24px ${glowColor}15`;
    } else if (isBlurred) {
      filter = 'blur(6px)';
      opacity = 0.25;
    }

    return {
      width: `${width}px`, height: `${height}px`, transform, filter, opacity, boxShadow,
      background: isDark
        ? 'linear-gradient(145deg, rgba(44,44,46,0.75), rgba(28,28,30,0.55))'
        : 'linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: isDark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(255,255,255,0.6)',
      borderRadius: `${borderRadius}px`, padding: '16px',
      transition: isMorphing ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer', position: 'relative' as const,
      fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
      overflow: 'hidden',
    };
  }, [isFocused, isRelated, isBlurred, isDived, isMorphing, width, height, borderRadius, glowColor, isDark, mp]);

  // Render the effective content size based on morph state
  const effectiveSize: WidgetSize = showLargeContent ? 'large' : size;

  return (
    <Html position={[widget.position.x / 100, -widget.position.y / 100, widget.position.z / 50]} center distanceFactor={8} zIndexRange={[100, 0]}>
      <div style={containerStyle} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onClick={handleClick} role="button" tabIndex={0} aria-label={`${title}: ${subtitle}`}>
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: categoryStyle.gradient, opacity: isDark ? 0.5 : 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 40%)' : 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent 40%)', pointerEvents: 'none' }} />

        {/* Morph glow ring */}
        {isMorphing && mp > 0 && (
          <div style={{
            position: 'absolute', inset: -2, borderRadius: borderRadius + 2,
            border: `2px solid ${glowColor}`,
            opacity: mp * 0.6,
            boxShadow: `0 0 ${20 * mp}px ${glowColor}40, inset 0 0 ${10 * mp}px ${glowColor}20`,
            pointerEvents: 'none',
            transition: 'none',
          }} />
        )}

        <div style={{ position: 'relative', height: '100%' }}>
          {/* Original content fading out during morph */}
          {isMorphing && !showLargeContent && (
            <div style={{ opacity: originalContentOpacity, transition: 'none' }}>
              {size === 'small' && <SmallWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'medium' && <MediumWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'large' && <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
            </div>
          )}

          {/* Large content fading in during morph */}
          {isMorphing && showLargeContent && (
            <div style={{ opacity: contentOpacity, transition: 'none' }}>
              <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />
            </div>
          )}

          {/* Normal content when not morphing */}
          {!isMorphing && (
            <>
              {size === 'small' && <SmallWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'medium' && <MediumWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'large' && <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
            </>
          )}

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Html>
  );
};
