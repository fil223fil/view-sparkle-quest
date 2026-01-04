import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Billboard, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Виджеты для изометрического вида
const WIDGETS = [
  // Центральный виджет
  { id: 'focus', x: 0, y: 0, z: 0, width: 2.2, height: 1.4, type: 'main', title: 'Стратегическое планирование Q3', subtitle: 'Долгосрочное планирование целей команды', icon: '🎯', color: 'rgba(255,255,255,0.95)', gradient: ['#FFFFFF', '#F0F4F8'] },
  
  // Верхний левый кластер
  { id: 'calendar', x: -3.5, y: 1.8, z: 0, width: 1.3, height: 1.3, type: 'calendar', title: 'Calendar', icon: '📅', color: '#FFFFFF', gradient: ['#FF6B6B', '#EE5A5A'] },
  { id: 'reminder', x: -4.8, y: 0.8, z: 0, width: 1, height: 0.7, type: 'small', title: 'Reminder', icon: '🔔', color: '#FFFFFF', gradient: ['#FFB347', '#FFA500'] },
  { id: 'notes', x: -5.2, y: -0.3, z: 0, width: 0.9, height: 0.9, type: 'small', title: 'Notes', icon: '📝', color: '#FFFFFF', gradient: ['#87CEEB', '#6BB3D9'] },
  
  // Верхний правый кластер  
  { id: 'stats', x: 2.8, y: 2.2, z: 0, width: 1.4, height: 1, type: 'chart', title: 'Analytics', icon: '📊', color: '#FFFFFF', gradient: ['#4ECDC4', '#45B7AA'] },
  { id: 'progress', x: 4.2, y: 1.5, z: 0, width: 1.1, height: 1.1, type: 'progress', title: 'Progress', icon: '📈', color: '#FFFFFF', gradient: ['#96CEB4', '#7AB89A'] },
  { id: 'creative', x: 4.5, y: 0.3, z: 0, width: 1.2, height: 0.9, type: 'gradient', title: 'Creative pad', icon: '🎨', color: '#FFFFFF', gradient: ['#FF6B9D', '#C44569'] },
  
  // Средний левый кластер
  { id: 'tasks', x: -3, y: 0.2, z: 0, width: 1.3, height: 1, type: 'list', title: 'Tasks', subtitle: 'Daily goals', icon: '✅', color: '#FFFFFF', gradient: ['#FFEAA7', '#FDCB6E'] },
  { id: 'research', x: -3.8, y: -1.2, z: 0, width: 1.2, height: 1.1, type: 'list', title: 'Research', icon: '🔍', color: '#FFFFFF', gradient: ['#DFE6E9', '#B2BEC3'] },
  
  // Средний правый кластер
  { id: 'content', x: 3.2, y: -0.5, z: 0, width: 1.1, height: 0.9, type: 'small', title: 'Content ideas', icon: '💡', color: '#FFFFFF', gradient: ['#C9A227', '#A68523'] },
  { id: 'search', x: 4.8, y: -0.8, z: 0, width: 1.3, height: 1.2, type: 'list', title: 'Search', icon: '🔎', color: '#FFFFFF', gradient: ['#FFFFFF', '#F8F9FA'] },
  
  // Нижний кластер
  { id: 'code', x: 1.2, y: -2, z: 0, width: 1.6, height: 1.2, type: 'code', title: 'Code', icon: '💻', color: '#1E1E1E', gradient: ['#2D2D2D', '#1E1E1E'] },
  { id: 'snippets', x: -1, y: -2.3, z: 0, width: 1.2, height: 0.9, type: 'dark', title: 'Snippets', icon: '📋', color: '#2D2D2D', gradient: ['#3D3D3D', '#2D2D2D'] },
  { id: 'researchNotes', x: 3.5, y: -2, z: 0, width: 1.4, height: 1.1, type: 'notes', title: 'Research notes', icon: '📒', color: '#FFFFFF', gradient: ['#FFFACD', '#FFF8B3'] },
  
  // Дополнительные виджеты
  { id: 'profile', x: -4.5, y: -2.2, z: 0, width: 0.7, height: 0.7, type: 'avatar', title: 'Profile', icon: '👤', color: '#FFFFFF', gradient: ['#E8D5B7', '#D4C4A8'] },
  { id: 'settings', x: -2.5, y: -1.5, z: 0, width: 0.8, height: 0.8, type: 'small', title: 'Settings', icon: '⚙️', color: '#FFFFFF', gradient: ['#A8E6CF', '#7DD3B5'] },
  { id: 'stickies', x: 5.2, y: -2.2, z: 0, width: 1, height: 0.8, type: 'sticky', title: 'Quick notes', icon: '📌', color: '#FFFACD', gradient: ['#FFFACD', '#FFF59D'] },
];

