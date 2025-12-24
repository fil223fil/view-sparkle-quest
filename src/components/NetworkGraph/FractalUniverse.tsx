import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface UniverseNode {
  id: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
}

interface UniverseEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Mind map concept networks - hierarchical knowledge structures
const CONCEPT_MAPS = {
  // Level 0: Core philosophy
  core: {
    central: { icon: '◉', title: 'ЯДРО', subtitle: 'Центр мысли' },
    nodes: [
      { icon: '💡', title: 'Идея', subtitle: 'Зарождение', connects: ['Анализ', 'Синтез'] },
      { icon: '🔍', title: 'Анализ', subtitle: 'Разложение', connects: ['Данные', 'Паттерны'] },
      { icon: '🔗', title: 'Синтез', subtitle: 'Объединение', connects: ['Система', 'Модель'] },
      { icon: '📊', title: 'Данные', subtitle: 'Факты', connects: ['Знание'] },
      { icon: '🧩', title: 'Паттерны', subtitle: 'Закономерности', connects: ['Знание'] },
      { icon: '⚙️', title: 'Система', subtitle: 'Структура', connects: ['Результат'] },
      { icon: '📐', title: 'Модель', subtitle: 'Абстракция', connects: ['Результат'] },
      { icon: '✨', title: 'Знание', subtitle: 'Понимание', connects: ['Мудрость'] },
    ]
  },
  // Level 1: Technology
  technology: {
    central: { icon: '⚡', title: 'TECH', subtitle: 'Технологии' },
    nodes: [
      { icon: '🤖', title: 'AI', subtitle: 'Интеллект', connects: ['ML', 'NLP'] },
      { icon: '📈', title: 'ML', subtitle: 'Обучение', connects: ['Data', 'Модели'] },
      { icon: '💬', title: 'NLP', subtitle: 'Язык', connects: ['LLM', 'Семантика'] },
      { icon: '🗃️', title: 'Data', subtitle: 'Данные', connects: ['База', 'Поток'] },
      { icon: '🧠', title: 'LLM', subtitle: 'GPT', connects: ['Генерация'] },
      { icon: '🔮', title: 'Модели', subtitle: 'Нейросети', connects: ['Обучение'] },
      { icon: '🌐', title: 'Web', subtitle: 'Сеть', connects: ['API', 'Cloud'] },
      { icon: '☁️', title: 'Cloud', subtitle: 'Облако', connects: ['Scale'] },
    ]
  },
  // Level 2: Business
  business: {
    central: { icon: '🎯', title: 'БИЗНЕС', subtitle: 'Стратегия' },
    nodes: [
      { icon: '👥', title: 'Команда', subtitle: 'Люди', connects: ['Культура', 'Рост'] },
      { icon: '💰', title: 'Финансы', subtitle: 'Капитал', connects: ['ROI', 'Инвестиции'] },
      { icon: '📦', title: 'Продукт', subtitle: 'Ценность', connects: ['MVP', 'Scale'] },
      { icon: '🚀', title: 'Рост', subtitle: 'Growth', connects: ['Метрики', 'Воронка'] },
      { icon: '📱', title: 'MVP', subtitle: 'Прототип', connects: ['Тест', 'Итерация'] },
      { icon: '📊', title: 'Метрики', subtitle: 'KPI', connects: ['Решения'] },
      { icon: '🎨', title: 'UX', subtitle: 'Опыт', connects: ['Продукт', 'Retention'] },
      { icon: '🔄', title: 'Итерация', subtitle: 'Цикл', connects: ['Улучшение'] },
    ]
  },
  // Level 3: Science
  science: {
    central: { icon: '🔬', title: 'НАУКА', subtitle: 'Познание' },
    nodes: [
      { icon: '⚛️', title: 'Физика', subtitle: 'Материя', connects: ['Квант', 'Космос'] },
      { icon: '🧬', title: 'Биология', subtitle: 'Жизнь', connects: ['Эволюция', 'Геном'] },
      { icon: '🧮', title: 'Математика', subtitle: 'Логика', connects: ['Теория', 'Модель'] },
      { icon: '🌌', title: 'Космос', subtitle: 'Вселенная', connects: ['Время', 'Энергия'] },
      { icon: '⏳', title: 'Время', subtitle: 'Измерение', connects: ['Причинность'] },
      { icon: '💫', title: 'Энергия', subtitle: 'Сила', connects: ['Трансформация'] },
      { icon: '🔮', title: 'Квант', subtitle: 'Неопределённость', connects: ['Наблюдатель'] },
      { icon: '🧠', title: 'Сознание', subtitle: 'Разум', connects: ['Опыт', 'Знание'] },
    ]
  },
  // Level 4: Philosophy
  philosophy: {
    central: { icon: '∞', title: 'СМЫСЛ', subtitle: 'Философия' },
    nodes: [
      { icon: '💭', title: 'Мысль', subtitle: 'Cogito', connects: ['Бытие', 'Сознание'] },
      { icon: '🌊', title: 'Бытие', subtitle: 'Существование', connects: ['Время', 'Пространство'] },
      { icon: '⚖️', title: 'Этика', subtitle: 'Мораль', connects: ['Выбор', 'Ценности'] },
      { icon: '🎭', title: 'Истина', subtitle: 'Алетейя', connects: ['Знание', 'Вера'] },
      { icon: '🌀', title: 'Хаос', subtitle: 'Энтропия', connects: ['Порядок', 'Эмерджентность'] },
      { icon: '✨', title: 'Порядок', subtitle: 'Космос', connects: ['Структура', 'Гармония'] },
      { icon: '🔥', title: 'Воля', subtitle: 'Свобода', connects: ['Действие', 'Цель'] },
      { icon: '💎', title: 'Ценности', subtitle: 'Аксиология', connects: ['Смысл', 'Цель'] },
    ]
  },
};

