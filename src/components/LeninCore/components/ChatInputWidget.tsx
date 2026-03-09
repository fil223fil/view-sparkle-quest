import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Brain } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useChatStore } from '@/store/useChatStore';
import { simulateAIResponse } from '@/services/glmChatService';
import type { ChatMessage } from '@/types/chat';

export const ChatInputWidget: React.FC = () => {
  const { messages, isProcessing, addMessage, setProcessing } = useChatStore();
  const [inputText, setInputText] = useState('');
  const activateQueryGroup = useChatStore((s) => s.activateQueryGroup);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    addMessage(userMsg);
    setInputText('');
    setProcessing(true);
    activateQueryGroup(text);

    const aiResponse = await simulateAIResponse(text);
    addMessage(aiResponse);
    setProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Glass styles
  const glassInput: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.4) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.5)',
    boxShadow: isDark
      ? '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)'
      : '0 12px 40px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.6)',
  };

  const glassPill: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(180deg, rgba(40, 40, 50, 0.6) 0%, rgba(20, 20, 25, 0.4) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.5)',
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.06)'
      : '0 8px 32px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.6)',
  };

  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 w-full max-w-2xl px-4">
      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-3 rounded-full px-5 py-3 mx-auto w-fit"
            style={glassPill}
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#007AFF' }}
                  animate={{ y: [0, -6, 0], scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </div>
            <span className="text-sm font-semibold tracking-wide" style={{ color: textColor }}>Анализирую...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions when empty */}
      {messages.length === 0 && (
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {['Какая погода?', 'Мои события', 'Сколько шагов?'].map((q) => (
            <button
              key={q}
              onClick={() => setInputText(q)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                ...glassPill,
                color: textColor,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-3 rounded-[2rem] px-5 py-3.5 w-full mx-auto transition-all duration-300" style={glassInput}>
        <button className="rounded-full p-2.5 transition-all hover:scale-110 active:scale-95" style={{ color: mutedColor }}>
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спроси что-нибудь..."
          disabled={isProcessing}
          className="flex-1 bg-transparent text-base font-medium focus:outline-none"
          style={{ color: textColor, caretColor: '#007AFF' }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || isProcessing}
          className="rounded-full p-3 transition-all disabled:opacity-30 active:scale-95 hover:shadow-lg"
          style={{
            background: inputText.trim() ? '#007AFF' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
            color: inputText.trim() ? '#FFFFFF' : mutedColor,
          }}
        >
          <Send className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