// Связи между виджетами (стрелки)
const CONNECTIONS = [
  // От центра к ключевым виджетам
  { from: 'focus', to: 'calendar', color: '#00BFA5' },
  { from: 'focus', to: 'stats', color: '#00BFA5' },
  { from: 'focus', to: 'code', color: '#7C4DFF' },
  { from: 'focus', to: 'tasks', color: '#00BFA5' },
  { from: 'focus', to: 'content', color: '#FFB300' },
  
  // Между виджетами
  { from: 'calendar', to: 'reminder', color: '#00BFA5' },
  { from: 'calendar', to: 'tasks', color: '#00BFA5' },
  { from: 'stats', to: 'progress', color: '#00BFA5' },
  { from: 'stats', to: 'creative', color: '#FF6B9D' },
  { from: 'tasks', to: 'research', color: '#00BFA5' },
  { from: 'research', to: 'notes', color: '#00BFA5' },
  { from: 'code', to: 'snippets', color: '#7C4DFF' },
  { from: 'code', to: 'researchNotes', color: '#7C4DFF' },
  { from: 'content', to: 'search', color: '#FFB300' },
  { from: 'search', to: 'stickies', color: '#FFB300' },
  { from: 'creative', to: 'search', color: '#FF6B9D' },
  { from: 'snippets', to: 'profile', color: '#7C4DFF' },
  { from: 'research', to: 'settings', color: '#00BFA5' },
];