// Get concept map for current depth
const getConceptMap = (depth: number) => {
  const maps = Object.values(CONCEPT_MAPS);
  return maps[depth % maps.length];
};

// Process-describing formulas grouped by category
const PROCESS_FORMULAS = {
  network: ['dI/dt = αS·I', 'C = Σᵢⱼ Aᵢⱼ', 'k̄ = 2E/N', 'L = Σdᵢⱼ/N²'],
  emergence: ['S = -Σpᵢ ln pᵢ', 'Φ = Σφ(Mᵢ)', 'ΔG < 0', 'dS/dt ≥ 0'],
  complexity: ['D = ln N/ln ε', 'λ = ln|δₙ|/n', 'f(x) = xⁿ+c', 'z→z²+c'],
  quantum: ['ψ = Σcₙ|n⟩', 'Ĥψ = Eψ', 'ΔxΔp ≥ ℏ/2', '⟨A⟩ = ⟨ψ|Â|ψ⟩'],
  evolution: ['dN/dt = rN(1-N/K)', 'Δp = sp(1-p)', 'H² = 8πGρ/3', '∂ρ/∂t + ∇·J = 0'],
};

// 3Blue1Brown signature color palette
const DEPTH_PALETTES = [
  { primary: '#58C4DD', secondary: '#9CDCEB', glow: '#58C4DD', accent: '#FC6255' },  // Classic 3B1B blue
  { primary: '#83C167', secondary: '#A8D88E', glow: '#83C167', accent: '#F9F871' },  // Green
  { primary: '#9A72AC', secondary: '#B794C4', glow: '#9A72AC', accent: '#58C4DD' },  // Purple
  { primary: '#E8B923', secondary: '#F5D75A', glow: '#E8B923', accent: '#FC6255' },  // Gold
  { primary: '#5CD0B3', secondary: '#8DE0CA', glow: '#5CD0B3', accent: '#D147BD' },  // Teal
  { primary: '#FC6255', secondary: '#FD8A80', glow: '#FC6255', accent: '#58C4DD' },  // Red
  { primary: '#D147BD', secondary: '#E07DD2', glow: '#D147BD', accent: '#F9F871' },  // Pink
  { primary: '#F9F871', secondary: '#FBFBA0', glow: '#F9F871', accent: '#9A72AC' },  // Yellow
];

// Mind-map layout - hierarchical tree structure in 3D
const generateMindMapNodes = (count: number, time: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  const levels = 3;
  const nodesPerLevel = Math.ceil(count / levels);
  
  for (let i = 0; i < count; i++) {
    const level = Math.floor(i / nodesPerLevel);
    const indexInLevel = i % nodesPerLevel;
    const totalInLevel = Math.min(nodesPerLevel, count - level * nodesPerLevel);
    
    // Spread nodes in a tree-like 3D structure
    const angle = (indexInLevel / totalInLevel) * Math.PI * 2 + level * 0.3;
    const radius = 0.2 + level * 0.35;
    const yOffset = (level - 1) * 0.15;
    const zVariance = Math.sin(indexInLevel * 1.5) * 0.15;
    
    nodes.push({
      id: i,
      position: [
        radius * Math.cos(angle),
        yOffset + Math.sin(angle + i) * 0.1,
        radius * Math.sin(angle) + zVariance,
      ],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.12,
    });
  }
  return nodes;
};

