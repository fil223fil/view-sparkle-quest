import type { ChatMessage, ThinkingStep, FunctionCall, DataReference, ProcessStep, WidgetResponse } from '@/types/chat';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let counter = 0;
const uid = () => `msg-${++counter}-${Date.now()}`;

export const simulateAIResponse = async (userInput: string): Promise<ChatMessage> => {
  const lower = userInput.toLowerCase();

  await delay(800 + Math.random() * 700);

  const now = new Date();
  const t1 = new Date(now.getTime() - 600);
  const t2 = new Date(now.getTime() - 300);
  const t3 = now;

  // Base thinking chain
  const thinkingChain: ThinkingStep[] = [
    { id: '1', title: 'Анализ запроса', description: 'Определение намерения пользователя', timestamp: t1, status: 'complete' },
    { id: '2', title: 'Поиск данных', description: 'Запрос к внешним источникам', timestamp: t2, status: 'complete' },
    { id: '3', title: 'Синтез ответа', description: 'Формирование текста ответа', timestamp: t3, status: 'complete' },
  ];

  let content: string;
  let functions: FunctionCall[];
  let data: DataReference[];
  let processSteps: ProcessStep[];
  let widget: WidgetResponse | undefined;

  if (lower.includes('погод') || lower.includes('weather')) {
    content = 'Сейчас в Москве +22°C, солнечно. Влажность 45%. Отличный день для прогулки! ☀️';
    functions = [
      { name: 'analyzeIntent', service: 'GLM-4.7', parameters: { query: userInput }, result: { intent: 'weather', confidence: 0.97 }, duration: 120 },
      { name: 'getWeather', service: 'OpenWeather', parameters: { city: 'Moscow', units: 'metric' }, result: { temp: 22, condition: 'sunny', humidity: 45, wind: 3.2 }, duration: 340 },
    ];
    data = [{ type: 'weather', source: 'OpenWeather API', content: { temp: 22, condition: 'Солнечно', humidity: 45, wind: 3.2 }, timestamp: now }];
    widget = { type: 'weather', title: 'Погода в Москве', data: { temp: 22, condition: 'Солнечно', humidity: 45, wind: 3.2 } };
    processSteps = [
      { id: '1', title: 'Input', description: 'Получен запрос о погоде', type: 'analysis', status: 'complete', duration: 50 },
      { id: '2', title: 'Intent', description: 'Определено: weather', type: 'analysis', status: 'complete', duration: 120 },
      { id: '3', title: 'API Call', description: 'OpenWeather запрос', type: 'function', status: 'complete', duration: 340 },
      { id: '4', title: 'Output', description: 'Ответ сформирован', type: 'synthesis', status: 'complete', duration: 80 },
    ];
  } else if (lower.includes('календар') || lower.includes('событи') || lower.includes('встреч')) {
    content = 'У вас сегодня 3 события:\n• 10:00 — Встреча с командой\n• 14:00 — Code Review\n• 16:00 — Спринт планирование';
    functions = [
      { name: 'analyzeIntent', service: 'GLM-4.7', parameters: { query: userInput }, result: { intent: 'calendar', confidence: 0.93 }, duration: 110 },
      { name: 'getCalendarEvents', service: 'Google Calendar', parameters: { date: 'today' }, result: { count: 3 }, duration: 280 },
    ];
    data = [{ type: 'calendar', source: 'Google Calendar API', content: { events: [{ time: '10:00', title: 'Встреча с командой' }, { time: '14:00', title: 'Code Review' }, { time: '16:00', title: 'Спринт планирование' }] }, timestamp: now }];
    widget = { type: 'calendar', title: 'Календарь на сегодня', data: { events: [{ id: '1', time: '10:00', title: 'Встреча с командой' }, { id: '2', time: '14:00', title: 'Code Review' }, { id: '3', time: '16:00', title: 'Спринт планирование' }] } };
    processSteps = [
      { id: '1', title: 'Input', description: 'Запрос календаря', type: 'analysis', status: 'complete', duration: 40 },
      { id: '2', title: 'API Call', description: 'Google Calendar', type: 'function', status: 'complete', duration: 280 },
      { id: '3', title: 'Output', description: 'Ответ сформирован', type: 'synthesis', status: 'complete', duration: 60 },
    ];
  } else if (lower.includes('шаг') || lower.includes('активност') || lower.includes('здоров') || lower.includes('health')) {
    content = 'Сегодня вы прошли 8 432 шага (5.2 км). Это 84% от дневной нормы! 💪';
    functions = [
      { name: 'analyzeIntent', service: 'GLM-4.7', parameters: { query: userInput }, result: { intent: 'health', confidence: 0.91 }, duration: 105 },
      { name: 'getHealthData', service: 'HealthKit', parameters: { type: 'steps', date: 'today' }, result: { steps: 8432, distance: 5.2, calories: 340 }, duration: 220 },
    ];
    data = [{ type: 'health', source: 'HealthKit API', content: { steps: 8432, distance: 5.2, calories: 340, goal: 10000 }, timestamp: now }];
    widget = { type: 'health', title: 'Активность', data: { steps: 8432, distance: 5.2, calories: 340 } };
    processSteps = [
      { id: '1', title: 'Input', description: 'Запрос здоровья', type: 'analysis', status: 'complete', duration: 35 },
      { id: '2', title: 'API Call', description: 'HealthKit', type: 'function', status: 'complete', duration: 220 },
      { id: '3', title: 'Output', description: 'Виджет активности', type: 'synthesis', status: 'complete', duration: 55 },
    ];
  } else {
    content = 'Я получил ваш запрос и готов помочь! Попробуйте спросить о погоде, календаре или активности.';
    functions = [
      { name: 'analyzeIntent', service: 'GLM-4.7', parameters: { query: userInput }, result: { intent: 'general', confidence: 0.72 }, duration: 130 },
    ];
    data = [];
    processSteps = [
      { id: '1', title: 'Input', description: 'Получен запрос', type: 'analysis', status: 'complete', duration: 40 },
      { id: '2', title: 'Process', description: 'Обработка', type: 'function', status: 'complete', duration: 130 },
      { id: '3', title: 'Output', description: 'Ответ сформирован', type: 'synthesis', status: 'complete', duration: 50 },
    ];
  }

  return {
    id: uid(),
    role: 'assistant',
    content,
    thinkingChain,
    usedFunctions: functions,
    usedData: data,
    processSteps,
    hasProcessData: true,
    widget,
  };
};
