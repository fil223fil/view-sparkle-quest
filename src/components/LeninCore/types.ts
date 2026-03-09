// Ядро Ленин - Core Type Definitions
// Based on iOS 26 Widget Ecosystem PRD

export type WidgetPriority = 'critical' | 'high' | 'medium' | 'low';

export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetCategory = 
  | 'system' 
  | 'productivity' 
  | 'communication' 
  | 'media' 
  | 'utilities';

export type ConnectionType = 
  | 'dataFlow'
  | 'dependency'
  | 'contextLink'
  | 'logicChain'
  | 'causal'
  | 'temporal'
  | 'semantic'
  | 'metacognitive';

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
  size: WidgetSize;
  infoLoad: number;
  connects: string[];
  miniWidgets: MiniWidgetData[];
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  // Extended data for rich widget content
  widgetData?: {
    // Weather
    temperature?: number;
    tempHigh?: number;
    tempLow?: number;
    condition?: string;
    humidity?: number;
    wind?: number;
    feelsLike?: number;
    precipitation?: number;
    hourlyForecast?: { time: string; temp: number; icon: string }[];
    // Calendar
    events?: { time: string; title: string; color: string }[];
    // Health/Fitness
    steps?: number;
    calories?: number;
    progress?: number;
    exerciseMinutes?: number;
    standHours?: number;
    // Messages/Mail
    unread?: number;
    // Generic items
    items?: { icon: string; label: string; value: string }[];
  };
}

export interface ConnectionData {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  strength?: number;
}

export interface DepthLevelData {
  id: DepthLevel;
  icon: string;
  label: string;
  description: string;
}

export const PRIORITY_SCALE: Record<WidgetPriority, number> = {
  critical: 1.5,
  high: 1.25,
  medium: 1.0,
  low: 0.85,
};

// Apple-refined connection styles — subtle, elegant, SF-inspired palette
export const CONNECTION_STYLES: Record<ConnectionType, {
  color: string;
  secondaryColor?: string;
  dashArray?: string;
  particleColor?: string;
  animated: boolean;
  opacity: number;
}> = {
  dataFlow: {
    color: '#34C759',        // Apple Green
    secondaryColor: '#30D158',
    particleColor: '#32D74B',
    animated: true,
    opacity: 0.45,
  },
  dependency: {
    color: '#007AFF',        // Apple Blue
    secondaryColor: '#0A84FF',
    dashArray: '12,6',
    animated: false,
    opacity: 0.35,
  },
  contextLink: {
    color: '#FF9F0A',        // Apple Orange
    secondaryColor: '#FFD60A',
    animated: true,
    opacity: 0.3,
  },
  logicChain: {
    color: '#BF5AF2',        // Apple Purple
    secondaryColor: '#DA8FFF',
    animated: true,
    opacity: 0.4,
  },
  causal: {
    color: '#FF453A',        // Apple Red
    secondaryColor: '#FF6961',
    animated: true,
    opacity: 0.35,
  },
  temporal: {
    color: '#5E5CE6',        // Apple Indigo
    secondaryColor: '#7D7AFF',
    dashArray: '6,4',
    animated: false,
    opacity: 0.3,
  },
  semantic: {
    color: '#64D2FF',        // Apple Cyan
    secondaryColor: '#70D7FF',
    animated: false,
    opacity: 0.25,
  },
  metacognitive: {
    color: '#AC8E68',        // Apple Gold/Warm
    secondaryColor: '#C4A882',
    dashArray: '3,3',
    animated: true,
    opacity: 0.3,
  },
};

export const DEPTH_LEVELS: DepthLevelData[] = [
  { id: 'dock', icon: '🦆', label: 'Док', description: 'Общая постановка задачи' },
  { id: 'active', icon: '✨', label: 'Активность', description: 'ИИ начал работу' },
  { id: 'target', icon: '🎯', label: 'Цель', description: 'Фокус на подзадаче' },
  { id: 'detail', icon: '🔬', label: 'Детали', description: 'Глубокий анализ' },
  { id: 'infinite', icon: '∞', label: 'Бесконечность', description: 'Непрерывный анализ' },
];

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

export const PHYSICS_CONFIG = {
  damping: 0.82,
  repulsion: 650,
  attraction: 0.012,
  springStrength: 0.06,
  magneticSnapDistance: 20,
  maxVelocity: 8,
};