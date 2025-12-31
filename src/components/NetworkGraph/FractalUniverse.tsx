import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line, RoundedBox, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface UniverseNode {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
}

interface UniverseEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
  processName: string;
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Полная анатомическая карта мозга с обоими полушариями
const BRAIN_ANATOMY = {
  // ========== ЛЕВОЕ ПОЛУШАРИЕ ==========
  // Лобная доля
  prefrontal_left: {
    name: 'Префронтальная кора (Л)',
    shortName: 'Планирование',
    position: [-0.22, 0.32, 0.3] as [number, number, number],
    color: '#FF6B9D',
    size: 0.055,
    hemisphere: 'left',
  },
  dorsolateral_left: {
    name: 'Дорсолатеральная ПФК (Л)',
    shortName: 'Рабочая память',
    position: [-0.28, 0.28, 0.22] as [number, number, number],
    color: '#FF8FAB',
    size: 0.045,
    hemisphere: 'left',
  },
  frontal_left: {
    name: 'Лобная доля (Л)',
    shortName: 'Решения',
    position: [-0.25, 0.22, 0.18] as [number, number, number],
    color: '#FF8FAB',
    size: 0.06,
    hemisphere: 'left',
  },
  motor_left: {
    name: 'Моторная кора (Л)',
    shortName: 'Движение П',
    position: [-0.2, 0.32, 0.02] as [number, number, number],
    color: '#E74C3C',
    size: 0.045,
    hemisphere: 'left',
  },
  premotor_left: {
    name: 'Премоторная кора (Л)',
    shortName: 'Подготовка',
    position: [-0.24, 0.3, 0.08] as [number, number, number],
    color: '#C0392B',
    size: 0.04,
    hemisphere: 'left',
  },
  broca: {
    name: 'Зона Брока',
    shortName: 'Речь',
    position: [-0.32, 0.12, 0.15] as [number, number, number],
    color: '#9B59B6',
    size: 0.04,
    hemisphere: 'left',
  },

  // Теменная доля
  parietal_left: {
    name: 'Теменная доля (Л)',
    shortName: 'Интеграция',
    position: [-0.18, 0.28, -0.1] as [number, number, number],
    color: '#58C4DD',
    size: 0.055,
    hemisphere: 'left',
  },
  somatosensory_left: {
    name: 'Соматосенсорная кора (Л)',
    shortName: 'Ощущения П',
    position: [-0.18, 0.32, -0.02] as [number, number, number],
    color: '#3498DB',
    size: 0.04,
    hemisphere: 'left',
  },
  angular_left: {
    name: 'Угловая извилина (Л)',
    shortName: 'Чтение',
    position: [-0.22, 0.2, -0.18] as [number, number, number],
    color: '#5DADE2',
    size: 0.035,
    hemisphere: 'left',
  },

  // Височная доля
  temporal_left: {
    name: 'Височная доля (Л)',
    shortName: 'Слух',
    position: [-0.35, 0.02, 0.08] as [number, number, number],
    color: '#9B59B6',
    size: 0.06,
    hemisphere: 'left',
  },
  wernicke: {
    name: 'Зона Вернике',
    shortName: 'Понимание',
    position: [-0.3, 0.08, -0.05] as [number, number, number],
    color: '#8E44AD',
    size: 0.04,
    hemisphere: 'left',
  },
  auditory_left: {
    name: 'Слуховая кора (Л)',
    shortName: 'Слух обраб.',
    position: [-0.33, 0.08, 0.02] as [number, number, number],
    color: '#AF7AC5',
    size: 0.035,
    hemisphere: 'left',
  },

  // Затылочная доля
  occipital_left: {
    name: 'Затылочная доля (Л)',
    shortName: 'Зрение',
    position: [-0.12, 0.15, -0.32] as [number, number, number],
    color: '#2ECC71',
    size: 0.055,
    hemisphere: 'left',
  },
  visual_primary_left: {
    name: 'Первичная зрит. кора (Л)',
    shortName: 'V1',
    position: [-0.08, 0.1, -0.35] as [number, number, number],
    color: '#27AE60',
    size: 0.04,
    hemisphere: 'left',
  },

  // ========== ПРАВОЕ ПОЛУШАРИЕ ==========
  // Лобная доля
  prefrontal_right: {
    name: 'Префронтальная кора (П)',
    shortName: 'Самоконтроль',
    position: [0.22, 0.32, 0.3] as [number, number, number],
    color: '#FF6B9D',
    size: 0.055,
    hemisphere: 'right',
  },
  dorsolateral_right: {
    name: 'Дорсолатеральная ПФК (П)',
    shortName: 'Внимание',
    position: [0.28, 0.28, 0.22] as [number, number, number],
    color: '#FF8FAB',
    size: 0.045,
    hemisphere: 'right',
  },
  frontal_right: {
    name: 'Лобная доля (П)',
    shortName: 'Эмпатия',
    position: [0.25, 0.22, 0.18] as [number, number, number],
    color: '#FF8FAB',
    size: 0.06,
    hemisphere: 'right',
  },
  motor_right: {
    name: 'Моторная кора (П)',
    shortName: 'Движение Л',
    position: [0.2, 0.32, 0.02] as [number, number, number],
    color: '#E74C3C',
    size: 0.045,
    hemisphere: 'right',
  },
  premotor_right: {
    name: 'Премоторная кора (П)',
    shortName: 'Имитация',
    position: [0.24, 0.3, 0.08] as [number, number, number],
    color: '#C0392B',
    size: 0.04,
    hemisphere: 'right',
  },

  // Теменная доля
  parietal_right: {
    name: 'Теменная доля (П)',
    shortName: 'Пространство',
    position: [0.18, 0.28, -0.1] as [number, number, number],
    color: '#58C4DD',
    size: 0.055,
    hemisphere: 'right',
  },
  somatosensory_right: {
    name: 'Соматосенсорная кора (П)',
    shortName: 'Ощущения Л',
    position: [0.18, 0.32, -0.02] as [number, number, number],
    color: '#3498DB',
    size: 0.04,
    hemisphere: 'right',
  },
  angular_right: {
    name: 'Угловая извилина (П)',
    shortName: 'Метафоры',
    position: [0.22, 0.2, -0.18] as [number, number, number],
    color: '#5DADE2',
    size: 0.035,
    hemisphere: 'right',
  },

  // Височная доля
  temporal_right: {
    name: 'Височная доля (П)',
    shortName: 'Музыка',
    position: [0.35, 0.02, 0.08] as [number, number, number],
    color: '#E91E63',
    size: 0.06,
    hemisphere: 'right',
  },
  fusiform_right: {
    name: 'Веретенов. извилина (П)',
    shortName: 'Лица',
    position: [0.3, -0.02, 0.02] as [number, number, number],
    color: '#F06292',
    size: 0.04,
    hemisphere: 'right',
  },
  auditory_right: {
    name: 'Слуховая кора (П)',
    shortName: 'Тональность',
    position: [0.33, 0.08, 0.02] as [number, number, number],
    color: '#CE93D8',
    size: 0.035,
    hemisphere: 'right',
  },

  // Затылочная доля
  occipital_right: {
    name: 'Затылочная доля (П)',
    shortName: 'Образы',
    position: [0.12, 0.15, -0.32] as [number, number, number],
    color: '#2ECC71',
    size: 0.055,
    hemisphere: 'right',
  },
  visual_primary_right: {
    name: 'Первичная зрит. кора (П)',
    shortName: 'V1',
    position: [0.08, 0.1, -0.35] as [number, number, number],
    color: '#27AE60',
    size: 0.04,
    hemisphere: 'right',
  },

  // ========== ЦЕНТРАЛЬНЫЕ СТРУКТУРЫ ==========
  corpus_callosum: {
    name: 'Мозолистое тело',
    shortName: 'Связь полушарий',
    position: [0, 0.2, 0] as [number, number, number],
    color: '#F39C12',
    size: 0.08,
    hemisphere: 'center',
  },
  anterior_cingulate: {
    name: 'Передняя поясная кора',
    shortName: 'Конфликты',
    position: [0, 0.28, 0.12] as [number, number, number],
    color: '#E67E22',
    size: 0.04,
    hemisphere: 'center',
  },
  posterior_cingulate: {
    name: 'Задняя поясная кора',
    shortName: 'Самосознание',
    position: [0, 0.22, -0.08] as [number, number, number],
    color: '#D35400',
    size: 0.035,
    hemisphere: 'center',
  },
  thalamus: {
    name: 'Таламус',
    shortName: 'Ретрансляция',
    position: [0, 0.1, 0.02] as [number, number, number],
    color: '#3498DB',
    size: 0.05,
    hemisphere: 'center',
  },
  hippocampus_left: {
    name: 'Гиппокамп (Л)',
    shortName: 'Память Л',
    position: [-0.1, 0.02, 0.06] as [number, number, number],
    color: '#1ABC9C',
    size: 0.035,
    hemisphere: 'left',
  },
  hippocampus_right: {
    name: 'Гиппокамп (П)',
    shortName: 'Память П',
    position: [0.1, 0.02, 0.06] as [number, number, number],
    color: '#16A085',
    size: 0.035,
    hemisphere: 'right',
  },
  amygdala_left: {
    name: 'Амигдала (Л)',
    shortName: 'Страх Л',
    position: [-0.12, -0.02, 0.1] as [number, number, number],
    color: '#E74C3C',
    size: 0.03,
    hemisphere: 'left',
  },
  amygdala_right: {
    name: 'Амигдала (П)',
    shortName: 'Эмоции П',
    position: [0.12, -0.02, 0.1] as [number, number, number],
    color: '#C0392B',
    size: 0.03,
    hemisphere: 'right',
  },
  hypothalamus: {
    name: 'Гипоталамус',
    shortName: 'Гомеостаз',
    position: [0, -0.02, 0.12] as [number, number, number],
    color: '#9B59B6',
    size: 0.035,
    hemisphere: 'center',
  },
  basal_ganglia: {
    name: 'Базальные ганглии',
    shortName: 'Привычки',
    position: [0, 0.08, 0.08] as [number, number, number],
    color: '#34495E',
    size: 0.04,
    hemisphere: 'center',
  },
  insula_left: {
    name: 'Островок (Л)',
    shortName: 'Интероцепция',
    position: [-0.22, 0.08, 0.1] as [number, number, number],
    color: '#E91E63',
    size: 0.035,
    hemisphere: 'left',
  },
  insula_right: {
    name: 'Островок (П)',
    shortName: 'Эмпатия тела',
    position: [0.22, 0.08, 0.1] as [number, number, number],
    color: '#C2185B',
    size: 0.035,
    hemisphere: 'right',
  },
  brainstem: {
    name: 'Ствол мозга',
    shortName: 'Жизнь',
    position: [0, -0.12, -0.02] as [number, number, number],
    color: '#34495E',
    size: 0.05,
    hemisphere: 'center',
  },
  cerebellum_left: {
    name: 'Мозжечок (Л)',
    shortName: 'Баланс Л',
    position: [-0.12, -0.08, -0.22] as [number, number, number],
    color: '#F39C12',
    size: 0.06,
    hemisphere: 'left',
  },
  cerebellum_right: {
    name: 'Мозжечок (П)',
    shortName: 'Баланс П',
    position: [0.12, -0.08, -0.22] as [number, number, number],
    color: '#E67E22',
    size: 0.06,
    hemisphere: 'right',
  },
  vermis: {
    name: 'Червь мозжечка',
    shortName: 'Координация',
    position: [0, -0.1, -0.25] as [number, number, number],
    color: '#D35400',
    size: 0.04,
    hemisphere: 'center',
  },
};

