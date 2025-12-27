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

// Полная карта зон мозга с анатомически корректными позициями
const BRAIN_ANATOMY = {
  // ЛЕВОЕ ПОЛУШАРИЕ
  prefrontal_left: {
    name: 'Префронтальная кора (Л)',
    shortName: 'Планирование',
    position: [-0.15, 0.28, 0.25] as [number, number, number],
    color: '#FF6B9D',
    size: 0.08,
  },
  frontal_left: {
    name: 'Лобная доля (Л)',
    shortName: 'Решения',
    position: [-0.2, 0.2, 0.15] as [number, number, number],
    color: '#FF8FAB',
    size: 0.1,
  },
  motor_left: {
    name: 'Моторная кора (Л)',
    shortName: 'Движение',
    position: [-0.18, 0.25, 0] as [number, number, number],
    color: '#E74C3C',
    size: 0.06,
  },
  parietal_left: {
    name: 'Теменная доля (Л)',
    shortName: 'Интеграция',
    position: [-0.15, 0.22, -0.12] as [number, number, number],
    color: '#58C4DD',
    size: 0.09,
  },
  temporal_left: {
    name: 'Височная доля (Л)',
    shortName: 'Речь',
    position: [-0.28, 0.02, 0.05] as [number, number, number],
    color: '#9B59B6',
    size: 0.1,
  },
  occipital_left: {
    name: 'Затылочная доля (Л)',
    shortName: 'Зрение',
    position: [-0.1, 0.12, -0.28] as [number, number, number],
    color: '#2ECC71',
    size: 0.08,
  },
  
  // ПРАВОЕ ПОЛУШАРИЕ  
  prefrontal_right: {
    name: 'Префронтальная кора (П)',
    shortName: 'Самоконтроль',
    position: [0.15, 0.28, 0.25] as [number, number, number],
    color: '#FF6B9D',
    size: 0.08,
  },
  frontal_right: {
    name: 'Лобная доля (П)',
    shortName: 'Внимание',
    position: [0.2, 0.2, 0.15] as [number, number, number],
    color: '#FF8FAB',
    size: 0.1,
  },
  motor_right: {
    name: 'Моторная кора (П)',
    shortName: 'Координация',
    position: [0.18, 0.25, 0] as [number, number, number],
    color: '#E74C3C',
    size: 0.06,
  },
  parietal_right: {
    name: 'Теменная доля (П)',
    shortName: 'Пространство',
    position: [0.15, 0.22, -0.12] as [number, number, number],
    color: '#58C4DD',
    size: 0.09,
  },
  temporal_right: {
    name: 'Височная доля (П)',
    shortName: 'Эмоции',
    position: [0.28, 0.02, 0.05] as [number, number, number],
    color: '#E91E63',
    size: 0.1,
  },
  occipital_right: {
    name: 'Затылочная доля (П)',
    shortName: 'Образы',
    position: [0.1, 0.12, -0.28] as [number, number, number],
    color: '#2ECC71',
    size: 0.08,
  },
  
  // ЦЕНТРАЛЬНЫЕ СТРУКТУРЫ
  corpus_callosum: {
    name: 'Мозолистое тело',
    shortName: 'Связь полушарий',
    position: [0, 0.15, 0] as [number, number, number],
    color: '#F39C12',
    size: 0.12,
  },
  thalamus: {
    name: 'Таламус',
    shortName: 'Ретрансляция',
    position: [0, 0.08, 0] as [number, number, number],
    color: '#3498DB',
    size: 0.06,
  },
  hippocampus: {
    name: 'Гиппокамп',
    shortName: 'Память',
    position: [0, 0, 0.05] as [number, number, number],
    color: '#1ABC9C',
    size: 0.05,
  },
  amygdala: {
    name: 'Амигдала',
    shortName: 'Страх/Эмоции',
    position: [0, -0.02, 0.08] as [number, number, number],
    color: '#E74C3C',
    size: 0.04,
  },
  hypothalamus: {
    name: 'Гипоталамус',
    shortName: 'Гомеостаз',
    position: [0, -0.05, 0.1] as [number, number, number],
    color: '#9B59B6',
    size: 0.04,
  },
  brainstem: {
    name: 'Ствол мозга',
    shortName: 'Жизнь',
    position: [0, -0.15, -0.05] as [number, number, number],
    color: '#34495E',
    size: 0.07,
  },
  cerebellum: {
    name: 'Мозжечок',
    shortName: 'Баланс',
    position: [0, -0.1, -0.2] as [number, number, number],
    color: '#F39C12',
    size: 0.12,
  },
};

