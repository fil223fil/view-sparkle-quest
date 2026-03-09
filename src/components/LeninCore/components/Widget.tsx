// iOS 26 Style Widget Component — Interactive Apple WidgetKit
// Every widget has unique interactive controls
import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  small: { width: 155, height: 155, radius: 22 },
  medium: { width: 320, height: 155, radius: 22 },
  large: { width: 320, height: 340, radius: 26 },
};

const APPLE_COLORS = {
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', orange: '#FF9500',
  yellow: '#FFCC00', purple: '#AF52DE', pink: '#FF2D55', teal: '#5AC8FA', indigo: '#5856D6',
};

// ===== SHARED UI PRIMITIVES =====

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

// Interactive toggle switch (Apple style)
const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void; color?: string }> = ({ on, onToggle, color = APPLE_COLORS.green }) => (
  <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
    width: 42, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
    background: on ? color : 'rgba(120,120,128,0.32)',
    transition: 'background 0.25s ease',
    display: 'flex', alignItems: 'center',
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 11, background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      transform: on ? 'translateX(16px)' : 'translateX(0)',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }} />
  </div>
);

// Interactive pill button
const PillButton: React.FC<{ label: string; icon?: string; color?: string; isDark: boolean; onClick: () => void; active?: boolean; small?: boolean }> = 
  ({ label, icon, color = APPLE_COLORS.blue, isDark, onClick, active = false, small = false }) => (
  <div onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: small ? '3px 8px' : '5px 12px',
    borderRadius: small ? 8 : 12,
    fontSize: small ? 10 : 12, fontWeight: 600,
    cursor: 'pointer',
    background: active ? color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    color: active ? 'white' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
    transition: 'all 0.2s ease',
    border: active ? 'none' : `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
  }}>
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </div>
);

// Checkbox
const Checkbox: React.FC<{ checked: boolean; onToggle: () => void; color?: string }> = ({ checked, onToggle, color = APPLE_COLORS.blue }) => (
  <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
    width: 20, height: 20, borderRadius: 10, cursor: 'pointer',
    border: checked ? 'none' : '2px solid rgba(120,120,128,0.4)',
    background: checked ? color : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: 11, color: 'white', fontWeight: 700,
  }}>
    {checked && '✓'}
  </div>
);

const textPrimary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)';
const textSecondary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
const textTertiary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
const rowBg = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

// ===== SMALL WIDGET LAYOUTS =====

const SmallWidgetContent: React.FC<{ widget: WidgetData; isDark: boolean; glowColor: string; categoryStyle: { iconBg: string } }> = ({ widget, isDark, glowColor, categoryStyle }) => {
  const { widgetData, id } = widget;

  // Clock widget with alarm toggle
  if (id === 'reminders') {
    const [alarmOn, setAlarmOn] = useState(true);
    const now = new Date();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginBottom: 4 }}>🌍 Москва</div>
        <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: '-0.02em', color: textPrimary(isDark), lineHeight: 1 }}>
          {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: textSecondary(isDark) }}>⏰ 07:00</span>
          <ToggleSwitch on={alarmOn} onToggle={() => setAlarmOn(!alarmOn)} color={APPLE_COLORS.orange} />
        </div>
      </div>
    );
  }

  // Wallet with pay button
  if (id === 'wallet') {
    const [showPay, setShowPay] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>💳</div>
        <div>
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widgetData?.items?.[0]?.label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary(isDark), letterSpacing: '-0.02em' }}>{widgetData?.items?.[0]?.value}</div>
        </div>
        <PillButton label={showPay ? 'Готово ✓' : 'Apple Pay'} icon="💳" color={APPLE_COLORS.indigo} isDark={isDark} onClick={() => setShowPay(!showPay)} active={showPay} small />
      </div>
    );
  }

  // Notes with new note button
  if (id === 'notes') {
    const [noteCount, setNoteCount] = useState(widgetData?.unread || 23);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Заметки</span>
        </div>
        <PillButton label="+ Создать" color={APPLE_COLORS.yellow} isDark={isDark} onClick={() => setNoteCount(n => n + 1)} small />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary(isDark) }}>{noteCount}</div>
          <div style={{ fontSize: 11, color: textTertiary(isDark) }}>заметок</div>
        </div>
      </div>
    );
  }

  // Files with upload action
  if (id === 'files') {
    const [uploaded, setUploaded] = useState(false);
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
        <PillButton label={uploaded ? 'Загружено ✓' : '⬆️ Загрузить'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setUploaded(!uploaded)} active={uploaded} small />
      </div>
    );
  }

  // Phone with call back
  if (id === 'phone') {
    const [calling, setCalling] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
        {widgetData?.unread ? (
          <>
            <div style={{ background: APPLE_COLORS.red, color: 'white', fontSize: 18, fontWeight: 700, width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>{widgetData.unread}</div>
            <PillButton label={calling ? '📞 Звонок...' : '↩️ Перезвонить'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => setCalling(!calling)} active={calling} small />
          </>
        ) : (
          <div style={{ fontSize: 13, color: textSecondary(isDark) }}>Телефон</div>
        )}
      </div>
    );
  }

  // Contacts with quick call
  if (id === 'contacts') {
    const [activeAction, setActiveAction] = useState<string | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8 }}>👤</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'Мама'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <PillButton label="📞" isDark={isDark} onClick={() => setActiveAction(activeAction === 'call' ? null : 'call')} active={activeAction === 'call'} color={APPLE_COLORS.green} small />
          <PillButton label="💬" isDark={isDark} onClick={() => setActiveAction(activeAction === 'msg' ? null : 'msg')} active={activeAction === 'msg'} color={APPLE_COLORS.blue} small />
        </div>
      </div>
    );
  }

  // FaceTime with call button
  if (id === 'facetime') {
    const [calling, setCalling] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📹</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'FaceTime'}</div>
        <PillButton label={calling ? '🔴 Завершить' : '📹 Позвонить'} color={calling ? APPLE_COLORS.red : APPLE_COLORS.green} isDark={isDark} onClick={() => setCalling(!calling)} active={calling} small />
      </div>
    );
  }

  // Camera with mode switcher
  if (id === 'camera') {
    const [mode, setMode] = useState(0);
    const modes = ['📷 Фото', '🎞️ Видео', '🌃 Ночь'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>📸</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {modes.map((m, i) => (
            <PillButton key={i} label={m} isDark={isDark} onClick={() => setMode(i)} active={mode === i} color={APPLE_COLORS.yellow} small />
          ))}
        </div>
      </div>
    );
  }

  // Podcasts with play
  if (id === 'podcasts') {
    const [playing, setPlaying] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{widgetData?.items?.[0]?.label || 'Подкасты'}</div>
          <PillButton label={playing ? '⏸ Пауза' : '▶️ Слушать'} color={APPLE_COLORS.purple} isDark={isDark} onClick={() => setPlaying(!playing)} active={playing} small />
        </div>
      </div>
    );
  }

  // TV with continue watching
  if (id === 'tv') {
    const [watching, setWatching] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📺</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || 'Apple TV+'}</div>
          <PillButton label={watching ? '⏸ Пауза' : '▶️ Смотреть'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setWatching(!watching)} active={watching} small />
        </div>
      </div>
    );
  }

  // Books with resume reading
  if (id === 'books') {
    const [reading, setReading] = useState(false);
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
        <PillButton label={reading ? '📖 Читаю...' : '📖 Продолжить'} color={APPLE_COLORS.orange} isDark={isDark} onClick={() => setReading(!reading)} active={reading} small />
      </div>
    );
  }

  // Freeform with new board
  if (id === 'freeform') {
    const [boards, setBoards] = useState(1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>Freeform</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginBottom: 4 }}>{boards} досок</div>
        <PillButton label="+ Новая" color={APPLE_COLORS.purple} isDark={isDark} onClick={() => setBoards(b => b + 1)} small />
      </div>
    );
  }

  // FindMy with ping
  if (id === 'findmy') {
    const [pinging, setPinging] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData?.items?.[0]?.label || '3 устройства'}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <PillButton label={pinging ? '📡 Сигнал...' : '📍 Найти'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => { setPinging(true); setTimeout(() => setPinging(false), 2000); }} active={pinging} small />
        </div>
      </div>
    );
  }

  // Translate with swap
  if (id === 'translate') {
    const [swapped, setSwapped] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{swapped ? 'RU → EN' : 'EN → RU'}</div>
        <PillButton label="⇄ Поменять" color={APPLE_COLORS.teal} isDark={isDark} onClick={() => setSwapped(!swapped)} small />
      </div>
    );
  }

  // App Store with update
  if (id === 'appstore') {
    const [updates, setUpdates] = useState(widgetData?.unread || 4);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🛍️</div>
        <div style={{ flex: 1 }} />
        {updates > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: APPLE_COLORS.blue, color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{updates}</div>
            <PillButton label="Обновить" color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setUpdates(0)} active small />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: APPLE_COLORS.green, fontWeight: 600 }}>✓ Всё обновлено</div>
        )}
      </div>
    );
  }

  // Settings with toggles
  if (id === 'processing-queue') {
    const [wifi, setWifi] = useState(true);
    const [bt, setBt] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚙️</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: textSecondary(isDark) }}>
            <span>📶 WiFi</span>
            <ToggleSwitch on={wifi} onToggle={() => setWifi(!wifi)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: textSecondary(isDark) }}>
            <span>🔵 Bluetooth</span>
            <ToggleSwitch on={bt} onToggle={() => setBt(!bt)} color={APPLE_COLORS.blue} />
          </div>
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

  // Siri with tappable suggestions
  if (id === 'siri') {
    const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
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
            <div key={i} onClick={(e) => { e.stopPropagation(); setActiveSuggestion(activeSuggestion === i ? null : i); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8,
                background: activeSuggestion === i ? `${APPLE_COLORS.purple}22` : rowBg(isDark),
                border: activeSuggestion === i ? `1px solid ${APPLE_COLORS.purple}44` : '1px solid transparent',
                fontSize: 12, color: activeSuggestion === i ? APPLE_COLORS.purple : textSecondary(isDark), cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
              <span>{item.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>"{item.label}"</span>
              {activeSuggestion === i && <span style={{ fontSize: 10, color: APPLE_COLORS.purple }}>▶</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Music — Now Playing with play/pause
  if (id === 'music') {
    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState(widgetData?.progress || 65);
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
          <PillButton label="⏮" isDark={isDark} onClick={() => setProgress(Math.max(0, progress - 10))} small />
          <PillButton label={playing ? '⏸' : '▶️'} isDark={isDark} onClick={() => setPlaying(!playing)} active={playing} color={APPLE_COLORS.pink} small />
          <PillButton label="⏭" isDark={isDark} onClick={() => setProgress(Math.min(100, progress + 10))} small />
          <div style={{ flex: 1 }}><ProgressBar value={progress} color={APPLE_COLORS.pink} isDark={isDark} height={3} /></div>
          <span style={{ fontSize: 11, color: textTertiary(isDark) }}>{widgetData?.items?.[1]?.label || '3:42'}</span>
        </div>
      </div>
    );
  }

  // Messages with reply action
  if (id === 'messages') {
    const [replying, setReplying] = useState<number | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Messages</span>
          {widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widgetData.unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} onClick={(e) => { e.stopPropagation(); setReplying(replying === i ? null : i); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: textSecondary(isDark), cursor: 'pointer',
                padding: '3px 6px', borderRadius: 8,
                background: replying === i ? `${APPLE_COLORS.blue}15` : 'transparent',
                transition: 'background 0.2s ease',
              }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{item.icon}</div>
              <span style={{ fontWeight: 500, color: textPrimary(isDark), minWidth: 36 }}>{item.label}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textTertiary(isDark) }}>{item.value}</span>
              {replying === i && <span style={{ fontSize: 10, color: APPLE_COLORS.blue }}>↩️</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mail with archive/read
  if (id === 'mail') {
    const [readMails, setReadMails] = useState<Set<number>>(new Set());
    const unread = (widgetData?.unread || 12) - readMails.size;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📧</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Входящие</span>
          {unread > 0 && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unread}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: readMails.has(i) ? textTertiary(isDark) : textSecondary(isDark), opacity: readMails.has(i) ? 0.5 : 1 }}>
              <Checkbox checked={readMails.has(i)} onToggle={() => {
                const next = new Set(readMails);
                readMails.has(i) ? next.delete(i) : next.add(i);
                setReadMails(next);
              }} color={APPLE_COLORS.blue} />
              <span style={{ fontWeight: 600, color: readMails.has(i) ? textTertiary(isDark) : textPrimary(isDark), minWidth: 36 }}>{item.label}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fitness — Activity Rings with workout button
  if (id === 'fitness') {
    const [workoutActive, setWorkoutActive] = useState(false);
    return (
      <div style={{ display: 'flex', height: '100%', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <ActivityRing progress={workoutActive ? 100 : (widgetData?.progress || 54)} color={APPLE_COLORS.red} size={72} strokeWidth={7} />
          <div style={{ position: 'absolute' }}>
            <ActivityRing progress={workoutActive ? 100 : ((widgetData?.exerciseMinutes || 25) / 30 * 100)} color={APPLE_COLORS.green} size={56} strokeWidth={6} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <ActivityRing progress={workoutActive ? 100 : ((widgetData?.standHours || 8) / 12 * 100)} color={APPLE_COLORS.teal} size={40} strokeWidth={5} />
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
          <PillButton label={workoutActive ? '🏃 Активна' : '▶️ Тренировка'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => setWorkoutActive(!workoutActive)} active={workoutActive} small />
        </div>
      </div>
    );
  }

  // Neural Engine with benchmark
  if (id === 'neural-engine') {
    const [benchmarking, setBenchmarking] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔮</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Neural Engine</div>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>16-core</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ActivityRing progress={benchmarking ? 100 : (widgetData?.progress || 95)} color={benchmarking ? APPLE_COLORS.green : APPLE_COLORS.teal} size={40} strokeWidth={4} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
        <PillButton label={benchmarking ? '⏳ Тест...' : '🧪 Benchmark'} color={APPLE_COLORS.teal} isDark={isDark} onClick={() => { setBenchmarking(true); setTimeout(() => setBenchmarking(false), 2000); }} active={benchmarking} small />
      </div>
    );
  }

  // iCloud — storage with manage button
  if (id === 'memory-bank') {
    const [managing, setManaging] = useState(false);
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
        <PillButton label={managing ? '✓ Оптимизировано' : '🗑 Очистить'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setManaging(!managing)} active={managing} small />
      </div>
    );
  }

  // Safari — tabs with new tab
  if (id === 'safari') {
    const [tabs, setTabs] = useState(widgetData?.unread || 7);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🧭</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Safari</span>
          <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{tabs}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <PillButton label="+ Вкладка" color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setTabs(t => t + 1)} small />
          {tabs > 0 && <PillButton label="✕ Закрыть" color={APPLE_COLORS.red} isDark={isDark} onClick={() => setTabs(t => Math.max(0, t - 1))} small />}
        </div>
      </div>
    );
  }

  // Tasks/Reminders — interactive checklist
  if (id === 'tasks') {
    const [checked, setChecked] = useState<Set<number>>(new Set([2])); // 3rd item pre-checked
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Напоминания</span>
          <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{(widgetData?.items?.length || 3) - checked.size}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: checked.has(i) ? textTertiary(isDark) : textSecondary(isDark), textDecoration: checked.has(i) ? 'line-through' : 'none', transition: 'all 0.2s ease' }}>
              <Checkbox checked={checked.has(i)} onToggle={() => {
                const next = new Set(checked);
                checked.has(i) ? next.delete(i) : next.add(i);
                setChecked(next);
              }} color={APPLE_COLORS.blue} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Shortcuts — runnable grid
  if (id === 'shortcuts') {
    const [running, setRunning] = useState<number | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Команды</span>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {widgetData?.items?.slice(0, 4).map((item, i) => (
            <div key={i} onClick={(e) => { e.stopPropagation(); setRunning(i); setTimeout(() => setRunning(null), 1500); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8,
                background: running === i ? `${APPLE_COLORS.orange}22` : rowBg(isDark),
                border: running === i ? `1px solid ${APPLE_COLORS.orange}44` : '1px solid transparent',
                fontSize: 11, color: running === i ? APPLE_COLORS.orange : textSecondary(isDark), cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
              <span>{running === i ? '⏳' : item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // News — bookmarkable headlines
  if (id === 'news') {
    const [saved, setSaved] = useState<Set<number>>(new Set());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>📰</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Для вас</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} style={{ padding: '5px 0', borderBottom: i < (widgetData.items?.length || 0) - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                <div style={{ fontSize: 10, color: textTertiary(isDark), marginTop: 1 }}>{item.value}</div>
              </div>
              <div onClick={(e) => { e.stopPropagation(); const n = new Set(saved); saved.has(i) ? n.delete(i) : n.add(i); setSaved(n); }}
                style={{ cursor: 'pointer', fontSize: 14, color: saved.has(i) ? APPLE_COLORS.yellow : textTertiary(isDark), transition: 'color 0.2s' }}>
                {saved.has(i) ? '★' : '☆'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Maps — navigation with start button
  if (id === 'maps') {
    const [navigating, setNavigating] = useState<number | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Карты</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {widgetData?.items?.map((item, i) => (
            <div key={i} onClick={(e) => { e.stopPropagation(); setNavigating(navigating === i ? null : i); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8,
                background: navigating === i ? `${APPLE_COLORS.blue}15` : rowBg(isDark), cursor: 'pointer',
                border: navigating === i ? `1px solid ${APPLE_COLORS.blue}33` : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary(isDark), flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 12, color: navigating === i ? APPLE_COLORS.blue : textSecondary(isDark), fontWeight: navigating === i ? 600 : 400 }}>
                {navigating === i ? '🧭 В пути' : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Home — smart home with toggles
  if (id === 'homekit') {
    const [devices, setDevices] = useState<Record<number, boolean>>({ 0: true, 1: false });
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
              {item.icon === '💡' ? (
                <ToggleSwitch on={devices[i] ?? item.value === 'Вкл'} onToggle={() => setDevices(d => ({ ...d, [i]: !(d[i] ?? item.value === 'Вкл') }))} color={APPLE_COLORS.yellow} />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 500, color: APPLE_COLORS.orange }}>{item.value}</span>
              )}
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

  // Weather — Full Apple style with location toggle
  if (id === 'weather' && widgetData?.temperature !== undefined) {
    const [unit, setUnit] = useState<'C' | 'F'>('C');
    const temp = unit === 'C' ? widgetData.temperature : Math.round(widgetData.temperature * 9/5 + 32);
    const high = unit === 'C' ? widgetData.tempHigh : Math.round((widgetData.tempHigh || 0) * 9/5 + 32);
    const low = unit === 'C' ? widgetData.tempLow : Math.round((widgetData.tempLow || 0) * 9/5 + 32);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 64, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.03em', color: textPrimary(isDark) }}>{temp}°</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: textSecondary(isDark), marginTop: 6 }}>{widgetData.condition}</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark), marginTop: 2 }}>H:{high}° L:{low}°</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 56, filter: 'drop-shadow(0 4px 12px rgba(255,180,0,0.3))' }}>
              {widgetData.condition?.includes('Солн') ? '☀️' : '🌤️'}
            </div>
            <PillButton label={unit === 'C' ? '°C → °F' : '°F → °C'} isDark={isDark} onClick={() => setUnit(unit === 'C' ? 'F' : 'C')} small />
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
                  <div style={{ fontSize: 14, fontWeight: 500, color: textPrimary(isDark) }}>
                    {unit === 'C' ? h.temp : Math.round(h.temp * 9/5 + 32)}°
                  </div>
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
            { icon: '🌡️', label: 'Ощущается', value: `${unit === 'C' ? widgetData.feelsLike : Math.round((widgetData.feelsLike || 0) * 9/5 + 32)}°` },
            { icon: '🌧️', label: 'Осадки', value: `${widgetData.precipitation}%` },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '6px 8px', borderRadius: 8, background: rowBg(isDark) }}>
              <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{stat.icon} {stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary(isDark) }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Health — with goal tracking
  if (id === 'health' && widgetData) {
    const [goalMet, setGoalMet] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>❤️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Здоровье</div>
            <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Сводка за день</div>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityRing progress={goalMet ? 100 : (widgetData.progress || 84)} color={APPLE_COLORS.red} size={56} strokeWidth={6} />
            <div style={{ position: 'absolute' }}>
              <ActivityRing progress={goalMet ? 100 : ((widgetData.exerciseMinutes || 25) / 30 * 100)} color={APPLE_COLORS.green} size={42} strokeWidth={5} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <ActivityRing progress={goalMet ? 100 : ((widgetData.standHours || 8) / 12 * 100)} color={APPLE_COLORS.teal} size={28} strokeWidth={4} />
              </div>
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
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>🔥 Калории</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>{widgetData.calories}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>⏱️ Время</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>45 мин</div>
          </div>
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, flex: 1 }}>
          {widgetData.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textSecondary(isDark) }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
            </div>
          ))}
        </div>
        <PillButton label={goalMet ? '🏆 Цель достигнута!' : '🎯 Отметить цель'} color={goalMet ? APPLE_COLORS.green : APPLE_COLORS.red} isDark={isDark} onClick={() => setGoalMet(!goalMet)} active={goalMet} />
      </div>
    );
  }

  // Calendar — with add event
  if (id === 'calendar' && widgetData?.events) {
    const today = new Date();
    const [events, setEvents] = useState(widgetData.events);
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
          <PillButton label="+ Событие" icon="📅" color={APPLE_COLORS.red} isDark={isDark}
            onClick={() => setEvents([...events, { time: '18:00', title: 'Новое событие', color: APPLE_COLORS.purple }])} small />
        </div>
        <Divider isDark={isDark} />
        <SectionLabel isDark={isDark}>Сегодня</SectionLabel>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((event, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: rowBg(isDark), borderRadius: 10, borderLeft: `3px solid ${event.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: textSecondary(isDark), minWidth: 45 }}>{event.time}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: textPrimary(isDark), flex: 1 }}>{event.title}</div>
              <div onClick={(e) => { e.stopPropagation(); setEvents(events.filter((_, idx) => idx !== i)); }}
                style={{ fontSize: 12, color: textTertiary(isDark), cursor: 'pointer' }}>✕</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Apple Intelligence — toggleable features
  if (id === 'lmm-core' && widgetData) {
    const [features, setFeatures] = useState({ text: true, images: true, code: true });
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
          {Object.entries(features).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{key === 'text' ? 'Текст' : key === 'images' ? 'Фото' : 'Код'}</div>
              <ToggleSwitch on={val} onToggle={() => setFeatures(f => ({ ...f, [key]: !val }))} color={APPLE_COLORS.teal} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Photos — gallery with share
  if (id === 'photos' && widgetData) {
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
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
            <div key={i} onClick={(e) => { e.stopPropagation(); setSelectedPhoto(selectedPhoto === i ? null : i); }}
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i === 0 ? 32 : 20, cursor: 'pointer',
                border: selectedPhoto === i ? `2px solid ${APPLE_COLORS.blue}` : '2px solid transparent',
                transition: 'border 0.2s ease',
              }}>
              {emoji}
            </div>
          ))}
        </div>
        <Divider isDark={isDark} />
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
          {selectedPhoto !== null ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton label="📤 Поделиться" color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setSelectedPhoto(null)} small />
              <PillButton label="❤️ Избранное" color={APPLE_COLORS.pink} isDark={isDark} onClick={() => setSelectedPhoto(null)} small />
              <PillButton label="🗑" color={APPLE_COLORS.red} isDark={isDark} onClick={() => setSelectedPhoto(null)} small />
            </div>
          ) : (
            widgetData.items?.slice(0, 3).map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{item.value}</div>
              </div>
            ))
          )}
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

  return (
    <Html position={[widget.position.x / 100, -widget.position.y / 100, widget.position.z / 50]} center distanceFactor={8} zIndexRange={[100, 0]}>
      <div style={containerStyle} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onClick={handleClick} role="button" tabIndex={0} aria-label={`${title}: ${subtitle}`}>
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: categoryStyle.gradient, opacity: isDark ? 0.5 : 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius, background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 40%)' : 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent 40%)', pointerEvents: 'none' }} />

        {isMorphing && mp > 0 && (
          <div style={{
            position: 'absolute', inset: -2, borderRadius: borderRadius + 2,
            border: `2px solid ${glowColor}`,
            opacity: mp * 0.6,
            boxShadow: `0 0 ${20 * mp}px ${glowColor}40, inset 0 0 ${10 * mp}px ${glowColor}20`,
            pointerEvents: 'none', transition: 'none',
          }} />
        )}

        <div style={{ position: 'relative', height: '100%' }}>
          {isMorphing && !showLargeContent && (
            <div style={{ opacity: originalContentOpacity, transition: 'none' }}>
              {size === 'small' && <SmallWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'medium' && <MediumWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
              {size === 'large' && <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />}
            </div>
          )}

          {isMorphing && showLargeContent && (
            <div style={{ opacity: contentOpacity, transition: 'none' }}>
              <LargeWidgetContent widget={widget} isDark={isDark} glowColor={glowColor} categoryStyle={categoryStyle} />
            </div>
          )}

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
