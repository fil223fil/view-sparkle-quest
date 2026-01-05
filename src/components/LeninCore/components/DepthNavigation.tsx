// Depth Level Navigation - Glass sphere arc
import React from 'react';
import { Html } from '@react-three/drei';
import { DepthLevel, DEPTH_LEVELS } from '../types';

interface DepthNavigationProps {
  currentLevel: DepthLevel;
  onLevelChange: (level: DepthLevel) => void;
}

export const DepthNavigation: React.FC<DepthNavigationProps> = ({
  currentLevel,
  onLevelChange,
}) => {
  return (
    <Html
      position={[0, -4, 0]}
      center
      distanceFactor={10}
      zIndexRange={[200, 100]}
    >
      <div className="flex items-center gap-4">
        {DEPTH_LEVELS.map((level, index) => {
          const isActive = level.id === currentLevel;
          const isPast = DEPTH_LEVELS.findIndex((l) => l.id === currentLevel) > index;

          return (
            <button
              key={level.id}
              onClick={() => onLevelChange(level.id)}
              className="group relative flex flex-col items-center gap-2 transition-all duration-300"
              aria-label={`${level.label}: ${level.description}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Glass sphere */}
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: isActive ? '64px' : '48px',
                  height: isActive ? '64px' : '48px',
                  borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))'
                    : isPast
                    ? 'linear-gradient(135deg, rgba(88,196,221,0.3), rgba(88,196,221,0.1))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))',
                  backdropFilter: 'blur(12px)',
                  border: isActive
                    ? '2px solid rgba(88,196,221,0.8)'
                    : '1px solid rgba(255,255,255,0.3)',
                  boxShadow: isActive
                    ? '0 8px 32px rgba(88,196,221,0.4), inset 0 -4px 8px rgba(255,255,255,0.4)'
                    : '0 4px 16px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(255,255,255,0.3)',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                }}
              >
                {/* Icon */}
                <span
                  className="text-2xl"
                  style={{
                    filter: isActive ? 'none' : 'grayscale(0.3)',
                    opacity: isActive ? 1 : isPast ? 0.8 : 0.6,
                  }}
                >
                  {level.icon}
                </span>

                {/* Glow ring when active */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: 'transparent',
                      border: '2px solid rgba(88,196,221,0.5)',
                      transform: 'scale(1.2)',
                      opacity: 0.6,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="text-xs font-medium transition-all duration-300"
                style={{
                  color: isActive ? '#58C4DD' : isPast ? 'rgba(88,196,221,0.7)' : 'rgba(255,255,255,0.6)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {level.label}
              </span>

              {/* Tooltip on hover */}
              <div
                className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
                style={{
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {level.description}
              </div>

              {/* Connecting line (except last) */}
              {index < DEPTH_LEVELS.length - 1 && (
                <div
                  className="absolute top-6 -right-4 w-4 h-0.5"
                  style={{
                    background: isPast
                      ? 'linear-gradient(90deg, rgba(88,196,221,0.6), rgba(88,196,221,0.3))'
                      : 'rgba(255,255,255,0.2)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </Html>
  );
};
