// Interactive widget renderers — each is its own component to satisfy React hooks rules
import React, { useState } from 'react';
import { WidgetData } from '../types';

// ===== SHARED PRIMITIVES =====

export const APPLE_COLORS = {
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', orange: '#FF9500',
  yellow: '#FFCC00', purple: '#AF52DE', pink: '#FF2D55', teal: '#5AC8FA', indigo: '#5856D6',
};

export const textPrimary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)';
export const textSecondary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
export const textTertiary = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
export const rowBg = (isDark: boolean) => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

export const ProgressBar: React.FC<{ value: number; color: string; isDark: boolean; height?: number }> = ({ value, color, isDark, height = 4 }) => (
  <div style={{ width: '100%', height, borderRadius: height / 2, overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
    <div style={{ height: '100%', borderRadius: height / 2, width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)`, transition: 'width 0.5s ease' }} />
  </div>
);

export const ActivityRing: React.FC<{ progress: number; color: string; size?: number; strokeWidth?: number }> = ({ progress, color, size = 48, strokeWidth = 6 }) => {
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

export const Divider: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', margin: '2px 0' }} />
);

export const SectionLabel: React.FC<{ children: React.ReactNode; isDark: boolean }> = ({ children, isDark }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
    {children}
  </div>
);

export const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void; color?: string }> = ({ on, onToggle, color = APPLE_COLORS.green }) => (
  <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
    width: 42, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
    background: on ? color : 'rgba(120,120,128,0.32)', transition: 'background 0.25s ease',
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

export const PillButton: React.FC<{ label: string; icon?: string; color?: string; isDark: boolean; onClick: () => void; active?: boolean; small?: boolean }> = 
  ({ label, icon, color = APPLE_COLORS.blue, isDark, onClick, active = false, small = false }) => (
  <div onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: small ? '3px 8px' : '5px 12px', borderRadius: small ? 8 : 12,
    fontSize: small ? 10 : 12, fontWeight: 600, cursor: 'pointer',
    background: active ? color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    color: active ? 'white' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
    transition: 'all 0.2s ease',
    border: active ? 'none' : `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
  }}>
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </div>
);

export const Checkbox: React.FC<{ checked: boolean; onToggle: () => void; color?: string }> = ({ checked, onToggle, color = APPLE_COLORS.blue }) => (
  <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
    width: 20, height: 20, borderRadius: 10, cursor: 'pointer',
    border: checked ? 'none' : '2px solid rgba(120,120,128,0.4)',
    background: checked ? color : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease', fontSize: 11, color: 'white', fontWeight: 700,
  }}>
    {checked && '✓'}
  </div>
);

export interface WidgetContentProps {
  widget: WidgetData;
  isDark: boolean;
  glowColor: string;
  categoryStyle: { iconBg: string };
}

// ===== SMALL WIDGET COMPONENTS =====

export const ClockSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
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
};

export const WalletSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [showPay, setShowPay] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>💳</div>
      <div>
        <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.widgetData?.items?.[0]?.label}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary(isDark), letterSpacing: '-0.02em' }}>{widget.widgetData?.items?.[0]?.value}</div>
      </div>
      <PillButton label={showPay ? 'Готово ✓' : 'Apple Pay'} icon="💳" color={APPLE_COLORS.indigo} isDark={isDark} onClick={() => setShowPay(!showPay)} active={showPay} small />
    </div>
  );
};

export const NotesSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [noteCount, setNoteCount] = useState(widget.widgetData?.unread || 23);
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
};

export const FilesSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [uploaded, setUploaded] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>📁</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Файлы</span>
      </div>
      <div style={{ flex: 1 }}>
        {widget.widgetData?.items?.slice(0, 2).map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: textSecondary(isDark), marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>
      <PillButton label={uploaded ? 'Загружено ✓' : '⬆️ Загрузить'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setUploaded(!uploaded)} active={uploaded} small />
    </div>
  );
};

export const PhoneSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [calling, setCalling] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
      {widget.widgetData?.unread ? (
        <>
          <div style={{ background: APPLE_COLORS.red, color: 'white', fontSize: 18, fontWeight: 700, width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>{widget.widgetData.unread}</div>
          <PillButton label={calling ? '📞 Звонок...' : '↩️ Перезвонить'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => setCalling(!calling)} active={calling} small />
        </>
      ) : (
        <div style={{ fontSize: 13, color: textSecondary(isDark) }}>Телефон</div>
      )}
    </div>
  );
};

