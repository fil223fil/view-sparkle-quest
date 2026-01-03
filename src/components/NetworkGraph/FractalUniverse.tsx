import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line, RoundedBox, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface UniverseNode {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
}

interface UniverseEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
  processName: string;
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Приоритеты для виджетов (влияют на размер)
type Priority = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_SCALES = {
  critical: 1.3,
  high: 1.15,
  medium: 1.0,
  low: 0.85,
};

// Иерархическая структура дерева когнитивных процессов
const TREE_STRUCTURE = {
  // Корневой уровень (уровень 0) - центральные процессы
  root: [
    { id: 'consciousness', icon: '🌟', title: 'Сознание', subtitle: 'Центр', priority: 'critical' as Priority, chain: 'integration', infoLoad: 1.0 },
  ],
  // Уровень 1 - основные ветви
  level1: [
    { id: 'cognition', icon: '🧠', title: 'Познание', subtitle: 'Когнитив', priority: 'critical' as Priority, chain: 'executive', infoLoad: 0.92, parent: 'consciousness' },
    { id: 'emotion', icon: '❤️', title: 'Эмоции', subtitle: 'Лимбика', priority: 'critical' as Priority, chain: 'limbic', infoLoad: 0.88, parent: 'consciousness' },
    { id: 'perception', icon: '👁️', title: 'Восприятие', subtitle: 'Сенсоры', priority: 'critical' as Priority, chain: 'sensory', infoLoad: 0.90, parent: 'consciousness' },
    { id: 'action', icon: '⚡', title: 'Действие', subtitle: 'Моторика', priority: 'high' as Priority, chain: 'motor', infoLoad: 0.78, parent: 'consciousness' },
  ],
  // Уровень 2 - подветви
  level2: [
    // Ветвь Познания
    { id: 'memory', icon: '📚', title: 'Память', subtitle: 'Гиппокамп', priority: 'high' as Priority, chain: 'memory', infoLoad: 0.95, parent: 'cognition' },
    { id: 'attention', icon: '🎯', title: 'Внимание', subtitle: 'Фокус', priority: 'high' as Priority, chain: 'attention', infoLoad: 0.82, parent: 'cognition' },
    { id: 'thinking', icon: '💭', title: 'Мышление', subtitle: 'Анализ', priority: 'high' as Priority, chain: 'executive', infoLoad: 0.88, parent: 'cognition' },
    // Ветвь Эмоций
    { id: 'joy', icon: '😊', title: 'Радость', subtitle: 'Позитив', priority: 'medium' as Priority, chain: 'limbic', infoLoad: 0.65, parent: 'emotion' },
    { id: 'fear', icon: '😰', title: 'Страх', subtitle: 'Амигдала', priority: 'medium' as Priority, chain: 'limbic', infoLoad: 0.72, parent: 'emotion' },
    { id: 'motivation', icon: '🔥', title: 'Мотивация', subtitle: 'Драйв', priority: 'high' as Priority, chain: 'limbic', infoLoad: 0.80, parent: 'emotion' },
    // Ветвь Восприятия
    { id: 'vision', icon: '👀', title: 'Зрение', subtitle: 'V1', priority: 'medium' as Priority, chain: 'visual', infoLoad: 0.75, parent: 'perception' },
    { id: 'hearing', icon: '👂', title: 'Слух', subtitle: 'A1', priority: 'medium' as Priority, chain: 'auditory', infoLoad: 0.68, parent: 'perception' },
    { id: 'touch', icon: '✋', title: 'Осязание', subtitle: 'S1', priority: 'low' as Priority, chain: 'sensory', infoLoad: 0.55, parent: 'perception' },
    // Ветвь Действия
    { id: 'movement', icon: '🏃', title: 'Движение', subtitle: 'M1', priority: 'medium' as Priority, chain: 'motor', infoLoad: 0.70, parent: 'action' },
    { id: 'speech', icon: '🗣️', title: 'Речь', subtitle: 'Брока', priority: 'high' as Priority, chain: 'language', infoLoad: 0.85, parent: 'action' },
    { id: 'habits', icon: '🔄', title: 'Привычки', subtitle: 'Базальные', priority: 'low' as Priority, chain: 'basal', infoLoad: 0.48, parent: 'action' },
  ],
  // Уровень 3 - листья
  level3: [
    // Память
    { id: 'episodic', icon: '📖', title: 'Эпизод.', subtitle: 'События', priority: 'medium' as Priority, chain: 'memory', infoLoad: 0.72, parent: 'memory' },
    { id: 'semantic', icon: '📝', title: 'Семант.', subtitle: 'Факты', priority: 'medium' as Priority, chain: 'memory', infoLoad: 0.68, parent: 'memory' },
    { id: 'procedural', icon: '🔧', title: 'Процедур.', subtitle: 'Навыки', priority: 'low' as Priority, chain: 'memory', infoLoad: 0.55, parent: 'memory' },
    // Внимание
    { id: 'selective', icon: '🔍', title: 'Избират.', subtitle: 'Выбор', priority: 'medium' as Priority, chain: 'attention', infoLoad: 0.60, parent: 'attention' },
    { id: 'sustained', icon: '⏳', title: 'Устойч.', subtitle: 'Время', priority: 'low' as Priority, chain: 'attention', infoLoad: 0.52, parent: 'attention' },
    // Мышление
    { id: 'logic', icon: '🧩', title: 'Логика', subtitle: 'Вывод', priority: 'medium' as Priority, chain: 'executive', infoLoad: 0.75, parent: 'thinking' },
    { id: 'creativity', icon: '✨', title: 'Креатив', subtitle: 'Идеи', priority: 'medium' as Priority, chain: 'creative', infoLoad: 0.70, parent: 'thinking' },
    // Зрение
    { id: 'colors', icon: '🌈', title: 'Цвета', subtitle: 'V4', priority: 'low' as Priority, chain: 'visual', infoLoad: 0.45, parent: 'vision' },
    { id: 'faces', icon: '😀', title: 'Лица', subtitle: 'FFA', priority: 'medium' as Priority, chain: 'social', infoLoad: 0.62, parent: 'vision' },
    { id: 'motion_vis', icon: '🎬', title: 'Движ.', subtitle: 'MT', priority: 'low' as Priority, chain: 'visual', infoLoad: 0.48, parent: 'vision' },
    // Речь
    { id: 'syntax', icon: '📐', title: 'Синтаксис', subtitle: 'Структура', priority: 'low' as Priority, chain: 'language', infoLoad: 0.58, parent: 'speech' },
    { id: 'semantics', icon: '💡', title: 'Семантика', subtitle: 'Смысл', priority: 'medium' as Priority, chain: 'language', infoLoad: 0.72, parent: 'speech' },
  ],
};

