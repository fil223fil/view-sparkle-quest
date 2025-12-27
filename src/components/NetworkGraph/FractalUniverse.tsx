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
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Зоны мозга с функциями и связанными процессами
const BRAIN_ZONES = {
  // Лобная доля - исполнительные функции, планирование
  frontal: {
    name: 'Лобная доля',
    position: [0, 0.25, 0.15] as [number, number, number],
    color: '#FF6B9D',
    functions: ['Планирование', 'Решения', 'Воля', 'Логика'],
    icon: '🎯',
    processes: ['Анализ → Синтез', 'Цель → Действие']
  },
  // Теменная доля - пространственное восприятие, интеграция
  parietal: {
    name: 'Теменная доля',
    position: [0, 0.3, -0.1] as [number, number, number],
    color: '#58C4DD',
    functions: ['Интеграция', 'Пространство', 'Расчёт', 'Тело'],
    icon: '🧩',
    processes: ['Сенсор → Модель', 'Ощущение → Осознание']
  },
  // Височная доля - память, слух, речь
  temporal_left: {
    name: 'Левая височная',
    position: [-0.3, 0, 0] as [number, number, number],
    color: '#9B59B6',
    functions: ['Речь', 'Память', 'Логика', 'Анализ'],
    icon: '💬',
    processes: ['Звук → Смысл', 'Слово → Понятие']
  },
  temporal_right: {
    name: 'Правая височная',
    position: [0.3, 0, 0] as [number, number, number],
    color: '#E74C3C',
    functions: ['Музыка', 'Эмоции', 'Интуиция', 'Образы'],
    icon: '🎵',
    processes: ['Тон → Эмоция', 'Ритм → Чувство']
  },
  // Затылочная доля - зрение
  occipital: {
    name: 'Затылочная доля',
    position: [0, 0.1, -0.3] as [number, number, number],
    color: '#2ECC71',
    functions: ['Зрение', 'Цвет', 'Форма', 'Движение'],
    icon: '👁️',
    processes: ['Свет → Образ', 'Паттерн → Объект']
  },
  // Мозжечок - координация
  cerebellum: {
    name: 'Мозжечок',
    position: [0, -0.2, -0.2] as [number, number, number],
    color: '#F39C12',
    functions: ['Баланс', 'Координация', 'Моторика', 'Ритм'],
    icon: '⚖️',
    processes: ['Намерение → Движение', 'Ошибка → Коррекция']
  },
  // Лимбическая система - эмоции
  limbic: {
    name: 'Лимбическая система',
    position: [0, 0, 0] as [number, number, number],
    color: '#E91E63',
    functions: ['Эмоции', 'Память', 'Мотивация', 'Награда'],
    icon: '❤️',
    processes: ['Стимул → Эмоция', 'Опыт → Память']
  },
  // Префронтальная кора - высшие функции
  prefrontal: {
    name: 'Префронтальная кора',
    position: [0, 0.2, 0.25] as [number, number, number],
    color: '#3498DB',
    functions: ['Сознание', 'Самоконтроль', 'Абстракция', 'Творчество'],
    icon: '✨',
    processes: ['Идея → План', 'Импульс → Контроль']
  }
};

// Нейронные связи между зонами мозга (аксональные пути)
const NEURAL_PATHWAYS = [
  { from: 'frontal', to: 'parietal', name: 'Лобно-теменной путь', process: 'Внимание' },
  { from: 'frontal', to: 'temporal_left', name: 'Дугообразный пучок', process: 'Речь' },
  { from: 'frontal', to: 'limbic', name: 'Мезолимбический путь', process: 'Мотивация' },
  { from: 'frontal', to: 'prefrontal', name: 'Префронтальный контур', process: 'Контроль' },
  { from: 'parietal', to: 'occipital', name: 'Дорсальный поток', process: 'Где?' },
  { from: 'temporal_left', to: 'temporal_right', name: 'Мозолистое тело', process: 'Интеграция' },
  { from: 'temporal_right', to: 'limbic', name: 'Эмоциональный контур', process: 'Чувства' },
  { from: 'occipital', to: 'temporal_left', name: 'Вентральный поток', process: 'Что?' },
  { from: 'cerebellum', to: 'frontal', name: 'Мозжечково-таламический', process: 'Координация' },
  { from: 'limbic', to: 'prefrontal', name: 'Амигдало-префронтальный', process: 'Регуляция' },
  { from: 'prefrontal', to: 'parietal', name: 'Фронто-париетальный', process: 'Осознанность' },
  { from: 'limbic', to: 'cerebellum', name: 'Лимбико-мозжечковый', process: 'Эмоц. моторика' },
];

