import { useState, useCallback, useEffect } from 'react';
import { NetworkNode, NetworkEdge } from './types';

const generateNodePosition = (index: number, total: number): [number, number, number] => {
  if (index === 0) return [0, 0, 0];
  
  const phi = Math.acos(-1 + (2 * index) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;
  const radius = 1.5 + Math.random() * 0.5;
  
  return [
    radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi),
  ];
};

const generateFractalPositions = (
  parentPosition: [number, number, number],
  depth: number,
  count: number = 3
): [number, number, number][] => {
  const positions: [number, number, number][] = [];
  const radius = 0.4 / (depth + 1); // Smaller radius for deeper levels
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const verticalAngle = Math.random() * Math.PI - Math.PI / 2;
    
    positions.push([
      parentPosition[0] + radius * Math.cos(angle) * Math.cos(verticalAngle),
      parentPosition[1] + radius * Math.sin(verticalAngle),
      parentPosition[2] + radius * Math.sin(angle) * Math.cos(verticalAngle),
    ]);
  }
  
  return positions;
};

export const useNetworkAnimation = (isPaused: boolean) => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [time, setTime] = useState(0);

  const addNode = useCallback((currentTime: number, position?: [number, number, number], depth: number = 0) => {
    setNodes((prev) => {
      const newId = prev.length;
      const nodePosition = position || generateNodePosition(newId, 20);
      return [
        ...prev,
        {
          id: newId,
          position: nodePosition,
          scale: 0,
          opacity: 0,
          birthTime: currentTime,
          depth,
        },
      ];
    });
  }, []);

  const addEdge = useCallback((from: number, to: number, currentTime: number) => {
    setEdges((prev) => [
      ...prev,
      { from, to, opacity: 0, birthTime: currentTime },
    ]);
  }, []);

  const spawnFractal = useCallback((parentPosition: [number, number, number], parentDepth: number, currentTime: number) => {
    const newDepth = parentDepth + 1;
    const childCount = Math.max(2, 4 - newDepth); // Fewer children at deeper levels
    const childPositions = generateFractalPositions(parentPosition, newDepth, childCount);
    
    setNodes((prev) => {
      const parentId = prev.findIndex(n => 
        n.position[0] === parentPosition[0] && 
        n.position[1] === parentPosition[1] && 
        n.position[2] === parentPosition[2]
      );
      
      const newNodes = childPositions.map((pos, i) => ({
        id: prev.length + i,
        position: pos,
        scale: 0,
        opacity: 0,
        birthTime: currentTime + i * 0.1,
        depth: newDepth,
      }));
      
      return [...prev, ...newNodes];
    });

    // Add edges from parent to new children
    setTimeout(() => {
      setNodes((currentNodes) => {
        const parentId = currentNodes.findIndex(n => 
          n.position[0] === parentPosition[0] && 
          n.position[1] === parentPosition[1] && 
          n.position[2] === parentPosition[2]
        );
        
        if (parentId !== -1) {
          const newChildIds = currentNodes
            .slice(-childCount)
            .map(n => n.id);
          
          setEdges((prev) => [
            ...prev,
            ...newChildIds.map(childId => ({
              from: parentId,
              to: childId,
              opacity: 0,
              birthTime: currentTime,
            })),
          ]);
        }
        return currentNodes;
      });
    }, 50);
  }, []);

  // Main animation loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTime((prev) => prev + 0.016);
    }, 16);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Node spawning logic
  useEffect(() => {
    if (isPaused) return;

    // Initial node at t=0
    if (nodes.length === 0 && time > 0.5) {
      addNode(time);
    }

    // Add more nodes over time
    if (nodes.length > 0 && nodes.length < 12) {
      const lastNode = nodes[nodes.length - 1];
      if (time - lastNode.birthTime > 1.5) {
        addNode(time);
        
        // Connect to random existing nodes
        const newId = nodes.length;
        const connections = Math.min(2, nodes.length);
        const connectedTo = new Set<number>();
        
        for (let i = 0; i < connections; i++) {
          let targetId;
          do {
            targetId = Math.floor(Math.random() * nodes.length);
          } while (connectedTo.has(targetId));
          connectedTo.add(targetId);
          addEdge(newId, targetId, time);
        }
      }
    }
  }, [time, nodes, isPaused, addNode, addEdge]);

  // Update node properties based on time
  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const growthDuration = 1.0;
    const progress = Math.min(1, age / growthDuration);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    return {
      ...node,
      scale: eased,
      opacity: eased,
    };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const growthDuration = 0.8;
    const progress = Math.min(1, age / growthDuration);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    return {
      ...edge,
      opacity: eased,
    };
  });

  const reset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setTime(0);
  }, []);

  return {
    nodes: animatedNodes,
    edges: animatedEdges,
    time,
    reset,
    spawnFractal,
  };
};
