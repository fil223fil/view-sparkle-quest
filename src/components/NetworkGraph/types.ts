export interface NetworkNode {
  id: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
}

export interface NetworkEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
}

export interface AnimationState {
  time: number;
  phase: 'birth' | 'growth' | 'stable';
  isPaused: boolean;
}