// Приоритеты для виджетов (влияют на размер)
type Priority = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_SCALES = {
  critical: 1.35,
  high: 1.15,
  medium: 1.0,
  low: 0.85,
};

// Иконки для хлебных крошек (процессы)
const BREADCRUMB_ICONS = ['◉', '⚡', '🎯', '🔬', '∞'];

// Расширенная карта виджетов с цепями взаимосвязей и приоритетами
const COGNITIVE_WIDGETS = {
  basic: [
    { id: 'think', icon: '💭', title: 'Мысль', subtitle: 'Когнитив', zone: 'prefrontal_left', 
      connects: ['decide', 'analyze', 'memory'], chain: 'executive', priority: 'critical' as Priority, infoLoad: 0.85 },
    { id: 'decide', icon: '🎯', title: 'Решение', subtitle: 'Выбор', zone: 'frontal_left', 
      connects: ['action', 'plan'], chain: 'executive', priority: 'critical' as Priority, infoLoad: 0.92 },
    { id: 'analyze', icon: '🔍', title: 'Анализ', subtitle: 'Данные', zone: 'parietal_left', 
      connects: ['memory', 'pattern'], chain: 'cognitive', priority: 'high' as Priority, infoLoad: 0.78 },
    { id: 'action', icon: '⚡', title: 'Действие', subtitle: 'Мотор', zone: 'motor_left', 
      connects: ['feedback', 'coord'], chain: 'motor', priority: 'high' as Priority, infoLoad: 0.65 },
    { id: 'speak', icon: '🗣️', title: 'Речь', subtitle: 'Брока', zone: 'broca', 
      connects: ['think', 'understand'], chain: 'language', priority: 'high' as Priority, infoLoad: 0.72 },
    { id: 'see', icon: '👁️', title: 'Зрение', subtitle: 'V1', zone: 'occipital_left', 
      connects: ['recognize', 'space'], chain: 'visual', priority: 'medium' as Priority, infoLoad: 0.88 },
    { id: 'feel', icon: '❤️', title: 'Эмоция', subtitle: 'Амигдала', zone: 'amygdala_left', 
      connects: ['memory', 'decide', 'body'], chain: 'limbic', priority: 'high' as Priority, infoLoad: 0.55 },
    { id: 'memory', icon: '📚', title: 'Память', subtitle: 'Гиппокамп', zone: 'hippocampus_left', 
      connects: ['learn', 'recall'], chain: 'memory', priority: 'critical' as Priority, infoLoad: 0.95 },
    { id: 'hear', icon: '👂', title: 'Слух', subtitle: 'Аудио', zone: 'auditory_left', 
      connects: ['speak', 'music'], chain: 'auditory', priority: 'medium' as Priority, infoLoad: 0.62 },
    { id: 'body', icon: '🫀', title: 'Тело', subtitle: 'Интероцепция', zone: 'insula_left', 
      connects: ['feel', 'regulate'], chain: 'interoception', priority: 'low' as Priority, infoLoad: 0.48 },
  ],
  advanced: [
    { id: 'plan', icon: '📋', title: 'План', subtitle: 'Стратегия', zone: 'prefrontal_right', 
      connects: ['goal', 'sequence', 'monitor'], chain: 'executive', priority: 'critical' as Priority, infoLoad: 0.88 },
    { id: 'focus', icon: '🎯', title: 'Внимание', subtitle: 'Фокус', zone: 'dorsolateral_right', 
      connects: ['filter', 'priority'], chain: 'attention', priority: 'critical' as Priority, infoLoad: 0.82 },
    { id: 'create', icon: '✨', title: 'Творчество', subtitle: 'Идеи', zone: 'temporal_right', 
      connects: ['imagine', 'combine'], chain: 'creative', priority: 'high' as Priority, infoLoad: 0.68 },
    { id: 'space', icon: '🗺️', title: 'Простр.', subtitle: 'Навигация', zone: 'parietal_right', 
      connects: ['navigate', 'map'], chain: 'spatial', priority: 'medium' as Priority, infoLoad: 0.75 },
    { id: 'faces', icon: '😊', title: 'Лица', subtitle: 'Узнавание', zone: 'fusiform_right', 
      connects: ['social', 'emotion'], chain: 'social', priority: 'medium' as Priority, infoLoad: 0.58 },
    { id: 'music', icon: '🎵', title: 'Музыка', subtitle: 'Мелодия', zone: 'auditory_right', 
      connects: ['rhythm', 'emotion'], chain: 'auditory', priority: 'low' as Priority, infoLoad: 0.45 },
    { id: 'coord', icon: '🤝', title: 'Коорд.', subtitle: 'Синхрон', zone: 'motor_right', 
      connects: ['timing', 'balance'], chain: 'motor', priority: 'medium' as Priority, infoLoad: 0.52 },
    { id: 'balance', icon: '⚖️', title: 'Баланс', subtitle: 'Равновесие', zone: 'cerebellum_right', 
      connects: ['posture', 'move'], chain: 'cerebellar', priority: 'low' as Priority, infoLoad: 0.38 },
    { id: 'empathy', icon: '💕', title: 'Эмпатия', subtitle: 'Понимание', zone: 'insula_right', 
      connects: ['social', 'feel'], chain: 'social', priority: 'high' as Priority, infoLoad: 0.72 },
    { id: 'monitor', icon: '🔔', title: 'Контроль', subtitle: 'Ошибки', zone: 'anterior_cingulate', 
      connects: ['focus', 'decide'], chain: 'executive', priority: 'high' as Priority, infoLoad: 0.78 },
  ],
  integration: [
    { id: 'integrate', icon: '🔗', title: 'Интегр.', subtitle: 'Связь', zone: 'corpus_callosum', 
      connects: ['left', 'right', 'sync'], chain: 'integration', priority: 'critical' as Priority, infoLoad: 0.98 },
    { id: 'self', icon: '🌟', title: 'Я', subtitle: 'Сознание', zone: 'posterior_cingulate', 
      connects: ['reflect', 'narrative'], chain: 'default', priority: 'critical' as Priority, infoLoad: 0.90 },
    { id: 'regulate', icon: '🎛️', title: 'Регуляция', subtitle: 'Гомеостаз', zone: 'hypothalamus', 
      connects: ['hormone', 'state', 'stress'], chain: 'autonomic', priority: 'high' as Priority, infoLoad: 0.65 },
    { id: 'survive', icon: '💓', title: 'Жизнь', subtitle: 'Витальные', zone: 'brainstem', 
      connects: ['breathe', 'heart', 'alert'], chain: 'autonomic', priority: 'critical' as Priority, infoLoad: 1.0 },
    { id: 'habit', icon: '🔄', title: 'Привычка', subtitle: 'Автомат', zone: 'basal_ganglia', 
      connects: ['reward', 'routine'], chain: 'basal', priority: 'medium' as Priority, infoLoad: 0.55 },
    { id: 'relay', icon: '📡', title: 'Реле', subtitle: 'Сигналы', zone: 'thalamus', 
      connects: ['sense', 'cortex', 'attention'], chain: 'thalamic', priority: 'high' as Priority, infoLoad: 0.85 },
    { id: 'learn', icon: '📖', title: 'Обучение', subtitle: 'Пластичн.', zone: 'hippocampus_right', 
      connects: ['encode', 'consolidate'], chain: 'memory', priority: 'high' as Priority, infoLoad: 0.78 },
    { id: 'emotion', icon: '😢', title: 'Чувства', subtitle: 'Валентность', zone: 'amygdala_right', 
      connects: ['social', 'memory', 'fear'], chain: 'limbic', priority: 'medium' as Priority, infoLoad: 0.60 },
    { id: 'timing', icon: '⏱️', title: 'Тайминг', subtitle: 'Ритм', zone: 'cerebellum_left', 
      connects: ['sequence', 'predict'], chain: 'cerebellar', priority: 'low' as Priority, infoLoad: 0.42 },
    { id: 'understand', icon: '💡', title: 'Понимание', subtitle: 'Вернике', zone: 'wernicke', 
      connects: ['speak', 'read', 'semantic'], chain: 'language', priority: 'high' as Priority, infoLoad: 0.82 },
  ],
};

