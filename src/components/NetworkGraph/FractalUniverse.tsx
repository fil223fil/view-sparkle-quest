import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line, RoundedBox, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

type Priority = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_SCALES = {
  critical: 1.25,
  high: 1.1,
  medium: 1.0,
  low: 0.85,
};

// Логические стопки виджетов (как листья на ветвях)
const WIDGET_STACKS = {
  cognition: {
    name: 'Познание',
    color: '#FF6B9D',
    position: [0.4, 0.5, 0.3] as [number, number, number],
    branchAngle: 0.3,
    widgets: [
      { id: 'think', icon: '💭', title: 'Мысль', priority: 'critical' as Priority, infoLoad: 0.92 },
      { id: 'analyze', icon: '🔍', title: 'Анализ', priority: 'high' as Priority, infoLoad: 0.85 },
      { id: 'logic', icon: '🧩', title: 'Логика', priority: 'medium' as Priority, infoLoad: 0.72 },
      { id: 'create', icon: '✨', title: 'Творч.', priority: 'medium' as Priority, infoLoad: 0.68 },
    ],
  },
  memory: {
    name: 'Память',
    color: '#1ABC9C',
    position: [-0.35, 0.55, 0.25] as [number, number, number],
    branchAngle: -0.4,
    widgets: [
      { id: 'remember', icon: '📚', title: 'Память', priority: 'critical' as Priority, infoLoad: 0.95 },
      { id: 'episodic', icon: '📖', title: 'Эпизод.', priority: 'high' as Priority, infoLoad: 0.78 },
      { id: 'semantic', icon: '📝', title: 'Семант.', priority: 'medium' as Priority, infoLoad: 0.65 },
    ],
  },
  emotion: {
    name: 'Эмоции',
    color: '#E91E63',
    position: [0.5, 0.2, -0.35] as [number, number, number],
    branchAngle: 0.6,
    widgets: [
      { id: 'feel', icon: '❤️', title: 'Чувства', priority: 'critical' as Priority, infoLoad: 0.88 },
      { id: 'joy', icon: '😊', title: 'Радость', priority: 'medium' as Priority, infoLoad: 0.62 },
      { id: 'fear', icon: '😰', title: 'Страх', priority: 'medium' as Priority, infoLoad: 0.55 },
      { id: 'love', icon: '💕', title: 'Любовь', priority: 'high' as Priority, infoLoad: 0.75 },
    ],
  },
  perception: {
    name: 'Восприятие',
    color: '#58C4DD',
    position: [-0.45, 0.3, -0.3] as [number, number, number],
    branchAngle: -0.5,
    widgets: [
      { id: 'see', icon: '👁️', title: 'Зрение', priority: 'high' as Priority, infoLoad: 0.82 },
      { id: 'hear', icon: '👂', title: 'Слух', priority: 'medium' as Priority, infoLoad: 0.68 },
      { id: 'touch', icon: '✋', title: 'Осязан.', priority: 'low' as Priority, infoLoad: 0.45 },
    ],
  },
  action: {
    name: 'Действие',
    color: '#F39C12',
    position: [0.3, 0.65, -0.15] as [number, number, number],
    branchAngle: 0.2,
    widgets: [
      { id: 'move', icon: '⚡', title: 'Движен.', priority: 'high' as Priority, infoLoad: 0.78 },
      { id: 'speak', icon: '🗣️', title: 'Речь', priority: 'high' as Priority, infoLoad: 0.85 },
      { id: 'habit', icon: '🔄', title: 'Привыч.', priority: 'low' as Priority, infoLoad: 0.48 },
    ],
  },
  attention: {
    name: 'Внимание',
    color: '#9B59B6',
    position: [-0.25, 0.7, 0.35] as [number, number, number],
    branchAngle: -0.25,
    widgets: [
      { id: 'focus', icon: '🎯', title: 'Фокус', priority: 'critical' as Priority, infoLoad: 0.9 },
      { id: 'filter', icon: '🔬', title: 'Фильтр', priority: 'medium' as Priority, infoLoad: 0.58 },
    ],
  },
  social: {
    name: 'Социум',
    color: '#FF69B4',
    position: [0.15, 0.4, 0.45] as [number, number, number],
    branchAngle: 0.15,
    widgets: [
      { id: 'empathy', icon: '🤝', title: 'Эмпатия', priority: 'high' as Priority, infoLoad: 0.8 },
      { id: 'faces', icon: '😀', title: 'Лица', priority: 'medium' as Priority, infoLoad: 0.65 },
      { id: 'mirror', icon: '🪞', title: 'Зеркало', priority: 'low' as Priority, infoLoad: 0.42 },
    ],
  },
  self: {
    name: 'Самость',
    color: '#FFD700',
    position: [0, 0.85, 0] as [number, number, number],
    branchAngle: 0,
    widgets: [
      { id: 'conscious', icon: '🌟', title: 'Сознание', priority: 'critical' as Priority, infoLoad: 1.0 },
      { id: 'self', icon: '🔮', title: 'Я', priority: 'critical' as Priority, infoLoad: 0.95 },
    ],
  },
};

