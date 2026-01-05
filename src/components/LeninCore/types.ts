// Ядро Ленин - Core Type Definitions
// Based on iOS 26 Widget Ecosystem PRD

export type WidgetPriority = 'critical' | 'high' | 'medium' | 'low';

export type WidgetCategory = 
  | 'system' 
  | 'productivity' 
  | 'communication' 
  | 'media' 
  | 'utilities';

export type ConnectionType = 
  | 'dataFlow'      // Solid gradient line with moving particles
  | 'dependency'    // Dashed blue line
  | 'contextLink'   // Semi-transparent golden thread
  | 'logicChain'    // Animated arrows
  | 'causal'        // Cause-effect relationships
  | 'temporal'      // Time sequence
  | 'semantic'      // Meaning/conceptual connections
  | 'metacognitive'; // Reflection over thought processes

export type DepthLevel = 'dock' | 'active' | 'target' | 'detail' | 'infinite';

export interface MiniWidgetData {
  id: string;
  icon: string;
  label: string;
}

export interface WidgetData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  priority: WidgetPriority;
  category: WidgetCategory;
  infoLoad: number; // 0-100
  connects: string[];
  miniWidgets: MiniWidgetData[];
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
}

export interface ConnectionData {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  strength?: number; // 0-1, affects line thickness for dataFlow
}

export interface DepthLevelData {
  id: DepthLevel;
  icon: string;
  label: string;
  description: string;
}

// Priority to size mapping (1.0 = base size)
export const PRIORITY_SCALE: Record<WidgetPriority, number> = {
  critical: 1.5,
  high: 1.25,
  medium: 1.0,
  low: 0.85,
};

// Connection visual configurations
export const CONNECTION_STYLES: Record<ConnectionType, {
  color: string;
  dashArray?: string;
  particleColor?: string;
  animated: boolean;
  opacity: number;
}> = {
  dataFlow: {
    color: '#00D4AA',
    particleColor: '#00FFD4',
    animated: true,
    opacity: 0.9,
  },
  dependency: {
    color: '#007AFF',
    dashArray: '8,4',
    animated: false,
    opacity: 0.7,
  },
  contextLink: {
    color: '#FFD700',
    animated: true,
    opacity: 0.5,
  },
  logicChain: {
    color: '#FF6B9D',
    animated: true,
    opacity: 0.85,
  },
  causal: {
    color: '#FF4500',
    animated: true,
    opacity: 0.8,
  },
  temporal: {
    color: '#9B59B6',
    dashArray: '4,2',
    animated: false,
    opacity: 0.6,
  },
  semantic: {
    color: '#3498DB',
    animated: false,
    opacity: 0.5,
  },
  metacognitive: {
    color: '#E74C3C',
    dashArray: '2,2',
    animated: true,
    opacity: 0.7,
  },
};

// Depth navigation levels
export const DEPTH_LEVELS: DepthLevelData[] = [
  { id: 'dock', icon: '🦆', label: 'Док', description: 'Общая постановка задачи' },
  { id: 'active', icon: '✨', label: 'Активность', description: 'ИИ начал работу' },
  { id: 'target', icon: '🎯', label: 'Цель', description: 'Фокус на подзадаче' },
  { id: 'detail', icon: '🔬', label: 'Детали', description: 'Глубокий анализ' },
  { id: 'infinite', icon: '∞', label: 'Бесконечность', description: 'Непрерывный анализ' },
];

// Category colors for widget backgrounds
export const CATEGORY_COLORS: Record<WidgetCategory, { 
  gradient: string; 
  glow: string;
  iconBg: string;
}> = {
  system: {
    gradient: 'linear-gradient(135deg, rgba(88, 196, 221, 0.3), rgba(88, 196, 221, 0.1))',
    glow: 'rgba(88, 196, 221, 0.4)',
    iconBg: 'rgba(88, 196, 221, 0.2)',
  },
  productivity: {
    gradient: 'linear-gradient(135deg, rgba(52, 199, 89, 0.3), rgba(52, 199, 89, 0.1))',
    glow: 'rgba(52, 199, 89, 0.4)',
    iconBg: 'rgba(52, 199, 89, 0.2)',
  },
  communication: {
    gradient: 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(0, 122, 255, 0.1))',
    glow: 'rgba(0, 122, 255, 0.4)',
    iconBg: 'rgba(0, 122, 255, 0.2)',
  },
  media: {
    gradient: 'linear-gradient(135deg, rgba(255, 45, 85, 0.3), rgba(255, 45, 85, 0.1))',
    glow: 'rgba(255, 45, 85, 0.4)',
    iconBg: 'rgba(255, 45, 85, 0.2)',
  },
  utilities: {
    gradient: 'linear-gradient(135deg, rgba(255, 159, 10, 0.3), rgba(255, 159, 10, 0.1))',
    glow: 'rgba(255, 159, 10, 0.4)',
    iconBg: 'rgba(255, 159, 10, 0.2)',
  },
};

// Physics constants for force-directed layout
export const PHYSICS_CONFIG = {
  damping: 0.8,
  repulsion: 150,
  attraction: 0.01,
  springStrength: 0.05,
  magneticSnapDistance: 20,
  maxVelocity: 5,
};