// Виджеты когнитивных процессов с привязкой к зонам мозга
const COGNITIVE_WIDGETS = {
  // Уровень 0: Базовые процессы
  basic: [
    { id: 'think', icon: '💭', title: 'Мысль', subtitle: 'Когнитивный процесс', zone: 'prefrontal_left', connects: ['decide', 'analyze'] },
    { id: 'decide', icon: '🎯', title: 'Решение', subtitle: 'Выбор действия', zone: 'frontal_left', connects: ['action', 'plan'] },
    { id: 'analyze', icon: '🔍', title: 'Анализ', subtitle: 'Разбор данных', zone: 'parietal_left', connects: ['memory', 'pattern'] },
    { id: 'action', icon: '⚡', title: 'Действие', subtitle: 'Моторный выход', zone: 'motor_left', connects: ['feedback'] },
    { id: 'speak', icon: '🗣️', title: 'Речь', subtitle: 'Зона Брока', zone: 'temporal_left', connects: ['think', 'memory'] },
    { id: 'see', icon: '👁️', title: 'Зрение', subtitle: 'Визуальный вход', zone: 'occipital_left', connects: ['recognize', 'space'] },
    { id: 'feel', icon: '❤️', title: 'Эмоция', subtitle: 'Лимбическая система', zone: 'amygdala', connects: ['memory', 'decide'] },
    { id: 'memory', icon: '📚', title: 'Память', subtitle: 'Гиппокамп', zone: 'hippocampus', connects: ['learn', 'recall'] },
  ],
  // Уровень 1: Высшие функции
  advanced: [
    { id: 'plan', icon: '📋', title: 'Планирование', subtitle: 'Стратегия', zone: 'prefrontal_left', connects: ['goal', 'sequence'] },
    { id: 'focus', icon: '🎯', title: 'Внимание', subtitle: 'Фокусировка', zone: 'frontal_right', connects: ['filter', 'priority'] },
    { id: 'create', icon: '✨', title: 'Творчество', subtitle: 'Генерация идей', zone: 'temporal_right', connects: ['imagine', 'combine'] },
    { id: 'logic', icon: '🧮', title: 'Логика', subtitle: 'Рассуждение', zone: 'parietal_left', connects: ['deduce', 'verify'] },
    { id: 'space', icon: '🗺️', title: 'Пространство', subtitle: 'Ориентация', zone: 'parietal_right', connects: ['navigate', 'map'] },
    { id: 'rhythm', icon: '🎵', title: 'Ритм', subtitle: 'Паттерны', zone: 'cerebellum', connects: ['timing', 'flow'] },
    { id: 'balance', icon: '⚖️', title: 'Баланс', subtitle: 'Равновесие', zone: 'cerebellum', connects: ['posture', 'move'] },
    { id: 'relay', icon: '📡', title: 'Ретрансляция', subtitle: 'Передача сигналов', zone: 'thalamus', connects: ['sense', 'cortex'] },
  ],
  // Уровень 2: Интеграция
  integration: [
    { id: 'conscious', icon: '🌟', title: 'Сознание', subtitle: 'Осознанность', zone: 'prefrontal_right', connects: ['self', 'meta'] },
    { id: 'integrate', icon: '🔗', title: 'Интеграция', subtitle: 'Связывание', zone: 'corpus_callosum', connects: ['left', 'right'] },
    { id: 'regulate', icon: '🎛️', title: 'Регуляция', subtitle: 'Контроль', zone: 'hypothalamus', connects: ['hormone', 'state'] },
    { id: 'survive', icon: '💓', title: 'Выживание', subtitle: 'Базовые функции', zone: 'brainstem', connects: ['breathe', 'heart'] },
    { id: 'learn', icon: '📖', title: 'Обучение', subtitle: 'Пластичность', zone: 'hippocampus', connects: ['encode', 'strengthen'] },
    { id: 'recognize', icon: '🔎', title: 'Распознавание', subtitle: 'Идентификация', zone: 'temporal_left', connects: ['pattern', 'name'] },
    { id: 'imagine', icon: '💫', title: 'Воображение', subtitle: 'Симуляция', zone: 'temporal_right', connects: ['scenario', 'future'] },
    { id: 'coordinate', icon: '🤝', title: 'Координация', subtitle: 'Синхронизация', zone: 'motor_right', connects: ['timing', 'sequence'] },
  ],
};

