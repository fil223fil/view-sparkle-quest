import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Billboard, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Priority scales from documentation
type Priority = 'critical' | 'high' | 'medium' | 'low';
const PRIORITY_SCALES: Record<Priority, number> = {
  critical: 1.5,
  high: 1.35,
  medium: 1.2,
  low: 1.0,
};

// Connection types from documentation
type ConnectionType = 'dataFlow' | 'dependency' | 'contextLink' | 'logicChain';

interface Widget {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  icon: string;
  priority: Priority;
  infoLoad: number; // 0-1
  color: string;
  miniWidgets?: { icon: string; label: string }[];
  connects: string[];
}

interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
}

// Widget ecosystem
const WIDGETS: Widget[] = [
  // Core widgets
  {
    id: 'lmm-core',
    x: 0,
    y: 0,
    title: 'LMM Core',
    subtitle: 'Neural Engine',
    icon: '🧠',
    priority: 'critical',
    infoLoad: 0.92,
    color: '#58C4DD',
    miniWidgets: [
      { icon: '⚡', label: 'GPU' },
      { icon: '🔥', label: 'TPU' },
      { icon: '💾', label: 'RAM' },
    ],
    connects: ['memory', 'processing', 'analytics', 'calendar'],
  },
  {
    id: 'memory',
    x: -2.5,
    y: 1.5,
    title: 'Memory',
    subtitle: 'Long-term Storage',
    icon: '💾',
    priority: 'high',
    infoLoad: 0.78,
    color: '#9A72AC',
    miniWidgets: [
      { icon: '📚', label: 'Docs' },
      { icon: '🖼️', label: 'Media' },
    ],
    connects: ['notes', 'photos'],
  },
  {
    id: 'processing',
    x: 2.5,
    y: 1.2,
    title: 'Processing',
    subtitle: 'Task Queue',
    icon: '⚙️',
    priority: 'high',
    infoLoad: 0.85,
    color: '#F39C12',
    miniWidgets: [
      { icon: '🔄', label: 'Sync' },
      { icon: '📊', label: 'Stats' },
    ],
    connects: ['tasks', 'reminders'],
  },
  {
    id: 'analytics',
    x: 0,
    y: 2.2,
    title: 'Analytics',
    subtitle: 'Insights',
    icon: '📊',
    priority: 'high',
    infoLoad: 0.65,
    color: '#5CD0B3',
    miniWidgets: [
      { icon: '📈', label: 'Charts' },
      { icon: '🎯', label: 'Goals' },
    ],
    connects: ['fitness', 'weather'],
  },
  // System widgets
  {
    id: 'calendar',
    x: -3.5,
    y: -0.5,
    title: 'Calendar',
    icon: '📅',
    priority: 'medium',
    infoLoad: 0.55,
    color: '#FC6255',
    connects: ['reminders', 'meetings'],
  },
  {
    id: 'tasks',
    x: 3.2,
    y: -0.3,
    title: 'Tasks',
    icon: '✅',
    priority: 'medium',
    infoLoad: 0.72,
    color: '#83C167',
    connects: ['notes'],
  },
  {
    id: 'notes',
    x: -2,
    y: -1.8,
    title: 'Notes',
    icon: '📝',
    priority: 'medium',
    infoLoad: 0.48,
    color: '#F9F871',
    connects: [],
  },
  {
    id: 'reminders',
    x: 1.5,
    y: -1.5,
    title: 'Reminders',
    icon: '🔔',
    priority: 'low',
    infoLoad: 0.35,
    color: '#E8B923',
    connects: [],
  },
  {
    id: 'photos',
    x: -4,
    y: 1,
    title: 'Photos',
    icon: '📷',
    priority: 'low',
    infoLoad: 0.42,
    color: '#D147BD',
    connects: [],
  },
  {
    id: 'fitness',
    x: 2,
    y: 2.5,
    title: 'Fitness',
    icon: '💪',
    priority: 'low',
    infoLoad: 0.28,
    color: '#83C167',
    connects: [],
  },
  {
    id: 'weather',
    x: -1.5,
    y: 2.8,
    title: 'Weather',
    icon: '🌤️',
    priority: 'low',
    infoLoad: 0.15,
    color: '#9CDCEB',
    connects: [],
  },
  {
    id: 'meetings',
    x: -4.5,
    y: -1.5,
    title: 'Meetings',
    icon: '👥',
    priority: 'medium',
    infoLoad: 0.58,
    color: '#58C4DD',
    connects: [],
  },
];

