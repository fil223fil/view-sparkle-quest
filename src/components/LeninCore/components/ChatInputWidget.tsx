import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Brain } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { simulateAIResponse } from '@/services/glmChatService';
import type { ChatMessage } from '@/types/chat';

export const ChatInputWidget: React.FC = () => {
  const { messages, isProcessing, addMessage, setProcessing } = useChatStore();
  const [inputText, setInputText] = useState('');

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    addMessage(userMsg);
    setInputText('');
    setProcessing(true);

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

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 w-full max-w-2xl px-4">
      {/* Last AI response floating above input */}
      <AnimatePresence>
        {lastAssistantMsg && (
          <motion.div
            key={lastAssistantMsg.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-3 rounded-2xl px-5 py-4 text-sm"
            style={{
              background: 'rgba(15, 15, 25, 0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(88, 196, 221, 0.08)',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {lastAssistantMsg.hasProcessData && lastAssistantMsg.processSteps && (
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <div className="flex gap-1">
                  {lastAssistantMsg.processSteps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: step.status === 'complete' ? '#00D4AA' : step.status === 'active' ? '#FF9F0A' : '#666',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/40">
                  {lastAssistantMsg.processSteps.length} шагов • {lastAssistantMsg.usedFunctions?.length ?? 0} функций
                </span>
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{lastAssistantMsg.content}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 flex items-center gap-3 rounded-2xl px-5 py-3"
            style={{
              background: 'rgba(15, 15, 25, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#58C4DD' }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-white/50">Анализирую связи...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions when empty */}
      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {['Какая погода?', 'Мои события', 'Сколько шагов?'].map((q) => (
            <button
              key={q}
              onClick={() => setInputText(q)}
              className="rounded-full px-3 py-1.5 text-xs transition"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(15, 15, 25, 0.7)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 80px rgba(88, 196, 221, 0.06)',
        }}
      >
        <button
          className="rounded-full p-2 transition"
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        >
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спроси что-нибудь..."
          disabled={isProcessing}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || isProcessing}
          className="rounded-full p-2 transition disabled:opacity-30"
          style={{
            background: inputText.trim() ? 'rgba(88, 196, 221, 0.8)' : 'rgba(88, 196, 221, 0.3)',
            color: '#fff',
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
