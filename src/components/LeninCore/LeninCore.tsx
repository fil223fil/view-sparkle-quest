// Ядро Ленин - Main Component
// iOS 26 Widget Ecosystem Visualization
import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WidgetData, ConnectionData, DepthLevel } from './types';
import { INITIAL_WIDGETS, INITIAL_CONNECTIONS } from './data';
import { useFocusMode } from './hooks/useFocusMode';
import { Widget } from './components/Widget';
import { Connection } from './components/Connection';
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
}> = ({ widgets, connections, currentDepth, onDepthChange }) => {
  const {
    focusState,
    handleWidgetHover,
    handleWidgetSelect,
    isWidgetFocused,
    isWidgetRelated,
    isWidgetBlurred,
    isConnectionHighlighted,
  } = useFocusMode(widgets, connections);

  const isFocusActive = focusState.focusedWidgetId !== null;

  return (
    <>
      <Background />

      {/* Connections layer (render behind widgets) */}
      {connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          widgets={widgets}
          isHighlighted={isConnectionHighlighted(connection.id)}
          isFocusActive={isFocusActive}
        />
      ))}

      {/* Widgets layer */}
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          widget={widget}
          isFocused={isWidgetFocused(widget.id)}
          isRelated={isWidgetRelated(widget.id)}
          isBlurred={isWidgetBlurred(widget.id)}
          onHover={handleWidgetHover}
          onSelect={handleWidgetSelect}
        />
      ))}

      {/* UI Overlays */}
      <ConnectionLegend />
      <DepthNavigation currentLevel={currentDepth} onLevelChange={onDepthChange} />

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!isFocusActive}
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
    // Future: Filter widgets based on depth level
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
            <span className="font-medium text-slate-800">Наведите</span> на виджет для фокусировки
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
