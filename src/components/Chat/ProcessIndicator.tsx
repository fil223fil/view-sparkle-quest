import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, X, Code, Database, GitBranch } from 'lucide-react';
import type { ProcessStep, ThinkingStep, FunctionCall, DataReference } from '@/types/chat';

interface Props {
  steps?: ProcessStep[];
  thinkingChain?: ThinkingStep[];
  functions?: FunctionCall[];
  data?: DataReference[];
}

export const ProcessIndicator: React.FC<Props> = ({ steps, thinkingChain, functions, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['Мышление', 'Функции', 'Данные', 'Граф'];

  return (
    <>
      {/* Compact */}
      <div
        onClick={() => setIsExpanded(true)}
        className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg bg-muted/50 p-2 transition hover:bg-muted/70"
      >
        <Brain className="h-4 w-4 text-[hsl(var(--apple-purple))]" />
        <span className="text-xs text-muted-foreground">
          {steps?.length ?? 0} шагов • {functions?.length ?? 0} функций
        </span>
        <ChevronDown className="ml-auto h-3 w-3 text-muted-foreground" />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="text-lg font-semibold text-foreground">Процесс мышления</h3>
                <button onClick={() => setIsExpanded(false)} className="rounded-full p-1 hover:bg-muted">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                {tabs.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 py-3 text-sm transition ${
                      activeTab === i
                        ? 'border-b-2 border-[hsl(var(--apple-purple))] text-[hsl(var(--apple-purple))]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 0 && <ThinkingView steps={thinkingChain} />}
                {activeTab === 1 && <FunctionsView functions={functions} />}
                {activeTab === 2 && <DataView data={data} />}
                {activeTab === 3 && <GraphView steps={steps} />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ThinkingView: React.FC<{ steps?: ThinkingStep[] }> = ({ steps }) => (
  <div className="space-y-3">
    {steps?.map((step, index) => (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex gap-3"
      >
        <div
          className={`mt-2 h-2 w-2 rounded-full ${
            step.status === 'complete'
              ? 'bg-[hsl(var(--apple-teal))]'
              : step.status === 'active'
              ? 'animate-pulse bg-[hsl(var(--apple-orange))]'
              : 'bg-muted-foreground'
          }`}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{step.title}</p>
          <p className="text-xs text-muted-foreground">{step.description}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {step.timestamp.toLocaleTimeString()}
        </span>
      </motion.div>
    ))}
  </div>
);

const FunctionsView: React.FC<{ functions?: FunctionCall[] }> = ({ functions }) => (
  <div className="space-y-2">
    {functions?.map((func, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="rounded-lg bg-muted p-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-primary">{func.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{func.duration}ms</span>
        </div>
        <div className="mb-1 text-xs text-muted-foreground">via {func.service}</div>
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Параметры</summary>
          <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-foreground">
            {JSON.stringify(func.parameters, null, 2)}
          </pre>
        </details>
        {func.result && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-[hsl(var(--apple-teal))]">Результат</summary>
            <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-foreground">
              {JSON.stringify(func.result, null, 2)}
            </pre>
          </details>
        )}
      </motion.div>
    ))}
  </div>
);

const DataView: React.FC<{ data?: DataReference[] }> = ({ data }) => (
  <div className="space-y-2">
    {data?.map((d, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="rounded-lg bg-muted p-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-[hsl(var(--apple-teal))]" />
          <span className="text-sm font-medium text-foreground">{d.type}</span>
          <span className="ml-auto text-xs text-muted-foreground">{d.source}</span>
        </div>
        <pre className="overflow-x-auto rounded bg-background p-2 text-xs text-foreground">
          {JSON.stringify(d.content, null, 2)}
        </pre>
      </motion.div>
    ))}
    {(!data || data.length === 0) && (
      <p className="text-center text-sm text-muted-foreground">Нет данных</p>
    )}
  </div>
);

const GraphView: React.FC<{ steps?: ProcessStep[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) return <p className="text-center text-sm text-muted-foreground">Нет шагов</p>;

  const w = 360;
  const h = 200;
  const nodeR = 18;
  const gap = w / (steps.length + 1);

  return (
    <div className="flex justify-center">
      <svg width={w} height={h} className="overflow-visible">
        {/* Edges */}
        {steps.slice(0, -1).map((_, i) => (
          <line
            key={`e-${i}`}
            x1={gap * (i + 1)}
            y1={h / 2}
            x2={gap * (i + 2)}
            y2={h / 2}
            stroke="hsl(var(--border))"
            strokeWidth={2}
          />
        ))}
        {/* Nodes */}
        {steps.map((step, i) => {
          const cx = gap * (i + 1);
          const cy = h / 2;
          const colors: Record<string, string> = {
            complete: 'hsl(var(--apple-teal))',
            active: 'hsl(var(--apple-orange))',
            error: 'hsl(var(--destructive))',
            pending: 'hsl(var(--muted-foreground))',
          };
          return (
            <g key={step.id}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={nodeR}
                fill={colors[step.status] || colors.pending}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 }}
              />
              <text x={cx} y={cy + nodeR + 16} textAnchor="middle" className="text-[10px]" fill="hsl(var(--muted-foreground))">
                {step.title}
              </text>
              <text x={cx} y={cy + 4} textAnchor="middle" className="text-[10px] font-bold" fill="hsl(var(--foreground))">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