// Цепи связей виджетов (при клике выделяется вся цепь)
const WIDGET_CHAINS = {
  executive: { name: 'Исполнительная сеть', color: '#FF6B9D', description: 'Планирование, решения, контроль' },
  language: { name: 'Языковая сеть', color: '#9B59B6', description: 'Речь, понимание, семантика' },
  visual: { name: 'Зрительная сеть', color: '#2ECC71', description: 'Восприятие, распознавание' },
  motor: { name: 'Моторная сеть', color: '#E74C3C', description: 'Движение, координация' },
  limbic: { name: 'Лимбическая сеть', color: '#E91E63', description: 'Эмоции, мотивация' },
  memory: { name: 'Сеть памяти', color: '#1ABC9C', description: 'Запоминание, воспроизведение' },
  attention: { name: 'Сеть внимания', color: '#3498DB', description: 'Фокус, фильтрация' },
  default: { name: 'Сеть покоя', color: '#F39C12', description: 'Самосознание, рефлексия' },
  social: { name: 'Социальная сеть', color: '#FF69B4', description: 'Лица, эмпатия' },
  auditory: { name: 'Слуховая сеть', color: '#AF7AC5', description: 'Слух, музыка' },
  cerebellar: { name: 'Мозжечковая сеть', color: '#F39C12', description: 'Баланс, тайминг' },
  autonomic: { name: 'Автономная сеть', color: '#34495E', description: 'Жизнеобеспечение' },
  interoception: { name: 'Интероцепция', color: '#C2185B', description: 'Ощущения тела' },
  spatial: { name: 'Пространственная', color: '#58C4DD', description: 'Навигация, карты' },
  creative: { name: 'Креативная сеть', color: '#E91E63', description: 'Творчество, воображение' },
  cognitive: { name: 'Когнитивная', color: '#58C4DD', description: 'Анализ, паттерны' },
  integration: { name: 'Интеграция', color: '#F39C12', description: 'Связь полушарий' },
  thalamic: { name: 'Таламическая', color: '#3498DB', description: 'Ретрансляция сигналов' },
  basal: { name: 'Базальная', color: '#34495E', description: 'Автоматизмы, привычки' },
};