// Типы виджетов привязанные к зонам мозга
const WIDGET_BRAIN_MAPPING = {
  // Аналитические виджеты → Лобная доля
  analytics: { zone: 'frontal', widgets: ['📊', '📈', '🔍', '📉'] },
  // Творческие виджеты → Правая височная
  creative: { zone: 'temporal_right', widgets: ['🎨', '🎵', '💡', '✨'] },
  // Коммуникационные → Левая височная  
  communication: { zone: 'temporal_left', widgets: ['💬', '📝', '🗣️', '📖'] },
  // Визуальные → Затылочная доля
  visual: { zone: 'occipital', widgets: ['👁️', '🖼️', '📷', '🎬'] },
  // Эмоциональные → Лимбическая система
  emotional: { zone: 'limbic', widgets: ['❤️', '😊', '🎭', '💝'] },
  // Координационные → Мозжечок
  motor: { zone: 'cerebellum', widgets: ['⚡', '🏃', '🎯', '🔄'] },
  // Интеграционные → Теменная доля
  integration: { zone: 'parietal', widgets: ['🧩', '🔗', '🌐', '📐'] },
  // Высшие функции → Префронтальная кора
  executive: { zone: 'prefrontal', widgets: ['🧠', '💎', '🎓', '🏆'] },
};

// Получить зону мозга для виджета
const getBrainZoneForWidget = (icon: string): keyof typeof BRAIN_ZONES => {
  for (const [_, mapping] of Object.entries(WIDGET_BRAIN_MAPPING)) {
    if (mapping.widgets.includes(icon)) {
      return mapping.zone as keyof typeof BRAIN_ZONES;
    }
  }
  return 'limbic'; // По умолчанию - центр
};

