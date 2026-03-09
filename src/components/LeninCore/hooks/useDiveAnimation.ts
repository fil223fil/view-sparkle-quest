// Dive Animation Hook - Zoom-in with morph transition
import { useState, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WidgetData, DepthLevel } from '../types';

export type MorphPhase = 'idle' | 'expanding' | 'expanded' | 'collapsing';

export interface DiveState {
  isDiving: boolean;
  divedWidgetId: string | null;
  targetPosition: THREE.Vector3;
  zoomLevel: number;
  subWidgets: WidgetData[];
  morphPhase: MorphPhase;
  morphProgress: number; // 0-1
}

const generateSubWidgets = (parent: WidgetData): WidgetData[] => {
  const subWidgetTemplates: Record<string, Array<{ icon: string; title: string; subtitle: string }>> = {
    'lmm-core': [
      { icon: '🎯', title: 'Attention', subtitle: 'Механизм внимания' },
      { icon: '🔄', title: 'Transformer', subtitle: 'Трансформер блоки' },
      { icon: '📊', title: 'Embeddings', subtitle: 'Векторные представления' },
      { icon: '⚡', title: 'Inference', subtitle: 'Вывод модели' },
    ],
    'memory-bank': [
      { icon: '📚', title: 'Long-term', subtitle: 'Долгосрочная память' },
      { icon: '💭', title: 'Working', subtitle: 'Рабочая память' },
      { icon: '🔍', title: 'Retrieval', subtitle: 'Поиск по памяти' },
    ],
    'neural-engine': [
      { icon: '🌊', title: 'Perception', subtitle: 'Слой восприятия' },
      { icon: '🤔', title: 'Reasoning', subtitle: 'Слой рассуждений' },
      { icon: '💬', title: 'Response', subtitle: 'Слой ответа' },
    ],
    'processing-queue': [
      { icon: '📥', title: 'Input Queue', subtitle: 'Входящие задачи' },
      { icon: '⚙️', title: 'Processing', subtitle: 'В обработке' },
      { icon: '📤', title: 'Output Queue', subtitle: 'Готовые результаты' },
    ],
  };

  const templates = subWidgetTemplates[parent.id] || [
    { icon: '📄', title: 'Детали', subtitle: 'Подробная информация' },
    { icon: '⚙️', title: 'Настройки', subtitle: 'Параметры виджета' },
    { icon: '📊', title: 'Аналитика', subtitle: 'Статистика' },
  ];

  const angleStep = (Math.PI * 2) / templates.length;
  const radius = 150;

  return templates.map((template, index) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      id: `sub-${parent.id}-${index}`,
      icon: template.icon,
      title: template.title,
      subtitle: template.subtitle,
      priority: 'medium' as const,
      category: parent.category,
      size: 'small' as const,
      infoLoad: Math.floor(Math.random() * 60) + 20,
      connects: [parent.id],
      miniWidgets: [],
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0,
      },
    };
  });
};

export const useDiveAnimation = (
  widgets: WidgetData[],
  onDepthChange: (level: DepthLevel) => void
) => {
  const [diveState, setDiveState] = useState<DiveState>({
    isDiving: false,
    divedWidgetId: null,
    targetPosition: new THREE.Vector3(0, 0, 0),
    zoomLevel: 1,
    subWidgets: [],
    morphPhase: 'idle',
    morphProgress: 0,
  });

  const animationRef = useRef<number | null>(null);
  const morphRef = useRef<number | null>(null);
  const { camera } = useThree();

  const handleDoubleTap = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    if (diveState.divedWidgetId === widgetId) {
      handleSurface();
      return;
    }

    const targetPos = new THREE.Vector3(
      widget.position.x / 100,
      -widget.position.y / 100,
      widget.position.z / 50
    );

    const subWidgets = generateSubWidgets(widget);

    // Phase 1: Start morph expansion
    setDiveState({
      isDiving: true,
      divedWidgetId: widgetId,
      targetPosition: targetPos,
      zoomLevel: 2.5,
      subWidgets,
      morphPhase: 'expanding',
      morphProgress: 0,
    });

    onDepthChange('detail');

    // Animate morph progress 0 → 1
    const morphStart = performance.now();
    const morphDuration = 600;

    const animateMorph = (now: number) => {
      const elapsed = now - morphStart;
      const t = Math.min(elapsed / morphDuration, 1);
      // Spring-like easing
      const eased = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5);

      setDiveState(prev => ({ ...prev, morphProgress: eased }));

      if (t < 1) {
        morphRef.current = requestAnimationFrame(animateMorph);
      } else {
        setDiveState(prev => ({ ...prev, morphPhase: 'expanded', morphProgress: 1 }));
      }
    };

    if (morphRef.current) cancelAnimationFrame(morphRef.current);
    morphRef.current = requestAnimationFrame(animateMorph);

    // Camera zoom
    const startPos = camera.position.clone();
    const endPos = targetPos.clone().add(new THREE.Vector3(0, 0, 4));
    const startTime = performance.now();
    const duration = 800;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPos, endPos, eased);
      camera.lookAt(targetPos);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [widgets, diveState.divedWidgetId, camera, onDepthChange]);

  const handleSurface = useCallback(() => {
    // Phase: collapsing
    setDiveState(prev => ({ ...prev, morphPhase: 'collapsing', morphProgress: 1 }));

    const morphStart = performance.now();
    const morphDuration = 400;

    const animateMorph = (now: number) => {
      const elapsed = now - morphStart;
      const t = Math.min(elapsed / morphDuration, 1);
      const eased = 1 - t;

      setDiveState(prev => ({ ...prev, morphProgress: eased }));

      if (t < 1) {
        morphRef.current = requestAnimationFrame(animateMorph);
      }
    };

    if (morphRef.current) cancelAnimationFrame(morphRef.current);
    morphRef.current = requestAnimationFrame(animateMorph);

    // Camera zoom out
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(0, 0, 10);
    const startTime = performance.now();
    const duration = 600;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPos, endPos, eased);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDiveState({
          isDiving: false,
          divedWidgetId: null,
          targetPosition: new THREE.Vector3(0, 0, 0),
          zoomLevel: 1,
          subWidgets: [],
          morphPhase: 'idle',
          morphProgress: 0,
        });
        onDepthChange('active');
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [camera, onDepthChange]);

  return {
    diveState,
    handleDoubleTap,
    handleSurface,
    isDived: diveState.divedWidgetId !== null,
  };
};
