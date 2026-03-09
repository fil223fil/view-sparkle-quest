// Ядро Ленин - Main Component
// iOS 26 Widget Ecosystem Visualization
import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { WidgetData, ConnectionData, DepthLevel } from './types';
import { INITIAL_WIDGETS, INITIAL_CONNECTIONS } from './data';
import { useFocusMode } from './hooks/useFocusMode';
import { useDiveAnimation } from './hooks/useDiveAnimation';
import { usePhysicsSimulation } from './hooks/usePhysicsSimulation';
import { Widget } from './components/Widget';
import { Connection } from './components/Connection';
import { SubWidget } from './components/SubWidget';
import { DiveOverlay } from './components/DiveOverlay';
import { ThinkingFlowConnection } from './components/ThinkingFlowConnection';
import { Background } from './components/Background';
import { ChatInputWidget } from './components/ChatInputWidget';
import { useChatStore } from '@/store/useChatStore';

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
  const activeGroups = useChatStore((s) => s.activeGroups);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPaused(p => !p); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    focusState, handleWidgetHover, handleWidgetSelect,
    isWidgetFocused, isWidgetRelated, isWidgetBlurred, isConnectionHighlighted,
  } = useFocusMode(widgets, connections);

  const {
    diveState, handleDoubleTap, handleSurface, isDived,
  } = useDiveAnimation(widgets, onDepthChange);

  useFrame(() => {
    if (!isPaused && !isDived) {
      setWidgets((prev) => calculateForces({ widgets: prev, connections, activeGroups }));
    }
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDived) handleSurface();
        else if (focusState.focusedWidgetId) handleWidgetSelect(focusState.focusedWidgetId);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDived, focusState.focusedWidgetId, handleSurface, handleWidgetSelect]);

  const isFocusActive = focusState.focusedWidgetId !== null;
  const divedWidget = diveState.divedWidgetId ? widgets.find(w => w.id === diveState.divedWidgetId) : null;

  return (
    <>
      <Background />

      {/* Connections layer */}
      {!isDived && connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          widgets={widgets}
          isHighlighted={isConnectionHighlighted(connection.id)}
          isFocusActive={isFocusActive}
        />
      ))}

      {/* Thinking flow connections from queries */}
      {!isDived && activeGroups.map((group) => (
        <ThinkingFlowConnection key={group.id} group={group} widgets={widgets} />
      ))}

      {/* Widgets layer */}
      {widgets.map((widget) => {
        if (isDived && widget.id !== diveState.divedWidgetId) return null;
        
        // Check if widget is part of any active group
        const isInActiveGroup = activeGroups.some(g => g.widgetIds.includes(widget.id));
        
        return (
          <Widget
            key={widget.id}
            widget={widget}
            isFocused={isWidgetFocused(widget.id) || isInActiveGroup}
            isRelated={isWidgetRelated(widget.id)}
            isBlurred={!isDived && isWidgetBlurred(widget.id) && !isInActiveGroup}
            isDived={widget.id === diveState.divedWidgetId}
            onHover={handleWidgetHover}
            onSelect={handleWidgetSelect}
            onDoubleTap={handleDoubleTap}
          />
        );
      })}

      {/* Sub-widgets layer */}
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

      {/* Dive overlay */}
      {isDived && divedWidget && (
        <DiveOverlay widgetTitle={divedWidget.title} onSurface={handleSurface} />
      )}

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
  const { theme, setTheme } = useTheme();

  const handleDepthChange = useCallback((level: DepthLevel) => {
    setCurrentDepth(level);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <div className="w-full h-screen bg-transparent relative overflow-hidden font-sans text-foreground">
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[100px] -z-10 mix-blend-overlay" />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6 pt-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl glass-liquid relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              🧠
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Ядро Ленин</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-80">Синхронизировано</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="glass-capsule w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-foreground"
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="glass-capsule px-5 py-2.5 rounded-full flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <span className="text-sm font-medium text-foreground">Система активна</span>
            </div>
          </div>
        </div>
      </header>

      <ChatInputWidget />

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

      <div className="sr-only" role="status" aria-live="polite">
        Текущий уровень глубины: {currentDepth}
      </div>
    </div>
  );
};

export default LeninCore;