// Generate mind-map connections based on concept relationships
const generateMindMapEdges = (nodeCount: number, time: number, depth: number): UniverseEdge[] => {
  const edges: UniverseEdge[] = [];
  const conceptMap = getConceptMap(depth);
  
  // Connect each node to central (node 0 connects to all)
  for (let i = 1; i < Math.min(4, nodeCount); i++) {
    edges.push({
      from: 0,
      to: i,
      opacity: 0,
      birthTime: time + i * 0.1,
    });
  }
  
  // Create semantic connections based on concept map
  for (let i = 0; i < nodeCount; i++) {
    const nodeData = conceptMap.nodes[i % conceptMap.nodes.length];
    if (nodeData.connects) {
      nodeData.connects.forEach((targetName, idx) => {
        const targetIndex = conceptMap.nodes.findIndex(n => n.title === targetName);
        if (targetIndex !== -1 && targetIndex < nodeCount && targetIndex !== i) {
          // Avoid duplicate edges
          const exists = edges.some(e => 
            (e.from === i && e.to === targetIndex) || 
            (e.from === targetIndex && e.to === i)
          );
          if (!exists) {
            edges.push({
              from: i,
              to: targetIndex,
              opacity: 0,
              birthTime: time + i * 0.1 + idx * 0.05 + 0.2,
            });
          }
        }
      });
    }
  }
  
  return edges;
};

// Get formulas based on depth level
const getFormulasForDepth = (depth: number): string[] => {
  const categories = Object.keys(PROCESS_FORMULAS) as (keyof typeof PROCESS_FORMULAS)[];
  const category = categories[depth % categories.length];
  return PROCESS_FORMULAS[category];
};

// Apple-style formula character - softer, more luminous
const FormulaChar = ({
  curve,
  char,
  t,
  opacity,
  color,
  scale = 1,
}: {
  curve: THREE.QuadraticBezierCurve3;
  char: string;
  t: number;
  opacity: number;
  color: string;
  scale?: number;
}) => {
  const point = curve.getPoint(t);
  
  return (
    <Text
      position={[point.x, point.y, point.z]}
      fontSize={0.014 * scale}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity * 0.9}
      outlineWidth={0.001}
      outlineColor={color}
      outlineOpacity={opacity * 0.3}
    >
      {char}
    </Text>
  );
};

// Formula stream - characters building up and flowing along the edge
const FormulaStream = ({
  curve,
  formula,
  baseOffset,
  speed,
  opacity,
  primaryColor,
  accentColor,
  time,
  streamIndex,
}: {
  curve: THREE.QuadraticBezierCurve3;
  formula: string;
  baseOffset: number;
  speed: number;
  opacity: number;
  primaryColor: string;
  accentColor: string;
  time: number;
  streamIndex: number;
}) => {
  const chars = formula.split('');
  const charSpacing = 0.04;
  
  // Building animation - characters appear one by one
  const buildProgress = ((time * 0.3 + baseOffset * 2) % 3) / 3;
  const visibleChars = Math.floor(buildProgress * chars.length * 1.5);
  
  // Flow position
  const flowT = ((time * speed + baseOffset) % 1.2);
  
  return (
    <group>
      {chars.map((char, i) => {
        // Character visibility based on build progress
        const charBuildDelay = i / chars.length;
        const isVisible = buildProgress > charBuildDelay * 0.6;
        if (!isVisible) return null;
        
        // Position along curve
        const t = Math.max(0, Math.min(1, flowT - i * charSpacing));
        if (t <= 0 || t >= 1) return null;
        
        // Fade edges
        const fadeIn = Math.min(1, t / 0.1);
        const fadeOut = Math.min(1, (1 - t) / 0.1);
        const charOpacity = opacity * fadeIn * fadeOut * 0.85;
        
        // Alternate colors for visual interest
        const useAccent = (i + streamIndex) % 5 === 0;
        const color = useAccent ? accentColor : primaryColor;
        
        // Slight scale variation for depth
        const scale = 0.9 + Math.sin(time * 3 + i) * 0.1;
        
        return (
          <FormulaChar
            key={`${streamIndex}-${i}`}
            curve={curve}
            char={char}
            t={t}
            opacity={charOpacity}
            color={color}
            scale={scale}
          />
        );
      })}
    </group>
  );
};