// Полная карта нейронных путей между зонами
const NEURAL_PATHWAYS_FULL = [
  // ========== ВНУТРИ ЛЕВОГО ПОЛУШАРИЯ ==========
  { from: 'prefrontal_left', to: 'dorsolateral_left', process: 'Рабочая память', color: '#FF6B9D' },
  { from: 'prefrontal_left', to: 'frontal_left', process: 'Решения', color: '#FF6B9D' },
  { from: 'frontal_left', to: 'premotor_left', process: 'Планирование движ.', color: '#E74C3C' },
  { from: 'premotor_left', to: 'motor_left', process: 'Команда', color: '#E74C3C' },
  { from: 'broca', to: 'motor_left', process: 'Артикуляция', color: '#9B59B6' },
  { from: 'broca', to: 'wernicke', process: 'Дугообразный пучок', color: '#9B59B6' },
  { from: 'wernicke', to: 'angular_left', process: 'Чтение', color: '#5DADE2' },
  { from: 'temporal_left', to: 'wernicke', process: 'Слуховой анализ', color: '#9B59B6' },
  { from: 'auditory_left', to: 'temporal_left', process: 'Слуховой вход', color: '#AF7AC5' },
  { from: 'occipital_left', to: 'visual_primary_left', process: 'Визуальный вход', color: '#2ECC71' },
  { from: 'occipital_left', to: 'parietal_left', process: 'Где? (дорсальный)', color: '#2ECC71' },
  { from: 'occipital_left', to: 'temporal_left', process: 'Что? (вентральный)', color: '#2ECC71' },
  { from: 'parietal_left', to: 'somatosensory_left', process: 'Соматотопия', color: '#3498DB' },
  { from: 'parietal_left', to: 'frontal_left', process: 'Парието-фронтальный', color: '#58C4DD' },
  { from: 'hippocampus_left', to: 'temporal_left', process: 'Консолидация', color: '#1ABC9C' },
  { from: 'hippocampus_left', to: 'prefrontal_left', process: 'Эпизодическая память', color: '#1ABC9C' },
  { from: 'amygdala_left', to: 'hippocampus_left', process: 'Эмоц. память', color: '#E74C3C' },
  { from: 'amygdala_left', to: 'prefrontal_left', process: 'Контроль страха', color: '#E74C3C' },
  { from: 'insula_left', to: 'amygdala_left', process: 'Интероцепция', color: '#E91E63' },
  { from: 'cerebellum_left', to: 'motor_left', process: 'Тонкая моторика', color: '#F39C12' },
  
  // ========== ВНУТРИ ПРАВОГО ПОЛУШАРИЯ ==========
  { from: 'prefrontal_right', to: 'dorsolateral_right', process: 'Внимание', color: '#FF6B9D' },
  { from: 'prefrontal_right', to: 'frontal_right', process: 'Социальные решения', color: '#FF6B9D' },
  { from: 'frontal_right', to: 'premotor_right', process: 'Имитация', color: '#C0392B' },
  { from: 'premotor_right', to: 'motor_right', process: 'Зеркальные нейроны', color: '#E74C3C' },
  { from: 'temporal_right', to: 'fusiform_right', process: 'Распознавание лиц', color: '#F06292' },
  { from: 'auditory_right', to: 'temporal_right', process: 'Музыкальный анализ', color: '#CE93D8' },
  { from: 'occipital_right', to: 'visual_primary_right', process: 'Визуальный вход П', color: '#2ECC71' },
  { from: 'occipital_right', to: 'parietal_right', process: 'Пространство', color: '#2ECC71' },
  { from: 'parietal_right', to: 'somatosensory_right', process: 'Телесная схема', color: '#3498DB' },
  { from: 'parietal_right', to: 'frontal_right', process: 'Пространств. внимание', color: '#58C4DD' },
  { from: 'hippocampus_right', to: 'temporal_right', process: 'Пространств. память', color: '#16A085' },
  { from: 'amygdala_right', to: 'hippocampus_right', process: 'Эмоц. контекст', color: '#C0392B' },
  { from: 'amygdala_right', to: 'fusiform_right', process: 'Эмоции в лицах', color: '#C0392B' },
  { from: 'insula_right', to: 'amygdala_right', process: 'Эмпатия тела', color: '#C2185B' },
  { from: 'cerebellum_right', to: 'motor_right', process: 'Координация Л', color: '#E67E22' },
  
  // ========== МЕЖПОЛУШАРНЫЕ СВЯЗИ ==========
  { from: 'prefrontal_left', to: 'prefrontal_right', process: 'Когнитивная интеграция', color: '#F39C12' },
  { from: 'frontal_left', to: 'frontal_right', process: 'Билат. контроль', color: '#F39C12' },
  { from: 'motor_left', to: 'motor_right', process: 'Билат. движение', color: '#F39C12' },
  { from: 'parietal_left', to: 'parietal_right', process: 'Пространств. интеграция', color: '#F39C12' },
  { from: 'temporal_left', to: 'temporal_right', process: 'Аудио интеграция', color: '#F39C12' },
  { from: 'occipital_left', to: 'occipital_right', process: 'Визуальная интеграция', color: '#F39C12' },
  { from: 'hippocampus_left', to: 'hippocampus_right', process: 'Память интеграция', color: '#F39C12' },
  { from: 'amygdala_left', to: 'amygdala_right', process: 'Эмоц. синхронизация', color: '#F39C12' },
  { from: 'cerebellum_left', to: 'cerebellum_right', process: 'Мозжечок связь', color: '#D35400' },
  
  // ========== ПОДКОРКОВЫЕ СВЯЗИ ==========
  { from: 'thalamus', to: 'prefrontal_left', process: 'Осознание Л', color: '#3498DB' },
  { from: 'thalamus', to: 'prefrontal_right', process: 'Осознание П', color: '#3498DB' },
  { from: 'thalamus', to: 'occipital_left', process: 'Визуальный реле Л', color: '#3498DB' },
  { from: 'thalamus', to: 'occipital_right', process: 'Визуальный реле П', color: '#3498DB' },
  { from: 'thalamus', to: 'parietal_left', process: 'Соматосенсорный реле', color: '#3498DB' },
  { from: 'thalamus', to: 'temporal_left', process: 'Слуховой реле', color: '#3498DB' },
  { from: 'basal_ganglia', to: 'frontal_left', process: 'Привычки → действия', color: '#34495E' },
  { from: 'basal_ganglia', to: 'thalamus', process: 'Базальный контур', color: '#34495E' },
  { from: 'hypothalamus', to: 'amygdala_left', process: 'Стресс Л', color: '#9B59B6' },
  { from: 'hypothalamus', to: 'brainstem', process: 'Автономный контроль', color: '#9B59B6' },
  { from: 'brainstem', to: 'thalamus', process: 'Ретикулярная активация', color: '#34495E' },
  { from: 'brainstem', to: 'cerebellum_left', process: 'Проприоцепция Л', color: '#34495E' },
  { from: 'brainstem', to: 'cerebellum_right', process: 'Проприоцепция П', color: '#34495E' },
  { from: 'vermis', to: 'cerebellum_left', process: 'Координация Л', color: '#D35400' },
  { from: 'vermis', to: 'cerebellum_right', process: 'Координация П', color: '#D35400' },
  { from: 'anterior_cingulate', to: 'prefrontal_left', process: 'Мониторинг ошибок', color: '#E67E22' },
  { from: 'anterior_cingulate', to: 'amygdala_left', process: 'Эмоц. регуляция', color: '#E67E22' },
  { from: 'posterior_cingulate', to: 'hippocampus_left', process: 'Автобиография', color: '#D35400' },
  { from: 'posterior_cingulate', to: 'parietal_right', process: 'Самолокализация', color: '#D35400' },
  { from: 'corpus_callosum', to: 'prefrontal_left', process: 'Передняя комиссура', color: '#F39C12' },
  { from: 'corpus_callosum', to: 'prefrontal_right', process: 'Передняя комиссура П', color: '#F39C12' },
  { from: 'corpus_callosum', to: 'parietal_left', process: 'Задняя комиссура', color: '#F39C12' },
  { from: 'corpus_callosum', to: 'parietal_right', process: 'Задняя комиссура П', color: '#F39C12' },
];

const DEPTH_PALETTES = [
  { primary: '#FF6B9D', secondary: '#FFB8D0', glow: '#FF8FB8', accent: '#58C4DD' },
  { primary: '#58C4DD', secondary: '#A8E4F0', glow: '#78D4ED', accent: '#9B59B6' },
  { primary: '#9B59B6', secondary: '#C8A8D8', glow: '#B078C6', accent: '#2ECC71' },
];

const getWidgetsForDepth = (depth: number) => {
  const levels = [COGNITIVE_WIDGETS.basic, COGNITIVE_WIDGETS.advanced, COGNITIVE_WIDGETS.integration];
  return levels[depth % levels.length];
};

const generateBrainWidgets = (time: number, depth: number): UniverseNode[] => {
  const widgets = getWidgetsForDepth(depth);
  const nodes: UniverseNode[] = [];
  
  widgets.forEach((widget, i) => {
    const zone = BRAIN_ANATOMY[widget.zone as keyof typeof BRAIN_ANATOMY];
    if (!zone) return;
    
    // Позиция виджета над зоной мозга
    const offsetZ = 0.12;
    const offsetY = 0.06;
    nodes.push({
      id: i,
      position: [
        zone.position[0] * 1.1,
        zone.position[1] + offsetY,
        zone.position[2] + offsetZ,
      ],
      velocity: [0, 0, 0],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.08,
    });
  });
  
  return nodes;
};

const generateWidgetEdges = (time: number, depth: number): UniverseEdge[] => {
  const widgets = getWidgetsForDepth(depth);
  const edges: UniverseEdge[] = [];
  
  widgets.forEach((widget, i) => {
    if (widget.connects) {
      widget.connects.forEach((targetId, idx) => {
        const targetIndex = widgets.findIndex(w => w.id === targetId);
        if (targetIndex !== -1 && targetIndex !== i) {
          const exists = edges.some(e => 
            (e.from === i && e.to === targetIndex) || 
            (e.from === targetIndex && e.to === i)
          );
          if (!exists) {
            edges.push({
              from: i,
              to: targetIndex,
              opacity: 0,
              birthTime: time + i * 0.08 + idx * 0.03 + 0.2,
              processName: `${widget.title} → ${widgets[targetIndex].title}`,
            });
          }
        }
      });
    }
  });
  
  return edges;
};

