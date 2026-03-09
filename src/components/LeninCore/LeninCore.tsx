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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleDepthChange = useCallback((level: DepthLevel) => {
    setCurrentDepth(level);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Inline glass styles for header (not in .dark scope)
  const headerGlass: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(30,30,40,0.6) 0%, rgba(15,15,20,0.3) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.4)',
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 2px rgba(255,255,255,0.5)',
  };

  const pillGlass: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(180deg, rgba(40,40,50,0.6) 0%, rgba(20,20,25,0.4) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.35) 100%)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.5)',
    boxShadow: isDark
      ? '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.06)'
      : '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 2px rgba(255,255,255,0.5)',
  };

  const textColor = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.88)';
  const mutedTextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[100px] -z-10 mix-blend-overlay" />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-5 pt-[env(safe-area-inset-top,44px)]">
        <div className="flex items-center justify-between max-w-7xl mx-auto rounded-[22px] px-5 py-3" style={headerGlass}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-105" style={{
              background: isDark ? 'rgba(88,196,221,0.15)' : 'rgba(88,196,221,0.12)',
              boxShadow: isDark ? '0 4px 12px rgba(88,196,221,0.2)' : '0 4px 12px rgba(88,196,221,0.15)',
            }}>
              🧠
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: textColor }}>Ядро Ленин</h1>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: mutedTextColor }}>Синхронизировано</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Theme toggle — Apple-native 44pt touch target */}
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90"
              style={{ ...pillGlass, color: textColor }}
              aria-label="Переключить тему"
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <div className="rounded-full flex items-center gap-2.5 px-4 py-2" style={pillGlass}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34C759', boxShadow: '0 0 8px rgba(52,199,89,0.6)' }} />
              <span className="text-[13px] font-semibold" style={{ color: textColor }}>Активна</span>
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
