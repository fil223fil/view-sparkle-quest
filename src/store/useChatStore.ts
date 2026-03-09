import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

// Maps query keywords to relevant widget IDs
const QUERY_WIDGET_MAP: Record<string, string[]> = {
  погод: ['weather', 'calendar', 'lmm-core'],
  weather: ['weather', 'calendar', 'lmm-core'],
  календар: ['calendar', 'tasks', 'reminders', 'lmm-core'],
  событи: ['calendar', 'tasks', 'reminders', 'lmm-core'],
  встреч: ['calendar', 'messages', 'lmm-core'],
  задач: ['tasks', 'processing-queue', 'lmm-core'],
  заметк: ['notes', 'memory-bank', 'lmm-core'],
  напомин: ['reminders', 'calendar', 'lmm-core'],
  сообщен: ['messages', 'mail', 'lmm-core'],
  почт: ['mail', 'messages', 'lmm-core'],
  фото: ['photos', 'memory-bank', 'lmm-core'],
  шаг: ['weather', 'calendar', 'lmm-core', 'neural-engine'],
  активност: ['processing-queue', 'neural-engine', 'lmm-core'],
  здоров: ['weather', 'calendar', 'lmm-core'],
  health: ['weather', 'calendar', 'lmm-core'],
  памят: ['memory-bank', 'notes', 'lmm-core'],
  мозг: ['lmm-core', 'neural-engine', 'memory-bank'],
  анализ: ['neural-engine', 'lmm-core', 'processing-queue'],
};

export interface QueryGroup {
  id: string;
  query: string;
  widgetIds: string[];
  timestamp: number;
  thinkingOrder: string[]; // ordered widget activation sequence
}

interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  activeGroups: QueryGroup[];
  currentGroupId: string | null;
  addMessage: (msg: ChatMessage) => void;
  setProcessing: (val: boolean) => void;
  clearMessages: () => void;
  activateQueryGroup: (query: string) => void;
  clearGroups: () => void;
}

function resolveWidgets(query: string): string[] {
  const lower = query.toLowerCase();
  const matched = new Set<string>();
  
  for (const [keyword, widgetIds] of Object.entries(QUERY_WIDGET_MAP)) {
    if (lower.includes(keyword)) {
      widgetIds.forEach(id => matched.add(id));
    }
  }
  
  // Always include lmm-core as the thinking center
  if (matched.size === 0) {
    matched.add('lmm-core');
    matched.add('neural-engine');
    matched.add('processing-queue');
  }
  
  return Array.from(matched);
}

// Determine thinking order: lmm-core first, then by category priority
function buildThinkingOrder(widgetIds: string[]): string[] {
  const order: string[] = [];
  // Core first
  if (widgetIds.includes('lmm-core')) order.push('lmm-core');
  // Processing second
  if (widgetIds.includes('processing-queue')) order.push('processing-queue');
  if (widgetIds.includes('neural-engine')) order.push('neural-engine');
  if (widgetIds.includes('memory-bank')) order.push('memory-bank');
  // Then the rest
  widgetIds.forEach(id => {
    if (!order.includes(id)) order.push(id);
  });
  return order;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isProcessing: false,
  activeGroups: [],
  currentGroupId: null,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setProcessing: (val) => set({ isProcessing: val }),
  clearMessages: () => set({ messages: [], activeGroups: [], currentGroupId: null }),
  activateQueryGroup: (query) => set((s) => {
    const widgetIds = resolveWidgets(query);
    const thinkingOrder = buildThinkingOrder(widgetIds);
    const group: QueryGroup = {
      id: `qg-${Date.now()}`,
      query,
      widgetIds,
      timestamp: Date.now(),
      thinkingOrder,
    };
    return {
      activeGroups: [...s.activeGroups, group],
      currentGroupId: group.id,
    };
  }),
  clearGroups: () => set({ activeGroups: [], currentGroupId: null }),
}));