// Mind map concepts с привязкой к зонам мозга
const CONCEPT_MAPS = {
  core: {
    central: { icon: '🧠', title: 'РАЗУМ', subtitle: 'Центр мысли' },
    nodes: [
      { icon: '💡', title: 'Идея', subtitle: 'Инсайт', connects: ['Анализ', 'Синтез'], zone: 'prefrontal' },
      { icon: '🔍', title: 'Анализ', subtitle: 'Разбор', connects: ['Данные', 'Паттерны'], zone: 'frontal' },
      { icon: '🔗', title: 'Синтез', subtitle: 'Сборка', connects: ['Система', 'Модель'], zone: 'parietal' },
      { icon: '📊', title: 'Данные', subtitle: 'Факты', connects: ['Знание'], zone: 'frontal' },
      { icon: '🧩', title: 'Паттерны', subtitle: 'Связи', connects: ['Знание'], zone: 'parietal' },
      { icon: '⚙️', title: 'Система', subtitle: 'Структура', connects: ['Результат'], zone: 'frontal' },
      { icon: '📐', title: 'Модель', subtitle: 'Абстракция', connects: ['Результат'], zone: 'parietal' },
      { icon: '✨', title: 'Знание', subtitle: 'Понимание', connects: ['Мудрость'], zone: 'prefrontal' },
    ]
  },
  emotions: {
    central: { icon: '❤️', title: 'ЭМОЦИИ', subtitle: 'Лимбическая система' },
    nodes: [
      { icon: '😊', title: 'Радость', subtitle: 'Дофамин', connects: ['Мотивация', 'Память'], zone: 'limbic' },
      { icon: '😢', title: 'Грусть', subtitle: 'Рефлексия', connects: ['Память', 'Рост'], zone: 'limbic' },
      { icon: '😠', title: 'Гнев', subtitle: 'Энергия', connects: ['Действие', 'Защита'], zone: 'limbic' },
      { icon: '😨', title: 'Страх', subtitle: 'Амигдала', connects: ['Осторожность', 'Обучение'], zone: 'limbic' },
      { icon: '🎭', title: 'Эмпатия', subtitle: 'Зеркальные нейроны', connects: ['Связь'], zone: 'temporal_right' },
      { icon: '💝', title: 'Любовь', subtitle: 'Окситоцин', connects: ['Привязанность'], zone: 'limbic' },
      { icon: '🌟', title: 'Вдохновение', subtitle: 'Творчество', connects: ['Идея'], zone: 'temporal_right' },
      { icon: '🙏', title: 'Благодарность', subtitle: 'Серотонин', connects: ['Счастье'], zone: 'prefrontal' },
    ]
  },
  perception: {
    central: { icon: '👁️', title: 'ВОСПРИЯТИЕ', subtitle: 'Затылочная доля' },
    nodes: [
      { icon: '🎨', title: 'Цвет', subtitle: 'V4 область', connects: ['Форма', 'Эмоция'], zone: 'occipital' },
      { icon: '📐', title: 'Форма', subtitle: 'Контуры', connects: ['Объект', 'Паттерн'], zone: 'occipital' },
      { icon: '🏃', title: 'Движение', subtitle: 'MT/V5', connects: ['Время', 'Действие'], zone: 'occipital' },
      { icon: '🌌', title: 'Глубина', subtitle: 'Стерео', connects: ['Пространство'], zone: 'parietal' },
      { icon: '👂', title: 'Звук', subtitle: 'Слуховая кора', connects: ['Речь', 'Музыка'], zone: 'temporal_left' },
      { icon: '🎵', title: 'Музыка', subtitle: 'Тембр', connects: ['Эмоция', 'Память'], zone: 'temporal_right' },
      { icon: '✋', title: 'Осязание', subtitle: 'Соматосенсорная', connects: ['Тело'], zone: 'parietal' },
      { icon: '🌡️', title: 'Ощущение', subtitle: 'Интероцепция', connects: ['Эмоция'], zone: 'limbic' },
    ]
  },
  cognition: {
    central: { icon: '🎯', title: 'ПОЗНАНИЕ', subtitle: 'Префронтальная кора' },
    nodes: [
      { icon: '🧮', title: 'Расчёт', subtitle: 'Логика', connects: ['Решение', 'Модель'], zone: 'frontal' },
      { icon: '💭', title: 'Мысль', subtitle: 'Рабочая память', connects: ['Внимание', 'Язык'], zone: 'prefrontal' },
      { icon: '🎓', title: 'Обучение', subtitle: 'Пластичность', connects: ['Память', 'Навык'], zone: 'parietal' },
      { icon: '💡', title: 'Инсайт', subtitle: 'Ага-момент', connects: ['Творчество'], zone: 'temporal_right' },
      { icon: '🗣️', title: 'Язык', subtitle: 'Брока', connects: ['Общение', 'Мысль'], zone: 'temporal_left' },
      { icon: '📖', title: 'Чтение', subtitle: 'Вернике', connects: ['Понимание'], zone: 'temporal_left' },
      { icon: '✍️', title: 'Письмо', subtitle: 'Моторная кора', connects: ['Выражение'], zone: 'frontal' },
      { icon: '🧘', title: 'Внимание', subtitle: 'Фокус', connects: ['Осознанность'], zone: 'prefrontal' },
    ]
  },
  memory: {
    central: { icon: '📚', title: 'ПАМЯТЬ', subtitle: 'Гиппокамп' },
    nodes: [
      { icon: '⚡', title: 'Рабочая', subtitle: '7±2', connects: ['Внимание', 'Обработка'], zone: 'prefrontal' },
      { icon: '📝', title: 'Эпизодическая', subtitle: 'События', connects: ['Время', 'Место'], zone: 'temporal_left' },
      { icon: '🧩', title: 'Семантическая', subtitle: 'Факты', connects: ['Знание', 'Язык'], zone: 'temporal_left' },
      { icon: '🚴', title: 'Процедурная', subtitle: 'Навыки', connects: ['Автоматизм'], zone: 'cerebellum' },
      { icon: '❤️', title: 'Эмоциональная', subtitle: 'Амигдала', connects: ['Чувства', 'Травма'], zone: 'limbic' },
      { icon: '🔮', title: 'Проспективная', subtitle: 'Планы', connects: ['Будущее'], zone: 'prefrontal' },
      { icon: '🌙', title: 'Консолидация', subtitle: 'Сон', connects: ['Долгосрочная'], zone: 'limbic' },
      { icon: '🔄', title: 'Извлечение', subtitle: 'Воспоминание', connects: ['Осознание'], zone: 'prefrontal' },
    ]
  },
};

const getConceptMap = (depth: number) => {
  const maps = Object.values(CONCEPT_MAPS);
  return maps[depth % maps.length];
};

