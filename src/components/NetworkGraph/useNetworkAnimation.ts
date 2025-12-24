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

export const useNetworkAnimation = (isPaused: boolean) => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [time, setTime] = useState(0);

  const addNode = useCallback((currentTime: number) => {
    setNodes((prev) => {
      const newId = prev.length;
      const position = generateNodePosition(newId, 20);
      return [
        ...prev,
        {
          id: newId,
          position,
          scale: 0,
          opacity: 0,
          birthTime: currentTime,
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
  };
};
