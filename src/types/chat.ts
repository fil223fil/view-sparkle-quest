export interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'complete';
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'function' | 'data' | 'synthesis';
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number;
  children?: ProcessStep[];
}

export interface FunctionCall {
  name: string;
  service: string;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  duration: number;
}

export interface DataReference {
  type: string;
  source: string;
  content: Record<string, any>;
  timestamp: Date;
}

export interface WidgetResponse {
  type: 'weather' | 'calendar' | 'health' | 'music' | 'reminder' | 'action';
  title: string;
  data: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  processSteps?: ProcessStep[];
  thinkingChain?: ThinkingStep[];
  usedFunctions?: FunctionCall[];
  usedData?: DataReference[];
  hasProcessData?: boolean;
  widget?: WidgetResponse;
}
