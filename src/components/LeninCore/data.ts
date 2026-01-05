// Ядро Ленин - Widget and Connection Data
import { WidgetData, ConnectionData, MiniWidgetData } from './types';

// Mini-widgets for orbit display
const createMiniWidgets = (items: { icon: string; label: string }[]): MiniWidgetData[] =>
  items.map((item, i) => ({
    id: `mini-${i}-${Date.now()}`,
    icon: item.icon,
    label: item.label,
  }));

// Main widget data based on PRD taxonomy
export const INITIAL_WIDGETS: WidgetData[] = [
  // === SYSTEM CATEGORY ===
  {
    id: 'lmm-core',
    icon: '🧠',
    title: 'LMM Core',
    subtitle: 'Центральный мозг ИИ',
    priority: 'critical',
    category: 'system',
    infoLoad: 85,
    connects: ['memory-bank', 'processing-queue', 'neural-engine'],
    miniWidgets: createMiniWidgets([
      { icon: '⚡', label: 'Активация' },
      { icon: '🔄', label: 'Синхронизация' },
      { icon: '📊', label: 'Метрики' },
    ]),
    position: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'memory-bank',
    icon: '💾',
    title: 'Memory Bank',
    subtitle: 'Хранилище контекста',
    priority: 'high',
    category: 'system',
    infoLoad: 72,
    connects: ['lmm-core', 'notes'],
    miniWidgets: createMiniWidgets([
      { icon: '🗂️', label: 'Архив' },
      { icon: '🔍', label: 'Поиск' },
    ]),
    position: { x: -200, y: -100, z: 20 },
  },
  {
    id: 'processing-queue',
    icon: '⚙️',
    title: 'Processing Queue',
    subtitle: 'Очередь активных задач',
    priority: 'high',
    category: 'system',
    infoLoad: 45,
    connects: ['lmm-core', 'tasks'],
    miniWidgets: createMiniWidgets([
      { icon: '▶️', label: 'Запуск' },
      { icon: '⏸️', label: 'Пауза' },
    ]),
    position: { x: 200, y: -80, z: 15 },
  },
  {
    id: 'neural-engine',
    icon: '🔮',
    title: 'Neural Engine',
    subtitle: 'Визуализация мышления',
    priority: 'high',
    category: 'system',
    infoLoad: 90,
    connects: ['lmm-core'],
    miniWidgets: createMiniWidgets([
      { icon: '🌐', label: 'Сеть' },
      { icon: '📈', label: 'Аналитика' },
    ]),
    position: { x: 0, y: 180, z: 25 },
  },

  // === PRODUCTIVITY CATEGORY ===
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendar',
    subtitle: 'Расписание и события',
    priority: 'medium',
    category: 'productivity',
    infoLoad: 35,
    connects: ['tasks', 'reminders'],
    miniWidgets: createMiniWidgets([
      { icon: '➕', label: 'Событие' },
      { icon: '🔔', label: 'Напоминание' },
    ]),
    position: { x: -280, y: 120, z: 10 },
  },
  {
    id: 'tasks',
    icon: '✅',
    title: 'Tasks',
    subtitle: 'Список дел',
    priority: 'medium',
    category: 'productivity',
    infoLoad: 60,
    connects: ['processing-queue', 'calendar'],
    miniWidgets: createMiniWidgets([
      { icon: '➕', label: 'Добавить' },
      { icon: '✓', label: 'Завершить' },
    ]),
    position: { x: 320, y: 60, z: 8 },
  },
  {
    id: 'notes',
    icon: '📝',
    title: 'Notes',
    subtitle: 'Заметки',
    priority: 'medium',
    category: 'productivity',
    infoLoad: 25,
    connects: ['memory-bank'],
    miniWidgets: createMiniWidgets([
      { icon: '✏️', label: 'Редактировать' },
      { icon: '📤', label: 'Экспорт' },
    ]),
    position: { x: -350, y: -180, z: 5 },
  },
  {
    id: 'reminders',
    icon: '🔔',
    title: 'Reminders',
    subtitle: 'Напоминания',
    priority: 'low',
    category: 'productivity',
    infoLoad: 15,
    connects: ['calendar'],
    miniWidgets: createMiniWidgets([
      { icon: '⏰', label: 'Время' },
    ]),
    position: { x: -180, y: 250, z: 3 },
  },

  // === COMMUNICATION CATEGORY ===
  {
    id: 'messages',
    icon: '💬',
    title: 'Messages',
    subtitle: 'Сообщения',
    priority: 'medium',
    category: 'communication',
    infoLoad: 40,
    connects: ['lmm-core'],
    miniWidgets: createMiniWidgets([
      { icon: '✉️', label: 'Новое' },
      { icon: '📎', label: 'Вложение' },
    ]),
    position: { x: 280, y: 200, z: 12 },
  },
  {
    id: 'mail',
    icon: '📧',
    title: 'Mail',
    subtitle: 'Электронная почта',
    priority: 'low',
    category: 'communication',
    infoLoad: 55,
    connects: ['messages'],
    miniWidgets: createMiniWidgets([
      { icon: '📨', label: 'Входящие' },
      { icon: '📤', label: 'Отправить' },
    ]),
    position: { x: 380, y: -160, z: 6 },
  },

  // === MEDIA CATEGORY ===
  {
    id: 'photos',
    icon: '📷',
    title: 'Photos',
    subtitle: 'Фотографии',
    priority: 'low',
    category: 'media',
    infoLoad: 70,
    connects: ['memory-bank'],
    miniWidgets: createMiniWidgets([
      { icon: '🖼️', label: 'Галерея' },
      { icon: '📤', label: 'Поделиться' },
    ]),
    position: { x: -400, y: 50, z: 4 },
  },

  // === UTILITIES CATEGORY ===
  {
    id: 'weather',
    icon: '🌤️',
    title: 'Weather',
    subtitle: 'Погода',
    priority: 'low',
    category: 'utilities',
    infoLoad: 20,
    connects: ['calendar'],
    miniWidgets: createMiniWidgets([
      { icon: '📍', label: 'Локация' },
    ]),
    position: { x: 150, y: -220, z: 2 },
  },
];