// iOS виджет компонент
const IOSWidget = ({
  widget,
  opacity,
  time,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}: {
  widget: typeof WIDGETS[0];
  opacity: number;
  time: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) => {
  const scale = isHovered ? 1.05 : isSelected ? 1.03 : 1;
  const lift = isHovered ? 0.15 : isSelected ? 0.1 : 0;
  const cornerRadius = Math.min(widget.width, widget.height) * 0.15;
  
  // Изометрическая проекция
  const isoX = widget.x * 0.8;
  const isoY = widget.y * 0.6 + lift;
  const isoZ = widget.x * 0.2 + widget.y * 0.3;

  const isDark = widget.type === 'code' || widget.type === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtitleColor = isDark ? '#888888' : '#666666';

  return (
    <group position={[isoX, isoY, isoZ]} scale={scale}>
      {/* Тень */}
      <RoundedBox
        args={[widget.width, widget.height, 0.02]}
        radius={cornerRadius}
        smoothness={4}
        position={[0.08, -0.08, -0.1]}
      >
        <meshBasicMaterial color="#000000" transparent opacity={opacity * 0.15} />
      </RoundedBox>
      
      {/* Фон виджета с градиентом */}
      <RoundedBox
        args={[widget.width, widget.height, 0.08]}
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
        <meshBasicMaterial 
          color={widget.gradient[0]} 
          transparent 
          opacity={opacity * 0.98}
        />
      </RoundedBox>
      
      {/* Блик сверху для глубины */}
      <RoundedBox
        args={[widget.width * 0.9, widget.height * 0.15, 0.09]}
        radius={cornerRadius * 0.5}
        smoothness={3}
        position={[0, widget.height * 0.35, 0.01]}
      >
        <meshBasicMaterial color="#FFFFFF" transparent opacity={opacity * (isDark ? 0.05 : 0.25)} />
      </RoundedBox>

      {/* Контент виджета */}
      <Billboard follow={true} position={[0, 0, 0.1]}>
        {/* Иконка */}
        <Text
          position={[0, widget.height * 0.15, 0]}
          fontSize={Math.min(widget.width, widget.height) * 0.25}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity}
        >
          {widget.icon}
        </Text>
        
        {/* Заголовок */}
        <Text
          position={[0, -widget.height * 0.15, 0]}
          fontSize={Math.min(widget.width, widget.height) * 0.1}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.9}
          maxWidth={widget.width * 0.85}
        >
          {widget.title}
        </Text>
        
        {/* Подзаголовок */}
        {widget.subtitle && (
          <Text
            position={[0, -widget.height * 0.32, 0]}
            fontSize={Math.min(widget.width, widget.height) * 0.06}
            color={subtitleColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * 0.7}
            maxWidth={widget.width * 0.8}
          >
            {widget.subtitle}
          </Text>
        )}
      </Billboard>

      {/* Дополнительные элементы для разных типов */}
      {widget.type === 'chart' && (
        <group position={[0, -widget.height * 0.05, 0.05]}>
          {[0, 1, 2, 3].map((i) => (
            <RoundedBox
              key={i}
              args={[0.15, 0.1 + Math.random() * 0.3, 0.02]}
              radius={0.02}
              position={[-0.3 + i * 0.2, -0.1, 0]}
            >
              <meshBasicMaterial 
                color={['#4ECDC4', '#45B7AA', '#38A89D', '#2B9A8E'][i]} 
                transparent 
                opacity={opacity * 0.8}
              />
            </RoundedBox>
          ))}
        </group>
      )}

      {widget.type === 'progress' && (
        <group position={[0, -0.1, 0.05]}>
          <RoundedBox args={[0.8, 0.1, 0.02]} radius={0.02} position={[0, 0, 0]}>
            <meshBasicMaterial color="#E0E0E0" transparent opacity={opacity * 0.6} />
          </RoundedBox>
          <RoundedBox args={[0.5, 0.1, 0.03]} radius={0.02} position={[-0.15, 0, 0.01]}>
            <meshBasicMaterial color="#4ECDC4" transparent opacity={opacity * 0.9} />
          </RoundedBox>
        </group>
      )}

      {/* Свечение при выделении */}
      {(isHovered || isSelected) && (
        <RoundedBox
          args={[widget.width + 0.15, widget.height + 0.15, 0.01]}
          radius={cornerRadius + 0.03}
          smoothness={3}
          position={[0, 0, -0.05]}
        >
          <meshBasicMaterial 
            color={widget.gradient[0]} 
            transparent 
            opacity={opacity * (1 + Math.sin(time * 4) * 0.3) * 0.3}
          />
        </RoundedBox>
      )}
    </group>
  );
};