// Цветовые палитры для разных уровней
const DEPTH_PALETTES = [
  { primary: '#FF6B9D', secondary: '#FFB8D0', glow: '#FF8FB8', accent: '#58C4DD' },  // Розовый-голубой
  { primary: '#58C4DD', secondary: '#A8E4F0', glow: '#78D4ED', accent: '#9B59B6' },  // Голубой
  { primary: '#9B59B6', secondary: '#C8A8D8', glow: '#B078C6', accent: '#2ECC71' },  // Фиолетовый
  { primary: '#2ECC71', secondary: '#A8E6C0', glow: '#58D68D', accent: '#F39C12' },  // Зелёный
  { primary: '#F39C12', secondary: '#F8D488', glow: '#F5B041', accent: '#E74C3C' },  // Оранжевый
];

// Генерация узлов на основе зон мозга
const generateBrainNodes = (count: number, time: number, depth: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  const conceptMap = getConceptMap(depth);
  
  for (let i = 0; i < Math.min(count, conceptMap.nodes.length); i++) {
    const nodeData = conceptMap.nodes[i];
    const zoneName = (nodeData as any).zone || 'limbic';
    const zone = BRAIN_ZONES[zoneName as keyof typeof BRAIN_ZONES];
    
    // Позиция близко к зоне мозга с небольшим смещением
    const jitter = 0.08;
    
    nodes.push({
      id: i,
      position: [
        zone.position[0] + (Math.random() - 0.5) * jitter,
        zone.position[1] + (Math.random() - 0.5) * jitter,
        zone.position[2] + (Math.random() - 0.5) * jitter,
      ],
      velocity: [0, 0, 0],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.08,
    });
  }
  return nodes;
};

// Физическая симуляция с притяжением к зонам мозга
const applyBrainForces = (
  nodes: UniverseNode[], 
  edges: UniverseEdge[], 
  depth: number,
  deltaTime: number
): UniverseNode[] => {
  if (!nodes || nodes.length === 0) return nodes;
  
  const conceptMap = getConceptMap(depth);
  
  const REPULSION = 0.003;
  const ATTRACTION = 0.008;
  const ZONE_PULL = 0.015; // Притяжение к своей зоне мозга
  const DAMPING = 0.92;
  const MAX_VELOCITY = 0.008;
  
  return nodes.map((node, i) => {
    if (!node || !node.position) return node;
    
    const nodeData = conceptMap.nodes[i % conceptMap.nodes.length];
    const zoneName = (nodeData as any).zone || 'limbic';
    const zone = BRAIN_ZONES[zoneName as keyof typeof BRAIN_ZONES];
    
    const nodeVelocity = node.velocity || [0, 0, 0];
    let fx = 0, fy = 0, fz = 0;
    
    // Притяжение к своей зоне мозга
    fx += (zone.position[0] - node.position[0]) * ZONE_PULL;
    fy += (zone.position[1] - node.position[1]) * ZONE_PULL;
    fz += (zone.position[2] - node.position[2]) * ZONE_PULL;
    
    // Отталкивание от других узлов
    nodes.forEach((other, j) => {
      if (i === j || !other || !other.position) return;
      
      const dx = node.position[0] - other.position[0];
      const dy = node.position[1] - other.position[1];
      const dz = node.position[2] - other.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
      
      const force = REPULSION / (dist * dist);
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
      fz += (dz / dist) * force;
    });
    
    // Притяжение по связям
    edges.forEach(edge => {
      if (!edge) return;
      let otherIndex = -1;
      if (edge.from === node.id) otherIndex = edge.to;
      else if (edge.to === node.id) otherIndex = edge.from;
      
      if (otherIndex !== -1) {
        const other = nodes.find(n => n && n.id === otherIndex);
        if (other && other.position) {
          const dx = other.position[0] - node.position[0];
          const dy = other.position[1] - node.position[1];
          const dz = other.position[2] - node.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
          
          const force = dist * ATTRACTION;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
          fz += (dz / dist) * force;
        }
      }
    });
    
    let vx = (nodeVelocity[0] + fx) * DAMPING;
    let vy = (nodeVelocity[1] + fy) * DAMPING;
    let vz = (nodeVelocity[2] + fz) * DAMPING;
    
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }
    
    return {
      ...node,
      position: [
        node.position[0] + vx,
        node.position[1] + vy,
        node.position[2] + vz,
      ] as [number, number, number],
      velocity: [vx, vy, vz] as [number, number, number],
    };
  });
};

