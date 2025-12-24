import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

// iOS 26 style color palette - soft, refined, elegant
const DEPTH_PALETTES = [
  { primary: '#A8C5DA', secondary: '#C8DCE8', glow: '#B8D4E8', accent: '#E8A8B8' },  // Soft sky blue
  { primary: '#B8D4C8', secondary: '#D0E8DC', glow: '#C8E0D4', accent: '#D4C8B8' },  // Sage green
  { primary: '#C8B8D8', secondary: '#DCD0E8', glow: '#D4C8E0', accent: '#B8D4D8' },  // Lavender
  { primary: '#E0D4C0', secondary: '#EDE8DC', glow: '#E8E0D0', accent: '#C8B8D0' },  // Warm sand
  { primary: '#B8D8D8', secondary: '#D0E8E8', glow: '#C8E0E0', accent: '#D8C0C8' },  // Soft teal
  { primary: '#D8C0C8', secondary: '#E8D8DC', glow: '#E0D0D4', accent: '#B8D0D8' },  // Blush pink
  { primary: '#C8D0D8', secondary: '#DCE4E8', glow: '#D4DCE4', accent: '#D8D0C0' },  // Cool gray
  { primary: '#D8D4C0', secondary: '#E8E4D4', glow: '#E0DCC8', accent: '#C0C8D8' },  // Cream
];

// Очень близко к ядру
const generateMindMapNodes = (count: number, time: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const radius = 0.03 + Math.random() * 0.02; // Очень близко к центру
    
    nodes.push({
      id: i,
      position: [
        radius * Math.cos(angle),
        (Math.random() - 0.5) * 0.015,
        radius * Math.sin(angle),
      ],
      velocity: [0, 0, 0],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.05,
    });
  }
  return nodes;
};

// Force-directed physics simulation
const applyForces = (
  nodes: UniverseNode[], 
  edges: UniverseEdge[], 
  deltaTime: number
): UniverseNode[] => {
  if (!nodes || nodes.length === 0) return nodes;
  
  const REPULSION = 0.0006;      // Минимальное отталкивание
  const ATTRACTION = 0.015;      // Притяжение связанных
  const DAMPING = 0.95;          // Плавное
  const CENTER_PULL = 0.006;     // Сильное притяжение к ядру
  const MAX_VELOCITY = 0.003;    // Медленно
  const IDEAL_DISTANCE = 0.04;   // Очень близко
  
  return nodes.map((node, i) => {
    if (!node || !node.position) return node;
    
    // Ensure velocity exists
    const nodeVelocity = node.velocity || [0, 0, 0];
    
    let fx = 0, fy = 0, fz = 0;
    
    // Repulsion from all other nodes (magnetic field effect)
    nodes.forEach((other, j) => {
      if (i === j || !other || !other.position) return;
      
      const dx = node.position[0] - other.position[0];
      const dy = node.position[1] - other.position[1];
      const dz = node.position[2] - other.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
      
      // Inverse square repulsion
      const force = REPULSION / (dist * dist);
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
      fz += (dz / dist) * force;
    });
    
    // Attraction along edges (connected nodes pull each other)
    edges.forEach(edge => {
      if (!edge) return;
      let otherIndex = -1;
      if (edge.from === node.id) otherIndex = edge.to;
      else if (edge.to === node.id) otherIndex = edge.from;
      
      if (otherIndex !== -1) {
        const other = nodes.find(n => n && n.id === otherIndex);
        if (other && other.position) {
          const dx = other.position[0] - node.position[0];
          const dy = other.position[1] - node.position[1];
          const dz = other.position[2] - node.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
          
          // Spring-like attraction (stronger when far from ideal distance)
          const displacement = dist - IDEAL_DISTANCE;
          const force = displacement * ATTRACTION;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
          fz += (dz / dist) * force;
        }
      }
    });
    
    // Gentle center pull to keep graph compact
    fx -= node.position[0] * CENTER_PULL;
    fy -= node.position[1] * CENTER_PULL;
    fz -= node.position[2] * CENTER_PULL;
    
    // Update velocity with forces
    let vx = (nodeVelocity[0] + fx) * DAMPING;
    let vy = (nodeVelocity[1] + fy) * DAMPING;
    let vz = (nodeVelocity[2] + fz) * DAMPING;
    
    // Clamp velocity
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }
    
    // Update position
    return {
      ...node,
      position: [
        node.position[0] + vx,
        node.position[1] + vy,
        node.position[2] + vz,
      ] as [number, number, number],
      velocity: [vx, vy, vz] as [number, number, number],
    };
  });
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