// Цепи связей виджетов
const WIDGET_CHAINS = {
  executive: { name: 'Исполнительная', color: '#FF6B9D', description: 'Планирование, решения' },
  language: { name: 'Языковая', color: '#9B59B6', description: 'Речь, понимание' },
  visual: { name: 'Зрительная', color: '#2ECC71', description: 'Образы, формы' },
  motor: { name: 'Моторная', color: '#E74C3C', description: 'Движение' },
  limbic: { name: 'Лимбическая', color: '#E91E63', description: 'Эмоции' },
  memory: { name: 'Память', color: '#1ABC9C', description: 'Запоминание' },
  attention: { name: 'Внимание', color: '#3498DB', description: 'Фокус' },
  sensory: { name: 'Сенсорная', color: '#58C4DD', description: 'Ощущения' },
  auditory: { name: 'Слуховая', color: '#AF7AC5', description: 'Звуки' },
  social: { name: 'Социальная', color: '#FF69B4', description: 'Лица, эмпатия' },
  creative: { name: 'Креативная', color: '#F39C12', description: 'Творчество' },
  basal: { name: 'Базальная', color: '#34495E', description: 'Автоматизмы' },
  integration: { name: 'Интеграция', color: '#FFD700', description: 'Объединение' },
};

const DEPTH_PALETTES = [
  { primary: '#FF6B9D', secondary: '#FFB8D0', glow: '#FF8FB8', accent: '#58C4DD' },
  { primary: '#58C4DD', secondary: '#A8E4F0', glow: '#78D4ED', accent: '#9B59B6' },
  { primary: '#9B59B6', secondary: '#C8A8D8', glow: '#B078C6', accent: '#2ECC71' },
];

