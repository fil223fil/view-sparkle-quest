// Connection Types Legend — Apple-minimal floating pill
import React from 'react';
import { Html } from '@react-three/drei';
import { ConnectionType, CONNECTION_STYLES } from '../types';
import { useTheme } from 'next-themes';

const CONNECTION_LABELS: Record<ConnectionType, string> = {
  dataFlow: 'Поток данных',
  dependency: 'Зависимость',
  contextLink: 'Контекст',
  logicChain: 'Логика',
  causal: 'Причинность',
  temporal: 'Время',
  semantic: 'Семантика',
  metacognitive: 'Метакогниция',
};

export const ConnectionLegend: React.FC = () => {
  const types = Object.keys(CONNECTION_STYLES) as ConnectionType[];
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerStyle: React.CSSProperties = {
    background: isDark
      ? 'rgba(28, 28, 30, 0.6)'
      : 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: isDark
      ? '0.5px solid rgba(255, 255, 255, 0.08)'
      : '0.5px solid rgba(0, 0, 0, 0.06)',
    borderRadius: 16,
    padding: '10px 14px',
    minWidth: 140,
    fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
  };

  return (
    <Html position={[-5.5, 3, 0]} distanceFactor={10} zIndexRange={[200, 100]}>
      <div style={containerStyle}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
          marginBottom: 8,
        }}>
          Связи
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {types.map((type) => {
            const style = CONNECTION_STYLES[type];
            const label = CONNECTION_LABELS[type];
            
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  background: style.color,
                  opacity: 0.7,
                  ...(style.dashArray ? {
                    backgroundImage: `repeating-linear-gradient(90deg, ${style.color} 0px, ${style.color} 3px, transparent 3px, transparent 5px)`,
                    background: 'none',
                  } : {}),
                }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)',
                  letterSpacing: '-0.01em',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Html>
  );
};