// Нейронные пути между зонами с названиями процессов
const NEURAL_PATHWAYS_FULL = [
  // Основные тракты
  { from: 'prefrontal_left', to: 'frontal_left', process: 'Принятие решений', color: '#FF6B9D' },
  { from: 'frontal_left', to: 'motor_left', process: 'Моторная команда', color: '#E74C3C' },
  { from: 'frontal_left', to: 'temporal_left', process: 'Речевой контроль', color: '#9B59B6' },
  { from: 'temporal_left', to: 'parietal_left', process: 'Понимание', color: '#58C4DD' },
  { from: 'occipital_left', to: 'parietal_left', process: 'Где? (дорсальный)', color: '#2ECC71' },
  { from: 'occipital_left', to: 'temporal_left', process: 'Что? (вентральный)', color: '#2ECC71' },
  
  // Межполушарные связи
  { from: 'frontal_left', to: 'frontal_right', process: 'Координация', color: '#F39C12' },
  { from: 'temporal_left', to: 'temporal_right', process: 'Интеграция', color: '#F39C12' },
  { from: 'parietal_left', to: 'parietal_right', process: 'Пространство', color: '#F39C12' },
  { from: 'motor_left', to: 'motor_right', process: 'Билатеральное движение', color: '#F39C12' },
  
  // Лимбические связи
  { from: 'prefrontal_left', to: 'amygdala', process: 'Контроль эмоций', color: '#E74C3C' },
  { from: 'amygdala', to: 'hippocampus', process: 'Эмоц. память', color: '#1ABC9C' },
  { from: 'hippocampus', to: 'temporal_left', process: 'Консолидация', color: '#1ABC9C' },
  { from: 'amygdala', to: 'hypothalamus', process: 'Стресс-реакция', color: '#9B59B6' },
  
  // Таламические связи
  { from: 'thalamus', to: 'prefrontal_left', process: 'Осознание', color: '#3498DB' },
  { from: 'thalamus', to: 'occipital_left', process: 'Визуальный вход', color: '#3498DB' },
  { from: 'thalamus', to: 'parietal_left', process: 'Соматосенсорный', color: '#3498DB' },
  
  // Мозжечковые связи
  { from: 'cerebellum', to: 'motor_left', process: 'Тонкая моторика', color: '#F39C12' },
  { from: 'cerebellum', to: 'frontal_left', process: 'Когн. координация', color: '#F39C12' },
  { from: 'brainstem', to: 'thalamus', process: 'Восходящий сигнал', color: '#34495E' },
  { from: 'brainstem', to: 'cerebellum', process: 'Проприоцепция', color: '#34495E' },
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

// Генерация узлов на основе виджетов и зон мозга
const generateBrainWidgets = (time: number, depth: number): UniverseNode[] => {
  const widgets = getWidgetsForDepth(depth);
  const nodes: UniverseNode[] = [];
  
  widgets.forEach((widget, i) => {
    const zone = BRAIN_ANATOMY[widget.zone as keyof typeof BRAIN_ANATOMY];
    if (!zone) return;
    
    // Позиция рядом с зоной
    const offset = 0.06;
    nodes.push({
      id: i,
      position: [
        zone.position[0] + (Math.random() - 0.5) * offset,
        zone.position[1] + (Math.random() - 0.5) * offset,
        zone.position[2] + (Math.random() - 0.5) * offset + 0.1, // Немного вперёд
      ],
      velocity: [0, 0, 0],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.1,
    });
  });
  
  return nodes;
};

// Генерация связей между виджетами
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
              birthTime: time + i * 0.1 + idx * 0.05 + 0.3,
              processName: `${widget.title} → ${widgets[targetIndex].title}`,
            });
          }
        }
      });
    }
  });
  
  return edges;
};