// Connections with 4 types
const CONNECTIONS: Connection[] = [
  // Data Flow - active data transfer
  { from: 'lmm-core', to: 'memory', type: 'dataFlow' },
  { from: 'lmm-core', to: 'processing', type: 'dataFlow' },
  { from: 'processing', to: 'tasks', type: 'dataFlow' },
  
  // Dependency - structural dependency
  { from: 'lmm-core', to: 'analytics', type: 'dependency' },
  { from: 'memory', to: 'notes', type: 'dependency' },
  { from: 'memory', to: 'photos', type: 'dependency' },
  
  // Context Link - semantic connection
  { from: 'lmm-core', to: 'calendar', type: 'contextLink' },
  { from: 'analytics', to: 'fitness', type: 'contextLink' },
  { from: 'analytics', to: 'weather', type: 'contextLink' },
  
  // Logic Chain - AI reasoning
  { from: 'calendar', to: 'reminders', type: 'logicChain' },
  { from: 'calendar', to: 'meetings', type: 'logicChain' },
  { from: 'processing', to: 'reminders', type: 'logicChain' },
  { from: 'tasks', to: 'notes', type: 'logicChain' },
];

// Connection styles from documentation
const CONNECTION_STYLES: Record<ConnectionType, { color: string; dash?: boolean; particles?: boolean; arrows?: boolean }> = {
  dataFlow: { color: '#58C4DD', particles: true },
  dependency: { color: '#9A72AC', dash: true },
  contextLink: { color: '#E8B923' },
  logicChain: { color: '#FC6255', arrows: true },
};

// Mini Widget Component
const MiniWidget = ({
  icon,
  label,
  position,
  opacity,
  scale = 1,
}: {
  icon: string;
  label: string;
  position: [number, number, number];
  opacity: number;
  scale?: number;
}) => (
  <Billboard follow position={position}>
    <group scale={scale}>
      <RoundedBox args={[0.35, 0.35, 0.05]} radius={0.08} smoothness={4}>
        <meshBasicMaterial color="#1C1C1E" transparent opacity={opacity * 0.9} />
      </RoundedBox>
      <Text position={[0, 0.02, 0.03]} fontSize={0.12} anchorX="center" anchorY="middle" fillOpacity={opacity}>
        {icon}
      </Text>
      <Text position={[0, -0.12, 0.03]} fontSize={0.05} color="#888888" anchorX="center" fillOpacity={opacity * 0.8}>
        {label}
      </Text>
    </group>
  </Billboard>
);

// Info Load Bar Component
const InfoLoadBar = ({
  load,
  width,
  position,
  opacity,
  color,
}: {
  load: number;
  width: number;
  position: [number, number, number];
  opacity: number;
  color: string;
}) => (
  <group position={position}>
    {/* Background */}
    <RoundedBox args={[width * 0.8, 0.06, 0.01]} radius={0.02} smoothness={2}>
      <meshBasicMaterial color="#2C2C2E" transparent opacity={opacity * 0.8} />
    </RoundedBox>
    {/* Fill */}
    <RoundedBox
      args={[width * 0.8 * load, 0.06, 0.015]}
      radius={0.02}
      smoothness={2}
      position={[-(width * 0.8 * (1 - load)) / 2, 0, 0.005]}
    >
      <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} />
    </RoundedBox>
  </group>
);

// Orbit Mini Widgets (shown on focus)
const OrbitMiniWidgets = ({
  miniWidgets,
  centerPosition,
  opacity,
  time,
}: {
  miniWidgets: { icon: string; label: string }[];
  centerPosition: [number, number, number];
  opacity: number;
  time: number;
}) => {
  const radius = 0.9;
  
  return (
    <group position={centerPosition}>
      {miniWidgets.map((mini, i) => {
        const angle = (i / miniWidgets.length) * Math.PI * 2 + time * 0.3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <MiniWidget
            key={i}
            icon={mini.icon}
            label={mini.label}
            position={[x, y, 0.1]}
            opacity={opacity}
            scale={1.1}
          />
        );
      })}
    </group>
  );
};