// Генерация нейронных связей на основе зон мозга
const generateNeuralEdges = (nodeCount: number, time: number, depth: number): UniverseEdge[] => {
  const edges: UniverseEdge[] = [];
  const conceptMap = getConceptMap(depth);
  
  // Создаём связи на основе семантических связей в concept map
  for (let i = 0; i < nodeCount; i++) {
    const nodeData = conceptMap.nodes[i % conceptMap.nodes.length];
    if (nodeData.connects) {
      nodeData.connects.forEach((targetName, idx) => {
        const targetIndex = conceptMap.nodes.findIndex(n => n.title === targetName);
        if (targetIndex !== -1 && targetIndex < nodeCount && targetIndex !== i) {
          const exists = edges.some(e => 
            (e.from === i && e.to === targetIndex) || 
            (e.from === targetIndex && e.to === i)
          );
          if (!exists) {
            edges.push({
              from: i,
              to: targetIndex,
              opacity: 0,
              birthTime: time + i * 0.1 + idx * 0.05 + 0.2,
            });
          }
        }
      });
    }
  }
  
  return edges;
};

// Нейронная связь - синапс с импульсами
const NeuralConnection = ({ 
  start, 
  end, 
  opacity, 
  palette, 
  edgeIndex,
  time,
  processLabel
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  opacity: number; 
  palette: typeof DEPTH_PALETTES[0];
  edgeIndex: number;
  time: number;
  processLabel?: string;
}) => {
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    
    // Создаём изогнутую линию как аксон
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    const curveAmount = distance * 0.3;
    const yLift = 0.05 + (edgeIndex % 3) * 0.02;
    
    const ctrl1 = startVec.clone().lerp(endVec, 0.33);
    ctrl1.add(perpendicular.clone().multiplyScalar(curveAmount * (edgeIndex % 2 === 0 ? 1 : -1)));
    ctrl1.y += yLift;
    
    const ctrl2 = startVec.clone().lerp(endVec, 0.66);
    ctrl2.add(perpendicular.clone().multiplyScalar(curveAmount * (edgeIndex % 2 === 0 ? 0.3 : -0.3)));
    ctrl2.y += yLift * 0.6;
    
    const bezierCurve = new THREE.CubicBezierCurve3(startVec, ctrl1, ctrl2, endVec);
    const curvePoints = bezierCurve.getPoints(50);
    
    const mid = bezierCurve.getPoint(0.5);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [start, end, edgeIndex]);

  // Пульсация нейронного сигнала
  const pulseSpeed = 0.5 + (edgeIndex % 4) * 0.1;
  const pulsePhase = edgeIndex * 0.5;
  
  // Несколько импульсов вдоль аксона
  const impulses = useMemo(() => {
    return [0, 0.33, 0.66].map((offset, i) => ({
      offset,
      speed: 0.3 + i * 0.1,
      size: 0.012 - i * 0.002,
    }));
  }, []);

  return (
    <group>
      {/* Аксон - основная линия */}
      <Line
        points={points}
        color={palette.secondary}
        lineWidth={0.8}
        transparent
        opacity={opacity * 0.3}
      />
      
      {/* Миелиновая оболочка - свечение */}
      <Line
        points={points}
        color={palette.glow}
        lineWidth={2.5}
        transparent
        opacity={opacity * 0.08}
      />
      
      {/* Нейронные импульсы - движущиеся сигналы */}
      {impulses.map((impulse, i) => {
        const t = ((time * impulse.speed + impulse.offset + edgeIndex * 0.2) % 1);
        const pos = curve.getPoint(t);
        const impulseOpacity = Math.sin(t * Math.PI) * opacity * 0.9;
        
        return (
          <group key={i}>
            {/* Ядро импульса */}
            <Sphere args={[impulse.size, 12, 12]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial 
                color={palette.primary}
                transparent 
                opacity={impulseOpacity}
              />
            </Sphere>
            {/* Свечение импульса */}
            <Sphere args={[impulse.size * 2, 8, 8]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial 
                color={palette.glow}
                transparent 
                opacity={impulseOpacity * 0.3}
              />
            </Sphere>
          </group>
        );
      })}
      
      {/* Метка процесса в середине связи */}
      {processLabel && (
        <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.03, midPoint.z]}>
          <Text
            fontSize={0.018}
            color={palette.accent}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * 0.7}
          >
            {processLabel}
          </Text>
        </Billboard>
      )}
      
      {/* Синаптические терминали на концах */}
      <Sphere args={[0.008, 8, 8]} position={start}>
        <meshBasicMaterial 
          color={palette.primary}
          transparent 
          opacity={opacity * 0.6}
        />
      </Sphere>
      <Sphere args={[0.008, 8, 8]} position={end}>
        <meshBasicMaterial 
          color={palette.accent}
          transparent 
          opacity={opacity * 0.6}
        />
      </Sphere>
    </group>
  );
};