// Connection data with all 8 types
export const INITIAL_CONNECTIONS: ConnectionData[] = [
  // Data Flow - active data transfer
  { id: 'c1', from: 'lmm-core', to: 'memory-bank', type: 'dataFlow', strength: 0.9 },
  { id: 'c2', from: 'lmm-core', to: 'processing-queue', type: 'dataFlow', strength: 0.85 },
  { id: 'c3', from: 'lmm-core', to: 'neural-engine', type: 'dataFlow', strength: 1.0 },
  
  // Dependency - structural dependencies
  { id: 'c4', from: 'processing-queue', to: 'tasks', type: 'dependency' },
  { id: 'c5', from: 'memory-bank', to: 'notes', type: 'dependency' },
  
  // Context Link - shared context
  { id: 'c6', from: 'calendar', to: 'tasks', type: 'contextLink' },
  { id: 'c7', from: 'calendar', to: 'reminders', type: 'contextLink' },
  { id: 'c8', from: 'messages', to: 'mail', type: 'contextLink' },
  
  // Logic Chain - AI reasoning path
  { id: 'c9', from: 'lmm-core', to: 'messages', type: 'logicChain' },
  
  // Causal - cause-effect
  { id: 'c10', from: 'weather', to: 'calendar', type: 'causal' },
  
  // Temporal - time sequence
  { id: 'c11', from: 'reminders', to: 'calendar', type: 'temporal' },
  
  // Semantic - conceptual connection
  { id: 'c12', from: 'photos', to: 'memory-bank', type: 'semantic' },
  
  // Metacognitive - reflection
  { id: 'c13', from: 'neural-engine', to: 'lmm-core', type: 'metacognitive' },
];