export const ContactsSmall: React.FC<WidgetContentProps> = ({ widget, isDark, categoryStyle }) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: categoryStyle.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8 }}>👤</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label || 'Мама'}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <PillButton label="📞" isDark={isDark} onClick={() => setActiveAction(activeAction === 'call' ? null : 'call')} active={activeAction === 'call'} color={APPLE_COLORS.green} small />
        <PillButton label="💬" isDark={isDark} onClick={() => setActiveAction(activeAction === 'msg' ? null : 'msg')} active={activeAction === 'msg'} color={APPLE_COLORS.blue} small />
      </div>
    </div>
  );
};

export const FacetimeSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [calling, setCalling] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📹</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label || 'FaceTime'}</div>
      <PillButton label={calling ? '🔴 Завершить' : '📹 Позвонить'} color={calling ? APPLE_COLORS.red : APPLE_COLORS.green} isDark={isDark} onClick={() => setCalling(!calling)} active={calling} small />
    </div>
  );
};

export const CameraSmall: React.FC<WidgetContentProps> = ({ isDark }) => {
  const [mode, setMode] = useState(0);
  const modes = ['📷', '🎞️', '🌃'];
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
};

export const PodcastsSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{widget.widgetData?.items?.[0]?.label || 'Подкасты'}</div>
        <PillButton label={playing ? '⏸ Пауза' : '▶️ Слушать'} color={APPLE_COLORS.purple} isDark={isDark} onClick={() => setPlaying(!playing)} active={playing} small />
      </div>
    </div>
  );
};

export const TVSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [watching, setWatching] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📺</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label || 'Apple TV+'}</div>
        <PillButton label={watching ? '⏸ Пауза' : '▶️ Смотреть'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setWatching(!watching)} active={watching} small />
      </div>
    </div>
  );
};

export const BooksSmall: React.FC<WidgetContentProps> = ({ widget, isDark, glowColor }) => {
  const [reading, setReading] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>📚</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>Books</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label}</div>
        <div style={{ fontSize: 11, color: textTertiary(isDark), marginTop: 2 }}>{widget.widgetData?.items?.[0]?.value}</div>
      </div>
      {widget.widgetData?.progress !== undefined && <ProgressBar value={widget.widgetData.progress} color={glowColor} isDark={isDark} />}
      <PillButton label={reading ? '📖 Читаю...' : '📖 Продолжить'} color={APPLE_COLORS.orange} isDark={isDark} onClick={() => setReading(!reading)} active={reading} small />
    </div>
  );
};

export const FreeformSmall: React.FC<WidgetContentProps> = ({ isDark }) => {
  const [boards, setBoards] = useState(1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary(isDark) }}>Freeform</div>
      <div style={{ fontSize: 11, color: textTertiary(isDark), marginBottom: 4 }}>{boards} досок</div>
      <PillButton label="+ Новая" color={APPLE_COLORS.purple} isDark={isDark} onClick={() => setBoards(b => b + 1)} small />
    </div>
  );
};

export const FindMySmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [pinging, setPinging] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label || '3 устройства'}</div>
      <PillButton label={pinging ? '📡 Сигнал...' : '📍 Найти'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => { setPinging(true); setTimeout(() => setPinging(false), 2000); }} active={pinging} small />
    </div>
  );
};

export const TranslateSmall: React.FC<WidgetContentProps> = ({ isDark }) => {
  const [swapped, setSwapped] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{swapped ? 'RU → EN' : 'EN → RU'}</div>
      <PillButton label="⇄ Поменять" color={APPLE_COLORS.teal} isDark={isDark} onClick={() => setSwapped(!swapped)} small />
    </div>
  );
};

export const AppStoreSmall: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [updates, setUpdates] = useState(widget.widgetData?.unread || 4);
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
};

export const SettingsSmall: React.FC<WidgetContentProps> = ({ isDark }) => {
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
          <span>🔵 BT</span>
          <ToggleSwitch on={bt} onToggle={() => setBt(!bt)} color={APPLE_COLORS.blue} />
        </div>
      </div>
    </div>
  );
};

// ===== MEDIUM WIDGET COMPONENTS =====

