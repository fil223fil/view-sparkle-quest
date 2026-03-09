import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

// Maps query keywords to relevant widget IDs
const QUERY_WIDGET_MAP: Record<string, string[]> = {
  // Weather & location
  погод: ['weather', 'maps', 'calendar', 'siri', 'lmm-core'],
  weather: ['weather', 'maps', 'calendar', 'siri', 'lmm-core'],
  карт: ['maps', 'weather', 'findmy', 'siri', 'lmm-core'],
  навигац: ['maps', 'siri', 'lmm-core'],
  // Calendar & productivity
  календар: ['calendar', 'tasks', 'reminders', 'mail', 'lmm-core'],
  событи: ['calendar', 'tasks', 'reminders', 'lmm-core'],
  встреч: ['calendar', 'messages', 'facetime', 'lmm-core'],
  задач: ['tasks', 'calendar', 'shortcuts', 'lmm-core'],
  заметк: ['notes', 'memory-bank', 'freeform', 'lmm-core'],
  напомин: ['reminders', 'calendar', 'siri', 'lmm-core'],
  файл: ['files', 'memory-bank', 'notes', 'lmm-core'],
  автоматиз: ['shortcuts', 'siri', 'homekit', 'lmm-core'],
  // Communication
  сообщен: ['messages', 'mail', 'contacts', 'lmm-core'],
  почт: ['mail', 'messages', 'contacts', 'lmm-core'],
  звон: ['phone', 'facetime', 'contacts', 'lmm-core'],
  видеозвон: ['facetime', 'messages', 'contacts', 'lmm-core'],
  контакт: ['contacts', 'messages', 'phone', 'lmm-core'],
  // Media
  фото: ['photos', 'camera', 'neural-engine', 'memory-bank', 'lmm-core'],
  камер: ['camera', 'photos', 'neural-engine', 'lmm-core'],
  музык: ['music', 'podcasts', 'siri', 'lmm-core'],
  music: ['music', 'podcasts', 'siri', 'lmm-core'],
  подкаст: ['podcasts', 'music', 'lmm-core'],
  фильм: ['tv', 'music', 'lmm-core'],
  видео: ['tv', 'camera', 'photos', 'lmm-core'],
  книг: ['books', 'notes', 'lmm-core'],
  новост: ['news', 'siri', 'safari', 'lmm-core'],
  // Health & Fitness
  шаг: ['health', 'fitness', 'siri', 'lmm-core'],
  активност: ['fitness', 'health', 'siri', 'lmm-core'],
  здоров: ['health', 'fitness', 'siri', 'lmm-core'],
  health: ['health', 'fitness', 'siri', 'lmm-core'],
  трениров: ['fitness', 'health', 'music', 'lmm-core'],
  // Utilities
  оплат: ['wallet', 'safari', 'lmm-core'],
  'apple pay': ['wallet', 'safari', 'lmm-core'],
  дом: ['homekit', 'siri', 'shortcuts', 'lmm-core'],
  умный: ['homekit', 'siri', 'shortcuts', 'lmm-core'],
  браузер: ['safari', 'lmm-core', 'translate'],
  поиск: ['safari', 'lmm-core', 'siri'],
  перевод: ['translate', 'siri', 'safari', 'lmm-core'],
  найти: ['findmy', 'maps', 'lmm-core'],
  airtag: ['findmy', 'maps', 'lmm-core'],
  приложен: ['appstore', 'lmm-core'],
  // AI & System
  памят: ['memory-bank', 'notes', 'files', 'lmm-core'],
  мозг: ['lmm-core', 'neural-engine', 'siri'],
  анализ: ['neural-engine', 'lmm-core', 'siri'],
  интеллект: ['lmm-core', 'neural-engine', 'siri'],
  настройк: ['processing-queue', 'lmm-core'],
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
