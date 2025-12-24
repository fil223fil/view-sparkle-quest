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

// Apple signature color palette - soft, luminous, spatial
const DEPTH_PALETTES = [
  { primary: '#0A84FF', secondary: '#0066CC', glow: '#64D2FF', accent: '#FF6482' },  // System Blue
  { primary: '#BF5AF2', secondary: '#9B4BD5', glow: '#DA8FFF', accent: '#64D2FF' },  // System Purple  
  { primary: '#FF6482', secondary: '#E84D6A', glow: '#FF9EB0', accent: '#30D158' },  // System Pink
  { primary: '#30D158', secondary: '#28B84C', glow: '#7AE99A', accent: '#FF9F0A' },  // System Green
  { primary: '#64D2FF', secondary: '#4BBDE8', glow: '#A0E5FF', accent: '#BF5AF2' },  // System Cyan
  { primary: '#FF9F0A', secondary: '#E58C00', glow: '#FFBF4D', accent: '#0A84FF' },  // System Orange
  { primary: '#5E5CE6', secondary: '#4B49C7', glow: '#9896F1', accent: '#FF375F' },  // System Indigo
  { primary: '#AC8E68', secondary: '#917554', glow: '#C9B08E', accent: '#64D2FF' },  // System Brown/Gold
];

const generateUniverseNodes = (count: number, time: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const radius = 0.3 + Math.random() * 0.2;
    
    nodes.push({
      id: i,
      position: [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.15,
    });
  }
  return nodes;
};

const generateUniverseEdges = (nodeCount: number, time: number): UniverseEdge[] => {
  const edges: UniverseEdge[] = [];
  for (let i = 1; i < nodeCount; i++) {
    const connections = Math.min(2, i);
    for (let j = 0; j < connections; j++) {
      const target = Math.floor(Math.random() * i);
      edges.push({
        from: i,
        to: target,
        opacity: 0,
        birthTime: time + i * 0.15 + 0.1,
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

// Minimalist dynamic edge - thin line made of flowing formula characters
const DynamicEdge = ({ 
  start, 
  end, 
  opacity, 
  palette, 
  edgeIndex,
  depth,
  time 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  opacity: number; 
  palette: typeof DEPTH_PALETTES[0];
  edgeIndex: number;
  depth: number;
  time: number;
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

  // Multiple formula streams with staggered timing
  const streams = useMemo(() => {
    return [
      { formula: formulas[edgeIndex % formulas.length], offset: 0, speed: 0.08 },
      { formula: formulas[(edgeIndex + 1) % formulas.length], offset: 0.4, speed: 0.1 },
      { formula: formulas[(edgeIndex + 2) % formulas.length], offset: 0.8, speed: 0.06 },
    ];
  }, [formulas, edgeIndex]);

  // Very subtle base line - almost invisible
  const basePulse = 0.02 + Math.sin(time * 2 + edgeIndex) * 0.01;

  return (
    <group>
      {/* Ultra-thin ghost line - barely visible guide */}
      <Line
        points={points}
        color={palette.primary}
        lineWidth={0.5}
        transparent
        opacity={opacity * basePulse}
      />

      {/* Formula character streams - the main visual */}
      {streams.map((stream, i) => (
        <FormulaStream
          key={i}
          curve={curve}
          formula={stream.formula}
          baseOffset={stream.offset}
          speed={stream.speed}
          opacity={opacity}
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
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];

  // Initialize universe when becoming active
  useFrame(({ clock }) => {
    if (isActive && !initialized.current) {
      initialized.current = true;
      const nodeCount = Math.max(5, 8 - depth);
      setNodes(generateUniverseNodes(nodeCount, clock.elapsedTime));
      setEdges(generateUniverseEdges(nodeCount, clock.elapsedTime));
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
          />
        );
      })}

      {/* Nodes - clean Apple aesthetic */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const pulse = 1 + Math.sin(time * 1.2 + node.id * 0.7) * 0.05;
        
        return (
          <group key={`node-${node.id}`} position={node.position}>
            {/* Core - crisp center */}
            <Sphere
              args={[0.015, 32, 32]}
              scale={node.scale * pulse * (isHovered ? 1.6 : 1)}
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
                color={isHovered ? '#FFFFFF' : palette.primary} 
                transparent 
                opacity={node.opacity} 
              />
            </Sphere>
            {/* Soft glow */}
            <Sphere args={[0.015, 20, 20]} scale={node.scale * pulse * 2.2}>
              <meshBasicMaterial 
                color={palette.glow} 
                transparent 
                opacity={node.opacity * 0.25} 
              />
            </Sphere>
            {/* Outer aura */}
            <Sphere args={[0.015, 12, 12]} scale={node.scale * pulse * 4}>
              <meshBasicMaterial 
                color={palette.glow} 
                transparent 
                opacity={node.opacity * 0.08} 
              />
            </Sphere>
            {/* Hover expansion */}
            {isHovered && (
              <Sphere args={[0.015, 8, 8]} scale={node.scale * 6}>
                <meshBasicMaterial 
                  color={palette.primary} 
                  transparent 
                  opacity={node.opacity * 0.1} 
                />
              </Sphere>
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