// Визуализация зоны мозга
const BrainZoneIndicator = ({
  zone,
  opacity,
  time,
}: {
  zone: typeof BRAIN_ZONES[keyof typeof BRAIN_ZONES];
  opacity: number;
  time: number;
}) => {
  const breathe = 1 + Math.sin(time * 0.5) * 0.1;
  
  return (
    <group position={zone.position}>
      {/* Ореол зоны */}
      <Sphere args={[0.12 * breathe, 24, 24]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * 0.08}
        />
      </Sphere>
      {/* Ядро зоны */}
      <Sphere args={[0.04, 16, 16]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * 0.2}
        />
      </Sphere>
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
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];
  const conceptMap = getConceptMap(depth);

  useFrame(({ clock }) => {
    if (isActive && !initialized.current) {
      initialized.current = true;
      const nodeCount = Math.min(8, conceptMap.nodes.length);
      setNodes(generateBrainNodes(nodeCount, clock.elapsedTime, depth));
      setEdges(generateNeuralEdges(nodeCount, clock.elapsedTime, depth));
    }
    
    if (isActive) {
      setTime(clock.elapsedTime);
      
      if (nodes.length > 0 && edges.length > 0) {
        setNodes(prevNodes => applyBrainForces(prevNodes, edges, depth, 0.016));
      }
    }

    if (groupRef.current) {
      // Очень лёгкое вращение для динамики
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.05;
    }
  });

  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.8));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...node, scale: eased, opacity: eased * universeOpacity };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.6));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...edge, opacity: eased * universeOpacity };
  });

  const handleNodeClick = useCallback((nodePosition: [number, number, number]) => {
    const worldPos: [number, number, number] = [
      position[0] + nodePosition[0] * universeScale,
      position[1] + nodePosition[1] * universeScale,
      position[2] + nodePosition[2] * universeScale,
    ];
    onDiveIn(worldPos, depth + 1);
  }, [depth, position, universeScale, onDiveIn]);

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      <Stars
        radius={1.5}
        depth={0.8}
        count={30}
        factor={0.12}
        saturation={0}
        fade
        speed={0.03}
      />

      {/* Визуализация зон мозга */}
      {Object.values(BRAIN_ZONES).map((zone, i) => (
        <BrainZoneIndicator
          key={zone.name}
          zone={zone}
          opacity={universeOpacity * 0.8}
          time={time}
        />
      ))}

      {/* Центральный "мозг" */}
      <Sphere args={[0.06, 32, 32]}>
        <meshBasicMaterial 
          color={palette.primary} 
          transparent 
          opacity={(0.6 + Math.sin(time * 1.5) * 0.15) * universeOpacity} 
        />
      </Sphere>
      <Sphere args={[0.1, 24, 24]}>
        <meshBasicMaterial 
          color={palette.glow} 
          transparent 
          opacity={0.15 * universeOpacity} 
        />
      </Sphere>
      
      {/* Название уровня */}
      <Billboard follow={true} position={[0, -0.12, 0]}>
        <Text
          fontSize={0.025}
          color={palette.primary}
          anchorX="center"
          fillOpacity={universeOpacity * 0.8}
        >
          {conceptMap.central.title}
        </Text>
        <Text
          fontSize={0.015}
          color={palette.secondary}
          anchorX="center"
          position={[0, -0.03, 0]}
          fillOpacity={universeOpacity * 0.5}
        >
          {conceptMap.central.subtitle}
        </Text>
      </Billboard>

      {/* Нейронные связи */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const startData = conceptMap.nodes[edge.from % conceptMap.nodes.length];
        const endData = conceptMap.nodes[edge.to % conceptMap.nodes.length];
        
        // Определяем процесс для связи
        const processLabel = startData.connects?.includes(endData.title) 
          ? `${startData.title} → ${endData.title}`
          : undefined;

        return (
          <NeuralConnection
            key={`edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            opacity={edge.opacity}
            palette={palette}
            edgeIndex={i}
            time={time}
            processLabel={i % 2 === 0 ? undefined : undefined} // Убираем лейблы для чистоты
          />
        );
      })}

      {/* Виджеты-нейроны */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const nodeData = conceptMap.nodes[node.id % conceptMap.nodes.length];
        const zoneName = (nodeData as any).zone || 'limbic';
        const zone = BRAIN_ZONES[zoneName as keyof typeof BRAIN_ZONES];
        
        const breatheSpeed = 0.4 + (node.id % 5) * 0.1;
        const breathe = 1 + Math.sin(time * breatheSpeed + node.id * 1.5) * 0.02;
        const hoverScale = isHovered ? 1.08 : 1;
        
        const widgetWidth = 0.28;
        const widgetHeight = 0.16;
        const cornerRadius = 0.03;
        
        return (
          <Billboard
            key={`node-${node.id}`}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <group 
              position={node.position}
              scale={node.scale * breathe * hoverScale}
            >
              {/* Связь с зоной мозга - светящаяся линия */}
              <Line
                points={[[0, 0, 0], [
                  zone.position[0] - node.position[0],
                  zone.position[1] - node.position[1],
                  zone.position[2] - node.position[2]
                ]]}
                color={zone.color}
                lineWidth={0.5}
                transparent
                opacity={node.opacity * 0.15}
              />
              
              {/* Внешнее свечение цвета зоны */}
              <RoundedBox
                args={[widgetWidth + 0.025, widgetHeight + 0.025, 0.004]}
                radius={cornerRadius + 0.008}
                smoothness={4}
              >
                <meshBasicMaterial 
                  color={zone.color}
                  transparent 
                  opacity={node.opacity * 0.2}
                />
              </RoundedBox>
              
              {/* Основной фон виджета */}
              <RoundedBox
                args={[widgetWidth, widgetHeight, 0.02]}
                radius={cornerRadius}
                smoothness={4}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.position);
                }}
                onPointerOver={() => {
                  setHoveredNode(node.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredNode(null);
                  document.body.style.cursor = 'default';
                }}
              >
                <meshBasicMaterial 
                  color="#1C1C1E"
                  transparent 
                  opacity={node.opacity * 0.95}
                />
              </RoundedBox>
              
              {/* Индикатор зоны мозга */}
              <Sphere 
                args={[0.012, 8, 8]} 
                position={[widgetWidth / 2 - 0.02, widgetHeight / 2 - 0.02, 0.015]}
              >
                <meshBasicMaterial 
                  color={zone.color}
                  transparent 
                  opacity={node.opacity * 0.9}
                />
              </Sphere>
              
              {/* Иконка */}
              <Text
                position={[-0.08, 0.01, 0.015]}
                fontSize={0.055}
                color={zone.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {nodeData.icon}
              </Text>
              
              {/* Название */}
              <Text
                position={[0.04, 0.03, 0.015]}
                fontSize={0.032}
                color={isHovered ? '#FFFFFF' : '#F5F5F7'}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {nodeData.title}
              </Text>
              
              {/* Подзаголовок */}
              <Text
                position={[0.04, -0.01, 0.015]}
                fontSize={0.018}
                color="#98989D"
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.85}
              >
                {nodeData.subtitle || ''}
              </Text>
              
              {/* Зона мозга - маленький текст */}
              <Text
                position={[0.04, -0.04, 0.015]}
                fontSize={0.012}
                color={zone.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.6}
              >
                {zone.name}
              </Text>
              
              {/* Hover эффект */}
              {isHovered && (
                <RoundedBox
                  args={[widgetWidth + 0.01, widgetHeight + 0.01, 0.002]}
                  radius={cornerRadius + 0.003}
                  smoothness={3}
                >
                  <meshBasicMaterial 
                    color={zone.color}
                    transparent 
                    opacity={node.opacity * 0.4}
                  />
                </RoundedBox>
              )}
            </group>
          </Billboard>
        );
      })}

      {/* Индикатор глубины */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.018}
        color={palette.glow}
        anchorX="center"
        fillOpacity={universeOpacity * 0.3}
      >
        Уровень {depth + 1}
      </Text>
    </group>
  );
};