// 3D контур мозга с полными полушариями
const BrainOutline = ({ opacity, time }: { opacity: number; time: number }) => {
  const leftHemisphere = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Левое полушарие - полный контур
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const r = 0.28 + Math.sin(t * 3) * 0.04;
      const x = -0.14 - Math.cos(t) * r * 0.6;
      const y = Math.sin(t) * r * 0.9;
      const z = Math.sin(t * 2) * 0.1;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);
  
  const rightHemisphere = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Правое полушарие - полный контур
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const r = 0.28 + Math.sin(t * 3) * 0.04;
      const x = 0.14 + Math.cos(t) * r * 0.6;
      const y = Math.sin(t) * r * 0.9;
      const z = Math.sin(t * 2) * 0.1;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const centralFissure = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      points.push(new THREE.Vector3(0, 0.35 - t * 0.5, 0.15 * Math.sin(t * Math.PI)));
    }
    return points;
  }, []);

  const breathe = 1 + Math.sin(time * 0.25) * 0.015;

  return (
    <group scale={breathe}>
      {/* Левое полушарие */}
      <Line points={leftHemisphere} color="#FF6B9D" lineWidth={1.5} transparent opacity={opacity * 0.2} />
      {/* Правое полушарие */}
      <Line points={rightHemisphere} color="#58C4DD" lineWidth={1.5} transparent opacity={opacity * 0.2} />
      {/* Центральная борозда */}
      <Line points={centralFissure} color="#F39C12" lineWidth={2} transparent opacity={opacity * 0.25} />
      
      {/* Мозолистое тело - широкая полоса */}
      <Line
        points={[
          new THREE.Vector3(-0.2, 0.2, 0),
          new THREE.Vector3(-0.1, 0.22, 0),
          new THREE.Vector3(0, 0.24, 0),
          new THREE.Vector3(0.1, 0.22, 0),
          new THREE.Vector3(0.2, 0.2, 0),
        ]}
        color="#F39C12"
        lineWidth={4}
        transparent
        opacity={opacity * 0.3}
      />
      
      {/* Латеральные борозды */}
      <Line
        points={[
          new THREE.Vector3(-0.35, 0.1, 0.1),
          new THREE.Vector3(-0.25, 0.05, 0.08),
          new THREE.Vector3(-0.15, 0.02, 0.06),
        ]}
        color="#FF6B9D"
        lineWidth={1}
        transparent
        opacity={opacity * 0.15}
      />
      <Line
        points={[
          new THREE.Vector3(0.35, 0.1, 0.1),
          new THREE.Vector3(0.25, 0.05, 0.08),
          new THREE.Vector3(0.15, 0.02, 0.06),
        ]}
        color="#58C4DD"
        lineWidth={1}
        transparent
        opacity={opacity * 0.15}
      />
    </group>
  );
};