// iOS 26 Widget Component
const IOS26Widget = ({
  widget,
  opacity,
  time,
  isHovered,
  isSelected,
  isFocusRelated,
  isBlurred,
  onHover,
  onSelect,
}: {
  widget: Widget;
  opacity: number;
  time: number;
  isHovered: boolean;
  isSelected: boolean;
  isFocusRelated: boolean;
  isBlurred: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) => {
  const priorityScale = PRIORITY_SCALES[widget.priority];
  const baseSize = 0.8;
  const size = baseSize * priorityScale;
  const cornerRadius = size * 0.2;
  
  // Animation states
  const hoverScale = isHovered ? 1.3 : isSelected ? 1.15 : isFocusRelated ? 1.05 : 1;
  const blurOpacity = isBlurred ? 0.25 : 1;
  const pulse = isHovered || isSelected ? 1 + Math.sin(time * 4) * 0.05 : 1;
  const lift = isHovered ? 0.2 : isSelected ? 0.1 : 0;
  
  // Glow intensity
  const glowIntensity = isHovered ? 0.6 : isSelected ? 0.4 : isFocusRelated ? 0.2 : 0;

  return (
    <group
      position={[widget.x, widget.y + lift, 0]}
      scale={hoverScale * pulse}
    >
      {/* Glow effect */}
      {glowIntensity > 0 && (
        <RoundedBox
          args={[size + 0.2, size + 0.2, 0.02]}
          radius={cornerRadius + 0.05}
          smoothness={4}
          position={[0, 0, -0.05]}
        >
          <meshBasicMaterial
            color={widget.color}
            transparent
            opacity={opacity * glowIntensity * blurOpacity * (1 + Math.sin(time * 3) * 0.3)}
          />
        </RoundedBox>
      )}
      
      {/* Shadow */}
      <RoundedBox
        args={[size, size, 0.02]}
        radius={cornerRadius}
        smoothness={4}
        position={[0.05, -0.05, -0.1]}
      >
        <meshBasicMaterial color="#000000" transparent opacity={opacity * 0.2 * blurOpacity} />
      </RoundedBox>
      
      {/* Main background - Glassmorphism */}
      <RoundedBox
        args={[size, size, 0.08]}
        radius={cornerRadius}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(widget.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(widget.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          document.body.style.cursor = 'default';
        }}
      >
        <meshBasicMaterial color="#1C1C1E" transparent opacity={opacity * 0.92 * blurOpacity} />
      </RoundedBox>
      
      {/* Glass highlight */}
      <RoundedBox
        args={[size * 0.85, size * 0.15, 0.09]}
        radius={cornerRadius * 0.4}
        smoothness={3}
        position={[0, size * 0.35, 0.01]}
      >
        <meshBasicMaterial color="#FFFFFF" transparent opacity={opacity * 0.12 * blurOpacity} />
      </RoundedBox>
      
      {/* Priority indicator (top line) */}
      <RoundedBox
        args={[size * 0.6, 0.04, 0.09]}
        radius={0.01}
        smoothness={2}
        position={[0, size * 0.42, 0.02]}
      >
        <meshBasicMaterial
          color={
            widget.priority === 'critical' ? '#FC6255' :
            widget.priority === 'high' ? '#F39C12' :
            widget.priority === 'medium' ? '#58C4DD' : '#48484A'
          }
          transparent
          opacity={opacity * 0.95 * blurOpacity}
        />
      </RoundedBox>
      
      {/* Content */}
      <Billboard follow position={[0, 0, 0.1]}>
        {/* Icon */}
        <Text
          position={[0, size * 0.12, 0]}
          fontSize={size * 0.35}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * blurOpacity}
        >
          {widget.icon}
        </Text>
        
        {/* Title */}
        <Text
          position={[0, -size * 0.18, 0]}
          fontSize={size * 0.11}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.95 * blurOpacity}
        >
          {widget.title}
        </Text>
        
        {/* Subtitle */}
        {widget.subtitle && (
          <Text
            position={[0, -size * 0.3, 0]}
            fontSize={size * 0.07}
            color="#888888"
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * 0.7 * blurOpacity}
          >
            {widget.subtitle}
          </Text>
        )}
      </Billboard>
      
      {/* Info Load Bar */}
      <InfoLoadBar
        load={widget.infoLoad}
        width={size}
        position={[0, -size * 0.42, 0.05]}
        opacity={opacity * blurOpacity}
        color={widget.color}
      />
      
      {/* Mini widgets inside (shown on hover/select) */}
      {(isHovered || isSelected) && widget.miniWidgets && (
        <OrbitMiniWidgets
          miniWidgets={widget.miniWidgets}
          centerPosition={[0, 0, 0.15]}
          opacity={opacity}
          time={time}
        />
      )}
    </group>
  );
};