// Расчёт позиций для древовидной структуры
const calculateTreePositions = () => {
  const positions: { [key: string]: [number, number, number] } = {};
  
  // Корень - сверху по центру
  TREE_STRUCTURE.root.forEach((node, i) => {
    positions[node.id] = [0, 0.55, 0];
  });
  
  // Уровень 1 - распределение по горизонтали
  const level1Count = TREE_STRUCTURE.level1.length;
  const level1Spacing = 0.45;
  TREE_STRUCTURE.level1.forEach((node, i) => {
    const x = (i - (level1Count - 1) / 2) * level1Spacing;
    positions[node.id] = [x, 0.25, 0];
  });
  
  // Уровень 2 - под родителями
  const level2ByParent: { [key: string]: typeof TREE_STRUCTURE.level2 } = {};
  TREE_STRUCTURE.level2.forEach(node => {
    if (!level2ByParent[node.parent]) level2ByParent[node.parent] = [];
    level2ByParent[node.parent].push(node);
  });
  
  Object.entries(level2ByParent).forEach(([parentId, children]) => {
    const parentPos = positions[parentId];
    if (!parentPos) return;
    
    const spacing = 0.15;
    children.forEach((node, i) => {
      const offset = (i - (children.length - 1) / 2) * spacing;
      positions[node.id] = [parentPos[0] + offset, -0.05, 0];
    });
  });
  
  // Уровень 3 - листья
  const level3ByParent: { [key: string]: typeof TREE_STRUCTURE.level3 } = {};
  TREE_STRUCTURE.level3.forEach(node => {
    if (!level3ByParent[node.parent]) level3ByParent[node.parent] = [];
    level3ByParent[node.parent].push(node);
  });
  
  Object.entries(level3ByParent).forEach(([parentId, children]) => {
    const parentPos = positions[parentId];
    if (!parentPos) return;
    
    const spacing = 0.1;
    children.forEach((node, i) => {
      const offset = (i - (children.length - 1) / 2) * spacing;
      positions[node.id] = [parentPos[0] + offset, -0.32, 0];
    });
  });
  
  return positions;
};

// Получить все узлы для текущего уровня глубины
const getNodesForDepth = (depth: number) => {
  switch (depth % 3) {
    case 0: return [...TREE_STRUCTURE.root, ...TREE_STRUCTURE.level1, ...TREE_STRUCTURE.level2];
    case 1: return [...TREE_STRUCTURE.level1, ...TREE_STRUCTURE.level2, ...TREE_STRUCTURE.level3];
    case 2: return [...TREE_STRUCTURE.root, ...TREE_STRUCTURE.level2, ...TREE_STRUCTURE.level3];
    default: return [...TREE_STRUCTURE.root, ...TREE_STRUCTURE.level1];
  }
};

// Получить связи между узлами
const getEdgesForNodes = (nodes: { id: string; parent?: string }[]) => {
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges: { from: string; to: string; processName: string }[] = [];
  
  nodes.forEach(node => {
    if (node.parent && nodeIds.has(node.parent)) {
      edges.push({
        from: node.parent,
        to: node.id,
        processName: `${node.parent} → ${node.id}`,
      });
    }
  });
  
  return edges;
};