// Flowing mini-widget along connection
const FlowingMiniWidget = ({
  curve,
  t,
  opacity,
  palette,
  icon,
  label,
}: {
  curve: THREE.QuadraticBezierCurve3;
  t: number;
  opacity: number;
  palette: typeof DEPTH_PALETTES[0];
  icon: string;
  label: string;
}) => {
  const pos = curve.getPoint(t);
  const fadeOpacity = Math.sin(t * Math.PI) * opacity;
  const widgetWidth = 0.05;
  const widgetHeight = 0.032;
  
  return (
    <group position={[pos.x, pos.y, pos.z]} scale={0.8}>
      {/* Mini widget background */}
      <RoundedBox
        args={[widgetWidth, widgetHeight, 0.006]}
        radius={0.008}
        smoothness={3}
      >
        <meshBasicMaterial 
          color="#1C1C1E"
          transparent 
          opacity={fadeOpacity * 0.95}
        />
      </RoundedBox>
      
      {/* Accent border */}
      <RoundedBox
        args={[widgetWidth + 0.002, widgetHeight + 0.002, 0.004]}
        radius={0.009}
        smoothness={3}
      >
        <meshBasicMaterial 
          color={palette.primary}
          transparent 
          opacity={fadeOpacity * 0.5}
        />
      </RoundedBox>
      
      {/* Icon */}
      <Text
        position={[-0.012, 0, 0.004]}
        fontSize={0.012}
        color={palette.accent}
        anchorX="center"
        anchorY="middle"
        fillOpacity={fadeOpacity}
      >
        {icon}
      </Text>
      
      {/* Label */}
      <Text
        position={[0.01, 0, 0.004]}
        fontSize={0.007}
        color="#EBEBF5"
        anchorX="center"
        anchorY="middle"
        fillOpacity={fadeOpacity * 0.9}
      >
        {label}
      </Text>
      
      {/* Glow trail */}
      <Sphere args={[0.025, 8, 8]} position={[0, 0, -0.01]}>
        <meshBasicMaterial 
          color={palette.glow}
          transparent 
          opacity={fadeOpacity * 0.2}
        />
      </Sphere>
    </group>
  );
};

// Mini widget data for flow animation
const FLOW_WIDGETS = [
  { icon: '⚡', label: 'Энергия' },
  { icon: '📊', label: 'Данные' },
  { icon: '🔗', label: 'Связь' },
  { icon: '💡', label: 'Идея' },
  { icon: '🎯', label: 'Цель' },
  { icon: '✨', label: 'Смысл' },
  { icon: '🔄', label: 'Поток' },
  { icon: '📈', label: 'Рост' },
];