// Зона мозга с режимом размытия
const BrainZone = ({ 
  zone, 
  zoneKey,
  opacity, 
  time,
  isHighlighted,
  isInActiveChain,
  isBlurred
}: { 
  zone: typeof BRAIN_ANATOMY[keyof typeof BRAIN_ANATOMY];
  zoneKey: string;
  opacity: number;
  time: number;
  isHighlighted: boolean;
  isInActiveChain: boolean;
  isBlurred: boolean;
}) => {
  const pulse = 1 + Math.sin(time * 0.6 + zone.position[0] * 5) * 0.08;
  const highlightScale = isHighlighted ? 1.4 : isInActiveChain ? 1.2 : 1;
  const blurFactor = isBlurred ? 0.25 : 1;
  
  return (
    <group position={zone.position}>
      {/* Ореол зоны */}
      <Sphere args={[zone.size * pulse * highlightScale, 16, 16]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * (isHighlighted ? 0.35 : isInActiveChain ? 0.2 : 0.06) * blurFactor}
        />
      </Sphere>
      
      {/* Ядро */}
      <Sphere args={[zone.size * 0.35 * highlightScale, 10, 10]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * (isHighlighted ? 0.7 : isInActiveChain ? 0.4 : 0.15) * blurFactor}
        />
      </Sphere>
      
      {/* Название зоны (показывать только при подсветке) */}
      {(isHighlighted || isInActiveChain) && !isBlurred && (
        <Billboard follow={true} position={[0, zone.size + 0.015, 0]}>
          <Text
            fontSize={0.014}
            color={zone.color}
            anchorX="center"
            fillOpacity={opacity * (isHighlighted ? 1 : 0.7)}
          >
            {zone.shortName}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// Мини-виджет при наведении (появляется вокруг основного виджета)
const MiniWidget = ({ 
  widget,
  index,
  total,
  parentPosition,
  opacity,
  time,
  chainColor,
  onClick
}: { 
  widget: { id: string; icon: string; title: string };
  index: number;
  total: number;
  parentPosition: [number, number, number];
  opacity: number;
  time: number;
  chainColor: string;
  onClick: () => void;
}) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = 0.08;
  const appearProgress = Math.min(1, (time * 3) % 1 + index * 0.15);
  
  const x = parentPosition[0] + Math.cos(angle) * radius * appearProgress;
  const y = parentPosition[1] + Math.sin(angle) * radius * appearProgress;
  const z = parentPosition[2] + 0.02;
  
  const pulse = 1 + Math.sin(time * 3 + index) * 0.1;
  
  return (
    <Billboard follow={true}>
      <group 
        position={[x, y, z]} 
        scale={pulse * appearProgress}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        {/* Фон мини-виджета */}
        <RoundedBox args={[0.045, 0.035, 0.008]} radius={0.008} smoothness={3}>
          <meshBasicMaterial color="#12121A" transparent opacity={opacity * 0.95 * appearProgress} />
        </RoundedBox>
        
        {/* Свечение */}
        <RoundedBox args={[0.05, 0.04, 0.004]} radius={0.01} smoothness={2}>
          <meshBasicMaterial color={chainColor} transparent opacity={opacity * 0.3 * appearProgress} />
        </RoundedBox>
        
        {/* Иконка */}
        <Text
          position={[0, 0.002, 0.006]}
          fontSize={0.018}
          color={chainColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity * appearProgress}
        >
          {widget.icon}
        </Text>
        
        {/* Название (маленькое) */}
        <Text
          position={[0, -0.012, 0.006]}
          fontSize={0.006}
          color="#FFFFFF"
          anchorX="center"
          fillOpacity={opacity * 0.8 * appearProgress}
        >
          {widget.title}
        </Text>
      </group>
    </Billboard>
  );
};

// Хлебные крошки процессов (дуга снизу)
const ProcessBreadcrumbs = ({ 
  activeProcesses,
  opacity,
  chainColor
}: { 
  activeProcesses: string[];
  opacity: number;
  chainColor: string;
}) => {
  const arcRadius = 0.35;
  const arcY = -0.38;
  const startAngle = -Math.PI * 0.4;
  const endAngle = Math.PI * 0.4;
  
  return (
    <group>
      {/* Дуга */}
      <Line
        points={Array.from({ length: 30 }).map((_, i) => {
          const t = i / 29;
          const angle = startAngle + (endAngle - startAngle) * t;
          return new THREE.Vector3(
            Math.sin(angle) * arcRadius,
            arcY + Math.cos(angle) * 0.05,
            0
          );
        })}
        color={chainColor}
        lineWidth={1}
        transparent
        opacity={opacity * 0.3}
      />
      
      {/* Иконки процессов */}
      {BREADCRUMB_ICONS.slice(0, Math.min(5, activeProcesses.length + 1)).map((icon, i) => {
        const t = (i + 0.5) / BREADCRUMB_ICONS.length;
        const angle = startAngle + (endAngle - startAngle) * t;
        const x = Math.sin(angle) * arcRadius;
        const y = arcY + Math.cos(angle) * 0.05;
        const isActive = i < activeProcesses.length;
        
        return (
          <Billboard key={i} follow={true} position={[x, y, 0]}>
            <Text
              fontSize={0.022}
              color={isActive ? chainColor : '#4A4A4A'}
              anchorX="center"
              fillOpacity={opacity * (isActive ? 1 : 0.4)}
            >
              {icon}
            </Text>
            {isActive && activeProcesses[i] && (
              <Text
                position={[0, -0.018, 0]}
                fontSize={0.008}
                color={chainColor}
                anchorX="center"
                fillOpacity={opacity * 0.7}
              >
                {activeProcesses[i].slice(0, 8)}
              </Text>
            )}
          </Billboard>
        );
      })}
    </group>
  );
};

// Индикатор загрузки информации (полоска внизу виджета)
const InfoLoadBar = ({ 
  loadProgress, 
  width, 
  position, 
  color, 
  opacity,
  time
}: { 
  loadProgress: number;
  width: number;
  position: [number, number, number];
  color: string;
  opacity: number;
  time: number;
}) => {
  const barHeight = 0.004;
  const animatedProgress = loadProgress + Math.sin(time * 2) * 0.02;
  const clampedProgress = Math.max(0, Math.min(1, animatedProgress));
  
  return (
    <group position={position}>
      {/* Фон полоски */}
      <RoundedBox 
        args={[width - 0.01, barHeight, 0.002]} 
        radius={0.001} 
        smoothness={2}
      >
        <meshBasicMaterial color="#2A2A2A" transparent opacity={opacity * 0.6} />
      </RoundedBox>
      
      {/* Заполненная часть */}
      <RoundedBox 
        args={[(width - 0.01) * clampedProgress, barHeight, 0.003]} 
        radius={0.001} 
        smoothness={2}
        position={[-(width - 0.01) * (1 - clampedProgress) / 2, 0, 0.001]}
      >
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} />
      </RoundedBox>
      
      {/* Свечение при высокой загрузке */}
      {clampedProgress > 0.8 && (
        <RoundedBox 
          args={[(width - 0.01) * clampedProgress, barHeight + 0.002, 0.001]} 
          radius={0.002} 
          smoothness={2}
          position={[-(width - 0.01) * (1 - clampedProgress) / 2, 0, -0.001]}
        >
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.3 * (1 + Math.sin(time * 4) * 0.3)} />
        </RoundedBox>
      )}
    </group>
  );
};

// Подсветка потока данных
const DataFlowHighlight = ({ 
  path,
  color,
  opacity,
  time,
  intensity
}: { 
  path: THREE.Vector3[];
  color: string;
  opacity: number;
  time: number;
  intensity: number;
}) => {
  const pulseCount = Math.floor(intensity * 5) + 2;
  
  return (
    <group>
      {/* Яркий путь */}
      <Line
        points={path}
        color="#FFFFFF"
        lineWidth={3}
        transparent
        opacity={opacity * 0.8}
      />
      
      {/* Свечение */}
      <Line
        points={path}
        color={color}
        lineWidth={8}
        transparent
        opacity={opacity * 0.3}
      />
      
      {/* Множественные импульсы */}
      {Array.from({ length: pulseCount }).map((_, i) => {
        const t = ((time * 0.8 + i / pulseCount) % 1);
        const idx = Math.floor(t * (path.length - 1));
        const pos = path[Math.min(idx, path.length - 1)];
        const pulseFade = Math.sin(t * Math.PI);
        
        return (
          <Sphere key={i} args={[0.012, 10, 10]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial color="#FFFFFF" transparent opacity={opacity * pulseFade} />
          </Sphere>
        );
      })}
    </group>
  );
};

// Нейронный путь с импульсами
const NeuralPathway = ({ 
  from, 
  to, 
  process,
  pathColor,
  opacity, 
  time,
  index,
  isHighlighted,
  isInActiveChain
}: { 
  from: [number, number, number];
  to: [number, number, number];
  process: string;
  pathColor: string;
  opacity: number;
  time: number;
  index: number;
  isHighlighted: boolean;
  isInActiveChain: boolean;
}) => {
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...from);
    const endVec = new THREE.Vector3(...to);
    const distance = startVec.distanceTo(endVec);
    
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    const curveAmount = distance * 0.35;
    const yLift = 0.02 + (index % 3) * 0.01;
    
    const mid = startVec.clone().lerp(endVec, 0.5);
    mid.add(perpendicular.clone().multiplyScalar(curveAmount * (index % 2 === 0 ? 1 : -1)));
    mid.y += yLift;
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(30);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [from, to, index]);

  const dimmed = !isHighlighted && !isInActiveChain;
  const impulseCount = isHighlighted ? 4 : isInActiveChain ? 2 : 1;
  const speed = isHighlighted ? 0.4 : 0.2;
  
  return (
    <group>
      {/* Аксон */}
      <Line
        points={points}
        color={isHighlighted ? '#FFFFFF' : pathColor}
        lineWidth={isHighlighted ? 2 : isInActiveChain ? 1.2 : 0.4}
        transparent
        opacity={opacity * (dimmed ? 0.08 : isHighlighted ? 0.9 : 0.5)}
      />
      
      {/* Свечение */}
      {(isHighlighted || isInActiveChain) && (
        <Line
          points={points}
          color={pathColor}
          lineWidth={isHighlighted ? 5 : 3}
          transparent
          opacity={opacity * (isHighlighted ? 0.3 : 0.15)}
        />
      )}
      
      {/* Импульсы */}
      {!dimmed && Array.from({ length: impulseCount }).map((_, i) => {
        const offset = i / impulseCount;
        const t = ((time * speed + offset + index * 0.08) % 1);
        const pos = curve.getPoint(t);
        const impulseOpacity = Math.sin(t * Math.PI) * opacity * (isHighlighted ? 1.2 : 0.6);
        const size = isHighlighted ? 0.008 : 0.005;
        
        return (
          <Sphere key={i} args={[size, 8, 8]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial 
              color={isHighlighted ? '#FFFFFF' : pathColor}
              transparent 
              opacity={impulseOpacity}
            />
          </Sphere>
        );
      })}
      
      {/* Название процесса */}
      {isHighlighted && (
        <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.02, midPoint.z]}>
          <Text fontSize={0.012} color="#FFFFFF" anchorX="center" fillOpacity={opacity * 0.9}>
            {process}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// Связь между виджетами
const WidgetConnection = ({ 
  start, 
  end, 
  processName,
  opacity, 
  palette,
  time,
  index,
  isHighlighted,
  isInActiveChain,
  chainColor
}: { 
  start: [number, number, number];
  end: [number, number, number];
  processName: string;
  opacity: number;
  palette: typeof DEPTH_PALETTES[0];
  time: number;
  index: number;
  isHighlighted: boolean;
  isInActiveChain: boolean;
  chainColor?: string;
}) => {
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    const curveAmount = distance * 0.2;
    
    const mid = startVec.clone().lerp(endVec, 0.5);
    mid.add(perpendicular.clone().multiplyScalar(curveAmount * (index % 2 === 0 ? 1 : -1)));
    mid.z += 0.04;
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(24);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [start, end, index]);

  const dimmed = !isHighlighted && !isInActiveChain;
  const speed = isHighlighted ? 0.6 : 0.3;
  const color = chainColor || palette.primary;

  return (
    <group>
      <Line
        points={points}
        color={isHighlighted ? '#FFFFFF' : isInActiveChain ? color : palette.primary}
        lineWidth={isHighlighted ? 2.5 : isInActiveChain ? 1.5 : 0.8}
        transparent
        opacity={opacity * (dimmed ? 0.1 : isHighlighted ? 1 : 0.6)}
      />
      
      {(isHighlighted || isInActiveChain) && (
        <Line
          points={points}
          color={color}
          lineWidth={isHighlighted ? 5 : 3}
          transparent
          opacity={opacity * (isHighlighted ? 0.35 : 0.2)}
        />
      )}
      
      {isHighlighted && (
        <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.025, midPoint.z]}>
          <Text fontSize={0.01} color="#FFFFFF" anchorX="center" fillOpacity={opacity * 0.85}>
            {processName}
          </Text>
        </Billboard>
      )}
      
      {!dimmed && Array.from({ length: isHighlighted ? 2 : 1 }).map((_, i) => {
        const t = ((time * speed + index * 0.15 + i * 0.5) % 1);
        const pos = curve.getPoint(t);
        const pOpacity = Math.sin(t * Math.PI) * opacity * (isHighlighted ? 1 : 0.5);
        
        return (
          <Sphere key={i} args={[isHighlighted ? 0.01 : 0.006, 8, 8]} position={[pos.x, pos.y, pos.z]}>
            <meshBasicMaterial color={isHighlighted ? '#FFFFFF' : color} transparent opacity={pOpacity} />
          </Sphere>
        );
      })}
    </group>
  );
};