// Ветка дерева (органическая линия)
const TreeBranch = ({ 
  start, 
  end, 
  color,
  opacity, 
  time,
  index,
  isHighlighted,
  isInActiveChain
}: { 
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  opacity: number;
  time: number;
  index: number;
  isHighlighted: boolean;
  isInActiveChain: boolean;
}) => {
  const { points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    
    // Контрольная точка для кривой (чтобы ветка была органичной)
    const mid = startVec.clone().lerp(endVec, 0.5);
    // Добавляем небольшой изгиб
    mid.x += (index % 2 === 0 ? 0.02 : -0.02) * (index % 3 + 1);
    
    const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    return { points: curve.getPoints(16), midPoint: mid };
  }, [start, end, index]);

  const dimmed = !isHighlighted && !isInActiveChain;
  const pulse = 1 + Math.sin(time * 2 + index) * 0.3;
  
  return (
    <group>
      {/* Основная ветка */}
      <Line
        points={points}
        color={isHighlighted ? '#FFFFFF' : color}
        lineWidth={isHighlighted ? 4 : isInActiveChain ? 2.5 : 1.2}
        transparent
        opacity={opacity * (dimmed ? 0.15 : isHighlighted ? 0.95 : 0.6)}
      />
      
      {/* Свечение */}
      {(isHighlighted || isInActiveChain) && (
        <Line
          points={points}
          color={color}
          lineWidth={isHighlighted ? 10 : 6}
          transparent
          opacity={opacity * (isHighlighted ? 0.35 : 0.18) * pulse}
        />
      )}
      
      {/* Импульс движения по ветке */}
      {!dimmed && (
        <>
          {Array.from({ length: isHighlighted ? 3 : 1 }).map((_, i) => {
            const t = ((time * 0.4 + i * 0.33 + index * 0.1) % 1);
            const pointIdx = Math.floor(t * (points.length - 1));
            const pos = points[Math.min(pointIdx, points.length - 1)];
            const fadeOpacity = Math.sin(t * Math.PI) * opacity * (isHighlighted ? 1 : 0.5);
            
            return (
              <Sphere key={i} args={[isHighlighted ? 0.012 : 0.007, 8, 8]} position={[pos.x, pos.y, pos.z]}>
                <meshBasicMaterial 
                  color={isHighlighted ? '#FFFFFF' : color}
                  transparent 
                  opacity={fadeOpacity}
                />
              </Sphere>
            );
          })}
        </>
      )}
    </group>
  );
};

