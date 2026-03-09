// Connection Types Legend - iOS 26 Liquid Glass
import React from 'react';
import { Html } from '@react-three/drei';
import { ConnectionType, CONNECTION_STYLES } from '../types';

const CONNECTION_LABELS: Record<ConnectionType, { label: string; description: string }> = {
  dataFlow: { label: 'Data Flow', description: 'Активный поток данных' },
  dependency: { label: 'Dependency', description: 'Структурная зависимость' },
  contextLink: { label: 'Context', description: 'Общий контекст' },
  logicChain: { label: 'Logic', description: 'Логическая цепь' },
  causal: { label: 'Causal', description: 'Причинно-следственная' },
  temporal: { label: 'Temporal', description: 'Временная последовательность' },
  semantic: { label: 'Semantic', description: 'Смысловая связь' },
  metacognitive: { label: 'Meta', description: 'Метакогниция' },
};

export const ConnectionLegend: React.FC = () => {
  const types = Object.keys(CONNECTION_STYLES) as ConnectionType[];

  return (
    <Html position={[-5.5, 3, 0]} distanceFactor={10} zIndexRange={[200, 100]}>
      <div className="glass-liquid p-4 rounded-2xl min-w-[180px]">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Типы связей
        </h4>
        
        <div className="space-y-2">
          {types.map((type) => {
            const style = CONNECTION_STYLES[type];
            const info = CONNECTION_LABELS[type];
            
            return (
              <div key={type} className="flex items-center gap-2 group">
                <div className="relative w-8 h-4 flex items-center">
                  <div
                    className="w-full h-0.5"
                    style={{
                      background: style.color,
                      opacity: style.opacity,
                      borderStyle: style.dashArray ? 'dashed' : 'solid',
                      borderWidth: style.dashArray ? '1px 0 0 0' : 0,
                      borderColor: style.dashArray ? style.color : 'transparent',
                    }}
                  />
                  {type === 'logicChain' && (
                    <div className="absolute right-0 w-0 h-0" style={{ borderLeft: `4px solid ${style.color}`, borderTop: '2px solid transparent', borderBottom: '2px solid transparent' }} />
                  )}
                  {type === 'dataFlow' && (
                    <div className="absolute right-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: style.particleColor }} />
                  )}
                </div>
                
                <div className="flex-1">
                  <span className="text-xs font-medium text-foreground">{info.label}</span>
                </div>
                
                <div className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 rounded-lg text-xs glass-capsule text-foreground whitespace-nowrap z-10">
                  {info.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Html>
  );
};