// Elegant iOS-style connection line
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
  // Create smooth cubic bezier path for elegant curves
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    
    // Smoother, more organic curves
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    // Gentler curve for elegance
    const curveAmount = distance * (isFromCenter ? 0.12 : 0.18);
    const yLift = isFromCenter ? 0.03 : 0.05;
    
    // Calculate control points for cubic bezier (smoother than quadratic)
    const ctrl1 = startVec.clone().lerp(endVec, 0.33);
    ctrl1.add(perpendicular.clone().multiplyScalar(curveAmount * (edgeIndex % 2 === 0 ? 1 : -1)));
    ctrl1.y += yLift;
    
    const ctrl2 = startVec.clone().lerp(endVec, 0.66);
    ctrl2.add(perpendicular.clone().multiplyScalar(curveAmount * (edgeIndex % 2 === 0 ? 0.5 : -0.5)));
    ctrl2.y += yLift * 0.8;
    
    const bezierCurve = new THREE.CubicBezierCurve3(startVec, ctrl1, ctrl2, endVec);
    const curvePoints = bezierCurve.getPoints(60); // More points for smoother line
    
    const mid = bezierCurve.getPoint(0.5);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [start, end, edgeIndex, isFromCenter]);

  // Органичное дыхание линии
  const breatheSpeed = 0.25 + (edgeIndex % 4) * 0.05;
  const breathe = 0.6 + Math.sin(time * breatheSpeed + edgeIndex * 0.8) * 0.2;

  return (
    <group>
      {/* Мягкая основная линия */}
      <Line
        points={points}
        color={palette.primary}
        lineWidth={isFromCenter ? 1 : 0.6}
        transparent
        opacity={opacity * breathe * 0.4}
      />
      
      {/* Нежное свечение */}
      <Line
        points={points}
        color={palette.glow}
        lineWidth={isFromCenter ? 2.5 : 2}
        transparent
        opacity={opacity * 0.05}
      />
      
      {/* Одна плавная частица */}
      {(() => {
        const flowSpeed = 0.02 + (edgeIndex % 3) * 0.005;
        const t = ((time * flowSpeed + edgeIndex * 0.2) % 1);
        const pos = curve.getPoint(t);
        const particleOpacity = Math.sin(t * Math.PI) * opacity * 0.4;
        
        return (
          <Sphere args={[0.004, 8, 8]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial 
              color={palette.secondary}
              transparent 
              opacity={particleOpacity}
            />
          </Sphere>
        );
      })()}
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
      
      // Apply force-directed physics
      if (nodes.length > 0 && edges.length > 0) {
        setNodes(prevNodes => applyForces(prevNodes, edges, 0.016));
      }
    }

    // Убираем вращение для фронтального вида
    // Только очень лёгкое дыхание
    if (groupRef.current) {
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.x = 0;
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

      {/* Mind Map Nodes - Widget style */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        
        // Органичное дыхание - каждый узел дышит в своём ритме
        const breatheSpeed = 0.3 + (node.id % 5) * 0.08;
        const breathePhase = node.id * 1.2;
        const breathe = 1 + Math.sin(time * breatheSpeed + breathePhase) * 0.015;
        
        // Лёгкое покачивание
        const swayX = Math.sin(time * 0.2 + node.id * 0.7) * 0.003;
        const swayY = Math.cos(time * 0.15 + node.id * 0.5) * 0.002;
        
        const hoverScale = isHovered ? 1.05 : 1;
        
        const conceptMap = getConceptMap(depth);
        const nodeData = conceptMap.nodes[node.id % conceptMap.nodes.length];
        
        const widgetWidth = 0.065;
        const widgetHeight = 0.035;
        const connectionCount = nodeData.connects?.length || 0;
        
        // Позиция с органичным покачиванием
        const organicPosition: [number, number, number] = [
          node.position[0] + swayX,
          node.position[1] + swayY,
          node.position[2]
        ];
        
        return (
          <Billboard
            key={`node-${node.id}`}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <group 
              position={organicPosition}
              scale={node.scale * breathe * hoverScale}
            >
              {/* Компактный виджет */}
              <RoundedBox
                args={[widgetWidth, widgetHeight, 0.008]}
                radius={0.01}
                smoothness={4}
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
                <meshBasicMaterial 
                  color="#1C1C1E"
                  transparent 
                  opacity={node.opacity * 0.9}
                />
              </RoundedBox>
              
              {/* Тонкая граница */}
              <RoundedBox
                args={[widgetWidth + 0.002, widgetHeight + 0.002, 0.004]}
                radius={0.008}
                smoothness={3}
              >
                <meshBasicMaterial 
                  color={isHovered ? palette.accent : palette.primary}
                  transparent 
                  opacity={node.opacity * (isHovered ? 0.6 : 0.3)}
                />
              </RoundedBox>
              
              {/* Иконка слева */}
              <Text
                position={[-0.02, 0, 0.005]}
                fontSize={0.014}
                color={palette.accent}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {nodeData.icon}
              </Text>
              
              {/* Название */}
              <Text
                position={[0.01, 0.005, 0.005]}
                fontSize={0.009}
                color={isHovered ? '#FFFFFF' : '#E8E8ED'}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {nodeData.title}
              </Text>
              
              {/* Счётчик связей */}
              <Text
                position={[0.01, -0.006, 0.005]}
                fontSize={0.006}
                color={palette.glow}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.7}
              >
                {connectionCount > 0 ? `${connectionCount} →` : ''}
              </Text>
            </group>
          </Billboard>
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