export const FractalUniverse = ({ 
  depth, 
  position, 
  scale: universeScale, 
  opacity: universeOpacity,
  onDiveIn,
  isActive
}: FractalUniverseProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [edges, setEdges] = useState<UniverseEdge[]>([]);
  const [time, setTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];
  const widgets = getWidgetsForDepth(depth);

  useFrame(({ clock }) => {
    if (isActive && !initialized.current) {
      initialized.current = true;
      setNodes(generateBrainWidgets(clock.elapsedTime, depth));
      setEdges(generateWidgetEdges(clock.elapsedTime, depth));
    }
    
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.08;
    }
  });

  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.5));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...node, scale: eased, opacity: eased * universeOpacity };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.4));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...edge, opacity: eased * universeOpacity };
  });

  const handleNodeClick = useCallback((nodeId: number) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, []);

  const handleDiveIn = useCallback((nodePosition: [number, number, number]) => {
    const worldPos: [number, number, number] = [
      position[0] + nodePosition[0] * universeScale,
      position[1] + nodePosition[1] * universeScale,
      position[2] + nodePosition[2] * universeScale,
    ];
    onDiveIn(worldPos, depth + 1);
  }, [depth, position, universeScale, onDiveIn]);

  // Активный узел для подсветки (наведённый или выбранный)
  const activeNode = hoveredNode ?? selectedNode;

  // Найти все связанные элементы для подсветки
  const highlightData = useMemo(() => {
    if (activeNode === null) return { zones: [], pathways: [], widgetIds: [], edgeIds: [], chain: null };
    
    const widget = widgets[activeNode];
    if (!widget) return { zones: [], pathways: [], widgetIds: [], edgeIds: [], chain: null };
    
    const chain = widget.chain;
    const chainInfo = WIDGET_CHAINS[chain as keyof typeof WIDGET_CHAINS];
    
    const zones = new Set<string>([widget.zone]);
    const pathways = new Set<number>();
    const widgetIds = new Set<number>([activeNode]);
    const edgeIds = new Set<number>();
    
    // Найти все виджеты в той же цепи
    widgets.forEach((w, i) => {
      if (w.chain === chain) {
        widgetIds.add(i);
        zones.add(w.zone);
      }
    });
    
    // Найти связанные виджеты через connects
    if (widget.connects) {
      widget.connects.forEach(targetId => {
        const targetIndex = widgets.findIndex(w => w.id === targetId);
        if (targetIndex !== -1) {
          widgetIds.add(targetIndex);
          const targetWidget = widgets[targetIndex];
          if (targetWidget) {
            zones.add(targetWidget.zone);
          }
        }
      });
    }
    
    // Найти виджеты, которые ссылаются на текущий
    widgets.forEach((w, i) => {
      if (w.connects?.includes(widget.id)) {
        widgetIds.add(i);
        zones.add(w.zone);
      }
    });
    
    // Найти нейронные пути между выделенными зонами
    const zoneArray = Array.from(zones);
    NEURAL_PATHWAYS_FULL.forEach((pathway, i) => {
      if (zoneArray.includes(pathway.from) && zoneArray.includes(pathway.to)) {
        pathways.add(i);
      } else if (zoneArray.includes(pathway.from) || zoneArray.includes(pathway.to)) {
        pathways.add(i);
        zones.add(pathway.from);
        zones.add(pathway.to);
      }
    });
    
    // Найти связи между виджетами
    edges.forEach((edge, i) => {
      if (widgetIds.has(edge.from) && widgetIds.has(edge.to)) {
        edgeIds.add(i);
      }
    });
    
    // Собрать процессы для хлебных крошек
    const processes: string[] = [];
    if (widget) {
      processes.push(widget.title);
      widget.connects?.slice(0, 4).forEach(c => {
        const connectedWidget = widgets.find(w => w.id === c);
        if (connectedWidget) processes.push(connectedWidget.title);
      });
    }
    
    return { 
      zones: Array.from(zones), 
      pathways: Array.from(pathways),
      widgetIds: Array.from(widgetIds),
      edgeIds: Array.from(edgeIds),
      chain: chainInfo,
      processes
    };
  }, [activeNode, widgets, edges]);

  const isAnyActive = activeNode !== null;

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      <Stars radius={2.5} depth={1.5} count={80} factor={0.08} saturation={0} fade speed={0.015} />

      {/* Контур мозга */}
      <BrainOutline opacity={universeOpacity} time={time} />

      {/* Зоны мозга с режимом размытия */}
      {Object.entries(BRAIN_ANATOMY).map(([key, zone]) => {
        const isInHighlight = highlightData.zones.includes(key);
        const isBlurred = isAnyActive && !isInHighlight;
        
        return (
          <BrainZone
            key={key}
            zone={zone}
            zoneKey={key}
            opacity={universeOpacity}
            time={time}
            isHighlighted={isInHighlight && activeNode !== null}
            isInActiveChain={isInHighlight}
            isBlurred={isBlurred}
          />
        );
      })}

      {/* Нейронные пути между зонами */}
      {NEURAL_PATHWAYS_FULL.map((pathway, i) => {
        const fromZone = BRAIN_ANATOMY[pathway.from as keyof typeof BRAIN_ANATOMY];
        const toZone = BRAIN_ANATOMY[pathway.to as keyof typeof BRAIN_ANATOMY];
        if (!fromZone || !toZone) return null;
        
        const isHighlighted = highlightData.pathways.includes(i);
        
        return (
          <NeuralPathway
            key={`pathway-${i}`}
            from={fromZone.position}
            to={toZone.position}
            process={pathway.process}
            pathColor={pathway.color}
            opacity={universeOpacity}
            time={time}
            index={i}
            isHighlighted={isHighlighted && activeNode !== null}
            isInActiveChain={isHighlighted}
          />
        );
      })}

      {/* Связи между виджетами */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const isHighlighted = highlightData.edgeIds.includes(i);

        return (
          <WidgetConnection
            key={`widget-edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            processName={edge.processName}
            opacity={edge.opacity * (isAnyActive && !isHighlighted ? 0.3 : 1)}
            palette={palette}
            time={time}
            index={i}
            isHighlighted={isHighlighted && activeNode !== null}
            isInActiveChain={isHighlighted}
            chainColor={highlightData.chain?.color}
          />
        );
      })}

      {/* Подсветка потока данных при активном виджете */}
      {isAnyActive && highlightData.pathways.length > 0 && (
        <>
          {highlightData.pathways.slice(0, 3).map((pathwayIdx) => {
            const pathway = NEURAL_PATHWAYS_FULL[pathwayIdx];
            if (!pathway) return null;
            const fromZone = BRAIN_ANATOMY[pathway.from as keyof typeof BRAIN_ANATOMY];
            const toZone = BRAIN_ANATOMY[pathway.to as keyof typeof BRAIN_ANATOMY];
            if (!fromZone || !toZone) return null;
            
            const startVec = new THREE.Vector3(...fromZone.position);
            const endVec = new THREE.Vector3(...toZone.position);
            const mid = startVec.clone().lerp(endVec, 0.5);
            mid.y += 0.03;
            
            const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
            const points = curve.getPoints(20);
            
            return (
              <DataFlowHighlight
                key={`flow-${pathwayIdx}`}
                path={points}
                color={highlightData.chain?.color || palette.primary}
                opacity={universeOpacity * 0.7}
                time={time}
                intensity={0.8}
              />
            );
          })}
        </>
      )}

      {/* Виджеты когнитивных процессов с Priority sizing и Info load bar */}
      {animatedNodes.map((node) => {
        const widget = widgets[node.id];
        if (!widget) return null;
        
        const zone = BRAIN_ANATOMY[widget.zone as keyof typeof BRAIN_ANATOMY];
        if (!zone) return null;
        
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const isInChain = highlightData.widgetIds.includes(node.id);
        const isBlurred = isAnyActive && !isInChain;
        const breathe = 1 + Math.sin(time * 0.4 + node.id * 1.5) * 0.012;
        const hoverScale = isHovered ? 1.12 : isSelected ? 1.08 : isInChain ? 1.04 : 1;
        
        // Priority sizing - размер зависит от приоритета
        const priorityScale = PRIORITY_SCALES[widget.priority as Priority] || 1;
        const baseWidth = 0.10;
        const baseHeight = 0.06;
        const widgetWidth = baseWidth * priorityScale;
        const widgetHeight = baseHeight * priorityScale;
        const cornerRadius = 0.012 * priorityScale;
        
        const chainInfo = WIDGET_CHAINS[widget.chain as keyof typeof WIDGET_CHAINS];
        const blurOpacity = isBlurred ? 0.25 : 1;
        
        // Связанные виджеты для мини-виджетов при наведении
        const connectedWidgets = isHovered && widget.connects 
          ? widget.connects.map(id => widgets.find(w => w.id === id)).filter(Boolean).slice(0, 5)
          : [];
        
        return (
          <Billboard key={`widget-${node.id}`} follow={true}>
            <group 
              position={node.position}
              scale={node.scale * breathe * hoverScale * priorityScale}
            >
              {/* Линия к зоне мозга */}
              <Line
                points={[
                  [0, 0, 0],
                  [
                    zone.position[0] - node.position[0],
                    zone.position[1] - node.position[1],
                    zone.position[2] - node.position[2]
                  ]
                ]}
                color={isInChain ? (chainInfo?.color || zone.color) : zone.color}
                lineWidth={isInChain ? 1 : 0.5}
                transparent
                opacity={node.opacity * (isBlurred ? 0.08 : isInChain ? 0.6 : 0.25) * blurOpacity}
              />
                
              {/* Свечение */}
              <RoundedBox
                args={[widgetWidth + 0.012, widgetHeight + 0.012, 0.002]}
                radius={cornerRadius + 0.003}
                smoothness={4}
              >
                <meshBasicMaterial 
                  color={isInChain ? (chainInfo?.color || zone.color) : zone.color}
                  transparent 
                  opacity={node.opacity * (isBlurred ? 0.05 : isSelected ? 0.6 : isInChain ? 0.4 : 0.2) * blurOpacity}
                />
              </RoundedBox>
              
              {/* Пульсация для выбранных */}
              {(isSelected || (isInChain && !isHovered)) && !isBlurred && (
                <RoundedBox
                  args={[widgetWidth + 0.02, widgetHeight + 0.02, 0.001]}
                  radius={cornerRadius + 0.005}
                  smoothness={3}
                >
                  <meshBasicMaterial 
                    color={chainInfo?.color || zone.color}
                    transparent 
                    opacity={node.opacity * 0.25 * (1 + Math.sin(time * 2.5) * 0.4)}
                  />
                </RoundedBox>
              )}
              
              {/* Фон виджета */}
              <RoundedBox
                args={[widgetWidth, widgetHeight, 0.01]}
                radius={cornerRadius}
                smoothness={4}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDiveIn(node.position);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNode(node.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredNode(null);
                  document.body.style.cursor = 'default';
                }}
              >
                <meshBasicMaterial 
                  color={isBlurred ? '#060608' : '#12121A'}
                  transparent 
                  opacity={node.opacity * 0.95 * blurOpacity}
                />
              </RoundedBox>
              
              {/* Индикатор приоритета (цветная полоска сверху) */}
              <RoundedBox
                args={[widgetWidth - 0.01, 0.004, 0.011]}
                radius={0.001}
                smoothness={2}
                position={[0, widgetHeight / 2 - 0.004, 0.001]}
              >
                <meshBasicMaterial 
                  color={widget.priority === 'critical' ? '#FF6B9D' : 
                         widget.priority === 'high' ? '#F39C12' : 
                         widget.priority === 'medium' ? '#58C4DD' : '#4A4A4A'}
                  transparent 
                  opacity={node.opacity * 0.9 * blurOpacity}
                />
              </RoundedBox>
              
              {/* Индикатор зоны */}
              <Sphere 
                args={[0.005, 6, 6]} 
                position={[widgetWidth / 2 - 0.01, widgetHeight / 2 - 0.01, 0.007]}
              >
                <meshBasicMaterial color={zone.color} transparent opacity={node.opacity * 0.85 * blurOpacity} />
              </Sphere>
              
              {/* Иконка */}
              <Text
                position={[-widgetWidth / 4, 0.004, 0.007]}
                fontSize={0.022 * priorityScale}
                color={isInChain ? (chainInfo?.color || zone.color) : zone.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * blurOpacity}
              >
                {widget.icon}
              </Text>
              
              {/* Название */}
              <Text
                position={[widgetWidth / 6, 0.008, 0.007]}
                fontSize={0.012 * priorityScale}
                color={isHovered || isSelected ? '#FFFFFF' : isInChain ? '#F0F0F2' : '#C0C0C5'}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * blurOpacity}
              >
                {widget.title}
              </Text>
              
              {/* Подзаголовок */}
              <Text
                position={[widgetWidth / 6, -0.006, 0.007]}
                fontSize={0.007 * priorityScale}
                color="#8E8E93"
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.7 * blurOpacity}
              >
                {widget.subtitle}
              </Text>
              
              {/* Info Load Bar - полоска загрузки информации */}
              {!isBlurred && (
                <InfoLoadBar
                  loadProgress={widget.infoLoad}
                  width={widgetWidth}
                  position={[0, -widgetHeight / 2 + 0.006, 0.007]}
                  color={chainInfo?.color || zone.color}
                  opacity={node.opacity * 0.8}
                  time={time}
                />
              )}
              
              {/* Hover/Select эффект */}
              {(isHovered || isSelected) && !isBlurred && (
                <RoundedBox
                  args={[widgetWidth + 0.005, widgetHeight + 0.005, 0.001]}
                  radius={cornerRadius + 0.002}
                  smoothness={3}
                >
                  <meshBasicMaterial 
                    color={chainInfo?.color || zone.color}
                    transparent 
                    opacity={node.opacity * (isSelected ? 0.5 : 0.4)}
                  />
                </RoundedBox>
              )}
            </group>
            
            {/* Мини-виджеты при наведении */}
            {isHovered && connectedWidgets.length > 0 && (
              <>
                {connectedWidgets.map((connWidget, idx) => {
                  if (!connWidget) return null;
                  const targetIdx = widgets.findIndex(w => w.id === connWidget.id);
                  return (
                    <MiniWidget
                      key={`mini-${connWidget.id}`}
                      widget={connWidget}
                      index={idx}
                      total={connectedWidgets.length}
                      parentPosition={node.position}
                      opacity={node.opacity}
                      time={time}
                      chainColor={chainInfo?.color || zone.color}
                      onClick={() => {
                        if (targetIdx !== -1) {
                          setHoveredNode(null);
                          setSelectedNode(targetIdx);
                        }
                      }}
                    />
                  );
                })}
              </>
            )}
          </Billboard>
        );
      })}

      {/* Хлебные крошки процессов */}
      {isAnyActive && highlightData.chain && (
        <ProcessBreadcrumbs
          activeProcesses={highlightData.processes}
          opacity={universeOpacity}
          chainColor={highlightData.chain.color}
        />
      )}

      {/* Информация о цепи */}
      {highlightData.chain && (
        <Billboard follow={true} position={[0, -0.46, 0]}>
          <Text
            fontSize={0.018}
            color={highlightData.chain.color}
            anchorX="center"
            fillOpacity={universeOpacity * 0.9}
          >
            {highlightData.chain.name}
          </Text>
          <Text
            fontSize={0.012}
            color="#8E8E93"
            anchorX="center"
            position={[0, -0.022, 0]}
            fillOpacity={universeOpacity * 0.7}
          >
            {highlightData.chain.description}
          </Text>
        </Billboard>
      )}

      {/* Заголовок уровня */}
      <Billboard follow={true} position={[0, -0.5, 0]}>
        <Text
          fontSize={0.016}
          color={palette.primary}
          anchorX="center"
          fillOpacity={universeOpacity * 0.5}
        >
          {depth === 0 ? 'Базовые процессы' : depth === 1 ? 'Высшие функции' : 'Интеграция'}
        </Text>
        <Text
          fontSize={0.01}
          color={palette.secondary}
          anchorX="center"
          position={[0, -0.018, 0]}
          fillOpacity={universeOpacity * 0.35}
        >
          Клик — выбрать цепь • Двойной клик — погрузиться
        </Text>
      </Billboard>
    </group>
  );
};
