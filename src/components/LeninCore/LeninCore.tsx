// Ядро Ленин - Main Component
// iOS 26 Widget Ecosystem Visualization
import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WidgetData, ConnectionData, DepthLevel } from './types';
import { INITIAL_WIDGETS, INITIAL_CONNECTIONS } from './data';
import { useFocusMode } from './hooks/useFocusMode';
import { useDiveAnimation } from './hooks/useDiveAnimation';
import { usePhysicsSimulation } from './hooks/usePhysicsSimulation';
import { Widget } from './components/Widget';
import { Connection } from './components/Connection';
import { SubWidget } from './components/SubWidget';
import { DiveOverlay } from './components/DiveOverlay';
import { DepthNavigation } from './components/DepthNavigation';
import { ConnectionLegend } from './components/ConnectionLegend';
import { Background } from './components/Background';

// Loading fallback
const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshBasicMaterial color="#58C4DD" wireframe />
  </mesh>
);

// Scene content
const SceneContent: React.FC<{
  widgets: WidgetData[];
  connections: ConnectionData[];
  currentDepth: DepthLevel;
  onDepthChange: (level: DepthLevel) => void;
}> = ({ widgets: initialWidgets, connections, currentDepth, onDepthChange }) => {
  const [widgets, setWidgets] = useState<WidgetData[]>(initialWidgets);
  const { calculateForces } = usePhysicsSimulation();
  const [isPaused, setIsPaused] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    focusState,
    handleWidgetHover,
    handleWidgetSelect,
    isWidgetFocused,
    isWidgetRelated,
    isWidgetBlurred,
    isConnectionHighlighted,
  } = useFocusMode(widgets, connections);

  const {
    diveState,
    handleDoubleTap,
    handleSurface,
    isDived,
  } = useDiveAnimation(widgets, onDepthChange);

  useFrame(() => {
    if (!isPaused && !isDived) {
      setWidgets((prev) => calculateForces({ widgets: prev, connections }));
    }
  });

  // Handle Esc key to exit focus or surface
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDived) {
          handleSurface();
        } else if (focusState.focusedWidgetId) {
          handleWidgetSelect(focusState.focusedWidgetId); // toggles focus off
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDived, focusState.focusedWidgetId, handleSurface, handleWidgetSelect]);

  const isFocusActive = focusState.focusedWidgetId !== null;
  const divedWidget = diveState.divedWidgetId 
    ? widgets.find(w => w.id === diveState.divedWidgetId) 
    : null;

  return (
    <>
      <Background />

      {/* Connections layer (render behind widgets) - hide when diving */}
      {!isDived && connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          widgets={widgets}
          isHighlighted={isConnectionHighlighted(connection.id)}
          isFocusActive={isFocusActive}
        />
      ))}

      {/* Widgets layer */}
      {widgets.map((widget) => {
        // When diving, only show the dived widget
        if (isDived && widget.id !== diveState.divedWidgetId) {
          return null;
        }
        
        return (
          <Widget
            key={widget.id}
            widget={widget}
            isFocused={isWidgetFocused(widget.id)}
            isRelated={isWidgetRelated(widget.id)}
            isBlurred={!isDived && isWidgetBlurred(widget.id)}
            isDived={widget.id === diveState.divedWidgetId}
            onHover={handleWidgetHover}
            onSelect={handleWidgetSelect}
            onDoubleTap={handleDoubleTap}
          />
        );
      })}

      {/* Sub-widgets layer (only visible when diving) */}
      {isDived && divedWidget && diveState.subWidgets.map((subWidget, index) => (
        <SubWidget
          key={subWidget.id}
          widget={subWidget}
          index={index}
          total={diveState.subWidgets.length}
          parentPosition={divedWidget.position}
          onHover={handleWidgetHover}
          onClick={handleWidgetSelect}
        />
      ))}

      {/* Dive mode overlay with back button */}
      {isDived && divedWidget && (
        <DiveOverlay
          widgetTitle={divedWidget.title}
          onSurface={handleSurface}
        />
      )}

      {/* UI Overlays - hide connection legend when diving */}
      {!isDived && <ConnectionLegend />}
      <DepthNavigation currentLevel={currentDepth} onLevelChange={onDepthChange} />

      {/* Camera controls - disable rotation when diving */}
      <OrbitControls
        enablePan={!isDived}
        enableZoom={!isDived}
        enableRotate={!isDived}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!isFocusActive && !isDived}
        autoRotateSpeed={0.3}
      />
    </>
  );
};

// Main exported component
export const LeninCore: React.FC = () => {
  const [widgets] = useState<WidgetData[]>(INITIAL_WIDGETS);
  const [connections] = useState<ConnectionData[]>(INITIAL_CONNECTIONS);
  const [currentDepth, setCurrentDepth] = useState<DepthLevel>('active');

  const handleDepthChange = useCallback((level: DepthLevel) => {
    setCurrentDepth(level);
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(88, 196, 221, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            }}
          >
            🧠
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Ядро Ленин</h1>
            <p className="text-sm text-slate-500">iOS 26 Widget Ecosystem</p>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 z-10">
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          }}
        >
          <p className="text-slate-600">
            <span className="font-medium text-slate-800">Наведите</span> для фокусировки •{' '}
            <span className="font-medium text-slate-800">2× клик</span> для погружения
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Прокрутка для масштабирования • Перетаскивание для поворота
          </p>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            widgets={widgets}
            connections={connections}
            currentDepth={currentDepth}
            onDepthChange={handleDepthChange}
          />
        </Suspense>
      </Canvas>

      {/* Accessibility: Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        Текущий уровень глубины: {currentDepth}
      </div>
    </div>
  );
};

export default LeninCore;