// 3D контур мозга
const BrainOutline = ({ opacity, time }: { opacity: number; time: number }) => {
  const brainPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    // Левое полушарие
    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * Math.PI;
      const x = -0.15 - Math.sin(t) * 0.18;
      const y = Math.cos(t) * 0.25;
      const z = Math.sin(t * 2) * 0.08;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }, []);
  
  const brainPointsRight = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    // Правое полушарие
    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * Math.PI;
      const x = 0.15 + Math.sin(t) * 0.18;
      const y = Math.cos(t) * 0.25;
      const z = Math.sin(t * 2) * 0.08;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }, []);

  const breathe = 1 + Math.sin(time * 0.3) * 0.02;

  return (
    <group scale={breathe}>
      {/* Левое полушарие контур */}
      <Line
        points={brainPoints}
        color="#FF6B9D"
        lineWidth={1}
        transparent
        opacity={opacity * 0.15}
      />
      
      {/* Правое полушарие контур */}
      <Line
        points={brainPointsRight}
        color="#58C4DD"
        lineWidth={1}
        transparent
        opacity={opacity * 0.15}
      />
      
      {/* Центральная борозда */}
      <Line
        points={[
          new THREE.Vector3(0, 0.35, 0.1),
          new THREE.Vector3(0, 0.1, 0.15),
          new THREE.Vector3(0, -0.1, 0.05),
        ]}
        color="#F39C12"
        lineWidth={2}
        transparent
        opacity={opacity * 0.2}
      />
      
      {/* Мозолистое тело */}
      <Line
        points={[
          new THREE.Vector3(-0.15, 0.15, 0),
          new THREE.Vector3(0, 0.18, 0),
          new THREE.Vector3(0.15, 0.15, 0),
        ]}
        color="#F39C12"
        lineWidth={3}
        transparent
        opacity={opacity * 0.25}
      />
    </group>
  );
};