// Связи между стопками (ветви между группами)
const STACK_CONNECTIONS = [
  { from: 'self', to: 'cognition', process: 'Осознание мысли' },
  { from: 'self', to: 'emotion', process: 'Осознание чувств' },
  { from: 'self', to: 'attention', process: 'Направление внимания' },
  { from: 'cognition', to: 'memory', process: 'Сохранение' },
  { from: 'cognition', to: 'action', process: 'Решение → действие' },
  { from: 'emotion', to: 'memory', process: 'Эмоц. память' },
  { from: 'emotion', to: 'social', process: 'Эмпатия' },
  { from: 'perception', to: 'cognition', process: 'Обработка' },
  { from: 'perception', to: 'emotion', process: 'Реакция' },
  { from: 'attention', to: 'perception', process: 'Фильтрация' },
  { from: 'attention', to: 'cognition', process: 'Концентрация' },
  { from: 'social', to: 'emotion', process: 'Резонанс' },
  { from: 'action', to: 'perception', process: 'Обратная связь' },
];

const DEPTH_PALETTES = [
  { primary: '#00FFAA', secondary: '#00AA77', glow: '#00FFCC', trunk: '#4A2800' },
  { primary: '#FF6B9D', secondary: '#CC4477', glow: '#FF8FB8', trunk: '#3D1A00' },
  { primary: '#58C4DD', secondary: '#3399BB', glow: '#78D4ED', trunk: '#2A1A00' },
];

// Биолюминесцентная частица (как в Аватаре)
const BioParticle = ({ 
  position, 
  color, 
  opacity, 
  time, 
  index 
}: { 
  position: [number, number, number]; 
  color: string; 
  opacity: number; 
  time: number; 
  index: number;
}) => {
  const floatY = Math.sin(time * 0.8 + index * 2) * 0.03;
  const floatX = Math.cos(time * 0.5 + index * 1.5) * 0.02;
  const pulse = 0.5 + Math.sin(time * 2 + index * 3) * 0.5;
  
  return (
    <Sphere 
      args={[0.004 + pulse * 0.002, 6, 6]} 
      position={[position[0] + floatX, position[1] + floatY, position[2]]}
    >
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity * pulse * 0.8} 
      />
    </Sphere>
  );
};

// Ствол дерева (Avatar style - органический, светящийся)
const TreeTrunk = ({ opacity, time, palette }: { opacity: number; time: number; palette: typeof DEPTH_PALETTES[0] }) => {
  // Главный ствол - органическая кривая
  const mainTrunk = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const y = -0.6 + t * 1.2;
      // Органический изгиб ствола
      const twist = Math.sin(t * Math.PI * 2) * 0.03 * (1 - t);
      const x = twist + Math.sin(t * 5) * 0.01;
      const z = Math.cos(t * 3) * 0.02 * (1 - t * 0.5);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  // Внутренние светящиеся каналы
  const innerGlow = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const y = -0.5 + t * 1.1;
      const x = Math.sin(t * Math.PI * 3 + 0.5) * 0.015;
      const z = Math.cos(t * Math.PI * 2) * 0.01;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const pulse = 1 + Math.sin(time * 0.5) * 0.1;

  return (
    <group>
      {/* Внешняя кора */}
      <Line points={mainTrunk} color={palette.trunk} lineWidth={18} transparent opacity={opacity * 0.7} />
      <Line points={mainTrunk} color="#2D1600" lineWidth={14} transparent opacity={opacity * 0.5} />
      
      {/* Биолюминесцентные каналы */}
      <Line points={innerGlow} color={palette.glow} lineWidth={4} transparent opacity={opacity * 0.6 * pulse} />
      <Line points={innerGlow} color={palette.primary} lineWidth={8} transparent opacity={opacity * 0.2 * pulse} />
      
      {/* Корни */}
      {[
        { angle: -0.5, length: 0.25 },
        { angle: 0.5, length: 0.2 },
        { angle: -0.2, length: 0.3 },
        { angle: 0.3, length: 0.22 },
        { angle: 0, length: 0.18 },
      ].map((root, i) => {
        const rootPoints = [
          new THREE.Vector3(0, -0.55, 0),
          new THREE.Vector3(
            Math.sin(root.angle) * root.length,
            -0.65 - Math.abs(Math.sin(root.angle)) * 0.1,
            Math.cos(root.angle) * root.length * 0.4
          ),
        ];
        return (
          <group key={i}>
            <Line points={rootPoints} color={palette.trunk} lineWidth={6 - i * 0.5} transparent opacity={opacity * 0.5} />
            <Line points={rootPoints} color={palette.glow} lineWidth={2} transparent opacity={opacity * 0.15 * pulse} />
          </group>
        );
      })}
    </group>
  );
};