// iOS 26 стиль виджет-узел дерева
const TreeNode = ({
  node,
  position,
  opacity,
  time,
  isHovered,
  isSelected,
  isInChain,
  isBlurred,
  chainColor,
  onHover,
  onSelect,
  onDiveIn
}: {
  node: { id: string; icon: string; title: string; subtitle: string; priority: Priority; chain: string; infoLoad: number };
  position: [number, number, number];
  opacity: number;
  time: number;
  isHovered: boolean;
  isSelected: boolean;
  isInChain: boolean;
  isBlurred: boolean;
  chainColor: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDiveIn: (pos: [number, number, number]) => void;
}) => {
  const breathe = 1 + Math.sin(time * 0.5 + position[0] * 3) * 0.02;
  const hoverScale = isHovered ? 1.12 : isSelected ? 1.08 : isInChain ? 1.03 : 1;
  
  const priorityScale = PRIORITY_SCALES[node.priority] || 1;
  const baseSize = 0.08;
  const widgetSize = baseSize * priorityScale;
  const cornerRadius = widgetSize * 0.22;
  
  const blurOpacity = isBlurred ? 0.2 : 1;
  
  return (
    <Billboard follow={true}>
      <group 
        position={position}
        scale={breathe * hoverScale}
      >
        {/* Outer glow */}
        <RoundedBox
          args={[widgetSize * 1.15, widgetSize * 1.15, 0.003]}
          radius={cornerRadius * 1.1}
          smoothness={4}
        >
          <meshBasicMaterial 
            color={chainColor}
            transparent 
            opacity={opacity * (isSelected ? 0.55 : isHovered ? 0.45 : isInChain ? 0.28 : 0.12) * blurOpacity}
          />
        </RoundedBox>
        
        {/* Pulsing ring */}
        {(isSelected || isInChain) && !isBlurred && (
          <RoundedBox
            args={[widgetSize * 1.25, widgetSize * 1.25, 0.001]}
            radius={cornerRadius * 1.2}
            smoothness={3}
          >
            <meshBasicMaterial 
              color={chainColor}
              transparent 
              opacity={opacity * 0.25 * (1 + Math.sin(time * 3) * 0.4)}
            />
          </RoundedBox>
        )}
        
        {/* Main widget background */}
        <RoundedBox
          args={[widgetSize, widgetSize, widgetSize * 0.18]}
          radius={cornerRadius}
          smoothness={5}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDiveIn(position);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(node.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover(null);
            document.body.style.cursor = 'default';
          }}
        >
          <meshBasicMaterial 
            color={isBlurred ? '#0A0A0C' : '#1C1C1E'}
            transparent 
            opacity={opacity * 0.94 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Shine effect */}
        <RoundedBox
          args={[widgetSize * 0.82, widgetSize * 0.22, widgetSize * 0.19]}
          radius={cornerRadius * 0.5}
          smoothness={3}
          position={[0, widgetSize * 0.26, widgetSize * 0.01]}
        >
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent 
            opacity={opacity * 0.1 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Priority accent line */}
        <RoundedBox
          args={[widgetSize * 0.65, widgetSize * 0.025, widgetSize * 0.19]}
          radius={0.002}
          smoothness={2}
          position={[0, widgetSize * 0.43, 0.001]}
        >
          <meshBasicMaterial 
            color={node.priority === 'critical' ? '#FF6B9D' : 
                   node.priority === 'high' ? '#F39C12' : 
                   node.priority === 'medium' ? '#58C4DD' : '#48484A'}
            transparent 
            opacity={opacity * 0.95 * blurOpacity}
          />
        </RoundedBox>
        
        {/* Main icon */}
        <Text
          position={[0, widgetSize * 0.1, widgetSize * 0.1]}
          fontSize={widgetSize * 0.38}
          color={chainColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * blurOpacity}
        >
          {node.icon}
        </Text>
        
        {/* Title */}
        <Text
          position={[0, -widgetSize * 0.16, widgetSize * 0.1]}
          fontSize={widgetSize * 0.12}
          color={isHovered || isSelected ? '#FFFFFF' : isInChain ? '#F0F0F2' : '#E5E5E7'}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * blurOpacity}
        >
          {node.title}
        </Text>
        
        {/* Subtitle */}
        <Text
          position={[0, -widgetSize * 0.30, widgetSize * 0.1]}
          fontSize={widgetSize * 0.075}
          color="#8E8E93"
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * 0.8 * blurOpacity}
        >
          {node.subtitle}
        </Text>
        
        {/* Info Load Bar */}
        {!isBlurred && (
          <group position={[0, -widgetSize * 0.42, widgetSize * 0.1]}>
            <RoundedBox 
              args={[widgetSize * 0.7, widgetSize * 0.03, 0.002]} 
              radius={widgetSize * 0.01} 
              smoothness={2}
            >
              <meshBasicMaterial color="#3A3A3C" transparent opacity={opacity * 0.7} />
            </RoundedBox>
            <RoundedBox 
              args={[widgetSize * 0.7 * node.infoLoad, widgetSize * 0.03, 0.003]} 
              radius={widgetSize * 0.01} 
              smoothness={2}
              position={[-widgetSize * 0.35 * (1 - node.infoLoad), 0, 0.001]}
            >
              <meshBasicMaterial color={chainColor} transparent opacity={opacity * 0.9} />
            </RoundedBox>
          </group>
        )}
      </group>
    </Billboard>
  );
};