// Зона мозга с пульсацией
const BrainZone = ({ 
  zone, 
  opacity, 
  time,
  isHighlighted
}: { 
  zone: typeof BRAIN_ANATOMY[keyof typeof BRAIN_ANATOMY];
  opacity: number;
  time: number;
  isHighlighted: boolean;
}) => {
  const pulse = 1 + Math.sin(time * 0.8 + zone.position[0] * 5) * 0.1;
  const highlightScale = isHighlighted ? 1.3 : 1;
  
  return (
    <group position={zone.position}>
      {/* Ореол зоны */}
      <Sphere args={[zone.size * pulse * highlightScale, 20, 20]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * (isHighlighted ? 0.25 : 0.08)}
        />
      </Sphere>
      
      {/* Ядро */}
      <Sphere args={[zone.size * 0.4 * highlightScale, 12, 12]}>
        <meshBasicMaterial 
          color={zone.color}
          transparent 
          opacity={opacity * (isHighlighted ? 0.6 : 0.2)}
        />
      </Sphere>
      
      {/* Название зоны */}
      <Billboard follow={true} position={[0, zone.size + 0.02, 0]}>
        <Text
          fontSize={0.018}
          color={zone.color}
          anchorX="center"
          fillOpacity={opacity * (isHighlighted ? 0.9 : 0.4)}
        >
          {zone.shortName}
        </Text>
      </Billboard>
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
  isHighlighted
}: { 
  from: [number, number, number];
  to: [number, number, number];
  process: string;
  pathColor: string;
  opacity: number;
  time: number;
  index: number;
  isHighlighted: boolean;
}) => {
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...from);
    const endVec = new THREE.Vector3(...to);
    const distance = startVec.distanceTo(endVec);
    
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    const curveAmount = distance * 0.4;
    const yLift = 0.03 + (index % 3) * 0.015;
    
    const mid = startVec.clone().lerp(endVec, 0.5);
    mid.add(perpendicular.clone().multiplyScalar(curveAmount * (index % 2 === 0 ? 1 : -1)));
    mid.y += yLift;
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(40);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [from, to, index]);

  // Множественные импульсы
  const impulseCount = isHighlighted ? 5 : 3;
  const highlightMultiplier = isHighlighted ? 3 : 1;
  
  return (
    <group>
      {/* Аксон */}
      <Line
        points={points}
        color={pathColor}
        lineWidth={isHighlighted ? 2 : 0.6}
        transparent
        opacity={opacity * (isHighlighted ? 0.8 : 0.2)}
      />
      
      {/* Миелиновое свечение */}
      <Line
        points={points}
        color={pathColor}
        lineWidth={isHighlighted ? 6 : 2}
        transparent
        opacity={opacity * (isHighlighted ? 0.25 : 0.05)}
      />
      
      {/* Дополнительное свечение при подсветке */}
      {isHighlighted && (
        <Line
          points={points}
          color="#FFFFFF"
          lineWidth={4}
          transparent
          opacity={opacity * 0.15}
        />
      )}
      
      {/* Импульсы */}
      {Array.from({ length: impulseCount }).map((_, i) => {
        const speed = (0.25 + (index % 4) * 0.05) * highlightMultiplier;
        const offset = i / impulseCount;
        const t = ((time * speed + offset + index * 0.1) % 1);
        const pos = curve.getPoint(t);
        const impulseOpacity = Math.sin(t * Math.PI) * opacity * (isHighlighted ? 1.2 : 0.8);
        const impulseSize = isHighlighted ? 0.012 : 0.008;
        
        return (
          <group key={i}>
            <Sphere args={[impulseSize, 10, 10]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial 
                color={isHighlighted ? '#FFFFFF' : pathColor}
                transparent 
                opacity={impulseOpacity}
              />
            </Sphere>
            <Sphere args={[impulseSize * 2, 8, 8]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial 
                color={pathColor}
                transparent 
                opacity={impulseOpacity * 0.4}
              />
            </Sphere>
          </group>
        );
      })}
      
      {/* Название процесса */}
      <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.025, midPoint.z]}>
        <Text
          fontSize={isHighlighted ? 0.016 : 0.012}
          color={isHighlighted ? '#FFFFFF' : pathColor}
          anchorX="center"
          fillOpacity={opacity * (isHighlighted ? 1 : 0.5)}
        >
          {process}
        </Text>
      </Billboard>
      
      {/* Синаптические терминали */}
      <Sphere args={[isHighlighted ? 0.01 : 0.006, 8, 8]} position={from}>
        <meshBasicMaterial color={pathColor} transparent opacity={opacity * (isHighlighted ? 0.9 : 0.5)} />
      </Sphere>
      <Sphere args={[isHighlighted ? 0.01 : 0.006, 8, 8]} position={to}>
        <meshBasicMaterial color={pathColor} transparent opacity={opacity * (isHighlighted ? 0.9 : 0.5)} />
      </Sphere>
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
  isHighlighted
}: { 
  start: [number, number, number];
  end: [number, number, number];
  processName: string;
  opacity: number;
  palette: typeof DEPTH_PALETTES[0];
  time: number;
  index: number;
  isHighlighted: boolean;
}) => {
  const { curve, points, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    
    const curveAmount = distance * 0.25;
    
    const mid = startVec.clone().lerp(endVec, 0.5);
    mid.add(perpendicular.clone().multiplyScalar(curveAmount * (index % 2 === 0 ? 1 : -1)));
    mid.z += 0.05;
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(30);
    
    return { curve: bezierCurve, points: curvePoints, midPoint: mid };
  }, [start, end, index]);

  const speed = isHighlighted ? 0.8 : 0.4;
  const pulseT = ((time * speed + index * 0.2) % 1);
  const pulsePos = curve.getPoint(pulseT);
  const pulseOpacity = Math.sin(pulseT * Math.PI) * opacity * (isHighlighted ? 1.2 : 0.7);

  return (
    <group>
      <Line
        points={points}
        color={isHighlighted ? '#FFFFFF' : palette.primary}
        lineWidth={isHighlighted ? 3 : 1.2}
        transparent
        opacity={opacity * (isHighlighted ? 0.9 : 0.4)}
      />
      
      {/* Дополнительное свечение при подсветке */}
      {isHighlighted && (
        <Line
          points={points}
          color={palette.accent}
          lineWidth={6}
          transparent
          opacity={opacity * 0.3}
        />
      )}
      
      {/* Название процесса при подсветке */}
      {isHighlighted && (
        <Billboard follow={true} position={[midPoint.x, midPoint.y + 0.03, midPoint.z]}>
          <Text
            fontSize={0.014}
            color="#FFFFFF"
            anchorX="center"
            fillOpacity={opacity * 0.9}
          >
            {processName}
          </Text>
        </Billboard>
      )}
      
      {/* Пульсирующие сигналы */}
      {Array.from({ length: isHighlighted ? 3 : 1 }).map((_, i) => {
        const t = ((time * speed + index * 0.2 + i * 0.33) % 1);
        const pos = curve.getPoint(t);
        const pOpacity = Math.sin(t * Math.PI) * opacity * (isHighlighted ? 1.2 : 0.7);
        
        return (
          <group key={i}>
            <Sphere args={[isHighlighted ? 0.016 : 0.012, 10, 10]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial color={isHighlighted ? '#FFFFFF' : palette.accent} transparent opacity={pOpacity} />
            </Sphere>
            <Sphere args={[isHighlighted ? 0.032 : 0.024, 8, 8]} position={[pos.x, pos.y, pos.z]}>
              <meshBasicMaterial color={palette.glow} transparent opacity={pOpacity * 0.4} />
            </Sphere>
          </group>
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
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
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
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.1;
    }
  });

  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.6));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...node, scale: eased, opacity: eased * universeOpacity };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.5));
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

  // Найти все связанные зоны и пути для подсветки
  const getHighlightedData = useMemo(() => {
    if (hoveredNode === null) return { zones: [], pathways: [], widgetIds: [], edgeIds: [] };
    
    const widget = widgets[hoveredNode];
    if (!widget) return { zones: [], pathways: [], widgetIds: [], edgeIds: [] };
    
    const zones = new Set<string>([widget.zone]);
    const pathways = new Set<number>();
    const widgetIds = new Set<number>([hoveredNode]);
    const edgeIds = new Set<number>();
    
    // Найти все связанные виджеты
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
      if (zoneArray.includes(pathway.from) || zoneArray.includes(pathway.to)) {
        pathways.add(i);
        zones.add(pathway.from);
        zones.add(pathway.to);
      }
    });
    
    // Найти связи между виджетами
    edges.forEach((edge, i) => {
      if (widgetIds.has(edge.from) || widgetIds.has(edge.to)) {
        edgeIds.add(i);
      }
    });
    
    return { 
      zones: Array.from(zones), 
      pathways: Array.from(pathways),
      widgetIds: Array.from(widgetIds),
      edgeIds: Array.from(edgeIds)
    };
  }, [hoveredNode, widgets, edges]);
  
  const highlightedZones = getHighlightedData.zones;
  const highlightedPathways = getHighlightedData.pathways;
  const highlightedWidgets = getHighlightedData.widgetIds;
  const highlightedEdges = getHighlightedData.edgeIds;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      <Stars
        radius={2}
        depth={1}
        count={50}
        factor={0.1}
        saturation={0}
        fade
        speed={0.02}
      />

      {/* Контур мозга */}
      <BrainOutline opacity={universeOpacity} time={time} />

      {/* Зоны мозга */}
      {Object.entries(BRAIN_ANATOMY).map(([key, zone]) => (
        <BrainZone
          key={key}
          zone={zone}
          opacity={universeOpacity}
          time={time}
          isHighlighted={highlightedZones.includes(key)}
        />
      ))}

      {/* Нейронные пути между зонами */}
      {NEURAL_PATHWAYS_FULL.map((pathway, i) => {
        const fromZone = BRAIN_ANATOMY[pathway.from as keyof typeof BRAIN_ANATOMY];
        const toZone = BRAIN_ANATOMY[pathway.to as keyof typeof BRAIN_ANATOMY];
        if (!fromZone || !toZone) return null;
        
        const isHighlighted = highlightedPathways.includes(i);
        const dimmed = hoveredNode !== null && !isHighlighted;
        
        return (
          <NeuralPathway
            key={`pathway-${i}`}
            from={fromZone.position}
            to={toZone.position}
            process={pathway.process}
            pathColor={pathway.color}
            opacity={universeOpacity * (dimmed ? 0.15 : 0.6)}
            time={time}
            index={i}
            isHighlighted={isHighlighted}
          />
        );
      })}

      {/* Связи между виджетами */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        const isHighlighted = highlightedEdges.includes(i);
        const dimmed = hoveredNode !== null && !isHighlighted;

        return (
          <WidgetConnection
            key={`widget-edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            processName={edge.processName}
            opacity={edge.opacity * (dimmed ? 0.2 : 1)}
            palette={palette}
            time={time}
            index={i}
            isHighlighted={isHighlighted}
          />
        );
      })}

      {/* Виджеты когнитивных процессов */}
      {animatedNodes.map((node) => {
        const widget = widgets[node.id];
        if (!widget) return null;
        
        const zone = BRAIN_ANATOMY[widget.zone as keyof typeof BRAIN_ANATOMY];
        if (!zone) return null;
        
        const isHovered = hoveredNode === node.id;
        const isConnected = highlightedWidgets.includes(node.id);
        const dimmed = hoveredNode !== null && !isConnected;
        const breathe = 1 + Math.sin(time * 0.5 + node.id * 1.2) * 0.015;
        const hoverScale = isHovered ? 1.15 : isConnected ? 1.05 : 1;
        
        const widgetWidth = 0.22;
        const widgetHeight = 0.13;
        const cornerRadius = 0.025;
        
        return (
          <Billboard
            key={`widget-${node.id}`}
            follow={true}
          >
            <group 
              position={node.position}
              scale={node.scale * breathe * hoverScale}
            >
              {/* Линия к зоне мозга */}
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
                  color={isConnected ? '#FFFFFF' : zone.color}
                  lineWidth={isConnected ? 1.5 : 0.8}
                  transparent
                  opacity={node.opacity * (dimmed ? 0.05 : isConnected ? 0.5 : 0.2)}
                />
                
              {/* Свечение */}
              <RoundedBox
                args={[widgetWidth + 0.02, widgetHeight + 0.02, 0.003]}
                radius={cornerRadius + 0.006}
                smoothness={4}
              >
                <meshBasicMaterial 
                  color={isConnected ? '#FFFFFF' : zone.color}
                  transparent 
                  opacity={node.opacity * (dimmed ? 0.08 : isConnected ? 0.5 : 0.25)}
                />
              </RoundedBox>
              
              {/* Дополнительное свечение для связанных виджетов */}
              {isConnected && !isHovered && (
                <RoundedBox
                  args={[widgetWidth + 0.04, widgetHeight + 0.04, 0.002]}
                  radius={cornerRadius + 0.01}
                  smoothness={4}
                >
                  <meshBasicMaterial 
                    color={zone.color}
                    transparent 
                    opacity={node.opacity * 0.3 * (1 + Math.sin(time * 3) * 0.3)}
                  />
                </RoundedBox>
              )}
              
              {/* Фон виджета */}
              <RoundedBox
                args={[widgetWidth, widgetHeight, 0.018]}
                radius={cornerRadius}
                smoothness={4}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.position);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNode(node.id);
                  setHoveredZone(widget.zone);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredNode(null);
                  setHoveredZone(null);
                  document.body.style.cursor = 'default';
                }}
              >
                <meshBasicMaterial 
                  color={dimmed ? '#0A0A0B' : '#1A1A1C'}
                  transparent 
                  opacity={node.opacity * 0.95}
                />
              </RoundedBox>
              
              {/* Индикатор зоны */}
              <Sphere 
                args={[0.01, 8, 8]} 
                position={[widgetWidth / 2 - 0.018, widgetHeight / 2 - 0.018, 0.012]}
              >
                <meshBasicMaterial color={zone.color} transparent opacity={node.opacity * 0.9} />
              </Sphere>
              
              {/* Иконка */}
              <Text
                position={[-0.06, 0.008, 0.012]}
                fontSize={0.045}
                color={zone.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {widget.icon}
              </Text>
              
              {/* Название */}
              <Text
                position={[0.035, 0.025, 0.012]}
                fontSize={0.026}
                color={isHovered ? '#FFFFFF' : '#F0F0F2'}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity}
              >
                {widget.title}
              </Text>
              
              {/* Подзаголовок */}
              <Text
                position={[0.035, -0.005, 0.012]}
                fontSize={0.014}
                color="#8E8E93"
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.85}
              >
                {widget.subtitle}
              </Text>
              
              {/* Зона */}
              <Text
                position={[0.035, -0.032, 0.012]}
                fontSize={0.01}
                color={zone.color}
                anchorX="center"
                anchorY="middle"
                fillOpacity={node.opacity * 0.6}
              >
                {zone.shortName}
              </Text>
              
              {/* Hover эффект */}
              {isHovered && (
                <RoundedBox
                  args={[widgetWidth + 0.008, widgetHeight + 0.008, 0.002]}
                  radius={cornerRadius + 0.003}
                  smoothness={3}
                >
                  <meshBasicMaterial 
                    color={zone.color}
                    transparent 
                    opacity={node.opacity * 0.45}
                  />
                </RoundedBox>
              )}
            </group>
          </Billboard>
        );
      })}

      {/* Заголовок уровня */}
      <Billboard follow={true} position={[0, -0.4, 0]}>
        <Text
          fontSize={0.02}
          color={palette.primary}
          anchorX="center"
          fillOpacity={universeOpacity * 0.6}
        >
          {depth === 0 ? 'Базовые процессы' : depth === 1 ? 'Высшие функции' : 'Интеграция'}
        </Text>
        <Text
          fontSize={0.014}
          color={palette.secondary}
          anchorX="center"
          position={[0, -0.025, 0]}
          fillOpacity={universeOpacity * 0.4}
        >
          Уровень {depth + 1} • Нажмите на виджет для погружения
        </Text>
      </Billboard>
    </group>
  );
};
