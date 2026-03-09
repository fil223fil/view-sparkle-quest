import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  addMessage: (msg: ChatMessage) => void;
  setProcessing: (val: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isProcessing: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setProcessing: (val) => set({ isProcessing: val }),
  clearMessages: () => set({ messages: [] }),
}));