// Ствол дерева (декоративный элемент)
const TreeTrunk = ({ opacity, time }: { opacity: number; time: number }) => {
  const trunkPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Ствол от корня вниз
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const y = 0.55 - t * 0.15;
      const x = Math.sin(t * Math.PI * 2) * 0.005;
      const z = Math.cos(t * Math.PI * 3) * 0.003;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);
  
  const breathe = 1 + Math.sin(time * 0.3) * 0.02;
  
  return (
    <group scale={breathe}>
      {/* Главный ствол */}
      <Line
        points={trunkPoints}
        color="#8B4513"
        lineWidth={6}
        transparent
        opacity={opacity * 0.4}
      />
      {/* Свечение ствола */}
      <Line
        points={trunkPoints}
        color="#D2691E"
        lineWidth={12}
        transparent
        opacity={opacity * 0.15}
      />
      
      {/* Корни (декоративные) */}
      {[-0.06, 0, 0.06].map((offsetX, i) => (
        <Line
          key={`root-${i}`}
          points={[
            new THREE.Vector3(0, 0.4, 0),
            new THREE.Vector3(offsetX * 2, 0.48, 0),
          ]}
          color="#A0522D"
          lineWidth={3}
          transparent
          opacity={opacity * 0.25}
        />
      ))}
    </group>
  );
};

