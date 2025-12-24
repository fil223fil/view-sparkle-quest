import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Stars, Text } from '@react-three/drei';
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

const FORMULAS = [
  'E = mc²', 'ψ(x,t)', '∇ × B', 'Σ aₙ', '∫ f dx', 'λ = h/p',
  'e^iπ', 'Δx·Δp', '∂²u/∂t²', 'det(A)', 'lim→∞', '∮ E·dl',
];

const DEPTH_COLORS = ['#58C4DD', '#FF6B9D', '#9B59B6', '#F39C12', '#2ECC71'];

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
      birthTime: time + i * 0.2,
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
        birthTime: time + i * 0.2 + 0.1,
      });
    }
  }
  return edges;
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

  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];

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
      groupRef.current.rotation.y += 0.002;
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
    if (depth < 4) {
      // Transform local position to world position
      const worldPos: [number, number, number] = [
        position[0] + nodePosition[0] * universeScale,
        position[1] + nodePosition[1] * universeScale,
        position[2] + nodePosition[2] * universeScale,
      ];
      onDiveIn(worldPos, depth + 1);
    }
  }, [depth, position, universeScale, onDiveIn]);

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      {/* Inner stars */}
      <Stars
        radius={2}
        depth={1}
        count={100}
        factor={0.5}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Center glow */}
      <Sphere args={[0.05, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.3 * universeOpacity} />
      </Sphere>

      {/* Edges with formulas */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const midPoint: [number, number, number] = [
          (startNode.position[0] + endNode.position[0]) / 2,
          (startNode.position[1] + endNode.position[1]) / 2,
          (startNode.position[2] + endNode.position[2]) / 2,
        ];

        return (
          <group key={`edge-${i}`}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([...startNode.position, ...endNode.position])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={color} transparent opacity={edge.opacity * 0.3} />
            </line>
            <Text
              position={midPoint}
              fontSize={0.03}
              color={color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={edge.opacity * 0.7}
            >
              {FORMULAS[(i + depth * 3) % FORMULAS.length]}
            </Text>
          </group>
        );
      })}

      {/* Nodes */}
      {animatedNodes.map((node) => (
        <group key={`node-${node.id}`} position={node.position}>
          <Sphere
            args={[0.03, 24, 24]}
            scale={node.scale * (hoveredNode === node.id ? 1.5 : 1)}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(node.position);
            }}
            onPointerOver={() => setHoveredNode(node.id)}
            onPointerOut={() => setHoveredNode(null)}
          >
            <meshBasicMaterial color={color} transparent opacity={node.opacity} />
          </Sphere>
          <Sphere args={[0.03, 12, 12]} scale={node.scale * 2}>
            <meshBasicMaterial color={color} transparent opacity={node.opacity * 0.15} />
          </Sphere>
        </group>
      ))}

      {/* Depth indicator */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.04}
        color={color}
        anchorX="center"
        fillOpacity={universeOpacity * 0.5}
      >
        {`Глубина ${depth + 1}`}
      </Text>
    </group>
  );
};
