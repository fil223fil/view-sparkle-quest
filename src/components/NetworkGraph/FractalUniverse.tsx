import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

interface UniverseNode {
  id: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
  priority: number; // 0-1, affects size and brightness
  connections: number; // number of connections
}

interface UniverseEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
  strength: number; // 0-1, affects line brightness
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Process-describing formulas grouped by category
const PROCESS_FORMULAS = {
  // Network dynamics & information flow
  network: [
    'dI/dt = αS·I',      // Information spread
    'C = Σᵢⱼ Aᵢⱼ',       // Connectivity
    'k̄ = 2E/N',          // Average degree
    'L = Σᵢⱼ dᵢⱼ/N²',    // Path length
  ],
  // Emergence & self-organization
  emergence: [
    'S = -Σ pᵢ ln pᵢ',   // Entropy
    'Φ = Σ φ(Mᵢ)',       // Integrated info
    'ΔG < 0',            // Spontaneous order
    'dS/dt ≥ 0',         // Second law
  ],
  // Complexity & fractals
  complexity: [
    'D = lim ln N/ln ε', // Fractal dimension
    'λ = lim ln|δₙ|/n',  // Lyapunov exp
    'f(x) = xⁿ + c',     // Iteration
    'z → z² + c',        // Mandelbrot
  ],
  // Quantum & wave
  quantum: [
    'ψ = Σ cₙ|n⟩',       // Superposition
    'Ĥψ = Eψ',           // Schrödinger
    'ΔxΔp ≥ ℏ/2',        // Uncertainty
    '⟨A⟩ = ⟨ψ|Â|ψ⟩',     // Expectation
  ],
  // Growth & evolution
  evolution: [
    'dN/dt = rN(1-N/K)', // Logistic growth
    'Δp = sp(1-p)',      // Selection
    'H² = 8πGρ/3',       // Expansion
    '∂ρ/∂t + ∇·J = 0',   // Conservation
  ],
};

// Extended cosmic color palette - vibrant and diverse
const DEPTH_PALETTES = [
  { primary: '#00D9FF', secondary: '#0099B8', glow: '#80ECFF', accent: '#FF6B9D' },  // Electric Cyan
  { primary: '#FF2D7B', secondary: '#B81F56', glow: '#FF7AAF', accent: '#00FFD1' },  // Hot Pink
  { primary: '#A855F7', secondary: '#7C3AED', glow: '#C084FC', accent: '#FACC15' },  // Vivid Purple
  { primary: '#FFB800', secondary: '#CC9300', glow: '#FFD54F', accent: '#00E5FF' },  // Solar Gold
  { primary: '#00FF87', secondary: '#00B85C', glow: '#7AFFB8', accent: '#FF4D6D' },  // Neon Green
  { primary: '#FF6B35', secondary: '#CC5529', glow: '#FF9A70', accent: '#4ECDC4' },  // Sunset Orange
  { primary: '#667EEA', secondary: '#5A67D8', glow: '#A3BFFA', accent: '#F687B3' },  // Indigo Dream
  { primary: '#38B2AC', secondary: '#2C9A94', glow: '#81E6D9', accent: '#FC8181' },  // Teal Wave
];

const generateUniverseNodes = (count: number, time: number, depth: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const radius = 0.3 + Math.random() * 0.2;
    
    // Priority based on position - creates natural hierarchy
    // First few nodes and some random ones get higher priority
    let priority: number;
    const rand = Math.random();
    if (i === 0) {
      priority = 1;
    } else if (i <= 2 || rand < 0.15) {
      priority = 0.75 + Math.random() * 0.25;
    } else if (rand < 0.4) {
      priority = 0.45 + Math.random() * 0.25;
    } else {
      priority = 0.25 + Math.random() * 0.2;
    }
    
    nodes.push({
      id: i,
      position: [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.1,
      priority,
      connections: 0,
    });
  }
  return nodes;
};

