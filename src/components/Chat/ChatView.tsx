import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Mic, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { simulateAIResponse } from '@/services/glmChatService';
import { ProcessIndicator } from './ProcessIndicator';
import { WidgetDisplay } from './Widgets';
import type { ChatMessage } from '@/types/chat';

export const ChatView: React.FC = () => {
  const { messages, isProcessing, addMessage, setProcessing } = useChatStore();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Ядро Ленин</h1>
          <p className="text-xs text-muted-foreground">AI-ассистент</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Добро пожаловать!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Спросите о погоде, календаре или активности, чтобы увидеть процесс мышления AI.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {['Какая погода?', 'Мои события', 'Сколько шагов?'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInputText(q); }}
                  className="rounded-full border px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-2 py-3"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Думаю...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2 rounded-2xl border bg-card px-3 py-2">
          <button className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <Mic className="h-5 w-5" />
          </button>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спроси что-нибудь..."
            disabled={isProcessing}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="rounded-full bg-primary p-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {!isUser && message.hasProcessData && (
          <ProcessIndicator
            steps={message.processSteps}
            thinkingChain={message.thinkingChain}
            functions={message.usedFunctions}
            data={message.usedData}
          />
        )}
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {!isUser && message.widget && <WidgetDisplay widget={message.widget} />}
      </div>
    </motion.div>
  );
};