// Изогнутая стрелка-связь
const CurvedArrow = ({
  fromWidget,
  toWidget,
  color,
  opacity,
  time,
  isHighlighted,
}: {
  fromWidget: typeof WIDGETS[0];
  toWidget: typeof WIDGETS[0];
  color: string;
  opacity: number;
  time: number;
  isHighlighted: boolean;
}) => {
  // Изометрические позиции
  const startX = fromWidget.x * 0.8;
  const startY = fromWidget.y * 0.6;
  const startZ = fromWidget.x * 0.2 + fromWidget.y * 0.3;
  
  const endX = toWidget.x * 0.8;
  const endY = toWidget.y * 0.6;
  const endZ = toWidget.x * 0.2 + toWidget.y * 0.3;

  // Средняя точка с изгибом
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 + 0.3;
  const midZ = (startZ + endZ) / 2 + 0.2;

  const start = new THREE.Vector3(startX, startY, startZ);
  const mid = new THREE.Vector3(midX, midY, midZ);
  const end = new THREE.Vector3(endX, endY, endZ);

  // Анимация импульса
  const pulseOpacity = isHighlighted ? 0.9 : 0.5 + Math.sin(time * 2) * 0.15;

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        mid={mid}
        end={end}
        color={color}
        lineWidth={isHighlighted ? 3 : 2}
        transparent
        opacity={opacity * pulseOpacity}
      />
      
      {/* Наконечник стрелки */}
      <mesh position={[endX, endY, endZ]} rotation={[0, 0, Math.atan2(endY - midY, endX - midX)]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * pulseOpacity} />
      </mesh>

      {/* Движущийся импульс */}
      {isHighlighted && (
        <>
          {[0, 0.33, 0.66].map((offset, i) => {
            const t = (time * 0.5 + offset) % 1;
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const point = curve.getPoint(t);
            
            return (
              <mesh key={i} position={[point.x, point.y, point.z]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial 
                  color={color} 
                  transparent 
                  opacity={opacity * Math.sin(t * Math.PI) * 0.8}
                />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
};

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
      // Легкое вращение сцены
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.1) * 0.05;
      groupRef.current.rotation.x = -0.4 + Math.sin(timeRef.current * 0.15) * 0.02;
    }
  });

  // Подсветка связей при наведении
  const highlightedConnections = useMemo(() => {
    if (!hoveredWidget && !selectedWidget) return new Set<string>();
    const active = hoveredWidget || selectedWidget;
    const highlighted = new Set<string>();
    
    CONNECTIONS.forEach((conn) => {
      if (conn.from === active || conn.to === active) {
        highlighted.add(`${conn.from}-${conn.to}`);
      }
    });
    
    return highlighted;
  }, [hoveredWidget, selectedWidget]);

  const handleSelectWidget = (id: string) => {
    setSelectedWidget(selectedWidget === id ? null : id);
  };

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[-0.4, 0, 0]}>
      {/* Фоновая плоскость */}
      <mesh position={[0, 0, -1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshBasicMaterial color="#F8FAFC" transparent opacity={opacity * 0.95} />
      </mesh>
      
      {/* Сетка точек на фоне */}
      {Array.from({ length: 15 }).map((_, i) =>
        Array.from({ length: 12 }).map((_, j) => (
          <mesh key={`dot-${i}-${j}`} position={[-7 + i, -5 + j * 0.9, -0.9]}>
            <circleGeometry args={[0.015, 8]} />
            <meshBasicMaterial color="#E2E8F0" transparent opacity={opacity * 0.5} />
          </mesh>
        ))
      )}

      {/* Связи (стрелки) - рендерятся под виджетами */}
      {CONNECTIONS.map((conn) => {
        const fromWidget = WIDGETS.find(w => w.id === conn.from);
        const toWidget = WIDGETS.find(w => w.id === conn.to);
        if (!fromWidget || !toWidget) return null;
        
        const isHighlighted = highlightedConnections.has(`${conn.from}-${conn.to}`);
        
        return (
          <CurvedArrow
            key={`${conn.from}-${conn.to}`}
            fromWidget={fromWidget}
            toWidget={toWidget}
            color={conn.color}
            opacity={opacity}
            time={time}
            isHighlighted={isHighlighted}
          />
        );
      })}

      {/* Виджеты */}
      {WIDGETS.map((widget) => (
        <IOSWidget
          key={widget.id}
          widget={widget}
          opacity={opacity}
          time={time}
          isHovered={hoveredWidget === widget.id}
          isSelected={selectedWidget === widget.id}
          onHover={setHoveredWidget}
          onSelect={handleSelectWidget}
        />
      ))}

      {/* Заголовок */}
      <Billboard follow={true} position={[0, 4, 0]}>
        <Text
          fontSize={0.3}
          color="#1A1A2E"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.9}
        >
          Workflow Network
        </Text>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.12}
          color="#64748B"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.7}
        >
          Наведите на виджет для просмотра связей
        </Text>
      </Billboard>
    </group>
  );
};