const generateUniverseEdges = (nodes: UniverseNode[], time: number): UniverseEdge[] => {
  const edges: UniverseEdge[] = [];
  const nodeCount = nodes.length;
  
  for (let i = 1; i < nodeCount; i++) {
    // Each node connects to 1-3 previous nodes
    const connections = 1 + Math.floor(Math.random() * Math.min(2, i));
    
    for (let j = 0; j < connections; j++) {
      const target = Math.floor(Math.random() * i);
      
      // Avoid duplicate edges
      const exists = edges.some(e => 
        (e.from === i && e.to === target) || (e.from === target && e.to === i)
      );
      if (exists) continue;
      
      // Edge strength based on node priorities
      const strength = (nodes[i].priority + nodes[target].priority) / 2;
      
      edges.push({
        from: i,
        to: target,
        opacity: 0,
        birthTime: time + i * 0.1 + 0.05,
        strength,
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

// Single formula character component - moves along the edge
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
      fontSize={0.016 * scale}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
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

// Minimalist dynamic edge - thin line made of flowing formula characters
const DynamicEdge = ({ 
  start, 
  end, 
  opacity, 
  palette, 
  edgeIndex,
  depth,
  time,
  strength,
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  opacity: number; 
  palette: typeof DEPTH_PALETTES[0];
  edgeIndex: number;
  depth: number;
  time: number;
  strength: number;
}) => {
  const formulas = getFormulasForDepth(depth);
  
  // Create subtle curved path
  const { curve, points } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // Minimal curve offset for elegance
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(startVec.distanceTo(endVec) * 0.08);
    
    if (edgeIndex % 2 === 0) perpendicular.negate();
    mid.add(perpendicular);
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(30);
    
    return { curve: bezierCurve, points: curvePoints };
  }, [start, end, edgeIndex]);

  // Streams count based on strength
  const streamCount = strength > 0.7 ? 3 : strength > 0.4 ? 2 : 1;
  
  const streams = useMemo(() => {
    const result = [];
    for (let i = 0; i < streamCount; i++) {
      result.push({
        formula: formulas[(edgeIndex + i) % formulas.length],
        offset: i * 0.35,
        speed: 0.06 + strength * 0.06,
      });
    }
    return result;
  }, [formulas, edgeIndex, streamCount, strength]);

  // Base line visibility based on strength
  const basePulse = (0.02 + strength * 0.03) + Math.sin(time * 2 + edgeIndex) * 0.01;

  return (
    <group>
      {/* Ultra-thin ghost line - visibility based on strength */}
      <Line
        points={points}
        color={palette.primary}
        lineWidth={0.3 + strength * 0.5}
        transparent
        opacity={opacity * basePulse * (0.5 + strength * 0.5)}
      />

      {/* Formula character streams - the main visual */}
      {streams.map((stream, i) => (
        <FormulaStream
          key={i}
          curve={curve}
          formula={stream.formula}
          baseOffset={stream.offset}
          speed={stream.speed}
          opacity={opacity * (0.6 + strength * 0.4)}
          primaryColor={palette.primary}
          accentColor={palette.accent}
          time={time}
          streamIndex={edgeIndex * 3 + i}
        />
      ))}
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
  const initializedForDepth = useRef<number | null>(null);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];

  // Initialize universe when becoming active - reset on depth change
  useFrame(({ clock }) => {
    if (isActive && initializedForDepth.current !== depth) {
      initializedForDepth.current = depth;
      const nodeCount = Math.max(6, 10 - (depth % 4)); // More nodes, cycling
      const newNodes = generateUniverseNodes(nodeCount, clock.elapsedTime, depth);
      const newEdges = generateUniverseEdges(newNodes, clock.elapsedTime);
      setNodes(newNodes);
      setEdges(newEdges);
    }
    
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05;
    }
  });

  // Animate nodes with priority affecting appearance
  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.8));
    const eased = 1 - Math.pow(1 - progress, 3);
    // Priority affects final opacity and scale
    const priorityScale = 0.6 + node.priority * 0.6;
    const priorityOpacity = 0.5 + node.priority * 0.5;
    return { 
      ...node, 
      scale: eased * priorityScale, 
      opacity: eased * universeOpacity * priorityOpacity 
    };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.6));
    const eased = 1 - Math.pow(1 - progress, 3);
    // Strength affects opacity
    const strengthOpacity = 0.5 + edge.strength * 0.5;
    return { ...edge, opacity: eased * universeOpacity * strengthOpacity };
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
      {/* Inner stars with depth color */}
      <Stars
        radius={2}
        depth={1}
        count={80}
        factor={0.4}
        saturation={0.5}
        fade
        speed={0.2}
      />

      {/* Center core with pulsing glow */}
      <Sphere args={[0.04, 16, 16]}>
        <meshBasicMaterial 
          color={palette.primary} 
          transparent 
          opacity={(0.4 + Math.sin(time * 3) * 0.2) * universeOpacity} 
        />
      </Sphere>
      <Sphere args={[0.08, 12, 12]}>
        <meshBasicMaterial 
          color={palette.glow} 
          transparent 
          opacity={(0.1 + Math.sin(time * 2) * 0.05) * universeOpacity} 
        />
      </Sphere>

      {/* Dynamic edges */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        return (
          <DynamicEdge
            key={`edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            opacity={edge.opacity}
            palette={palette}
            edgeIndex={i}
            depth={depth}
            time={time}
            strength={edge.strength}
          />
        );
      })}

      {/* Nodes with glow - size and brightness based on priority */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const pulse = 1 + Math.sin(time * 2 + node.id) * 0.1;
        // Base size affected by priority
        const baseSize = 0.02 + node.priority * 0.02;
        
        return (
          <group key={`node-${node.id}`} position={node.position}>
            {/* Core - size based on priority */}
            <Sphere
              args={[baseSize, 24, 24]}
              scale={node.scale * pulse * (isHovered ? 1.4 : 1)}
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
                color={isHovered ? palette.glow : (node.priority > 0.7 ? palette.accent : palette.primary)} 
                transparent 
                opacity={node.opacity} 
              />
            </Sphere>
            {/* Outer glow - bigger for high priority */}
            <Sphere args={[baseSize, 12, 12]} scale={node.scale * pulse * (2 + node.priority)}>
              <meshBasicMaterial 
                color={palette.glow} 
                transparent 
                opacity={node.opacity * 0.1 * (0.5 + node.priority * 0.5)} 
              />
            </Sphere>
            {/* Extra glow on hover or high priority */}
            {(isHovered || node.priority > 0.8) && (
              <Sphere args={[baseSize, 8, 8]} scale={node.scale * (3 + node.priority * 2)}>
                <meshBasicMaterial 
                  color={node.priority > 0.8 ? palette.accent : palette.glow} 
                  transparent 
                  opacity={node.opacity * (isHovered ? 0.1 : 0.05)} 
                />
              </Sphere>
            )}
          </group>
        );
      })}

      {/* Depth indicator */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.035}
        color={palette.primary}
        anchorX="center"
        fillOpacity={universeOpacity * 0.4}
      >
        {`Уровень ${depth + 1}`}
      </Text>
    </group>
  );
};