export const SiriMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
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
        {widget.widgetData?.items?.slice(0, 3).map((item, i) => (
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
};

export const MusicMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(widget.widgetData?.progress || 65);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, #FF2D55, #AF52DE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎵</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{widget.widgetData?.items?.[0]?.label || 'Сейчас играет'}</div>
          <div style={{ fontSize: 12, color: textSecondary(isDark) }}>{widget.widgetData?.items?.[0]?.value || ''}</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PillButton label="⏮" isDark={isDark} onClick={() => setProgress(Math.max(0, progress - 10))} small />
        <PillButton label={playing ? '⏸' : '▶️'} isDark={isDark} onClick={() => setPlaying(!playing)} active={playing} color={APPLE_COLORS.pink} small />
        <PillButton label="⏭" isDark={isDark} onClick={() => setProgress(Math.min(100, progress + 10))} small />
        <div style={{ flex: 1 }}><ProgressBar value={progress} color={APPLE_COLORS.pink} isDark={isDark} height={3} /></div>
        <span style={{ fontSize: 11, color: textTertiary(isDark) }}>{widget.widgetData?.items?.[1]?.label || '3:42'}</span>
      </div>
    </div>
  );
};

export const MessagesMedium: React.FC<WidgetContentProps> = ({ widget, isDark, categoryStyle }) => {
  const [replying, setReplying] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Messages</span>
        {widget.widgetData?.unread && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{widget.widgetData.unread}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {widget.widgetData?.items?.slice(0, 3).map((item, i) => (
          <div key={i} onClick={(e) => { e.stopPropagation(); setReplying(replying === i ? null : i); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: textSecondary(isDark), cursor: 'pointer',
              padding: '3px 6px', borderRadius: 8,
              background: replying === i ? `${APPLE_COLORS.blue}15` : 'transparent', transition: 'background 0.2s ease',
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
};

export const MailMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [readMails, setReadMails] = useState<Set<number>>(new Set());
  const unread = (widget.widgetData?.unread || 12) - readMails.size;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>📧</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Входящие</span>
        {unread > 0 && <div style={{ marginLeft: 'auto', background: APPLE_COLORS.red, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{unread}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {widget.widgetData?.items?.slice(0, 3).map((item, i) => (
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
};

export const FitnessMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [workoutActive, setWorkoutActive] = useState(false);
  const wd = widget.widgetData;
  return (
    <div style={{ display: 'flex', height: '100%', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <ActivityRing progress={workoutActive ? 100 : (wd?.progress || 54)} color={APPLE_COLORS.red} size={72} strokeWidth={7} />
        <div style={{ position: 'absolute' }}>
          <ActivityRing progress={workoutActive ? 100 : ((wd?.exerciseMinutes || 25) / 30 * 100)} color={APPLE_COLORS.green} size={56} strokeWidth={6} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <ActivityRing progress={workoutActive ? 100 : ((wd?.standHours || 8) / 12 * 100)} color={APPLE_COLORS.teal} size={40} strokeWidth={5} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        {wd?.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
            <span>{item.icon} {item.label}</span>
            <span style={{ fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
        <PillButton label={workoutActive ? '🏃 Активна' : '▶️ Тренировка'} color={APPLE_COLORS.green} isDark={isDark} onClick={() => setWorkoutActive(!workoutActive)} active={workoutActive} small />
      </div>
    </div>
  );
};

export const NeuralEngineMedium: React.FC<WidgetContentProps> = ({ widget, isDark, categoryStyle }) => {
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
          <ActivityRing progress={benchmarking ? 100 : (widget.widgetData?.progress || 95)} color={benchmarking ? APPLE_COLORS.green : APPLE_COLORS.teal} size={40} strokeWidth={4} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {widget.widgetData?.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
            <span>{item.icon} {item.label}</span>
            <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
          </div>
        ))}
      </div>
      <PillButton label={benchmarking ? '⏳ Тест...' : '🧪 Benchmark'} color={APPLE_COLORS.teal} isDark={isDark} onClick={() => { setBenchmarking(true); setTimeout(() => setBenchmarking(false), 2000); }} active={benchmarking} small />
    </div>
  );
};

export const ICloudMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [managing, setManaging] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>💾</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>iCloud</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: textSecondary(isDark) }}>128/200 ГБ</span>
      </div>
      <ProgressBar value={widget.widgetData?.progress || 64} color={APPLE_COLORS.blue} isDark={isDark} height={6} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
        {widget.widgetData?.items?.slice(1).map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textSecondary(isDark) }}>
            <span>{item.icon} {item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
      <PillButton label={managing ? '✓ Оптимизировано' : '🗑 Очистить'} color={APPLE_COLORS.blue} isDark={isDark} onClick={() => setManaging(!managing)} active={managing} small />
    </div>
  );
};

export const SafariMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [tabs, setTabs] = useState(widget.widgetData?.unread || 7);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>🧭</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Safari</span>
        <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{tabs}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {widget.widgetData?.items?.map((item, i) => (
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
};

export const TasksMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [checked, setChecked] = useState<Set<number>>(new Set([2]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Напоминания</span>
        <div style={{ marginLeft: 'auto', background: APPLE_COLORS.blue, color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{(widget.widgetData?.items?.length || 3) - checked.size}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {widget.widgetData?.items?.map((item, i) => (
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
};

export const ShortcutsMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [running, setRunning] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Команды</span>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {widget.widgetData?.items?.slice(0, 4).map((item, i) => (
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
};

export const NewsMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [saved, setSaved] = useState<Set<number>>(new Set());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>📰</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Для вас</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {widget.widgetData?.items?.map((item, i) => (
          <div key={i} style={{ padding: '5px 0', borderBottom: i < (widget.widgetData?.items?.length || 0) - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
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
};

export const MapsMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [navigating, setNavigating] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>🗺️</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Карты</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {widget.widgetData?.items?.map((item, i) => (
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
};

export const HomeMedium: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [devices, setDevices] = useState<Record<number, boolean>>({ 0: true, 1: false });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>🏠</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>Дом</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {widget.widgetData?.items?.map((item, i) => (
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
};

// ===== LARGE WIDGET COMPONENTS =====

export const WeatherLarge: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const wd = widget.widgetData!;
  const temp = unit === 'C' ? wd.temperature! : Math.round(wd.temperature! * 9/5 + 32);
  const high = unit === 'C' ? wd.tempHigh : Math.round((wd.tempHigh || 0) * 9/5 + 32);
  const low = unit === 'C' ? wd.tempLow : Math.round((wd.tempLow || 0) * 9/5 + 32);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 64, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.03em', color: textPrimary(isDark) }}>{temp}°</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: textSecondary(isDark), marginTop: 6 }}>{wd.condition}</div>
          <div style={{ fontSize: 13, color: textTertiary(isDark), marginTop: 2 }}>H:{high}° L:{low}°</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 56, filter: 'drop-shadow(0 4px 12px rgba(255,180,0,0.3))' }}>
            {wd.condition?.includes('Солн') ? '☀️' : '🌤️'}
          </div>
          <PillButton label={unit === 'C' ? '°C → °F' : '°F → °C'} isDark={isDark} onClick={() => setUnit(unit === 'C' ? 'F' : 'C')} small />
        </div>
      </div>
      <Divider isDark={isDark} />
      {wd.hourlyForecast && (
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <SectionLabel isDark={isDark}>Прогноз по часам</SectionLabel>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            {wd.hourlyForecast.slice(0, 5).map((h, i) => (
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
          { icon: '💧', label: 'Влажность', value: `${wd.humidity}%` },
          { icon: '💨', label: 'Ветер', value: `${wd.wind} м/с` },
          { icon: '🌡️', label: 'Ощущается', value: `${unit === 'C' ? wd.feelsLike : Math.round((wd.feelsLike || 0) * 9/5 + 32)}°` },
          { icon: '🌧️', label: 'Осадки', value: `${wd.precipitation}%` },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '6px 8px', borderRadius: 8, background: rowBg(isDark) }}>
            <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{stat.icon} {stat.label}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary(isDark) }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const HealthLarge: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [goalMet, setGoalMet] = useState(false);
  const wd = widget.widgetData!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>❤️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Здоровье</div>
          <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Сводка за день</div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityRing progress={goalMet ? 100 : (wd.progress || 84)} color={APPLE_COLORS.red} size={56} strokeWidth={6} />
          <div style={{ position: 'absolute' }}>
            <ActivityRing progress={goalMet ? 100 : ((wd.exerciseMinutes || 25) / 30 * 100)} color={APPLE_COLORS.green} size={42} strokeWidth={5} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <ActivityRing progress={goalMet ? 100 : ((wd.standHours || 8) / 12 * 100)} color={APPLE_COLORS.teal} size={28} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>
      <Divider isDark={isDark} />
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, marginBottom: 8 }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: textTertiary(isDark) }}>🚶 Шаги</div><div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>{wd.steps?.toLocaleString()}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: textTertiary(isDark) }}>🔥 Калории</div><div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>{wd.calories}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: textTertiary(isDark) }}>⏱️ Время</div><div style={{ fontSize: 18, fontWeight: 600, color: textPrimary(isDark) }}>45 мин</div></div>
      </div>
      <Divider isDark={isDark} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, flex: 1 }}>
        {wd.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textSecondary(isDark) }}>
            <span>{item.icon} {item.label}</span>
            <span style={{ fontWeight: 500, color: textPrimary(isDark) }}>{item.value}</span>
          </div>
        ))}
      </div>
      <PillButton label={goalMet ? '🏆 Цель достигнута!' : '🎯 Отметить цель'} color={goalMet ? APPLE_COLORS.green : APPLE_COLORS.red} isDark={isDark} onClick={() => setGoalMet(!goalMet)} active={goalMet} />
    </div>
  );
};

export const CalendarLarge: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [events, setEvents] = useState(widget.widgetData?.events || []);
  const today = new Date();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: APPLE_COLORS.red, textTransform: 'uppercase' }}>{today.toLocaleDateString('ru', { month: 'long' })}</div>
          <div style={{ fontSize: 34, fontWeight: 200, color: textPrimary(isDark), lineHeight: 1 }}>{today.getDate()}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary(isDark) }}>{today.toLocaleDateString('ru', { weekday: 'long' })}</div>
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
};

export const IntelligenceLarge: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
  const [features, setFeatures] = useState({ text: true, images: true, code: true });
  const wd = widget.widgetData!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, rgba(88,196,221,0.3), rgba(175,82,222,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: textPrimary(isDark) }}>Apple Intelligence</div>
          <div style={{ fontSize: 13, color: textTertiary(isDark) }}>Активен</div>
        </div>
        <ActivityRing progress={wd.progress || 92} color={APPLE_COLORS.teal} size={40} strokeWidth={4} />
      </div>
      <Divider isDark={isDark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {wd.items?.map((item, i) => (
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
};

export const PhotosLarge: React.FC<WidgetContentProps> = ({ widget, isDark }) => {
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
          widget.widgetData?.items?.slice(0, 3).map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: textTertiary(isDark) }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary(isDark) }}>{item.value}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ===== COMPONENT MAPS =====

export const SMALL_WIDGETS: Record<string, React.FC<WidgetContentProps>> = {
  'reminders': ClockSmall,
  'wallet': WalletSmall,
  'notes': NotesSmall,
  'files': FilesSmall,
  'phone': PhoneSmall,
  'contacts': ContactsSmall,
  'facetime': FacetimeSmall,
  'camera': CameraSmall,
  'podcasts': PodcastsSmall,
  'tv': TVSmall,
  'books': BooksSmall,
  'freeform': FreeformSmall,
  'findmy': FindMySmall,
  'translate': TranslateSmall,
  'appstore': AppStoreSmall,
  'processing-queue': SettingsSmall,
};

export const MEDIUM_WIDGETS: Record<string, React.FC<WidgetContentProps>> = {
  'siri': SiriMedium,
  'music': MusicMedium,
  'messages': MessagesMedium,
  'mail': MailMedium,
  'fitness': FitnessMedium,
  'neural-engine': NeuralEngineMedium,
  'memory-bank': ICloudMedium,
  'safari': SafariMedium,
  'tasks': TasksMedium,
  'shortcuts': ShortcutsMedium,
  'news': NewsMedium,
  'maps': MapsMedium,
  'homekit': HomeMedium,
};

export const LARGE_WIDGETS: Record<string, React.FC<WidgetContentProps>> = {
  'weather': WeatherLarge,
  'health': HealthLarge,
  'calendar': CalendarLarge,
  'lmm-core': IntelligenceLarge,
  'photos': PhotosLarge,
};