// Connection Component with 4 types
const ConnectionLine = ({
  fromWidget,
  toWidget,
  type,
  opacity,
  time,
  isHighlighted,
}: {
  fromWidget: Widget;
  toWidget: Widget;
  type: ConnectionType;
  opacity: number;
  time: number;
  isHighlighted: boolean;
}) => {
  const style = CONNECTION_STYLES[type];
  const dimOpacity = isHighlighted ? 1 : 0.3;
  
  // Calculate curved path
  const points = useMemo(() => {
    const start = new THREE.Vector3(fromWidget.x, fromWidget.y, 0);
    const end = new THREE.Vector3(toWidget.x, toWidget.y, 0);
    
    const mid = start.clone().lerp(end, 0.5);
    const perpendicular = new THREE.Vector3(
      -(end.y - start.y),
      end.x - start.x,
      0
    ).normalize();
    
    const distance = start.distanceTo(end);
    mid.add(perpendicular.multiplyScalar(distance * 0.2));
    mid.z = 0.15;
    
    // Create curve
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [fromWidget.x, fromWidget.y, toWidget.x, toWidget.y]);
  
  // Particles for Data Flow
  const particles = useMemo(() => {
    if (!style.particles) return [];
    return [0, 0.33, 0.66].map((offset, i) => {
      const t = (time * 0.4 + offset) % 1;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(fromWidget.x, fromWidget.y, 0),
        new THREE.Vector3(
          (fromWidget.x + toWidget.x) / 2,
          (fromWidget.y + toWidget.y) / 2 + 0.3,
          0.15
        ),
        new THREE.Vector3(toWidget.x, toWidget.y, 0)
      );
      return { point: curve.getPoint(t), opacity: Math.sin(t * Math.PI), key: i };
    });
  }, [fromWidget, toWidget, time, style.particles]);
  
  // Arrow for Logic Chain
  const arrowPosition = useMemo(() => {
    if (!style.arrows) return null;
    const t = 0.7;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(fromWidget.x, fromWidget.y, 0),
      new THREE.Vector3(
        (fromWidget.x + toWidget.x) / 2,
        (fromWidget.y + toWidget.y) / 2 + 0.3,
        0.15
      ),
      new THREE.Vector3(toWidget.x, toWidget.y, 0)
    );
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const angle = Math.atan2(tangent.y, tangent.x);
    return { point, angle };
  }, [fromWidget, toWidget, style.arrows]);

  return (
    <group>
      {/* Main line */}
      <Line
        points={points}
        color={style.color}
        lineWidth={isHighlighted ? 3 : 1.5}
        transparent
        opacity={opacity * dimOpacity * (style.dash ? 0.6 : 0.8)}
        dashed={style.dash}
        dashSize={style.dash ? 0.1 : undefined}
        gapSize={style.dash ? 0.05 : undefined}
      />
      
      {/* Glow for highlighted */}
      {isHighlighted && (
        <Line
          points={points}
          color={style.color}
          lineWidth={8}
          transparent
          opacity={opacity * 0.25 * (1 + Math.sin(time * 3) * 0.3)}
        />
      )}
      
      {/* Particles for Data Flow */}
      {style.particles && particles.map(({ point, opacity: pOpacity, key }) => (
        <Sphere key={key} args={[0.04, 8, 8]} position={[point.x, point.y, point.z + 0.05]}>
          <meshBasicMaterial color={style.color} transparent opacity={opacity * pOpacity * dimOpacity} />
        </Sphere>
      ))}
      
      {/* Arrow for Logic Chain */}
      {style.arrows && arrowPosition && (
        <group position={[arrowPosition.point.x, arrowPosition.point.y, arrowPosition.point.z + 0.05]}>
          <mesh rotation={[0, 0, arrowPosition.angle - Math.PI / 2]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshBasicMaterial color={style.color} transparent opacity={opacity * dimOpacity} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Connection Type Legend
const ConnectionLegend = ({ opacity }: { opacity: number }) => (
  <Billboard follow position={[4.5, 2.8, 0]}>
    <group>
      <Text position={[0, 0.4, 0]} fontSize={0.1} color="#FFFFFF" anchorX="left" fillOpacity={opacity * 0.9}>
        Типы связей:
      </Text>
      
      {/* Data Flow */}
      <group position={[0, 0.2, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color="#58C4DD" transparent opacity={opacity} />
        </mesh>
        <Text position={[0, 0, 0]} fontSize={0.07} color="#58C4DD" anchorX="left" fillOpacity={opacity * 0.9}>
          Data Flow
        </Text>
      </group>
      
      {/* Dependency */}
      <group position={[0, 0.05, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color="#9A72AC" transparent opacity={opacity} />
        </mesh>
        <Text position={[0, 0, 0]} fontSize={0.07} color="#9A72AC" anchorX="left" fillOpacity={opacity * 0.9}>
          Dependency
        </Text>
      </group>
      
      {/* Context Link */}
      <group position={[0, -0.1, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color="#E8B923" transparent opacity={opacity} />
        </mesh>
        <Text position={[0, 0, 0]} fontSize={0.07} color="#E8B923" anchorX="left" fillOpacity={opacity * 0.9}>
          Context Link
        </Text>
      </group>
      
      {/* Logic Chain */}
      <group position={[0, -0.25, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color="#FC6255" transparent opacity={opacity} />
        </mesh>
        <Text position={[0, 0, 0]} fontSize={0.07} color="#FC6255" anchorX="left" fillOpacity={opacity * 0.9}>
          Logic Chain
        </Text>
      </group>
    </group>
  </Billboard>
);

// Main Component
export const FractalUniverse = ({
  depth,
  position,
  scale,
  opacity,
  onDiveIn,
  isActive,
}: FractalUniverseProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    setTime(timeRef.current);
    
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.08) * 0.03;
      groupRef.current.rotation.x = -0.3 + Math.sin(timeRef.current * 0.1) * 0.02;
    }
  });

  const activeWidget = hoveredWidget || selectedWidget;
  
  // Calculate related widgets and connections
  const { relatedWidgets, highlightedConnections } = useMemo(() => {
    if (!activeWidget) return { relatedWidgets: new Set<string>(), highlightedConnections: new Set<string>() };
    
    const related = new Set<string>([activeWidget]);
    const highlighted = new Set<string>();
    
    CONNECTIONS.forEach((conn) => {
      if (conn.from === activeWidget || conn.to === activeWidget) {
        related.add(conn.from);
        related.add(conn.to);
        highlighted.add(`${conn.from}-${conn.to}`);
      }
    });
    
    // Also add widgets from connects array
    const widget = WIDGETS.find(w => w.id === activeWidget);
    if (widget) {
      widget.connects.forEach(id => related.add(id));
    }
    
    return { relatedWidgets: related, highlightedConnections: highlighted };
  }, [activeWidget]);

  const handleHover = useCallback((id: string | null) => {
    setHoveredWidget(id);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedWidget(selectedWidget === id ? null : id);
  }, [selectedWidget]);

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[-0.3, 0, 0]}>
      {/* Background grid */}
      {Array.from({ length: 20 }).map((_, i) =>
        Array.from({ length: 15 }).map((_, j) => (
          <mesh key={`dot-${i}-${j}`} position={[-9 + i, -6 + j * 0.9, -0.5]}>
            <circleGeometry args={[0.012, 6]} />
            <meshBasicMaterial color="#2C2C2E" transparent opacity={opacity * 0.4} />
          </mesh>
        ))
      )}

      {/* Connections */}
      {CONNECTIONS.map((conn) => {
        const fromWidget = WIDGETS.find(w => w.id === conn.from);
        const toWidget = WIDGETS.find(w => w.id === conn.to);
        if (!fromWidget || !toWidget) return null;
        
        const isHighlighted = highlightedConnections.has(`${conn.from}-${conn.to}`);
        
        return (
          <ConnectionLine
            key={`${conn.from}-${conn.to}`}
            fromWidget={fromWidget}
            toWidget={toWidget}
            type={conn.type}
            opacity={opacity}
            time={time}
            isHighlighted={!activeWidget || isHighlighted}
          />
        );
      })}

      {/* Widgets */}
      {WIDGETS.map((widget) => {
        const isHovered = hoveredWidget === widget.id;
        const isSelected = selectedWidget === widget.id;
        const isFocusRelated = relatedWidgets.has(widget.id);
        const isBlurred = activeWidget !== null && !isFocusRelated;
        
        return (
          <IOS26Widget
            key={widget.id}
            widget={widget}
            opacity={opacity}
            time={time}
            isHovered={isHovered}
            isSelected={isSelected}
            isFocusRelated={isFocusRelated}
            isBlurred={isBlurred}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        );
      })}

      {/* Legend */}
      <ConnectionLegend opacity={opacity} />

      {/* Title */}
      <Billboard follow position={[0, 3.8, 0]}>
        <Text
          fontSize={0.25}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.95}
        >
          Ядро Ленин — iOS 26 Ecosystem
        </Text>
        <Text
          position={[0, -0.35, 0]}
          fontSize={0.1}
          color="#888888"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.7}
        >
          Наведите на виджет для режима фокусировки
        </Text>
      </Billboard>

      {/* Priority Legend */}
      <Billboard follow position={[-4.5, 2.8, 0]}>
        <group>
          <Text position={[0, 0.4, 0]} fontSize={0.1} color="#FFFFFF" anchorX="left" fillOpacity={opacity * 0.9}>
            Приоритет:
          </Text>
          
          <group position={[0, 0.2, 0]}>
            <RoundedBox args={[0.08, 0.03, 0.01]} radius={0.005} position={[-0.15, 0, 0]}>
              <meshBasicMaterial color="#FC6255" transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0]} fontSize={0.07} color="#FC6255" anchorX="left" fillOpacity={opacity * 0.9}>
              Critical (1.5x)
            </Text>
          </group>
          
          <group position={[0, 0.05, 0]}>
            <RoundedBox args={[0.08, 0.03, 0.01]} radius={0.005} position={[-0.15, 0, 0]}>
              <meshBasicMaterial color="#F39C12" transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0]} fontSize={0.07} color="#F39C12" anchorX="left" fillOpacity={opacity * 0.9}>
              High (1.35x)
            </Text>
          </group>
          
          <group position={[0, -0.1, 0]}>
            <RoundedBox args={[0.08, 0.03, 0.01]} radius={0.005} position={[-0.15, 0, 0]}>
              <meshBasicMaterial color="#58C4DD" transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0]} fontSize={0.07} color="#58C4DD" anchorX="left" fillOpacity={opacity * 0.9}>
              Medium (1.2x)
            </Text>
          </group>
          
          <group position={[0, -0.25, 0]}>
            <RoundedBox args={[0.08, 0.03, 0.01]} radius={0.005} position={[-0.15, 0, 0]}>
              <meshBasicMaterial color="#48484A" transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0]} fontSize={0.07} color="#888888" anchorX="left" fillOpacity={opacity * 0.9}>
              Low (1x)
            </Text>
          </group>
        </group>
      </Billboard>
    </group>
  );
};