// Ветвь к стопке виджетов (органическая 3D кривая)
const Branch = ({ 
  start, 
  end, 
  color, 
  opacity, 
  time, 
  index, 
  isHighlighted,
  isActive,
  processName
}: { 
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  opacity: number;
  time: number;
  index: number;
  isHighlighted: boolean;
  isActive: boolean;
  processName?: string;
}) => {
  const { points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    
    // Множественные контрольные точки для органичной формы
    const distance = startVec.distanceTo(endVec);
    const segments = 20;
    const pts: THREE.Vector3[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = startVec.clone().lerp(endVec, t);
      
      // Органические изгибы
      const wobble = Math.sin(t * Math.PI) * distance * 0.15;
      const twist = Math.sin(t * Math.PI * 2 + index) * 0.05;
      
      p.x += wobble * Math.cos(index * 1.5) + twist;
      p.y += Math.sin(t * Math.PI) * 0.08;
      p.z += wobble * Math.sin(index * 1.5) + twist * 0.5;
      
      pts.push(p);
    }
    
    const mid = pts[Math.floor(pts.length / 2)];
    return { points: pts, midPoint: mid };
  }, [start, end, index]);

  const pulse = 1 + Math.sin(time * 1.5 + index) * 0.3;
  const dimmed = !isHighlighted && !isActive;

  return (
    <group>
      {/* Основная ветвь */}
      <Line
        points={points}
        color={isHighlighted ? '#FFFFFF' : color}
        lineWidth={isHighlighted ? 5 : isActive ? 3 : 1.5}
        transparent
        opacity={opacity * (dimmed ? 0.15 : isHighlighted ? 0.95 : 0.55)}
      />
      
      {/* Биолюминесцентное свечение */}
      {(isHighlighted || isActive) && (
        <Line
          points={points}
          color={color}
          lineWidth={isHighlighted ? 14 : 8}
          transparent
          opacity={opacity * (isHighlighted ? 0.4 : 0.2) * pulse}
        />
      )}
      
      {/* Световые импульсы вдоль ветви */}
      {!dimmed && Array.from({ length: isHighlighted ? 4 : 2 }).map((_, i) => {
        const t = ((time * 0.3 + i * 0.25 + index * 0.1) % 1);
        const pointIdx = Math.floor(t * (points.length - 1));
        const pos = points[Math.min(pointIdx, points.length - 1)];
        const fadeOpacity = Math.sin(t * Math.PI) * opacity;
        
        return (
          <Sphere key={i} args={[isHighlighted ? 0.015 : 0.008, 8, 8]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial 
              color={isHighlighted ? '#FFFFFF' : color}
              transparent 
              opacity={fadeOpacity * (isHighlighted ? 1 : 0.6)}
            />
          </Sphere>
        );
      })}
      
      {/* Название процесса */}
      {isHighlighted && processName && (
        <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.04, midPoint.z]}>
          <Text fontSize={0.018} color="#FFFFFF" anchorX="center" fillOpacity={opacity * 0.95}>
            {processName}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// Виджет-лист (iOS 26 стиль)
const LeafWidget = ({
  widget,
  position,
  stackColor,
  opacity,
  time,
  isHovered,
  isSelected,
  isInActiveStack,
  isBlurred,
  onHover,
  onSelect,
  onDiveIn,
  index
}: {
  widget: { id: string; icon: string; title: string; priority: Priority; infoLoad: number };
  position: [number, number, number];
  stackColor: string;
  opacity: number;
  time: number;
  isHovered: boolean;
  isSelected: boolean;
  isInActiveStack: boolean;
  isBlurred: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDiveIn: (pos: [number, number, number]) => void;
  index: number;
}) => {
  // Анимация покачивания листа
  const sway = Math.sin(time * 0.8 + index * 1.2) * 0.02;
  const breathe = 1 + Math.sin(time * 0.6 + index * 0.8) * 0.03;
  const hoverScale = isHovered ? 1.15 : isSelected ? 1.1 : isInActiveStack ? 1.04 : 1;
  
  const priorityScale = PRIORITY_SCALES[widget.priority] || 1;
  const baseSize = 0.065;
  const widgetSize = baseSize * priorityScale;
  const cornerRadius = widgetSize * 0.25;
  
  const blurOpacity = isBlurred ? 0.18 : 1;

  return (
    <Billboard follow={true}>
      <group 
        position={[position[0] + sway, position[1], position[2] + sway * 0.5]}
        scale={breathe * hoverScale}
      >
        {/* Биолюминесцентное свечение */}
        <RoundedBox
          args={[widgetSize * 1.3, widgetSize * 1.3, 0.002]}
          radius={cornerRadius * 1.3}
          smoothness={4}
        >
          <meshBasicMaterial 
            color={stackColor}
            transparent 
            opacity={opacity * (isSelected ? 0.5 : isHovered ? 0.4 : isInActiveStack ? 0.25 : 0.1) * blurOpacity}
          />
        </RoundedBox>
        
        {/* Пульсирующий ореол */}
        {(isSelected || isInActiveStack) && !isBlurred && (
          <RoundedBox
            args={[widgetSize * 1.45, widgetSize * 1.45, 0.001]}
            radius={cornerRadius * 1.4}
            smoothness={3}
          >
            <meshBasicMaterial 
              color={stackColor}
              transparent 
              opacity={opacity * 0.2 * (1 + Math.sin(time * 3) * 0.5)}
            />
          </RoundedBox>
        )}
        
        {/* Основной фон виджета */}
        <RoundedBox
          args={[widgetSize, widgetSize, widgetSize * 0.2]}
          radius={cornerRadius}
          smoothness={5}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(widget.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDiveIn(position);
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
            color={isBlurred ? '#0A0A0C' : '#1A1A1C'}
            transparent 
            opacity={opacity * 0.92 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Стеклянный блик */}
        <RoundedBox
          args={[widgetSize * 0.8, widgetSize * 0.2, widgetSize * 0.21]}
          radius={cornerRadius * 0.4}
          smoothness={3}
          position={[0, widgetSize * 0.28, widgetSize * 0.01]}
        >
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent 
            opacity={opacity * 0.12 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Приоритетная линия */}
        <RoundedBox
          args={[widgetSize * 0.6, widgetSize * 0.02, widgetSize * 0.21]}
          radius={0.002}
          smoothness={2}
          position={[0, widgetSize * 0.44, 0]}
        >
          <meshBasicMaterial 
            color={widget.priority === 'critical' ? '#FF6B9D' : 
                   widget.priority === 'high' ? '#F39C12' : 
                   widget.priority === 'medium' ? '#58C4DD' : '#48484A'}
            transparent 
            opacity={opacity * 0.95 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Иконка */}
        <Text
          position={[0, widgetSize * 0.08, widgetSize * 0.11]}
          fontSize={widgetSize * 0.42}
          color={stackColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * blurOpacity}
        >
          {widget.icon}
        </Text>
        
        {/* Название */}
        <Text
          position={[0, -widgetSize * 0.22, widgetSize * 0.11]}
          fontSize={widgetSize * 0.13}
          color={isHovered || isSelected ? '#FFFFFF' : '#E5E5E7'}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * blurOpacity}
        >
          {widget.title}
        </Text>
        
        {/* Прогресс-бар */}
        {!isBlurred && (
          <group position={[0, -widgetSize * 0.38, widgetSize * 0.11]}>
            <RoundedBox 
              args={[widgetSize * 0.65, widgetSize * 0.025, 0.002]} 
              radius={widgetSize * 0.008} 
              smoothness={2}
            >
              <meshBasicMaterial color="#3A3A3C" transparent opacity={opacity * 0.6} />
            </RoundedBox>
            <RoundedBox 
              args={[widgetSize * 0.65 * widget.infoLoad, widgetSize * 0.025, 0.003]} 
              radius={widgetSize * 0.008} 
              smoothness={2}
              position={[-widgetSize * 0.325 * (1 - widget.infoLoad), 0, 0.001]}
            >
              <meshBasicMaterial color={stackColor} transparent opacity={opacity * 0.85} />
            </RoundedBox>
          </group>
        )}
      </group>
    </Billboard>
  );
};

// Стопка виджетов (группа листьев на конце ветви)
const WidgetStack = ({
  stack,
  stackKey,
  opacity,
  time,
  hoveredWidget,
  selectedWidget,
  activeStackKey,
  onHoverWidget,
  onSelectWidget,
  onDiveIn,
  palette
}: {
  stack: typeof WIDGET_STACKS[keyof typeof WIDGET_STACKS];
  stackKey: string;
  opacity: number;
  time: number;
  hoveredWidget: string | null;
  selectedWidget: string | null;
  activeStackKey: string | null;
  onHoverWidget: (id: string | null) => void;
  onSelectWidget: (id: string) => void;
  onDiveIn: (pos: [number, number, number]) => void;
  palette: typeof DEPTH_PALETTES[0];
}) => {
  const isActiveStack = activeStackKey === stackKey;
  const isAnyActive = activeStackKey !== null;
  
  // Расположение виджетов в стопке (веером/каскадом в 3D)
  const widgetPositions = stack.widgets.map((_, i) => {
    const count = stack.widgets.length;
    const angle = ((i - (count - 1) / 2) / Math.max(1, count - 1)) * 0.4;
    const radius = 0.08 + i * 0.015;
    const height = i * 0.05;
    
    return [
      stack.position[0] + Math.sin(angle + stack.branchAngle) * radius,
      stack.position[1] + height,
      stack.position[2] + Math.cos(angle + stack.branchAngle) * radius * 0.5,
    ] as [number, number, number];
  });

  const sway = Math.sin(time * 0.4 + stackKey.charCodeAt(0)) * 0.01;

  return (
    <group position={[sway, 0, sway * 0.5]}>
      {/* Название стопки */}
      <Billboard follow={true} position={[stack.position[0], stack.position[1] - 0.08, stack.position[2]]}>
        <Text
          fontSize={0.022}
          color={isActiveStack ? '#FFFFFF' : stack.color}
          anchorX="center"
          fillOpacity={opacity * (isActiveStack ? 1 : isAnyActive ? 0.3 : 0.7)}
        >
          {stack.name}
        </Text>
      </Billboard>
      
      {/* Виджеты */}
      {stack.widgets.map((widget, i) => {
        const pos = widgetPositions[i];
        const isHovered = hoveredWidget === widget.id;
        const isSelected = selectedWidget === widget.id;
        const isBlurred = isAnyActive && !isActiveStack;
        
        return (
          <LeafWidget
            key={widget.id}
            widget={widget}
            position={pos}
            stackColor={stack.color}
            opacity={opacity}
            time={time}
            isHovered={isHovered}
            isSelected={isSelected}
            isInActiveStack={isActiveStack}
            isBlurred={isBlurred}
            onHover={onHoverWidget}
            onSelect={onSelectWidget}
            onDiveIn={onDiveIn}
            index={i}
          />
        );
      })}
      
      {/* Светлячки вокруг активной стопки */}
      {isActiveStack && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + time * 0.3;
            const radius = 0.12 + Math.sin(time + i) * 0.03;
            const x = stack.position[0] + Math.cos(angle) * radius;
            const y = stack.position[1] + Math.sin(time * 0.8 + i) * 0.04;
            const z = stack.position[2] + Math.sin(angle) * radius * 0.6;
            
            return (
              <BioParticle
                key={i}
                position={[x, y, z]}
                color={stack.color}
                opacity={opacity}
                time={time}
                index={i}
              />
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
  scale: universeScale, 
  opacity: universeOpacity,
  onDiveIn,
  isActive
}: FractalUniverseProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [time, setTime] = useState(0);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];

  useFrame(({ clock }) => {
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      // Медленное вращение дерева
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.15;
    }
  });

  const handleHoverWidget = useCallback((id: string | null) => {
    setHoveredWidget(id);
  }, []);

  const handleSelectWidget = useCallback((id: string) => {
    setSelectedWidget(prev => prev === id ? null : id);
  }, []);

  const handleDiveIn = useCallback((nodePosition: [number, number, number]) => {
    const worldPos: [number, number, number] = [
      position[0] + nodePosition[0] * universeScale,
      position[1] + nodePosition[1] * universeScale,
      position[2] + nodePosition[2] * universeScale,
    ];
    onDiveIn(worldPos, depth + 1);
  }, [depth, position, universeScale, onDiveIn]);

  // Найти активную стопку
  const activeStackKey = useMemo(() => {
    const activeId = hoveredWidget ?? selectedWidget;
    if (!activeId) return null;
    
    for (const [key, stack] of Object.entries(WIDGET_STACKS)) {
      if (stack.widgets.some(w => w.id === activeId)) {
        return key;
      }
    }
    return null;
  }, [hoveredWidget, selectedWidget]);

  // Связи между стопками для подсветки
  const activeConnections = useMemo(() => {
    if (!activeStackKey) return [];
    return STACK_CONNECTIONS.filter(
      conn => conn.from === activeStackKey || conn.to === activeStackKey
    );
  }, [activeStackKey]);

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      {/* Звёздное небо с биолюминесценцией */}
      <Stars radius={4} depth={2.5} count={150} factor={0.08} saturation={0.3} fade speed={0.015} />
      
      {/* Плавающие частицы (споры как в Аватаре) */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 0.6 + Math.sin(time * 0.3 + i) * 0.2;
        const x = Math.cos(angle + time * 0.1) * radius;
        const y = -0.3 + Math.sin(time * 0.4 + i * 0.5) * 0.4;
        const z = Math.sin(angle + time * 0.1) * radius * 0.7;
        
        return (
          <BioParticle
            key={`spore-${i}`}
            position={[x, y, z]}
            color={palette.glow}
            opacity={universeOpacity * 0.4}
            time={time}
            index={i}
          />
        );
      })}
      
      {/* Ствол дерева */}
      <TreeTrunk opacity={universeOpacity} time={time} palette={palette} />
      
      {/* Главные ветви от ствола к стопкам */}
      {Object.entries(WIDGET_STACKS).map(([key, stack], i) => {
        const isActive = activeStackKey === key;
        const isConnected = activeConnections.some(c => c.from === key || c.to === key);
        
        return (
          <Branch
            key={`main-branch-${key}`}
            start={[0, 0.4, 0]}
            end={stack.position}
            color={stack.color}
            opacity={universeOpacity}
            time={time}
            index={i}
            isHighlighted={isActive}
            isActive={isConnected || isActive}
          />
        );
      })}
      
      {/* Связи между стопками */}
      {STACK_CONNECTIONS.map((conn, i) => {
        const fromStack = WIDGET_STACKS[conn.from as keyof typeof WIDGET_STACKS];
        const toStack = WIDGET_STACKS[conn.to as keyof typeof WIDGET_STACKS];
        if (!fromStack || !toStack) return null;
        
        const isActive = activeConnections.includes(conn);
        
        return (
          <Branch
            key={`conn-${i}`}
            start={fromStack.position}
            end={toStack.position}
            color={isActive ? '#FFFFFF' : palette.secondary}
            opacity={universeOpacity * (activeStackKey && !isActive ? 0.15 : 0.7)}
            time={time}
            index={i + 100}
            isHighlighted={isActive}
            isActive={isActive}
            processName={isActive ? conn.process : undefined}
          />
        );
      })}
      
      {/* Стопки виджетов (листья) */}
      {Object.entries(WIDGET_STACKS).map(([key, stack]) => (
        <WidgetStack
          key={key}
          stack={stack}
          stackKey={key}
          opacity={universeOpacity}
          time={time}
          hoveredWidget={hoveredWidget}
          selectedWidget={selectedWidget}
          activeStackKey={activeStackKey}
          onHoverWidget={handleHoverWidget}
          onSelectWidget={handleSelectWidget}
          onDiveIn={handleDiveIn}
          palette={palette}
        />
      ))}
      
      {/* Название дерева */}
      <Billboard follow={true} position={[0, 1.0, 0]}>
        <Text
          fontSize={0.032}
          color={palette.glow}
          anchorX="center"
          fillOpacity={universeOpacity * 0.9}
        >
          🌳 Древо Сознания
        </Text>
        <Text
          fontSize={0.014}
          color={palette.secondary}
          anchorX="center"
          position={[0, -0.04, 0]}
          fillOpacity={universeOpacity * 0.6}
        >
          {depth === 0 ? 'Корни бытия' : depth === 1 ? 'Ветви познания' : 'Крона опыта'}
        </Text>
      </Billboard>
      
      {/* Инструкция */}
      <Billboard follow={true} position={[0, -0.75, 0]}>
        <Text
          fontSize={0.012}
          color="#6E6E73"
          anchorX="center"
          fillOpacity={universeOpacity * 0.5}
        >
          Нажми на лист • Двойной клик — погрузиться глубже
        </Text>
      </Billboard>
    </group>
  );
};