// Декоративные листья/частицы вокруг активных узлов
const FloatingParticles = ({ position, color, opacity, time }: { 
  position: [number, number, number]; 
  color: string; 
  opacity: number; 
  time: number 
}) => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2 + time * 0.5;
        const radius = 0.06 + Math.sin(time * 2 + i) * 0.015;
        const x = position[0] + Math.cos(angle) * radius;
        const y = position[1] + Math.sin(time + i) * 0.02;
        const z = position[2] + Math.sin(angle) * radius * 0.5;
        
        return (
          <Sphere key={i} args={[0.004, 6, 6]} position={[x, y, z]}>
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={opacity * (0.4 + Math.sin(time * 3 + i) * 0.3)} 
            />
          </Sphere>
        );
      })}
    </>
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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];
  
  // Получаем узлы и связи для текущей глубины
  const treeNodes = useMemo(() => getNodesForDepth(depth), [depth]);
  const treeEdges = useMemo(() => getEdgesForNodes(treeNodes as any), [treeNodes]);
  const treePositions = useMemo(() => calculateTreePositions(), []);

  useFrame(({ clock }) => {
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.06;
    }
  });

  const handleNodeHover = useCallback((id: string | null) => {
    setHoveredNode(id);
  }, []);

  const handleNodeSelect = useCallback((id: string) => {
    setSelectedNode(prev => prev === id ? null : id);
  }, []);

  const handleDiveIn = useCallback((nodePosition: [number, number, number]) => {
    const worldPos: [number, number, number] = [
      position[0] + nodePosition[0] * universeScale,
      position[1] + nodePosition[1] * universeScale,
      position[2] + nodePosition[2] * universeScale,
    ];
    onDiveIn(worldPos, depth + 1);
  }, [depth, position, universeScale, onDiveIn]);

  // Активный узел для подсветки
  const activeNodeId = hoveredNode ?? selectedNode;

  // Найти связанные элементы для подсветки
  const highlightData = useMemo(() => {
    if (!activeNodeId) return { nodeIds: [], edgeIndices: [], chain: null };
    
    const activeNode = treeNodes.find(n => n.id === activeNodeId);
    if (!activeNode) return { nodeIds: [], edgeIndices: [], chain: null };
    
    const chain = activeNode.chain;
    const chainInfo = WIDGET_CHAINS[chain as keyof typeof WIDGET_CHAINS];
    
    const nodeIds = new Set<string>([activeNodeId]);
    const edgeIndices = new Set<number>();
    
    // Найти все узлы в той же цепи
    treeNodes.forEach(n => {
      if (n.chain === chain) {
        nodeIds.add(n.id);
      }
    });
    
    // Найти детей текущего узла
    treeNodes.forEach(n => {
      if ((n as any).parent === activeNodeId) {
        nodeIds.add(n.id);
      }
    });
    
    // Найти родителя
    if ((activeNode as any).parent) {
      nodeIds.add((activeNode as any).parent);
    }
    
    // Найти связи
    treeEdges.forEach((edge, i) => {
      if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
        edgeIndices.add(i);
      }
    });
    
    return { 
      nodeIds: Array.from(nodeIds), 
      edgeIndices: Array.from(edgeIndices),
      chain: chainInfo
    };
  }, [activeNodeId, treeNodes, treeEdges]);

  const isAnyActive = activeNodeId !== null;

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      <Stars radius={3} depth={2} count={100} factor={0.1} saturation={0} fade speed={0.02} />

      {/* Декоративный ствол */}
      <TreeTrunk opacity={universeOpacity} time={time} />

      {/* Ветки (связи между узлами) */}
      {treeEdges.map((edge, i) => {
        const startPos = treePositions[edge.from];
        const endPos = treePositions[edge.to];
        if (!startPos || !endPos) return null;
        
        const toNode = treeNodes.find(n => n.id === edge.to);
        const chainInfo = toNode ? WIDGET_CHAINS[toNode.chain as keyof typeof WIDGET_CHAINS] : null;
        const color = chainInfo?.color || palette.primary;
        
        const isHighlighted = highlightData.edgeIndices.includes(i);
        
        return (
          <TreeBranch
            key={`branch-${i}`}
            start={startPos}
            end={endPos}
            color={color}
            opacity={universeOpacity * (isAnyActive && !isHighlighted ? 0.3 : 1)}
            time={time}
            index={i}
            isHighlighted={isHighlighted && activeNodeId !== null}
            isInActiveChain={isHighlighted}
          />
        );
      })}

      {/* Узлы дерева (виджеты) */}
      {treeNodes.map((node) => {
        const nodePos = treePositions[node.id];
        if (!nodePos) return null;
        
        const chainInfo = WIDGET_CHAINS[node.chain as keyof typeof WIDGET_CHAINS];
        const isInChain = highlightData.nodeIds.includes(node.id);
        const isBlurred = isAnyActive && !isInChain;
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        
        return (
          <group key={node.id}>
            <TreeNode
              node={node}
              position={nodePos}
              opacity={universeOpacity}
              time={time}
              isHovered={isHovered}
              isSelected={isSelected}
              isInChain={isInChain}
              isBlurred={isBlurred}
              chainColor={chainInfo?.color || palette.primary}
              onHover={handleNodeHover}
              onSelect={handleNodeSelect}
              onDiveIn={handleDiveIn}
            />
            
            {/* Частицы вокруг активных узлов */}
            {(isHovered || isSelected) && (
              <FloatingParticles
                position={nodePos}
                color={chainInfo?.color || palette.primary}
                opacity={universeOpacity}
                time={time}
              />
            )}
          </group>
        );
      })}

      {/* Информация о выбранной цепи */}
      {highlightData.chain && (
        <Billboard follow={true} position={[0, -0.52, 0]}>
          <Text
            fontSize={0.022}
            color={highlightData.chain.color}
            anchorX="center"
            fillOpacity={universeOpacity * 0.95}
          >
            {highlightData.chain.name}
          </Text>
          <Text
            fontSize={0.014}
            color="#8E8E93"
            anchorX="center"
            position={[0, -0.026, 0]}
            fillOpacity={universeOpacity * 0.75}
          >
            {highlightData.chain.description}
          </Text>
        </Billboard>
      )}

      {/* Заголовок */}
      <Billboard follow={true} position={[0, 0.72, 0]}>
        <Text
          fontSize={0.024}
          color={palette.primary}
          anchorX="center"
          fillOpacity={universeOpacity * 0.85}
        >
          🌳 Древо Сознания
        </Text>
        <Text
          fontSize={0.012}
          color={palette.secondary}
          anchorX="center"
          position={[0, -0.03, 0]}
          fillOpacity={universeOpacity * 0.5}
        >
          {depth === 0 ? 'Корневой уровень' : depth === 1 ? 'Ветви познания' : 'Листья опыта'}
        </Text>
      </Billboard>

      {/* Инструкция */}
      <Billboard follow={true} position={[0, -0.62, 0]}>
        <Text
          fontSize={0.01}
          color="#6E6E73"
          anchorX="center"
          fillOpacity={universeOpacity * 0.5}
        >
          Клик — выбрать ветвь • Двойной клик — погрузиться
        </Text>
      </Billboard>
    </group>
  );
};