// Mind-map 3D connection line with flowing mini-widgets
const MindMapConnection = ({ 
  start, 
  end, 
  opacity, 
  palette, 
  edgeIndex,
  connectionLabel,
  time,
  isFromCenter
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  opacity: number; 
  palette: typeof DEPTH_PALETTES[0];
  edgeIndex: number;
  connectionLabel?: string;
  time: number;
  isFromCenter: boolean;
}) => {
  // Create curved 3D bezier path for mind-map style
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // Add 3D curvature for mind-map feel
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    // Curve outward in 3D space
    const curveAmount = startVec.distanceTo(endVec) * (isFromCenter ? 0.15 : 0.25);
    const yLift = isFromCenter ? 0.05 : 0.08;
    
    mid.add(perpendicular.multiplyScalar(curveAmount * (edgeIndex % 2 === 0 ? 1 : -1)));
    mid.y += yLift;
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(40);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [start, end, edgeIndex, isFromCenter]);

  // Animated flow effect - slower, more elegant
  const flowSpeed = 0.08;
  const pulseIntensity = 0.4 + Math.sin(time * 0.8 + edgeIndex) * 0.1;

  // Get widgets for this connection
  const flowWidgetData = useMemo(() => {
    return [
      { ...FLOW_WIDGETS[edgeIndex % FLOW_WIDGETS.length], offset: 0 },
      { ...FLOW_WIDGETS[(edgeIndex + 3) % FLOW_WIDGETS.length], offset: 0.5 },
    ];
  }, [edgeIndex]);

  return (
    <group>
      {/* Main connection line - subtle glowing path */}
      <Line
        points={points}
        color={palette.primary}
        lineWidth={isFromCenter ? 2 : 1.5}
        transparent
        opacity={opacity * pulseIntensity * 0.5}
      />
      
      {/* Outer glow line */}
      <Line
        points={points}
        color={palette.glow}
        lineWidth={isFromCenter ? 4 : 3}
        transparent
        opacity={opacity * 0.1}
      />
      
      {/* Flowing mini-widgets along the connection */}
      {flowWidgetData.map((widget, i) => {
        const t = ((time * flowSpeed + widget.offset + edgeIndex * 0.2) % 2.0);
        // Only show when in valid range
        if (t < 0.15 || t > 1.15) return null;
        const clampedT = Math.max(0.05, Math.min(0.95, t - 0.15));
        
        return (
          <FlowingMiniWidget
            key={i}
            curve={curve}
            t={clampedT}
            opacity={opacity * 0.95}
            palette={palette}
            icon={widget.icon}
            label={widget.label}
          />
        );
      })}
      
      {/* Small particle trail behind widgets */}
      {[0.2, 0.45, 0.7].map((offset, i) => {
        const t = ((time * flowSpeed * 0.8 + offset + edgeIndex * 0.15) % 1);
        const pos = curve.getPoint(t);
        const particleOpacity = Math.sin(t * Math.PI) * opacity * 0.4;
        
        return (
          <Sphere key={`particle-${i}`} args={[0.004, 6, 6]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial 
              color={palette.accent}
              transparent 
              opacity={particleOpacity}
            />
          </Sphere>
        );
      })}
      
      {/* Connection label at midpoint */}
      {connectionLabel && (
        <group position={[midPoint.x, midPoint.y + 0.035, midPoint.z]}>
          {/* Label background */}
          <RoundedBox args={[0.04, 0.016, 0.004]} radius={0.004} smoothness={2}>
            <meshBasicMaterial 
              color="#1C1C1E"
              transparent 
              opacity={opacity * 0.9}
            />
          </RoundedBox>
          
          {/* Label text */}
          <Text
            position={[0, 0, 0.003]}
            fontSize={0.008}
            color={palette.glow}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * 0.8}
          >
            {connectionLabel}
          </Text>
        </group>
      )}
      
      {/* Start point connector */}
      <Sphere args={[0.01, 10, 10]} position={start}>
        <meshBasicMaterial 
          color={palette.primary}
          transparent 
          opacity={opacity * 0.7}
        />
      </Sphere>
      
      {/* End point connector */}
      <Sphere args={[0.01, 10, 10]} position={end}>
        <meshBasicMaterial 
          color={palette.accent}
          transparent 
          opacity={opacity * 0.7}
        />
      </Sphere>
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
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [edges, setEdges] = useState<UniverseEdge[]>([]);
  const [time, setTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];

  // Initialize universe when becoming active
  useFrame(({ clock }) => {
    if (isActive && !initialized.current) {
      initialized.current = true;
      const nodeCount = Math.max(6, 8);
      setNodes(generateMindMapNodes(nodeCount, clock.elapsedTime));
      setEdges(generateMindMapEdges(nodeCount, clock.elapsedTime, depth));
    }
    
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05;
    }
  });

  // Animate nodes
  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.8));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...node, scale: eased, opacity: eased * universeOpacity };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.6));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...edge, opacity: eased * universeOpacity };
  });

  const handleNodeClick = useCallback((nodePosition: [number, number, number]) => {
    // No depth limit - infinite exploration
    const worldPos: [number, number, number] = [
      position[0] + nodePosition[0] * universeScale,
      position[1] + nodePosition[1] * universeScale,
      position[2] + nodePosition[2] * universeScale,
    ];
    onDiveIn(worldPos, depth + 1);
  }, [depth, position, universeScale, onDiveIn]);

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      {/* Minimal particle field */}
      <Stars
        radius={1.2}
        depth={0.6}
        count={25}
        factor={0.15}
        saturation={0}
        fade
        speed={0.05}
      />

      {/* Central orb - Apple style soft glow */}
      <Sphere args={[0.025, 32, 32]}>
        <meshBasicMaterial 
          color={palette.primary} 
          transparent 
          opacity={(0.8 + Math.sin(time * 1.5) * 0.1) * universeOpacity} 
        />
      </Sphere>
      {/* Soft inner glow */}
      <Sphere args={[0.045, 24, 24]}>
        <meshBasicMaterial 
          color={palette.glow} 
          transparent 
          opacity={(0.2 + Math.sin(time * 1.2) * 0.05) * universeOpacity} 
        />
      </Sphere>
      {/* Outer bloom */}
      <Sphere args={[0.08, 16, 16]}>
        <meshBasicMaterial 
          color={palette.glow} 
          transparent 
          opacity={(0.06) * universeOpacity} 
        />
      </Sphere>

      {/* Mind-map 3D connections */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const conceptMap = getConceptMap(depth);
        const startData = conceptMap.nodes[edge.from % conceptMap.nodes.length];
        const endData = conceptMap.nodes[edge.to % conceptMap.nodes.length];
        
        // Get connection label if it's a semantic connection
        const connectionLabel = startData.connects?.includes(endData.title) 
          ? '→' 
          : endData.connects?.includes(startData.title) 
            ? '←' 
            : undefined;

        return (
          <MindMapConnection
            key={`edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            opacity={edge.opacity}
            palette={palette}
            edgeIndex={i}
            connectionLabel={connectionLabel}
            time={time}
            isFromCenter={edge.from === 0}
          />
        );
      })}

      {/* Mind Map Nodes - 3B1B clean mathematical style */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const pulse = 1 + Math.sin(time * 0.4 + node.id * 0.5) * 0.02;
        const hoverScale = isHovered ? 1.12 : 1;
        
        // Get concept from current depth's map
        const conceptMap = getConceptMap(depth);
        const nodeData = conceptMap.nodes[node.id % conceptMap.nodes.length];
        
        return (
          <group 
            key={`node-${node.id}`} 
            position={node.position}
            scale={node.scale * pulse * hoverScale}
          >
            {/* Main node circle - 3B1B style */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node.position);
              }}
              onPointerOver={() => {
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredNode(null);
                document.body.style.cursor = 'default';
              }}
            >
              <sphereGeometry args={[0.05, 32, 32]} />
              <meshBasicMaterial 
                color={palette.primary}
                transparent 
                opacity={node.opacity * (isHovered ? 1 : 0.85)}
              />
            </mesh>
            
            {/* Outer glow ring */}
            <mesh>
              <sphereGeometry args={[0.065, 24, 24]} />
              <meshBasicMaterial 
                color={palette.glow}
                transparent 
                opacity={node.opacity * (isHovered ? 0.4 : 0.15)}
              />
            </mesh>
            
            {/* Soft outer halo */}
            <mesh>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial 
                color={palette.primary}
                transparent 
                opacity={node.opacity * 0.05}
              />
            </mesh>
            
            {/* Label below node - 3B1B typography */}
            <Text
              position={[0, -0.09, 0]}
              fontSize={0.025}
              color={isHovered ? '#FFFFFF' : '#CCCCCC'}
              anchorX="center"
              anchorY="top"
              fillOpacity={node.opacity * 0.9}
            >
              {nodeData.title}
            </Text>
            
            {/* Subtitle */}
            <Text
              position={[0, -0.12, 0]}
              fontSize={0.014}
              color={palette.glow}
              anchorX="center"
              anchorY="top"
              fillOpacity={node.opacity * 0.5}
            >
              {nodeData.subtitle}
            </Text>
            
            {/* Connection hints on hover */}
            {isHovered && nodeData.connects && (
              <Text
                position={[0, -0.16, 0]}
                fontSize={0.012}
                color={palette.accent}
                anchorX="center"
                anchorY="top"
                fillOpacity={node.opacity * 0.6}
              >
                {`→ ${nodeData.connects.join(' · ')}`}
              </Text>
            )}
            
            {/* Hover highlight ring */}
            {isHovered && (
              <mesh>
                <ringGeometry args={[0.07, 0.075, 32]} />
                <meshBasicMaterial 
                  color={palette.accent}
                  transparent 
                  opacity={node.opacity * 0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Depth label - minimal */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.022}
        color={palette.glow}
        anchorX="center"
        fillOpacity={universeOpacity * 0.25}
      >
        {depth + 1}
      </Text>
    </group>
  );
};
